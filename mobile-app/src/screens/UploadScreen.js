import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getCourses, getPresentations, uploadPresentationNative, uploadExerciseNative } from '../services/api';

export default function UploadScreen({ navigation }) {
  const [mode, setMode] = useState('presentation'); // 'presentation' | 'exercise'
  const [courses, setCourses] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  
  // File state
  const [pickedFile, setPickedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [weekNumber, setWeekNumber] = useState('1');
  const [description, setDescription] = useState('');
  
  // Exercise-specific state
  const [exerciseType, setExerciseType] = useState('assignment');
  const [points, setPoints] = useState('100');
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await getCourses();
      setCourses(c);
      if (c.length > 0) setSelectedCourse(c[0].id);

      const p = await getPresentations();
      setPresentations(p);
    })();
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: mode === 'presentation' 
          ? ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf', '*/*']
          : ['*/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setPickedFile(file);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
        }
      }
    } catch (err) {
      Alert.alert('File Picker Error', err.message);
    }
  };

  const handleUpload = async () => {
    if (!pickedFile && mode === 'presentation') {
      Alert.alert('File Required', 'Please select a PowerPoint (.pptx / .ppt) or PDF file.');
      return;
    }
    if (!selectedCourse) {
      Alert.alert('Course Required', 'Please choose a course.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title.');
      return;
    }

    setUploading(true);

    try {
      if (mode === 'presentation') {
        const res = await uploadPresentationNative({
          file: pickedFile,
          courseId: selectedCourse,
          title: title.trim(),
          weekNumber: parseInt(weekNumber, 10) || 1,
          description
        });

        Alert.alert('Upload Complete', `"${res.title || title}" has been stored in SlideBox.`, [
          { text: 'OK', onPress: () => navigation.navigate('Slides') }
        ]);
      } else {
        const res = await uploadExerciseNative({
          file: pickedFile,
          courseId: selectedCourse,
          presentationId: selectedPresentation,
          title: title.trim(),
          exerciseType,
          points: parseInt(points, 10) || 100,
          description
        });

        Alert.alert('Success', `Exercise "${res.title || title}" published to SlideBox.`, [
          { text: 'OK', onPress: () => navigation.navigate('Exercises') }
        ]);
      }

      setPickedFile(null);
      setTitle('');
      setDescription('');
    } catch (err) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mode Switcher */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'presentation' && styles.modeBtnActive]}
          onPress={() => { setMode('presentation'); setPickedFile(null); }}
        >
          <Text style={[styles.modeText, mode === 'presentation' && styles.modeTextActive]}>
            📑 Upload PPT Slide
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === 'exercise' && styles.modeBtnActive]}
          onPress={() => { setMode('exercise'); setPickedFile(null); }}
        >
          <Text style={[styles.modeText, mode === 'exercise' && styles.modeTextActive]}>
            📝 Publish Exercise
          </Text>
        </TouchableOpacity>
      </View>

      {/* Native Document Picker Button */}
      <TouchableOpacity style={styles.pickerBox} onPress={handlePickDocument}>
        <View style={styles.pickerIcon}>
          <Text style={{ fontSize: 24 }}>{mode === 'presentation' ? '📊' : '📄'}</Text>
        </View>
        <Text style={styles.pickerTitle}>
          {pickedFile ? pickedFile.name : `Tap to Pick ${mode === 'presentation' ? 'PPT / PPTX Slide' : 'Exercise Document'}`}
        </Text>
        <Text style={styles.pickerSub}>
          {pickedFile
            ? `${(pickedFile.size / 1024).toFixed(0)} KB • Ready for SlideBox upload`
            : 'Access native files from iCloud / Device Storage'}
        </Text>
      </TouchableOpacity>

      {/* Course Selector Chips */}
      <Text style={styles.label}>Select Executive Course</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
        {courses.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.courseChip, selectedCourse === c.id && styles.courseChipActive]}
            onPress={() => setSelectedCourse(c.id)}
          >
            <Text style={[styles.courseChipText, selectedCourse === c.id && styles.courseChipTextActive]}>{c.code}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Link to presentation if uploading exercise */}
      {mode === 'exercise' && (
        <View>
          <Text style={styles.label}>Link to Presentation Deck (Optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
            <TouchableOpacity
              style={[styles.presChip, selectedPresentation === null && styles.presChipActive]}
              onPress={() => setSelectedPresentation(null)}
            >
              <Text style={[styles.presChipText, selectedPresentation === null && styles.presChipTextActive]}>None (Standalone)</Text>
            </TouchableOpacity>
            {presentations.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.presChip, selectedPresentation === p.id && styles.presChipActive]}
                onPress={() => setSelectedPresentation(p.id)}
              >
                <Text style={[styles.presChipText, selectedPresentation === p.id && styles.presChipTextActive]}>{p.course_code}: {p.title.slice(0, 18)}...</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Title */}
      <Text style={styles.label}>{mode === 'presentation' ? 'Presentation / Lecture Title' : 'Exercise Title'}</Text>
      <TextInput
        style={styles.input}
        placeholder={mode === 'presentation' ? 'e.g. Masterclass: Neural Transformers' : 'e.g. Case Study: Scalable Data Pipelines'}
        placeholderTextColor="#525252"
        value={title}
        onChangeText={setTitle}
      />

      {/* Week / Points Row */}
      {mode === 'presentation' ? (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Week / Module #</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weekNumber}
              onChangeText={setWeekNumber}
            />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Exercise Format</Text>
            <View style={styles.typeRow}>
              {['quiz', 'assignment', 'coding'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, exerciseType === t && styles.typeBtnActive]}
                  onPress={() => setExerciseType(t)}
                >
                  <Text style={[styles.typeText, exerciseType === t && styles.typeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ width: 90 }}>
            <Text style={styles.label}>Max Points</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={points}
              onChangeText={setPoints}
            />
          </View>
        </View>
      )}

      {/* Description */}
      <Text style={styles.label}>Executive Remarks / Deliverables</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Brief description or learning objectives..."
        placeholderTextColor="#525252"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.submitBtnText}>
            {mode === 'presentation' ? '👑 Upload PPT in SlideBox' : '🚀 Publish Exercise to SlideBox'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626'
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  modeBtnActive: {
    backgroundColor: '#d4af37'
  },
  modeText: {
    color: '#737373',
    fontWeight: '700',
    fontSize: 12
  },
  modeTextActive: {
    color: '#000000',
    fontWeight: '900'
  },
  pickerBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#111111',
    marginBottom: 16
  },
  pickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  pickerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  },
  pickerSub: {
    color: '#a3a3a3',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center'
  },
  label: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10
  },
  courseScroll: {
    marginBottom: 8
  },
  courseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#111111',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#262626'
  },
  courseChipActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37'
  },
  courseChipText: {
    color: '#a3a3a3',
    fontWeight: '700',
    fontSize: 12
  },
  courseChipTextActive: {
    color: '#000000',
    fontWeight: '900'
  },
  presChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#111111',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#262626'
  },
  presChipActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37'
  },
  presChipText: {
    color: '#737373',
    fontSize: 11
  },
  presChipTextActive: {
    color: '#000000',
    fontWeight: '700'
  },
  input: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#262626'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  typeRow: {
    flexDirection: 'row',
    gap: 4
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#111111',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626'
  },
  typeBtnActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37'
  },
  typeText: {
    color: '#737373',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  typeTextActive: {
    color: '#000000',
    fontWeight: '900'
  },
  submitBtn: {
    backgroundColor: '#d4af37',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14
  }
});
