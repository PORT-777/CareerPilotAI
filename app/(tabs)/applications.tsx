// Powered by OnSpace.AI — Applications with status distribution chart
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  Dimensions,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { AppRecord } from '@/services/applicationsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.md * 2;
const CHART_HEIGHT = 120;

const STATUS_CONFIG: Record<AppRecord['status'], { labelAr: string; color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  applied:   { labelAr: 'تم التقديم', color: Colors.textSecondary, icon: 'send' },
  screening: { labelAr: 'فرز أولي',  color: Colors.primary,       icon: 'manage-search' },
  interview: { labelAr: 'مقابلة',    color: Colors.gold,           icon: 'video-call' },
  offer:     { labelAr: 'عرض',       color: Colors.emerald,        icon: 'celebration' },
  rejected:  { labelAr: 'مرفوض',     color: Colors.rose,           icon: 'cancel' },
};

const STATUS_ORDER: AppRecord['status'][] = ['applied', 'screening', 'interview', 'offer', 'rejected'];

// ─── Bar Chart Component ──────────────────────────────────────────────────────
interface StatusCount { status: AppRecord['status']; count: number }

function StatusBarChart({ data, total }: { data: StatusCount[]; total: number }) {
  if (total === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barWidth = Math.max(1, (CHART_WIDTH - Spacing.md * (data.length - 1)) / data.length);

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>توزيع الطلبات حسب الحالة</Text>

      {/* Bars */}
      <View style={chartStyles.barsArea}>
        {data.map(item => {
          const cfg = STATUS_CONFIG[item.status];
          const barH = item.count === 0 ? 0 : Math.max(4, (item.count / maxCount) * CHART_HEIGHT);
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <View key={item.status} style={[chartStyles.barCol, { width: barWidth }]}>
              {item.count > 0 && (
                <Text style={[chartStyles.barCount, { color: cfg.color }]}>{item.count}</Text>
              )}
              <View style={chartStyles.barTrack}>
                <View style={[chartStyles.barFill, { height: barH, backgroundColor: cfg.color }]} />
              </View>
              <MaterialIcons name={cfg.icon} size={14} color={cfg.color} style={chartStyles.barIcon} />
              <Text style={[chartStyles.barLabel, { color: cfg.color }]} numberOfLines={2}>
                {cfg.labelAr}
              </Text>
              {pct > 0 && <Text style={chartStyles.barPct}>{pct}%</Text>}
            </View>
          );
        })}
      </View>

      {/* Legend row */}
      <View style={chartStyles.legend}>
        {data.filter(d => d.count > 0).map(item => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <View key={item.status} style={chartStyles.legendItem}>
              <View style={[chartStyles.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={chartStyles.legendText}>{cfg.labelAr}: {item.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const { applications, loadApplications, appsLoading } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  // Build status distribution
  const statusCounts: StatusCount[] = STATUS_ORDER.map(status => ({
    status,
    count: applications.filter(a => a.status === status).length,
  }));

  const stats = {
    total: applications.length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
    active: applications.filter(a => ['applied', 'screening', 'interview'].includes(a.status)).length,
  };

  const renderApplication: ListRenderItem<AppRecord> = ({ item }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const statusOrder: AppRecord['status'][] = ['applied', 'screening', 'interview', 'offer'];
    const currentIdx = statusOrder.indexOf(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardCompany}>
            <View style={[styles.companyIcon, { backgroundColor: `${statusConfig.color}22` }]}>
              <Text style={[styles.companyLetter, { color: statusConfig.color }]}>
                {item.company[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardTitles}>
              <Text style={styles.jobTitle}>{item.job_title}</Text>
              <Text style={styles.companyName}>{item.company}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}22`, borderColor: statusConfig.color }]}>
            <MaterialIcons name={statusConfig.icon} size={13} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.labelAr}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {statusOrder.map((step, i) => {
            const isActive = item.status === 'rejected' ? false : currentIdx >= i;
            const cfg = STATUS_CONFIG[step];
            return (
              <View key={step} style={styles.timelineStep}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: isActive ? cfg.color : Colors.border },
                ]}>
                  {isActive && <View style={[styles.timelineDotInner, { backgroundColor: Colors.background }]} />}
                </View>
                {i < statusOrder.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    { backgroundColor: currentIdx > i && item.status !== 'rejected' ? cfg.color : Colors.border },
                  ]} />
                )}
              </View>
            );
          })}
        </View>

        {item.next_step ? (
          <View style={styles.nextStep}>
            <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
            <Text style={styles.nextStepText}>{item.next_step}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            تقديم: {new Date(item.applied_date).toLocaleDateString('ar-SA')}
          </Text>
          {item.cv_customized && (
            <View style={styles.cvTag}>
              <MaterialIcons name="auto-fix-high" size={12} color={Colors.emerald} />
              <Text style={styles.cvTagText}>CV مخصص</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>طلباتي</Text>
        <Text style={styles.subtitle}>{stats.total} طلب · {stats.active} نشط</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={item => item.id}
        renderItem={renderApplication}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={[styles.quickStatValue, { color: Colors.primary }]}>{stats.total}</Text>
                <Text style={styles.quickStatLabel}>إجمالي</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.quickStat}>
                <Text style={[styles.quickStatValue, { color: Colors.gold }]}>{stats.interview}</Text>
                <Text style={styles.quickStatLabel}>مقابلات</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.quickStat}>
                <Text style={[styles.quickStatValue, { color: Colors.emerald }]}>{stats.offer}</Text>
                <Text style={styles.quickStatLabel}>عروض</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.quickStat}>
                <Text style={[styles.quickStatValue, { color: Colors.rose }]}>
                  {applications.filter(a => a.status === 'rejected').length}
                </Text>
                <Text style={styles.quickStatLabel}>مرفوض</Text>
              </View>
            </View>

            {/* Status Distribution Chart */}
            {appsLoading && !refreshing ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.chartLoadingText}>تحميل الإحصائيات...</Text>
              </View>
            ) : stats.total > 0 ? (
              <StatusBarChart data={statusCounts} total={stats.total} />
            ) : null}

            {/* Section title */}
            {stats.total > 0 && (
              <Text style={styles.sectionTitle}>قائمة الطلبات</Text>
            )}
          </>
        }
        ListEmptyComponent={
          appsLoading && !refreshing ? null : (
            <View style={styles.empty}>
              <MaterialIcons name="assignment" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد طلبات بعد</Text>
              <Text style={styles.emptySubtext}>ابدأ التقديم على الوظائف من تبويب الوظائف</Text>
            </View>
          )
        }
      />
    </View>
  );
}

// ─── Chart Styles ─────────────────────────────────────────────────────────────
const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    textAlign: 'right',
    marginBottom: Spacing.md,
  },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    height: CHART_HEIGHT + 80,
    marginBottom: Spacing.md,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barCount: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    includeFontPadding: false,
  },
  barTrack: {
    width: '100%',
    height: CHART_HEIGHT,
    backgroundColor: Colors.border,
    borderRadius: Radii.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: Radii.sm,
  },
  barIcon: { marginTop: 4 },
  barLabel: {
    fontSize: 9,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
    lineHeight: 13,
  },
  barPct: {
    fontSize: 9,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.textSecondary, fontSize: FontSizes.xs },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  subtitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, marginTop: 3 },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  quickStatLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 3 },
  divider: { width: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    textAlign: 'right',
    marginBottom: Spacing.md,
  },
  chartLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  chartLoadingText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardCompany: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLetter: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  cardTitles: { flex: 1 },
  jobTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    textAlign: 'right',
  },
  companyName: { color: Colors.textSecondary, fontSize: FontSizes.sm, textAlign: 'right' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  timelineStep: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: { width: 6, height: 6, borderRadius: 3 },
  timelineLine: { flex: 1, height: 2 },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  nextStepText: { color: Colors.textSecondary, fontSize: FontSizes.sm, flex: 1, textAlign: 'right' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: Colors.textMuted, fontSize: FontSizes.xs },
  cvTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cvTagText: { color: Colors.emerald, fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSizes.md, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
