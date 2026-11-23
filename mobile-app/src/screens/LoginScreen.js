import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getBaseUrl, setBaseUrl } from '../services/api';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [code, setCode] = useState('');
  const [server, setServer] = useState(getBaseUrl());
  const [showServer, setShowServer] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return Alert.alert('Missing info', 'Enter your email and password.');
    if (mode === 'register' && !name.trim()) return Alert.alert('Missing info', 'Enter your name.');
    if (mode === 'register' && role === 'instructor' && !code.trim()) {
      return Alert.alert('Missing info', 'Enter the instructor code.');
    }
    setBusy(true);
    try {
      await setBaseUrl(server);
      if (mode === 'login') await signIn(email.trim(), password);
      else await signUp({
        name: name.trim(), email: email.trim(), password,
        instructorCode: role === 'instructor' ? code.trim() : ''
      });
    } catch (err) {
      Alert.alert(mode === 'login' ? 'Login failed' : 'Sign up failed', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#050505' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>SLIDEBOX</Text>
        <Text style={styles.sub}>Presentation & Exercise Vault</Text>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {['login', 'register'].map((m) => (
              <TouchableOpacity key={m} style={[styles.tab, mode === m && styles.tabActive]} onPress={() => setMode(m)}>
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Log in' : 'Sign up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'register' && (
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#737373"
              value={name} onChangeText={setName} />
          )}
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#737373"
            autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password (min 6 characters)" placeholderTextColor="#737373"
            secureTextEntry value={password} onChangeText={setPassword} />

          {mode === 'register' && (
            <>
              <View style={styles.tabs}>
                {['student', 'instructor'].map((r) => (
                  <TouchableOpacity key={r} style={[styles.tab, role === r && styles.tabActive]} onPress={() => setRole(r)}>
                    <Text style={[styles.tabText, role === r && styles.tabTextActive]}>
                      {r === 'student' ? 'I am a student' : 'I am an instructor'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {role === 'instructor' && (
                <TextInput style={styles.input} placeholder="Instructor code" placeholderTextColor="#737373"
                  autoCapitalize="none" value={code} onChangeText={setCode} />
              )}
            </>
          )}

          <TouchableOpacity style={styles.primary} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#000" /> :
              <Text style={styles.primaryText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setShowServer(!showServer)}>
          <Text style={styles.link}>{showServer ? 'Hide server address' : 'Server address'}</Text>
        </TouchableOpacity>
        {showServer && (
          <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="https://your-app.onrender.com"
            placeholderTextColor="#737373" autoCapitalize="none" autoCorrect={false}
            value={server} onChangeText={setServer} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { color: '#d4af37', fontSize: 30, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  sub: { color: '#a3a3a3', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  card: { backgroundColor: '#111', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#171717', alignItems: 'center', borderWidth: 1, borderColor: '#262626' },
  tabActive: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
  tabText: { color: '#a3a3a3', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#000', fontWeight: '900' },
  input: { backgroundColor: '#171717', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: '#fff', marginBottom: 10, borderWidth: 1, borderColor: '#262626' },
  primary: { backgroundColor: '#d4af37', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#000', fontWeight: '900', fontSize: 14 },
  link: { color: '#d4af37', textAlign: 'center', marginTop: 18, fontSize: 12, fontWeight: '700' }
});
