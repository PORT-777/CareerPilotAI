// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Radii, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'gold' | 'emerald' | 'rose' | 'muted';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'primary', size = 'sm' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], size === 'md' && styles.md]}>
      <Text style={[styles.text, styles[`text_${variant}`], size === 'md' && styles.textMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  primary: { backgroundColor: Colors.primaryGlow, borderWidth: 1, borderColor: Colors.primary },
  gold: { backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.gold },
  emerald: { backgroundColor: Colors.emeraldGlow, borderWidth: 1, borderColor: Colors.emerald },
  rose: { backgroundColor: 'rgba(255,92,124,0.15)', borderWidth: 1, borderColor: Colors.rose },
  muted: { backgroundColor: Colors.surfaceCard },

  text: { fontSize: FontSizes.xs, fontWeight: '600', includeFontPadding: false },
  textMd: { fontSize: FontSizes.sm },
  text_primary: { color: Colors.primaryLight },
  text_gold: { color: Colors.gold },
  text_emerald: { color: Colors.emerald },
  text_rose: { color: Colors.rose },
  text_muted: { color: Colors.textSecondary },
});
