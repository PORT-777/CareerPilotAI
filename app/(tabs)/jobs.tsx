// Powered by OnSpace.AI — Jobs with real Supabase filter + skeleton + pull-to-refresh
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { JOB_CATEGORIES } from '@/constants/config';
import { JobCard } from '@/components';
import { JobCardSkeleton } from '@/components/ui/SkeletonCard';
import { useApp } from '@/hooks/useApp';
import { Job } from '@/services/jobsService';

const SKELETON_COUNT = 4;

export default function JobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { jobs, loadJobs, jobsLoading, bookmarkedJobs, toggleBookmark } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load on category change
  useEffect(() => {
    loadJobs(activeCategory, search);
  }, [activeCategory]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadJobs(activeCategory, search);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs(activeCategory, search);
    setRefreshing(false);
  }, [activeCategory, search, loadJobs]);

  const handleClearSearch = useCallback(() => {
    setSearch('');
    loadJobs(activeCategory, '');
  }, [activeCategory, loadJobs]);

  const renderJob: ListRenderItem<Job> = ({ item }) => (
    <JobCard
      job={item}
      onPress={() => router.push({ pathname: '/job-detail', params: { id: item.id } })}
      onBookmark={() => toggleBookmark(item.id)}
      isBookmarked={bookmarkedJobs.includes(item.id)}
    />
  );

  const renderSkeletons = () => (
    <View style={styles.skeletonList}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>البحث الوظيفي</Text>
        <Pressable
          onPress={() => router.push('/ai-chat')}
          style={({ pressed }) => [styles.aiSearchBtn, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons name="smart-toy" size={20} color={Colors.primary} />
          <Text style={styles.aiSearchText}>بحث ذكي</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن وظيفة، شركة، أو مهارة..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          textAlign="right"
        />
        {search.length > 0 && (
          <Pressable onPress={handleClearSearch} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          data={JOB_CATEGORIES}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
          renderItem={({ item }) => {
            const isSelected = activeCategory === item.id;
            return (
              <Pressable
                onPress={() => setActiveCategory(item.id)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {item.labelAr}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {jobsLoading && !refreshing ? 'جاري البحث...' : `${jobs.length} وظيفة`}
        </Text>
        <View style={styles.sortRow}>
          <MaterialIcons name="sort" size={14} color={Colors.primary} />
          <Text style={styles.sortText}>الأعلى تطابقاً</Text>
        </View>
      </View>

      {/* Job List with skeleton */}
      {jobsLoading && !refreshing ? (
        renderSkeletons()
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item.id}
          renderItem={renderJob}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyText}>لم يتم العثور على وظائف</Text>
              <Text style={styles.emptySubtext}>
                {search ? `لا نتائج لـ "${search}"` : 'جرب تغيير الفئة أو الكلمات المفتاحية'}
              </Text>
              {search ? (
                <Pressable
                  onPress={handleClearSearch}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>مسح البحث</Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  aiSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
  },
  aiSearchText: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    paddingVertical: 13,
    includeFontPadding: false,
  },
  categoriesWrapper: { marginBottom: Spacing.sm },
  categories: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeights.semibold },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultsText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  skeletonList: { paddingHorizontal: Spacing.md },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSizes.md, textAlign: 'center', paddingHorizontal: Spacing.xl },
  clearBtn: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  clearBtnText: { color: Colors.primary, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
});
