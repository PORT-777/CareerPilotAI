// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { Job } from '@/services/jobsService';
import { Badge } from '@/components/ui/Badge';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
  compact?: boolean;
}

export function JobCard({ job, onPress, onBookmark, isBookmarked, compact = false }: JobCardProps) {
  const matchColor = job.matchScore >= 90 ? Colors.emerald : job.matchScore >= 75 ? Colors.gold : Colors.textSecondary;

  const typeVariant = job.type === 'remote' ? 'emerald' : job.type === 'hybrid' ? 'gold' : 'muted';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {job.companyLogo ? (
            <Image
              source={{ uri: job.companyLogo }}
              style={styles.logo}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoLetter}>{job.company[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
          <Text style={styles.platform}>{job.platform} · {job.postedAr}</Text>
        </View>
        <Pressable onPress={onBookmark} hitSlop={10} style={styles.bookmarkBtn}>
          <MaterialIcons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? Colors.gold : Colors.textMuted}
          />
        </Pressable>
      </View>

      <Text style={styles.title} numberOfLines={2}>{job.titleAr}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{job.locationAr}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="attach-money" size={13} color={Colors.textMuted} />
          <Text style={styles.metaText}>{job.salary}</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.skillsRow}>
          {job.skills.slice(0, 3).map(skill => (
            <Badge key={skill} label={skill} variant="muted" />
          ))}
          {job.skills.length > 3 && (
            <Badge label={`+${job.skills.length - 3}`} variant="muted" />
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Badge label={job.typeAr} variant={typeVariant} size="sm" />
        <View style={styles.matchContainer}>
          <View style={[styles.matchDot, { backgroundColor: matchColor }]} />
          <Text style={[styles.matchScore, { color: matchColor }]}>{job.matchScore}% تطابق</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  compact: {
    width: 260,
    marginBottom: 0,
    marginRight: Spacing.md,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  logo: { width: '100%', height: '100%' },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  logoLetter: { color: Colors.textPrimary, fontWeight: '700', fontSize: FontSizes.lg },
  headerInfo: { flex: 1 },
  company: { color: Colors.textPrimary, fontWeight: FontWeights.semibold, fontSize: FontSizes.sm },
  platform: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 2 },
  bookmarkBtn: { padding: 4 },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    textAlign: 'right',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: Colors.textSecondary, fontSize: FontSizes.xs },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  matchDot: { width: 7, height: 7, borderRadius: 4 },
  matchScore: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
});
