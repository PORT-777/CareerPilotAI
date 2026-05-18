// Powered by OnSpace.AI
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  ListRenderItem,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { ONBOARDING_SLIDES } from '@/constants/config';
import { Button } from '@/components';
import { useAuth } from '@/template';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  titleAr: string;
  subtitleAr: string;
  image: ReturnType<typeof require>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(prev => prev + 1);
    } else {
      handleStart();
    }
  };

  const handleStart = () => {
    router.replace('/(tabs)');
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <Image source={item.image} style={styles.slideImage} contentFit="cover" transition={300} />
      <View style={styles.overlay} />
    </View>
  );

  const isLast = activeIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{ONBOARDING_SLIDES[activeIndex].titleAr}</Text>
          <Text style={styles.subtitle}>{ONBOARDING_SLIDES[activeIndex].subtitleAr}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={isLast ? 'ابدأ الآن' : 'التالي'}
            onPress={handleNext}
            fullWidth
            size="lg"
          />
          {!isLast && (
            <Pressable onPress={handleStart} style={styles.skipBtn}>
              <Text style={styles.skipText}>تخطي</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: { height },
  slideImage: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,13,26,0.65)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  textBlock: { marginBottom: Spacing.xl },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
    textAlign: 'right',
    marginBottom: Spacing.md,
    lineHeight: 42,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    textAlign: 'right',
    lineHeight: 26,
  },
  actions: { gap: Spacing.md },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: FontSizes.md },
});
