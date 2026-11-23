import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getCourses, getPresentations, getExercises, getStorageStats } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { isInstructor, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [c, p, e, s] = await Promise.all([
      getCourses(),
      getPresentations(),
      getExercises(),
      getStorageStats()
    ]);
    setCourses(c);
    setPresentations(p);
    setExercises(e);
    setStats(s);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  const usedMb = stats ? (stats.total_bytes / (1024 * 1024)).toFixed(1) : '8.2';
  const quotaMb = stats ? (stats.quota_bytes / (1024 * 1024)).toFixed(0) : '100';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Luxury Hero Card (Black & Gold) */}
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroSub}>SLIDEBOX • PRESTIGE LMS</Text>
            <Text style={styles.heroTitle}>Presentation & Course Vault</Text>
          </View>
          {isInstructor ? (
            <TouchableOpacity
              style={styles.heroUploadBtn}
              onPress={() => navigation.navigate('Upload')}
            >
              <Text style={styles.heroUploadText}>+ Deposit</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.heroSub}>{(user?.name || '').toUpperCase()}</Text>
          )}
        </View>

        {/* Gold Progress Bar */}
        <View style={styles.heroStorage}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>{usedMb} MB Used</Text>
            <Text style={{ color: '#d4af37', fontSize: 11, fontWeight: '600' }}>{quotaMb} MB Quota</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(100, Math.max(8, stats?.percentage_used || 8))}%` }]} />
          </View>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionGrid}>
        {isInstructor ? (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Upload')}>
              <View style={styles.iconCircle}>
                <Text style={styles.actionIcon}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Subjects')}>
              <View style={styles.iconCircle}>
                <Text style={styles.actionIcon}>📚</Text>
              </View>
              <Text style={styles.actionLabel}>Subjects</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Slides')}>
              <View style={styles.iconCircle}>
                <Text style={styles.actionIcon}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>Slides</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Exercises')}>
              <View style={styles.iconCircle}>
                <Text style={styles.actionIcon}>📝</Text>
              </View>
              <Text style={styles.actionLabel}>Exercises</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Exercises')}>
          <View style={styles.iconCircle}>
            <Text style={styles.actionIcon}>⚡</Text>
          </View>
          <Text style={styles.actionLabel}>Take Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Vault')}>
          <View style={styles.iconCircle}>
            <Text style={styles.actionIcon}>👑</Text>
          </View>
          <Text style={styles.actionLabel}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Enrolled Courses */}
      <Text style={styles.sectionHeader}>Enrolled Executive Courses</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
        {courses.map((c) => (
          <View key={c.id} style={styles.courseCard}>
            <View style={styles.courseColorPill}>
              <Text style={styles.courseCodeText}>{c.code}</Text>
            </View>
            <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
            <Text style={styles.courseProf} numberOfLines={1}>{c.instructor}</Text>
          </View>
        ))}
        {courses.length === 0 && (
          <Text style={{ color: '#737373', fontSize: 12 }}>
            No subjects yet.{isInstructor ? ' Tap Subjects to add one.' : ''}
          </Text>
        )}
      </ScrollView>

      {/* Recent Slide Decks */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionHeader}>Recent Presentations</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Slides')}>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>

      {presentations.slice(0, 3).map((p) => {
        let slides = [];
        try { slides = JSON.parse(p.slides_data || '[]'); } catch (e) {}
        return (
          <TouchableOpacity
            key={p.id}
            style={styles.recentCard}
            onPress={() => navigation.navigate('SlideViewer', { presentation: p, slides })}
          >
            <View style={styles.fileBadge}>
              <Text style={styles.fileBadgeText}>{p.extension ? p.extension.replace('.', '').toUpperCase() : 'PPT'}</Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.recentCourse}>{p.course_code} • Week {p.week_number}</Text>
              <Text style={styles.recentTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={styles.recentMeta}>{p.slide_count} slides • {(p.file_size / (1024 * 1024)).toFixed(1)} MB</Text>
            </View>
            <Text style={styles.openArrow}>▶</Text>
          </TouchableOpacity>
        );
      })}

      {/* Upcoming Exercises */}
      <View style={[styles.sectionRow, { marginTop: 14 }]}>
        <Text style={styles.sectionHeader}>Active Exercises & Quizzes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Exercises')}>
          <Text style={styles.seeAll}>Open Hub →</Text>
        </TouchableOpacity>
      </View>

      {exercises.slice(0, 2).map((e) => (
        <View key={e.id} style={styles.recentCard}>
          <View style={[styles.fileBadge, { backgroundColor: '#262626' }]}>
            <Text style={[styles.fileBadgeText, { color: '#d4af37' }]}>{e.exercise_type.slice(0, 4).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.recentCourse}>{e.course_code} • {e.points} Points</Text>
            <Text style={styles.recentTitle} numberOfLines={1}>{e.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.quizStartBtn}
            onPress={() => navigation.navigate('Exercises')}
          >
            <Text style={styles.quizStartText}>Start</Text>
          </TouchableOpacity>
        </View>
      ))}
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
    paddingBottom: 30
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505'
  },
  heroCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 16,
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  heroSub: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2
  },
  heroUploadBtn: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  heroUploadText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 11
  },
  heroStorage: {
    marginTop: 4
  },
  barBg: {
    height: 6,
    backgroundColor: '#1f1f1f',
    borderRadius: 3,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#d4af37',
    borderRadius: 3
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  actionBtn: {
    width: '23%',
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626'
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)'
  },
  actionIcon: {
    fontSize: 16
  },
  actionLabel: {
    color: '#e5e5e5',
    fontSize: 10,
    fontWeight: '700'
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  seeAll: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700'
  },
  courseScroll: {
    marginBottom: 14
  },
  courseCard: {
    width: 150,
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#262626'
  },
  courseColorPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#d4af37',
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  courseCodeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900'
  },
  courseTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 16
  },
  courseProf: {
    color: '#d4af37',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.85
  },
  recentCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626'
  },
  fileBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fileBadgeText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 11
  },
  recentCourse: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold'
  },
  recentTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  recentMeta: {
    color: '#737373',
    fontSize: 10
  },
  openArrow: {
    color: '#d4af37',
    fontSize: 12,
    paddingHorizontal: 6
  },
  quizStartBtn: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  quizStartText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900'
  }
});
