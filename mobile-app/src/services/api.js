// API service for the SlideBox mobile app.
// Handles: configurable server address, login token, and every API call.
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const URL_KEY = 'slidebox_server_url';
const TOKEN_KEY = 'slidebox_token';

// ---- Server address -------------------------------------------------------
// Priority: address saved in the app > EXPO_PUBLIC_API_URL (set in eas.json)
// > your computer's address when running through Expo Go > a placeholder.
function defaultUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;
  const hostUri = Constants.expoConfig?.hostUri || '';
  if (hostUri) return `http://${hostUri.split(':')[0]}:3000`;
  return 'http://192.168.1.8:3000';
}

let baseUrl = defaultUrl();
let token = null;
const memory = {}; // fallback if SecureStore is unavailable

async function storeGet(key) {
  try { return await SecureStore.getItemAsync(key); } catch (e) { return memory[key] || null; }
}
async function storeSet(key, value) {
  memory[key] = value;
  try { await SecureStore.setItemAsync(key, value); } catch (e) {}
}
async function storeDel(key) {
  delete memory[key];
  try { await SecureStore.deleteItemAsync(key); } catch (e) {}
}

function clean(url) {
  let u = String(url || '').trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

export function getBaseUrl() { return baseUrl; }

export async function setBaseUrl(url) {
  baseUrl = clean(url) || defaultUrl();
  await storeSet(URL_KEY, baseUrl);
  return baseUrl;
}

// Load saved server address and login token when the app starts.
export async function loadSession() {
  const savedUrl = await storeGet(URL_KEY);
  if (savedUrl) baseUrl = savedUrl;
  token = await storeGet(TOKEN_KEY);
  if (!token) return null;
  try {
    const data = await request('/api/auth/me');
    return data.user || data;
  } catch (e) {
    if (e.status === 401) { token = null; await storeDel(TOKEN_KEY); }
    return null; // server unreachable or token expired -> show login screen
  }
}

// ---- Core request helper --------------------------------------------------
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let init = { method, headers: h };
  if (body instanceof FormData) {
    init.body = body; // let React Native set the multipart boundary
  } else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, init);
  } catch (e) {
    const err = new Error(`Cannot reach the server at ${baseUrl}. Check the address and your internet connection.`);
    err.network = true;
    throw err;
  }
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    throw err;
  }
  return data;
}

async function safeList(path) {
  try {
    const d = await request(path);
    return Array.isArray(d) ? d : [];
  } catch (e) {
    console.warn(path, e.message);
    return [];
  }
}

// ---- Auth -----------------------------------------------------------------
async function saveAuth(data) {
  token = data.token;
  await storeSet(TOKEN_KEY, token);
  return data.user;
}
export async function login(email, password) {
  return saveAuth(await request('/api/auth/login', { method: 'POST', body: { email, password } }));
}
export async function register({ name, email, password, instructorCode }) {
  return saveAuth(await request('/api/auth/register', {
    method: 'POST',
    body: { name, email, password, instructor_code: instructorCode || undefined }
  }));
}
export async function logout() {
  token = null;
  await storeDel(TOKEN_KEY);
}

// ---- Subjects (courses) ---------------------------------------------------
export const getCourses = () => safeList('/api/courses');
export const createCourse = (course) => request('/api/courses', { method: 'POST', body: course });
export const deleteCourse = (id) => request(`/api/courses/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ---- Presentations --------------------------------------------------------
export function getPresentations(courseId = null, filter = 'all') {
  let q = '/api/presentations?';
  if (courseId) q += `course_id=${encodeURIComponent(courseId)}&`;
  if (filter === 'fav') q += 'favorite=1&';
  return safeList(q);
}

export async function uploadPresentationNative({ file, courseId, title, weekNumber, description }) {
  const fd = new FormData();
  fd.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
  fd.append('course_id', courseId);
  fd.append('title', title || file.name);
  fd.append('week_number', String(weekNumber || 1));
  fd.append('description', description || '');
  return request('/api/presentations/upload', { method: 'POST', body: fd });
}

export const deletePresentation = (id) =>
  request(`/api/presentations/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ---- Exercises ------------------------------------------------------------
export function getExercises(courseId = null) {
  let q = '/api/exercises?';
  if (courseId) q += `course_id=${encodeURIComponent(courseId)}`;
  return safeList(q);
}

export async function uploadExerciseNative({ file, courseId, presentationId, title, exerciseType, points, dueDate, description }) {
  const fd = new FormData();
  if (file) {
    fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
  }
  fd.append('course_id', courseId);
  if (presentationId) fd.append('presentation_id', presentationId);
  fd.append('title', title);
  fd.append('exercise_type', exerciseType || 'assignment');
  fd.append('points', String(points || 100));
  if (dueDate) fd.append('due_date', dueDate);
  fd.append('description', description || '');
  return request('/api/exercises/upload', { method: 'POST', body: fd });
}

export const deleteExercise = (id) =>
  request(`/api/exercises/${encodeURIComponent(id)}`, { method: 'DELETE' });

// The server takes the student's name and ID from the logged-in account.
export async function submitExerciseNative(exerciseId, { answersData, file }) {
  const fd = new FormData();
  if (answersData) {
    fd.append('submission_type', 'quiz_answers');
    fd.append('answers_data', JSON.stringify(answersData));
  } else if (file) {
    fd.append('submission_type', 'file');
    fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
  }
  return request(`/api/exercises/${encodeURIComponent(exerciseId)}/submit`, { method: 'POST', body: fd });
}

// ---- Download to phone ----------------------------------------------------
export async function downloadAndSaveOffline(presentationId, originalName) {
  const safeName = String(originalName || 'slides').replace(/[^\w.\- ]+/g, '_');
  const fileUri = `${FileSystem.documentDirectory}${safeName}`;
  const result = await FileSystem.downloadAsync(
    `${baseUrl}/api/presentations/${encodeURIComponent(presentationId)}/download`,
    fileUri,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (result.status && result.status >= 400) {
    throw new Error(`Download failed (${result.status})`);
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri);
  }
  return result.uri;
}

// ---- Stats ----------------------------------------------------------------
export async function getStorageStats() {
  try { return await request('/api/stats'); } catch (e) { return null; }
}
