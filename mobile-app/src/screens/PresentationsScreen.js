import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { getPresentations, downloadAndSaveOffline, deletePresentation } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PresentationsScreen({ navigation }) {
  const { isInstructor } = useAuth();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await getPresentations(null, filter);
    setPresentations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [filter, navigation]);

  const handleDownload = async (item) => {
    try {
      Alert.alert('Downloading', `Saving ${item.original_name} to device storage...`);
      await downloadAndSaveOffline(item.id, item.original_name);
    } catch (err) {
      Alert.alert('Download Error', err.message);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete presentation?', `"${item.title}" will be removed. Linked exercises stay but lose their link.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deletePresentation(item.id); await loadData(); }
          catch (err) { Alert.alert('Delete failed', err.message); }
        }
      }
    ]);
  };

  const filtered = presentations.filter(p => {
    if (!search) return true;
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.course_code.toLowerCase().includes(search.toLowerCase())
    );
  });

  const renderItem = ({ item }) => {
    let slides = [];
    try {
      slides = JSON.parse(item.slides_data || '[]');
    } catch (e) {
      slides = [];
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {item.extension ? item.extension.replace('.', '').toUpperCase() : 'PPT'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.courseRow}>
              <Text style={styles.courseCode}>{item.course_code}</Text>
              <Text style={styles.weekTag}>Week {item.week_number}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'Uploaded course lecture presentation.'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📊 {item.slide_count} slides</Text>
          <Text style={styles.metaText}>💾 {(item.file_size / (1024 * 1024)).toFixed(1)} MB</Text>
          <Text style={styles.metaText}>👁️ {item.views_count} views</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => navigation.navigate('SlideViewer', { presentation: item, slides })}
          >
            <Text style={styles.openBtnText}>▶ Open Slide Deck</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => handleDownload(item)}
          >
            <Text style={styles.downloadBtnText}>📥 Save</Text>
          </TouchableOpacity>

          {isInstructor && (
            <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDelete(item)}>
              <Text style={[styles.downloadBtnText, { color: '#f87171' }]}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search slides by title or course..."
          placeholderTextColor="#737373"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All Decks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'fav' && styles.filterChipActive]}
          onPress={() => setFilter('fav')}
        >
          <Text style={[styles.filterText, filter === 'fav' && styles.filterTextActive]}>⭐ Favorites</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#d4af37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No presentations found. Nothing has been uploaded yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    paddingTop: 10
  },
  searchBox: {
    paddingHorizontal: 16,
    marginBottom: 8
  },
  searchInput: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#262626'
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#262626'
  },
  filterChipActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37'
  },
  filterText: {
    color: '#a3a3a3',
    fontSize: 12,
    fontWeight: '600'
  },
  filterTextActive: {
    color: '#000000',
    fontWeight: '900'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#262626'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  badgeContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  badgeText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12
  },
  headerInfo: {
    flex: 1
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  courseCode: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '900'
  },
  weekTag: {
    color: '#737373',
    fontSize: 11
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  description: {
    color: '#a3a3a3',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f1f1f',
    marginBottom: 10
  },
  metaText: {
    color: '#737373',
    fontSize: 11
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8
  },
  openBtn: {
    flex: 1,
    backgroundColor: '#d4af37',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  openBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12
  },
  downloadBtn: {
    backgroundColor: '#1f1f1f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333'
  },
  downloadBtnText: {
    color: '#d4af37',
    fontWeight: '700',
    fontSize: 12
  },
  emptyText: {
    color: '#737373',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13
  }
});
