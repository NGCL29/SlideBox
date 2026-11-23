import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { getCourses, createCourse, deleteCourse } from '../services/api';

export default function SubjectsScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setCourses(await getCourses());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    return navigation.addListener('focus', load);
  }, [navigation, load]);

  const add = async () => {
    if (!code.trim() || !title.trim()) return Alert.alert('Missing info', 'Enter a subject code and title.');
    setBusy(true);
    try {
      await createCourse({ code: code.trim(), title: title.trim(), instructor: instructor.trim() || undefined });
      setCode(''); setTitle(''); setInstructor('');
      await load();
    } catch (err) {
      Alert.alert('Could not add subject', err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = (c) => {
    Alert.alert(
      `Remove ${c.code}?`,
      `This also deletes its ${c.presentations_count || 0} presentation(s) and ${c.exercises_count || 0} exercise(s), plus all student submissions. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try { await deleteCourse(c.id); await load(); }
            catch (err) { Alert.alert('Could not remove', err.message); }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.heading}>Add a subject</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Code (e.g. IT101)" placeholderTextColor="#737373"
            autoCapitalize="characters" value={code} onChangeText={setCode} />
          <TextInput style={[styles.input, { flex: 2 }]} placeholder="Subject title" placeholderTextColor="#737373"
            value={title} onChangeText={setTitle} />
        </View>
        <TextInput style={styles.input} placeholder="Instructor (optional)" placeholderTextColor="#737373"
          value={instructor} onChangeText={setInstructor} />
        <TouchableOpacity style={styles.addBtn} onPress={add} disabled={busy}>
          {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.addText}>+ Add subject</Text>}
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#d4af37" style={{ marginTop: 30 }} /> : (
        <FlatList
          data={courses}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No subjects yet. Add your first one above.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.meta}>{item.presentations_count || 0} slides • {item.exercises_count || 0} exercises</Text>
              </View>
              <TouchableOpacity style={styles.delBtn} onPress={() => remove(item)}>
                <Text style={styles.delText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  form: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  heading: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 10 },
  input: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', marginBottom: 8, borderWidth: 1, borderColor: '#262626' },
  addBtn: { backgroundColor: '#d4af37', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addText: { color: '#000', fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#262626' },
  code: { color: '#d4af37', fontWeight: '900', fontSize: 11 },
  title: { color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 2 },
  meta: { color: '#737373', fontSize: 11, marginTop: 2 },
  delBtn: { borderWidth: 1, borderColor: '#7f1d1d', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  delText: { color: '#f87171', fontWeight: '800', fontSize: 12 },
  empty: { color: '#737373', textAlign: 'center', marginTop: 30 }
});
