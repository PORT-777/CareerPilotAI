// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';

interface StatCardProps {
  value: string | number;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  trend?: string;
}

export function StatCard({ value, label, icon, color = Colors.primary, trend }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${color}22` }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend ? <Text style={[styles.trend, { color }]}>{trend}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    includeFontPadding: false,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    marginTop: 3,
  },
  trend: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    marginTop: 2,
  },
});
