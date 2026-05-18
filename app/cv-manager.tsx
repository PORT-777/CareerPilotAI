// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ListRenderItem,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { cvService, CVFile } from '@/services/cvService';
import { useAlert } from '@/template';
import { aiService } from '@/services/aiService';
import { notificationsService } from '@/services/notificationsService';

export default function CVManagerScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, cvFiles, loadCVs, cvsLoading } = useApp();
  const { showAlert } = useAlert();
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    loadCVs();
  }, []);

  const handleUpload = async () => {
    if (!authUser?.id) return;
    if (cvFiles.length >= 8) {
      showAlert('الحد الأقصى', 'يمكنك رفع 8 سير ذاتية كحد أقصى. يرجى حذف واحدة أولاً.');
      return;
    }
    try {
      setUploading(true);
      const file = await cvService.pickCV();
      if (!file) { setUploading(false); return; }
      const uploaded = await cvService.uploadCV(authUser.id, file);
      await loadCVs();
      // Trigger AI analysis
      if (uploaded?.id) {
        handleAnalyzeCV(uploaded.id, 'تم رفع سيرتك الذاتية. جاري التحليل بالذكاء الاصطناعي...');
      } else {
        showAlert('تم الرفع', 'تم رفع سيرتك الذاتية بنجاح!');
      }
    } catch (e: any) {
      showAlert('خطأ', e.message || 'فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeCV = async (cvId: string, toastMsg?: string) => {
    if (!authUser?.id) return;
    setAnalyzingId(cvId);
    if (toastMsg) showAlert('جارٍ التحليل', toastMsg);
    try {
      // Find the CV file to get the real storage path
      const cv = cvFiles.find(c => c.id === cvId);
      const filePath = cv?.file_url
        ? cv.file_url.includes('/storage/v1/object/public/')
          ? 'user-cvs/' + cv.file_url.split('/user-cvs/')[1]
          : cv.file_url
        : undefined;
      // Pass filePath so edge function downloads and reads the actual PDF
      const analysis = await aiService.analyzeCV(cvId, filePath);
      if (analysis) {
        await loadCVs();
        notificationsService.sendCVAnalysisComplete(analysis.score);
        showAlert(
          'اكتمل التحليل ✓',
          `نقاط السيرة الذاتية: ${analysis.score}/100\nنقاط ATS: ${analysis.atsScore}/100\n${analysis.summary ?? ''}`,
        );
      }
    } catch (err: any) {
      showAlert('خطأ في التحليل', err.message || 'فشل تحليل السيرة الذاتية. حاول مجدداً.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleSetPrimary = async (cvId: string) => {
    if (!authUser?.id) return;
    await cvService.setPrimary(cvId, authUser.id);
    await loadCVs();
  };

  const handleDelete = (cvId: string) => {
    showAlert(
      'حذف السيرة الذاتية',
      'هل أنت متأكد من حذف هذا الملف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(cvId);
            await cvService.deleteCV(cvId);
            await loadCVs();
            setDeletingId(null);
          },
        },
      ]
    );
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'غير معروف';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score?: number) => {
    if (!score) return Colors.textMuted;
    if (score >= 85) return Colors.emerald;
    if (score >= 70) return Colors.gold;
    return Colors.rose;
  };

  const renderCV: ListRenderItem<CVFile> = ({ item }) => {
    const isDeleting = deletingId === item.id;
    const scoreColor = getScoreColor(item.score);
    const ext = item.file_name.split('.').pop()?.toUpperCase() ?? 'PDF';
    return (
      <View style={[styles.card, item.is_primary && styles.cardPrimary]}>
        {item.is_primary && (
          <View style={styles.primaryBadge}>
            <MaterialIcons name="star" size={12} color={Colors.gold} />
            <Text style={styles.primaryBadgeText}>السيرة الرئيسية</Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={[styles.fileIcon, { backgroundColor: ext === 'PDF' ? '#ff5c7c22' : '#3b7fff22' }]}>
            <Text style={[styles.fileExt, { color: ext === 'PDF' ? Colors.rose : Colors.primary }]}>{ext}</Text>
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{item.file_name}</Text>
            <Text style={styles.fileMeta}>{formatSize(item.file_size)} · {formatDate(item.created_at)}</Text>
          </View>
          {item.score ? (
            <View style={styles.scoreTag}>
              <Text style={[styles.scoreTagValue, { color: scoreColor }]}>{item.score}</Text>
              <Text style={styles.scoreTagLabel}>نقاط</Text>
            </View>
          ) : null}
        </View>

        {/* Score Bar */}
        {item.score ? (
          <View style={styles.scoreSection}>
            <Text style={styles.scoreSectionLabel}>نقاط AI</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${item.score}%`, backgroundColor: scoreColor }]} />
            </View>
          </View>
        ) : null}

        {/* Skills */}
        {item.extracted_skills && item.extracted_skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsSectionLabel}>المهارات المستخلصة</Text>
            <View style={styles.skillsRow}>
              {item.extracted_skills.slice(0, 4).map(s => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s}</Text>
                </View>
              ))}
              {item.extracted_skills.length > 4 && (
                <View style={styles.skillChip}>
                  <Text style={styles.skillChipText}>+{item.extracted_skills.length - 4}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          {/* Analyze */}
          <Pressable
            onPress={() => handleAnalyzeCV(item.id)}
            disabled={analyzingId === item.id}
            style={({ pressed }) => [styles.actionBtn, styles.analyzeBtn, pressed && { opacity: 0.7 }]}
          >
            {analyzingId === item.id
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <>
                  <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
                  <Text style={[styles.actionBtnText, { color: Colors.primary }]}>تحليل AI</Text>
                </>
            }
          </Pressable>
          {!item.is_primary && (
            <Pressable
              onPress={() => handleSetPrimary(item.id)}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="star-outline" size={16} color={Colors.gold} />
              <Text style={[styles.actionBtnText, { color: Colors.gold }]}>رئيسية</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => handleDelete(item.id)}
            disabled={isDeleting}
            style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}
          >
            {isDeleting
              ? <ActivityIndicator size="small" color={Colors.rose} />
              : <MaterialIcons name="delete-outline" size={16} color={Colors.rose} />
            }
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <LinearGradient colors={['#1a3fa0', '#3b7fff']} style={styles.statGrad}>
          <Text style={styles.statNum}>{cvFiles.length}</Text>
          <Text style={styles.statLbl}>سيرة ذاتية</Text>
        </LinearGradient>
        <LinearGradient colors={['#0d7a52', '#22c98a']} style={styles.statGrad}>
          <Text style={styles.statNum}>{Math.max(0, 8 - cvFiles.length)}</Text>
          <Text style={styles.statLbl}>متبقي</Text>
        </LinearGradient>
        <LinearGradient colors={['#c4831a', '#f0c040']} style={styles.statGrad}>
          <Text style={styles.statNum}>
            {cvFiles.find(c => c.is_primary)?.score ?? '--'}
          </Text>
          <Text style={styles.statLbl}>نقاط الرئيسية</Text>
        </LinearGradient>
      </View>

      {/* Upload Button */}
      <Pressable
        onPress={handleUpload}
        disabled={uploading || cvFiles.length >= 8}
        style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.85 }, (cvFiles.length >= 8) && styles.uploadBtnDisabled]}
      >
        {uploading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            <MaterialIcons name="upload-file" size={22} color={cvFiles.length >= 8 ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.uploadBtnText, cvFiles.length >= 8 && { color: Colors.textMuted }]}>
              {cvFiles.length >= 8 ? 'وصلت الحد الأقصى (8)' : 'رفع سيرة ذاتية جديدة (PDF أو Word)'}
            </Text>
          </>
        )}
      </Pressable>

      {/* AI Info */}
      <View style={styles.aiInfo}>
        <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
        <Text style={styles.aiInfoText}>
          يحلل الذكاء الاصطناعي سيرتك الذاتية تلقائياً ويستخلص المهارات ويمنحها نقاطاً لتحسين تطابقك مع الوظائف
        </Text>
      </View>

      {cvsLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={cvFiles}
          keyExtractor={item => item.id}
          renderItem={renderCV}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="description" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد سير ذاتية بعد</Text>
              <Text style={styles.emptySubtitle}>ارفع سيرتك الذاتية ليحللها AI</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerStats: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  statGrad: { flex: 1, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: FontSizes.xxl, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  statLbl: { color: 'rgba(255,255,255,0.75)', fontSize: FontSizes.xs, marginTop: 3 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryGlow,
  },
  uploadBtnDisabled: { borderColor: Colors.border, backgroundColor: Colors.surfaceCard },
  uploadBtnText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryGlow,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radii.md,
    padding: Spacing.sm,
  },
  aiInfoText: { color: Colors.textSecondary, fontSize: FontSizes.xs, flex: 1, textAlign: 'right' },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardPrimary: { borderColor: Colors.gold },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    backgroundColor: Colors.goldGlow,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  primaryBadgeText: { color: Colors.gold, fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileExt: { fontSize: FontSizes.sm, fontWeight: FontWeights.extrabold },
  fileInfo: { flex: 1 },
  fileName: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.semibold, textAlign: 'right' },
  fileMeta: { color: Colors.textMuted, fontSize: FontSizes.xs, textAlign: 'right', marginTop: 3 },
  scoreTag: { alignItems: 'center' },
  scoreTagValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  scoreTagLabel: { color: Colors.textMuted, fontSize: FontSizes.xs },
  scoreSection: { marginBottom: Spacing.md },
  scoreSectionLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'right', marginBottom: 5 },
  scoreBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  skillsSection: { marginBottom: Spacing.md },
  skillsSectionLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'right', marginBottom: Spacing.sm },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  skillChip: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  skillChipText: { color: Colors.primary, fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceElevated,
  },
  deleteBtn: { backgroundColor: 'rgba(255,92,124,0.1)' },
  analyzeBtn: { backgroundColor: Colors.primaryGlow, borderWidth: 1, borderColor: Colors.primary },
  actionBtnText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { color: Colors.textSecondary, fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSizes.md },
});
