// Powered by OnSpace.AI — Dashboard with real DB stats
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { JobCard, StatCard, JobCardSkeleton, StatCardSkeleton } from '@/components';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/template';
import { Job, jobsService } from '@/services/jobsService';
import { getSupabaseClient } from '@/template';

interface DashboardStats {
  totalApps: number;
  activeApps: number;
  bestMatchScore: number;
  topCvScore: number | null;
  alertsCount: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authUser, bookmarkedJobs, toggleBookmark } = useApp();
  const { user } = useAuth();
  const [recommended, setRecommended] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalApps: 0,
    activeApps: 0,
    bestMatchScore: 0,
    topCvScore: null,
    alertsCount: 0,
  });

  const fetchStats = useCallback(async () => {
    const uid = user?.id ?? authUser?.id;
    if (!uid) return;

    const supabase = getSupabaseClient();

    // Run all queries in parallel
    const [appsRes, cvsRes, alertsRes, jobsRes] = await Promise.all([
      supabase.from('applications').select('status').eq('user_id', uid),
      supabase.from('user_cvs').select('score').eq('user_id', uid).order('score', { ascending: false }).limit(1),
      supabase.from('job_alerts').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('is_active', true),
      supabase.from('jobs').select('match_score').order('match_score', { ascending: false }).limit(1),
    ]);

    const apps = appsRes.data ?? [];
    const activeStatuses = ['applied', 'screening', 'interview'];
    const activeApps = apps.filter(a => activeStatuses.includes(a.status)).length;

    const topCv = cvsRes.data?.[0]?.score ?? null;
    const alertsCount = (alertsRes.count ?? 0);
    const bestMatch = jobsRes.data?.[0]?.match_score ?? 0;

    setStats({
      totalApps: apps.length,
      activeApps,
      bestMatchScore: bestMatch,
      topCvScore: topCv,
      alertsCount,
    });
  }, [user?.id, authUser?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      jobsService.getRecommendedJobs().then(setRecommended),
      fetchStats(),
    ]);
    setLoading(false);
  }, [fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}،</Text>
          <Text style={styles.userName}>{user?.username ?? authUser?.email?.split('@')[0] ?? 'مرحباً'} 👋</Text>
        </View>
        <Pressable
          onPress={() => router.push('/ai-chat')}
          style={({ pressed }) => [styles.agentBtn, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="smart-toy" size={24} color={Colors.primary} />
          <View style={styles.agentDot} />
        </Pressable>
      </View>

      {/* AI Agent Banner */}
      <Pressable onPress={() => router.push('/ai-chat')} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <LinearGradient
          colors={['#1a3fa0', '#3b7fff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.agentBanner}
        >
          <View style={styles.agentBannerLeft}>
            <MaterialIcons name="smart-toy" size={28} color={Colors.textPrimary} />
            <View style={styles.agentPulse} />
          </View>
          <View style={styles.agentBannerContent}>
            <Text style={styles.agentBannerTitle}>وكيل AI نشط · Gemini 3 Flash</Text>
            <Text style={styles.agentBannerSub}>
              {stats.alertsCount > 0
                ? `${stats.alertsCount} تنبيه نشط · اضغط للمحادثة`
                : 'جاهز لمساعدتك في بحثك الوظيفي'}
            </Text>
          </View>
          <MaterialIcons name="arrow-back-ios" size={18} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </Pressable>

      {/* Real Stats */}
      <Text style={styles.sectionTitle}>إحصائياتك الحقيقية</Text>
      {loading ? (
        <>
          <View style={styles.statsRow}>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
          <View style={styles.statsRow}>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
        </>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard
              value={String(stats.totalApps || '0')}
              label="إجمالي الطلبات"
              icon="assignment"
              color={Colors.primary}
              trend={stats.activeApps > 0 ? `${stats.activeApps} نشطة` : undefined}
            />
            <StatCard
              value={String(stats.activeApps || '0')}
              label="طلبات نشطة"
              icon="work"
              color={Colors.emerald}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              value={`${stats.bestMatchScore}%`}
              label="أعلى تطابق"
              icon="stars"
              color={Colors.gold}
            />
            <StatCard
              value={stats.topCvScore !== null ? String(stats.topCvScore) : '--'}
              label="نقاط CV"
              icon="description"
              color={Colors.rose}
              trend={stats.topCvScore === null ? 'حلّل CV للحصول على نقاط' : undefined}
            />
          </View>
        </>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map(action => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route as any)}
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8 }]}
          >
            <LinearGradient
              colors={action.gradient as [string, string]}
              style={styles.quickActionIcon}
            >
              <MaterialIcons name={action.icon as any} size={22} color={Colors.textPrimary} />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Recommended Jobs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>وظائف موصى بها</Text>
        <Pressable onPress={() => router.push('/(tabs)/jobs')}>
          <Text style={styles.seeAll}>عرض الكل</Text>
        </Pressable>
      </View>

      {loading ? (
        <View>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : recommended.length === 0 ? (
        <View style={styles.emptyJobs}>
          <MaterialIcons name="work-off" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyJobsText}>لا توجد وظائف حالياً</Text>
        </View>
      ) : (
        <View>
          {recommended.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => router.push({ pathname: '/job-detail', params: { id: job.id } })}
              onBookmark={() => toggleBookmark(job.id)}
              isBookmarked={bookmarkedJobs.includes(job.id)}
            />
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const QUICK_ACTIONS = [
  { label: 'بحث ذكي', icon: 'search', route: '/(tabs)/jobs', gradient: ['#3b7fff', '#1a3fa0'] },
  { label: 'إدارة CV', icon: 'description', route: '/cv-manager', gradient: ['#22c98a', '#0d7a52'] },
  { label: 'مقابلة AI', icon: 'psychology', route: '/interview', gradient: ['#f0c040', '#c4830a'] },
  { label: 'تنبيهات', icon: 'notifications', route: '/alerts', gradient: ['#ff5c7c', '#b52240'] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  userName: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  agentBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.emerald,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
  agentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  agentBannerLeft: { position: 'relative' },
  agentPulse: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.emerald,
  },
  agentBannerContent: { flex: 1 },
  agentBannerTitle: { color: Colors.textPrimary, fontWeight: FontWeights.bold, fontSize: FontSizes.md },
  agentBannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSizes.sm, marginTop: 3 },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
    textAlign: 'right',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAll: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
  },
  emptyJobs: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyJobsText: { color: Colors.textMuted, fontSize: FontSizes.md },
});
