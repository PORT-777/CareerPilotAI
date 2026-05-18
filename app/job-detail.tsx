// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { Job, jobsService } from '@/services/jobsService';
import { Badge, Button } from '@/components';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { applicationsService } from '@/services/applicationsService';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookmarkedJobs, toggleBookmark, authUser, addApplication } = useApp();
  const { showAlert } = useAlert();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      jobsService.getJobById(id).then(data => {
        setJob(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleApply = async () => {
    if (!authUser?.id || !job) return;
    setApplying(true);
    await new Promise(r => setTimeout(r, 1500));
    await addApplication({
      job_title: job.titleAr,
      company: job.company,
      status: 'applied',
      applied_date: new Date().toISOString(),
      cv_customized: true,
      next_step: 'انتظار رد الشركة',
    });
    setApplying(false);
    showAlert(
      'تم التقديم بنجاح!',
      'قام وكيل AI بتخصيص سيرتك الذاتية وتقديم طلبك على ' + job.company + '. ستصلك تحديثات على لوحة الطلبات.',
      [{ text: 'رائع!', style: 'default', onPress: () => router.push('/(tabs)/applications') }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>لم يتم العثور على الوظيفة</Text>
      </View>
    );
  }

  const isBookmarked = bookmarkedJobs.includes(job.id);
  const matchColor = job.matchScore >= 90 ? Colors.emerald : job.matchScore >= 75 ? Colors.gold : Colors.textSecondary;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.logoBox}>
              {job.companyLogo ? (
                <Image source={{ uri: job.companyLogo }} style={styles.logo} contentFit="contain" transition={200} />
              ) : (
                <Text style={styles.logoLetter}>{job.company[0]}</Text>
              )}
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.companyName}>{job.company}</Text>
              <View style={styles.metaRow}>
                <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{job.locationAr}</Text>
              </View>
            </View>
            <Pressable onPress={() => toggleBookmark(job.id)} hitSlop={10}>
              <MaterialIcons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={26}
                color={isBookmarked ? Colors.gold : Colors.textMuted}
              />
            </Pressable>
          </View>

          <Text style={styles.jobTitle}>{job.titleAr}</Text>

          <View style={styles.tagsRow}>
            <Badge label={job.typeAr} variant={job.type === 'remote' ? 'emerald' : 'gold'} size="md" />
            <Badge label={job.platform} variant="primary" size="md" />
            <Badge label={job.postedAr} variant="muted" size="md" />
          </View>

          {/* Match Score */}
          <View style={styles.matchCard}>
            <View style={styles.matchInfo}>
              <Text style={styles.matchLabel}>تطابق وكيل AI</Text>
              <Text style={[styles.matchValue, { color: matchColor }]}>{job.matchScore}%</Text>
            </View>
            <View style={styles.matchBarTrack}>
              <View style={[styles.matchBarFill, { width: `${job.matchScore}%`, backgroundColor: matchColor }]} />
            </View>
          </View>
        </View>

        {/* Salary */}
        <View style={styles.salaryCard}>
          <LinearGradient colors={[Colors.emerald, Colors.primary]} style={styles.salaryGradient}>
            <MaterialIcons name="payments" size={24} color={Colors.textPrimary} />
            <View>
              <Text style={styles.salaryLabel}>الراتب المتوقع</Text>
              <Text style={styles.salaryValue}>{job.salary}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عن الوظيفة</Text>
          <Text style={styles.description}>{job.descriptionAr}</Text>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المتطلبات</Text>
          {job.requirementsAr.map((req, i) => (
            <View key={i} style={styles.requirementItem}>
              <MaterialIcons name="check-circle" size={16} color={Colors.primary} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المهارات المطلوبة</Text>
          <View style={styles.skillsRow}>
            {job.skills.map(skill => (
              <Badge key={skill} label={skill} variant="primary" size="md" />
            ))}
          </View>
        </View>

        {/* AI Action */}
        <View style={styles.aiAction}>
          <MaterialIcons name="auto-fix-high" size={18} color={Colors.gold} />
          <Text style={styles.aiActionText}>
            وكيل AI سيخصص سيرتك الذاتية لهذه الوظيفة قبل التقديم
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          label={applying ? 'جاري التقديم...' : 'تقديم ذكي بالـ AI'}
          onPress={handleApply}
          loading={applying}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.textSecondary, fontSize: FontSizes.md },
  headerCard: {
    backgroundColor: Colors.surfaceCard,
    margin: Spacing.md,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: '100%', height: '100%' },
  logoLetter: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: FontWeights.bold },
  headerMeta: { flex: 1 },
  companyName: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  metaText: { color: Colors.textMuted, fontSize: FontSizes.xs },
  jobTitle: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, textAlign: 'right', marginBottom: Spacing.md },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  matchCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radii.md, padding: Spacing.md },
  matchInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  matchLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  matchValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  matchBarTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  matchBarFill: { height: '100%', borderRadius: 3 },
  salaryCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderRadius: Radii.lg, overflow: 'hidden' },
  salaryGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  salaryLabel: { color: 'rgba(255,255,255,0.75)', fontSize: FontSizes.xs },
  salaryValue: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, textAlign: 'right', marginBottom: Spacing.md },
  description: { color: Colors.textSecondary, fontSize: FontSizes.md, lineHeight: 26, textAlign: 'right' },
  requirementItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  requirementText: { color: Colors.textSecondary, fontSize: FontSizes.md, flex: 1, textAlign: 'right' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  aiAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.md,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
  },
  aiActionText: { color: Colors.gold, fontSize: FontSizes.sm, flex: 1, textAlign: 'right' },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
});
