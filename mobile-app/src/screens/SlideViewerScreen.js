import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { downloadAndSaveOffline } from '../services/api';

export default function SlideViewerScreen({ route, navigation }) {
  const { presentation, slides } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideList = slides && slides.length > 0 ? slides : [
    {
      slide_number: 1,
      title: presentation.title,
      subtitle: 'Executive Presentation Deck',
      bullets: ['Curated masterclass materials', 'Stored in SlideBox LMS'],
      notes: 'Introductory executive slide'
    }
  ];

  const currentSlide = slideList[currentIndex] || slideList[0];

  const handleNext = () => {
    if (currentIndex < slideList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.deckTitle} numberOfLines={1}>{presentation.title}</Text>
            <Text style={styles.deckSub}>{presentation.course_code}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => downloadAndSaveOffline(presentation.id, presentation.original_name)}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Stage Card */}
        <View style={styles.stage}>
          <View style={styles.slideCard}>
            <View style={styles.slideHeader}>
              <Text style={styles.slideBadge}>{currentSlide.badge || 'Topic'}</Text>
              <Text style={styles.slideCounter}>
                Slide {currentIndex + 1} of {slideList.length}
              </Text>
            </View>

            <ScrollView style={styles.slideBody}>
              <Text style={styles.slideTitle}>{currentSlide.title}</Text>
              {currentSlide.subtitle ? (
                <Text style={styles.slideSubtitle}>{currentSlide.subtitle}</Text>
              ) : null}

              <View style={styles.bulletsContainer}>
                {(currentSlide.bullets || []).map((b, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>

              {currentSlide.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesTitle}>👑 Executive Remarks:</Text>
                  <Text style={styles.notesText}>{currentSlide.notes}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>

        {/* Bottom Controller */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navBtnText}>← Previous</Text>
          </TouchableOpacity>

          <View style={styles.dotsBar}>
            {slideList.map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
                onPress={() => setCurrentIndex(i)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.navBtnNext, currentIndex === slideList.length - 1 && styles.navBtnDisabled]}
            onPress={handleNext}
            disabled={currentIndex === slideList.length - 1}
          >
            <Text style={styles.navBtnNextText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000'
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a'
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626'
  },
  closeBtnText: {
    color: '#a3a3a3',
    fontWeight: 'bold',
    fontSize: 12
  },
  deckTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13
  },
  deckSub: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '700'
  },
  saveBtn: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900'
  },
  stage: {
    flex: 1,
    padding: 16,
    justifyContent: 'center'
  },
  slideCard: {
    flex: 1,
    backgroundColor: '#0c0c0c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 20
  },
  slideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  slideBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  slideCounter: {
    color: '#737373',
    fontSize: 11,
    fontFamily: 'monospace'
  },
  slideBody: {
    flex: 1
  },
  slideTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 4
  },
  slideSubtitle: {
    color: '#d4af37',
    fontSize: 12,
    marginBottom: 16,
    fontWeight: '600'
  },
  bulletsContainer: {
    marginVertical: 10
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4af37',
    marginTop: 6,
    marginRight: 8
  },
  bulletText: {
    color: '#e5e5e5',
    fontSize: 13,
    lineHeight: 18,
    flex: 1
  },
  notesBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)'
  },
  notesTitle: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4
  },
  notesText: {
    color: '#d4d4d4',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#171717'
  },
  navBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626'
  },
  navBtnNext: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#d4af37'
  },
  navBtnDisabled: {
    opacity: 0.3
  },
  navBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  navBtnNextText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 12
  },
  dotsBar: {
    flexDirection: 'row',
    gap: 6
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#262626'
  },
  dotActive: {
    backgroundColor: '#d4af37',
    width: 14
  }
});
