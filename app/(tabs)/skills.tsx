// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { aiService, SkillGap } from '@/services/aiService';
import { useApp } from '@/hooks/useApp';

export default function SkillsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiService.getSkillGaps().then(data => {
      setGaps(data);
      setLoading(false);
    });
  }, []);

  const SkillBar = ({ current, required, color }: { current: number; required: number; color: string }) => (
    <View style={styles.barContainer}>
      <View style={styles.barTrack}>
        <View style={[styles.barRequired, { width: `${required}%`, backgroundColor: `${color}30` }]} />
        <View style={[styles.barCurrent, { width: `${current}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barLabel, { color }]}>{current}%</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>تطوير المهارات</Text>
      <Text style={styles.subtitle}>تحليل فجوات المهارات بالذكاء الاصطناعي</Text>

      {/* Current Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>مهاراتك الحالية</Text>
        <View style={styles.skillsWrap}>
          {user.skills.map(skill => (
            <View key={skill} style={styles.skillChip}>
              <MaterialIcons name="check-circle" size={14} color={Colors.emerald} />
              <Text style={styles.skillChipText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Overall Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreLeft}>
          <Text style={styles.scoreValue}>78</Text>
          <Text style={styles.scoreUnit}>/100</Text>
        </View>
        <View style={styles.scoreRight}>
          <Text style={styles.scoreTitle}>نقاط السيرة الذاتية</Text>
          <Text style={styles.scoreDesc}>تحسين 3 مجالات سيرفع نقاطك إلى 92+</Text>
        </View>
        <MaterialIcons name="description" size={36} color={`${Colors.gold}50`} />
      </View>

      {/* Skill Gaps */}
      <Text style={styles.sectionTitle}>فجوات المهارات</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
      ) : (
        gaps.map(gap => {
          const isLarge = gap.requiredLevel - gap.currentLevel > 40;
          const gapColor = isLarge ? Colors.rose : gap.requiredLevel - gap.currentLevel > 20 ? Colors.gold : Colors.emerald;
          return (
            <View key={gap.skill} style={styles.gapCard}>
              <View style={styles.gapHeader}>
                <View style={styles.gapTitles}>
                  <Text style={styles.gapTitle}>{gap.skillAr}</Text>
                  <Text style={styles.gapEn}>{gap.skill}</Text>
                </View>
                <View style={[styles.gapBadge, { backgroundColor: `${gapColor}20`, borderColor: gapColor }]}>
                  <Text style={[styles.gapBadgeText, { color: gapColor }]}>
                    فجوة {gap.requiredLevel - gap.currentLevel}%
                  </Text>
                </View>
              </View>

              <SkillBar current={gap.currentLevel} required={gap.requiredLevel} color={Colors.primary} />

              <View style={styles.gapLegend}>
                <Text style={styles.gapLegendText}>الحالي: {gap.currentLevel}%</Text>
                <Text style={styles.gapLegendText}>المطلوب: {gap.requiredLevel}%</Text>
              </View>

              {gap.course ? (
                <Pressable
                  onPress={() => gap.courseUrl && Linking.openURL(gap.courseUrl)}
                  style={({ pressed }) => [styles.courseBtn, pressed && { opacity: 0.8 }]}
                >
                  <MaterialIcons name="school" size={16} color={Colors.primary} />
                  <Text style={styles.courseBtnText}>{gap.course}</Text>
                  <MaterialIcons name="open-in-new" size={14} color={Colors.primary} />
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}

      {/* AI Tip */}
      <View style={styles.aiTip}>
        <MaterialIcons name="lightbulb" size={20} color={Colors.gold} />
        <Text style={styles.aiTipText}>
          نصيحة AI: التركيز على Machine Learning سيرفع تطابقك مع وظائف NEOM وأرامكو بنسبة 40%
        </Text>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: FontWeights.bold, marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, marginBottom: Spacing.md, textAlign: 'right' },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.emeraldGlow,
    borderWidth: 1,
    borderColor: Colors.emerald,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  skillChipText: { color: Colors.emerald, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  scoreCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scoreLeft: { flexDirection: 'row', alignItems: 'flex-end' },
  scoreValue: { color: Colors.gold, fontSize: FontSizes.xxxl, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  scoreUnit: { color: Colors.textMuted, fontSize: FontSizes.lg, marginBottom: 4 },
  scoreRight: { flex: 1 },
  scoreTitle: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.semibold, textAlign: 'right' },
  scoreDesc: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginTop: 4, textAlign: 'right' },
  gapCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  gapTitles: { flex: 1 },
  gapTitle: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.bold, textAlign: 'right' },
  gapEn: { color: Colors.textMuted, fontSize: FontSizes.xs, textAlign: 'right' },
  gapBadge: { borderWidth: 1, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  gapBadgeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
  barContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  barRequired: { position: 'absolute', height: '100%', borderRadius: 4, left: 0 },
  barCurrent: { position: 'absolute', height: '100%', borderRadius: 4, left: 0 },
  barLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, width: 40, textAlign: 'right' },
  gapLegend: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  gapLegendText: { color: Colors.textMuted, fontSize: FontSizes.xs },
  courseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radii.md,
    padding: Spacing.sm,
  },
  courseBtnText: { color: Colors.primaryLight, fontSize: FontSizes.sm, flex: 1 },
  aiTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  aiTipText: { color: Colors.gold, fontSize: FontSizes.sm, flex: 1, textAlign: 'right', lineHeight: 22 },
});
