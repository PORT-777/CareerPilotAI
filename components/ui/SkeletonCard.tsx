// Powered by OnSpace.AI — Skeleton loading card
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBoxProps) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.border,
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

export function JobCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <SkeletonBox width={44} height={44} borderRadius={Radii.sm} />
        <View style={styles.headerText}>
          <SkeletonBox width="60%" height={14} borderRadius={6} />
          <SkeletonBox width="40%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
        <SkeletonBox width={48} height={24} borderRadius={12} />
      </View>
      {/* Tags row */}
      <View style={styles.tagsRow}>
        <SkeletonBox width={80} height={24} borderRadius={12} />
        <SkeletonBox width={70} height={24} borderRadius={12} />
        <SkeletonBox width={90} height={24} borderRadius={12} />
      </View>
      {/* Footer */}
      <View style={styles.footer}>
        <SkeletonBox width="30%" height={12} borderRadius={6} />
        <SkeletonBox width={88} height={32} borderRadius={8} />
      </View>
    </View>
  );
}

export function StatCardSkeleton() {
  return (
    <View style={styles.statCard}>
      <SkeletonBox width={36} height={36} borderRadius={18} />
      <SkeletonBox width="50%" height={22} borderRadius={6} style={{ marginTop: 12 }} />
      <SkeletonBox width="70%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
});
