import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { getStorageStats } from '../services/api';

export default function VaultScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    const data = await getStorageStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    const unsubscribe = navigation.addListener('focus', loadStats);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  const usedMb = stats ? (stats.total_bytes / (1024 * 1024)).toFixed(1) : '0';
  const quotaMb = stats ? (stats.quota_bytes / (1024 * 1024)).toFixed(0) : '100';
  const pct = stats ? stats.percentage_used : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>SlideBox Storage Vault</Text>
      
      {/* Storage Card */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.usedText}>{usedMb} MB Deposited</Text>
          <Text style={styles.limitText}>of {quotaMb} MB Quota</Text>
        </View>

        {/* Gold Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.max(5, Math.min(100, pct))}%` }]} />
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownItem}>📊 {stats?.presentations_count || 0} Decks</Text>
          <Text style={styles.breakdownItem}>📝 {stats?.exercises_count || 0} Exercises</Text>
          <Text style={styles.breakdownItem}>👑 {stats?.submissions_count || 0} Submissions</Text>
        </View>
      </View>

      {/* 2x2 Grid */}
      <View style={styles.grid}>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>Presentations</Text>
          <Text style={[styles.cellVal, { color: '#d4af37' }]}>
            {stats ? ((stats.breakdown?.presentations || 0) / (1024 * 1024)).toFixed(1) : 0} MB
          </Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>Exercise Files</Text>
          <Text style={[styles.cellVal, { color: '#ffffff' }]}>
            {stats ? ((stats.breakdown?.exercises || 0) / (1024 * 1024)).toFixed(1) : 0} MB
          </Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>Active Courses</Text>
          <Text style={[styles.cellVal, { color: '#d4af37' }]}>
            {stats?.courses_count || 4} Enrolled
          </Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>Quota Health</Text>
          <Text style={[styles.cellVal, { color: '#e5e5e5' }]}>
            {pct}% Used
          </Text>
        </View>
      </View>

      {/* Sync Status */}
      <View style={styles.syncCard}>
        <Text style={styles.syncTitle}>👑 Executive Offline Sync</Text>
        <Text style={styles.syncSub}>
          Presentation decks are encrypted and available for offline viewing on iOS & Android via expo-file-system.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505'
  },
  content: {
    padding: 16
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505'
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 16
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10
  },
  usedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  limitText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '600'
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1f1f1f',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#d4af37',
    borderRadius: 4
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  breakdownItem: {
    color: '#a3a3a3',
    fontSize: 11
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  gridCell: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626'
  },
  cellLabel: {
    color: '#737373',
    fontSize: 11,
    marginBottom: 4
  },
  cellVal: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  syncCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)'
  },
  syncTitle: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4
  },
  syncSub: {
    color: '#d4d4d4',
    fontSize: 11,
    lineHeight: 16
  }
});
