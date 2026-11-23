import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getExercises, submitExerciseNative, deleteExercise } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ExercisesScreen({ navigation }) {
  const { isInstructor } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);

  const loadData = async () => {
    setLoading(true);
    const data = await getExercises();
    setExercises(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const startQuiz = (exercise) => {
    let questions = [];
    try {
      questions = JSON.parse(exercise.questions_data || '[]');
    } catch (e) {
      questions = [];
    }
    setActiveQuiz({ ...exercise, questions });
    setQuizIndex(0);
    setSelectedAnswers({});
    setQuizScore(0);
  };

  const handleSelectOption = (qId, optionIdx, correctIdx) => {
    if (selectedAnswers[qId] !== undefined) return;

    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));

    if (optionIdx === correctIdx) {
      const pts = Math.round((activeQuiz.points || 100) / activeQuiz.questions.length);
      setQuizScore(prev => prev + pts);
    }
  };

  const handleFinishQuiz = async () => {
    try {
      await submitExerciseNative(activeQuiz.id, {
        answersData: selectedAnswers
      });
      Alert.alert(
        'Quiz Finished!',
        `Your score: ${quizScore} / ${activeQuiz.points} pts. Recorded in SlideBox.`,
        [{ text: 'Great', onPress: () => setActiveQuiz(null) }]
      );
    } catch (err) {
      Alert.alert('Submission Error', err.message);
      setActiveQuiz(null);
    }
  };

  const submitFile = async (exercise) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      await submitExerciseNative(exercise.id, { file: result.assets[0] });
      Alert.alert('Submitted', `Your file was sent for "${exercise.title}".`);
    } catch (err) {
      Alert.alert('Submission Error', err.message);
    }
  };

  const handleDelete = (exercise) => {
    Alert.alert('Delete exercise?', `"${exercise.title}" and its student submissions will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteExercise(exercise.id); await loadData(); }
          catch (err) { Alert.alert('Delete failed', err.message); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.typeTag}>{item.exercise_type.toUpperCase()}</Text>
        <Text style={styles.courseTag}>{item.course_code}</Text>
        <Text style={styles.pointsTag}>{item.points} pts</Text>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>
        {item.description || 'Complete requirements before deadline.'}
      </Text>

      {item.presentation_title ? (
        <View style={styles.deckRef}>
          <Text style={styles.deckRefText}>
            📑 Linked Deck: {item.presentation_title}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.dueText}>
          Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'End of term'}
        </Text>
        <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => item.exercise_type === 'quiz' ? startQuiz(item) : submitFile(item)}
        >
          <Text style={styles.actionBtnText}>
            {item.exercise_type === 'quiz' ? 'Take Quiz ⚡' : 'Submit Work 📤'}
          </Text>
        </TouchableOpacity>
        {isInstructor && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1f1f1f', marginLeft: 6 }]} onPress={() => handleDelete(item)}>
            <Text style={[styles.actionBtnText, { color: '#f87171' }]}>🗑</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#d4af37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No exercises published yet.</Text>
          }
        />
      )}

      {/* Interactive Quiz Modal */}
      {activeQuiz && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{activeQuiz.title}</Text>
                <TouchableOpacity onPress={() => setActiveQuiz(null)}>
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              {activeQuiz.questions && activeQuiz.questions.length > 0 ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.qProgress}>
                    Question {quizIndex + 1} of {activeQuiz.questions.length} • Score: {quizScore} pts
                  </Text>
                  
                  <Text style={styles.questionText}>
                    {activeQuiz.questions[quizIndex].question}
                  </Text>

                  {activeQuiz.questions[quizIndex].options.map((opt, idx) => {
                    const qId = activeQuiz.questions[quizIndex].id || `q${quizIndex + 1}`;
                    const isSelected = selectedAnswers[qId] === idx;
                    const isCorrect = idx === activeQuiz.questions[quizIndex].correct_index;
                    const hasAnswered = selectedAnswers[qId] !== undefined;

                    let btnStyle = styles.optionBtn;
                    if (hasAnswered) {
                      if (isCorrect) btnStyle = [styles.optionBtn, styles.optionCorrect];
                      else if (isSelected) btnStyle = [styles.optionBtn, styles.optionWrong];
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={btnStyle}
                        onPress={() => handleSelectOption(qId, idx, activeQuiz.questions[quizIndex].correct_index)}
                      >
                        <Text style={styles.optionText}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={{ marginTop: 'auto', paddingTop: 16 }}>
                    {quizIndex < activeQuiz.questions.length - 1 ? (
                      <TouchableOpacity
                        style={styles.modalNextBtn}
                        onPress={() => setQuizIndex(quizIndex + 1)}
                      >
                        <Text style={styles.modalNextText}>Next Question →</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.modalNextBtn, { backgroundColor: '#d4af37' }]}
                        onPress={handleFinishQuiz}
                      >
                        <Text style={[styles.modalNextText, { color: '#000000' }]}>Finish & Submit Grade</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={{ color: '#fff' }}>No questions available for this quiz.</Text>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505'
  },
  listContent: {
    padding: 16
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  typeTag: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)'
  },
  courseTag: {
    color: '#a3a3a3',
    fontSize: 11,
    fontWeight: '600'
  },
  pointsTag: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 'auto'
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4
  },
  desc: {
    color: '#a3a3a3',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10
  },
  deckRef: {
    backgroundColor: '#171717',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  deckRefText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '600'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f'
  },
  dueText: {
    color: '#737373',
    fontSize: 11
  },
  actionBtn: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  actionBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12
  },
  emptyText: {
    color: '#737373',
    textAlign: 'center',
    marginTop: 40
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 20
  },
  modalBox: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    maxHeight: '80%',
    minHeight: 400
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1
  },
  closeModalText: {
    color: '#a3a3a3',
    fontSize: 18,
    padding: 4
  },
  qProgress: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8
  },
  questionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
    marginBottom: 16
  },
  optionBtn: {
    backgroundColor: '#171717',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626'
  },
  optionCorrect: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#d4af37'
  },
  optionWrong: {
    backgroundColor: '#1f1f1f',
    borderColor: '#525252'
  },
  optionText: {
    color: '#e5e5e5',
    fontSize: 12,
    lineHeight: 16
  },
  modalNextBtn: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalNextText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13
  }
});
