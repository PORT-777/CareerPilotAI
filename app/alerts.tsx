// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Switch,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { JobAlert } from '@/services/alertsService';
import { useAlert } from '@/template';

const JOB_TYPES = [
  { key: 'full-time', labelAr: 'دوام كامل' },
  { key: 'part-time', labelAr: 'دوام جزئي' },
  { key: 'remote', labelAr: 'عن بُعد' },
  { key: 'hybrid', labelAr: 'هجين' },
  { key: 'contract', labelAr: 'عقد مؤقت' },
];

const PRESET_ALERTS = [
  { title: 'مهندس برمجيات - السعودية', keywords: ['React Native', 'Flutter', 'iOS', 'Android'], location: 'الرياض', job_type: 'hybrid' },
  { title: 'وظائف عن بُعد - تقنية', keywords: ['Remote', 'Full-stack', 'Backend'], job_type: 'remote' },
  { title: 'مدير منتجات - خليج', keywords: ['Product Manager', 'Agile', 'Scrum'], location: 'الإمارات' },
];

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, alerts, loadAlerts, addAlert, toggleAlert, deleteAlert } = useApp();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAlerts().finally(() => setLoading(false));
  }, []);

  const handleSaveAlert = async () => {
    if (!title.trim()) {
      showAlert('خطأ', 'يرجى إدخال اسم التنبيه');
      return;
    }
    setSaving(true);
    await addAlert({
      title: title.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      location: location.trim() || undefined,
      job_type: selectedType || undefined,
      is_active: true,
    });
    setSaving(false);
    setShowModal(false);
    setTitle('');
    setKeywords('');
    setLocation('');
    setSelectedType('');
    showAlert('تم', 'تم إنشاء تنبيه الوظائف بنجاح');
  };

  const handleAddPreset = async (preset: typeof PRESET_ALERTS[0]) => {
    await addAlert({ ...preset, is_active: true, min_salary: undefined });
    showAlert('تم', `تم إضافة تنبيه "${preset.title}"`);
  };

  const handleDelete = (alertId: string) => {
    showAlert('حذف التنبيه', 'هل تريد حذف هذا التنبيه؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteAlert(alertId) },
    ]);
  };

  const renderAlert: ListRenderItem<JobAlert> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.alertIconWrap}>
          <MaterialIcons name="notifications-active" size={20} color={item.is_active ? Colors.primary : Colors.textMuted} />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          {item.location ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="location-on" size={12} color={Colors.textMuted} />
              <Text style={styles.alertMeta}>{item.location}</Text>
            </View>
          ) : null}
        </View>
        <Switch
          value={item.is_active}
          onValueChange={(val) => toggleAlert(item.id, val)}
          trackColor={{ false: Colors.border, true: Colors.primaryGlow }}
          thumbColor={item.is_active ? Colors.primary : Colors.textMuted}
        />
      </View>

      {item.keywords && item.keywords.length > 0 && (
        <View style={styles.keywordsRow}>
          {item.keywords.slice(0, 4).map(k => (
            <View key={k} style={styles.keyword}>
              <Text style={styles.keywordText}>{k}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        {item.job_type ? (
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{JOB_TYPES.find(t => t.key === item.job_type)?.labelAr ?? item.job_type}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => handleDelete(item.id)}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="delete-outline" size={18} color={Colors.rose} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Active/Total Banner */}
      <LinearGradient colors={['#1a3fa0', '#3b7fff']} style={styles.banner}>
        <View style={styles.bannerStats}>
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatVal}>{alerts.length}</Text>
            <Text style={styles.bannerStatLbl}>إجمالي التنبيهات</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatVal}>{alerts.filter(a => a.is_active).length}</Text>
            <Text style={styles.bannerStatLbl}>نشطة</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerStatVal}>247</Text>
            <Text style={styles.bannerStatLbl}>منصة تُراقَب</Text>
          </View>
        </View>
        <Text style={styles.bannerSub}>يبحث الوكيل في الوقت الفعلي عن وظائف تناسب تنبيهاتك</Text>
      </LinearGradient>

      {/* Presets */}
      <Text style={styles.sectionTitle}>تنبيهات جاهزة</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presets} contentContainerStyle={styles.presetsContent}>
        {PRESET_ALERTS.map(p => (
          <Pressable
            key={p.title}
            onPress={() => handleAddPreset(p)}
            style={({ pressed }) => [styles.presetCard, pressed && { opacity: 0.8 }]}
          >
            <MaterialIcons name="add-circle" size={18} color={Colors.emerald} />
            <Text style={styles.presetTitle}>{p.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Create Button */}
      <Pressable
        onPress={() => setShowModal(true)}
        style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient colors={['#3b7fff', '#1a3fa0']} style={styles.createBtnGrad}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>إنشاء تنبيه مخصص</Text>
        </LinearGradient>
      </Pressable>

      {/* Alerts List */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="notifications-off" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد تنبيهات</Text>
              <Text style={styles.emptySubtitle}>أضف تنبيهاً ليبحث الوكيل تلقائياً</Text>
            </View>
          }
        />
      )}

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تنبيه وظيفي جديد</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>اسم التنبيه *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="مثال: مطور React Native"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>الكلمات المفتاحية (مفصولة بفواصل)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={keywords}
                  onChangeText={setKeywords}
                  placeholder="React Native, TypeScript, Flutter"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>الموقع (اختياري)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="الرياض، دبي، عن بُعد..."
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>نوع الوظيفة</Text>
                <View style={styles.typeGrid}>
                  {JOB_TYPES.map(t => (
                    <Pressable
                      key={t.key}
                      onPress={() => setSelectedType(selectedType === t.key ? '' : t.key)}
                      style={[styles.typeChip, selectedType === t.key && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipText, selectedType === t.key && styles.typeChipTextActive]}>
                        {t.labelAr}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                onPress={handleSaveAlert}
                disabled={saving}
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient colors={['#3b7fff', '#1a3fa0']} style={styles.saveBtnGrad}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ التنبيه</Text>}
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  banner: { padding: Spacing.md, marginBottom: Spacing.md },
  bannerStats: { flexDirection: 'row', marginBottom: Spacing.sm },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatVal: { color: '#fff', fontSize: FontSizes.xxl, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  bannerStatLbl: { color: 'rgba(255,255,255,0.7)', fontSize: FontSizes.xs, marginTop: 3 },
  bannerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  bannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSizes.xs, textAlign: 'center' },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.bold, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  presets: { marginBottom: Spacing.md },
  presetsContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.emeraldGlow,
    borderWidth: 1,
    borderColor: Colors.emerald,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  presetTitle: { color: Colors.emerald, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  createBtn: { marginHorizontal: Spacing.md, borderRadius: Radii.lg, overflow: 'hidden', marginBottom: Spacing.md },
  createBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  createBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertInfo: { flex: 1 },
  alertTitle: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.semibold, textAlign: 'right' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 3 },
  alertMeta: { color: Colors.textMuted, fontSize: FontSizes.xs },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  keyword: { backgroundColor: Colors.primaryGlow, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  keywordText: { color: Colors.primaryLight, fontSize: FontSizes.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typePill: { backgroundColor: Colors.surfaceElevated, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  typePillText: { color: Colors.textSecondary, fontSize: FontSizes.xs },
  deleteBtn: { padding: Spacing.xs },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyTitle: { color: Colors.textSecondary, fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSizes.md },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: FontWeights.medium, textAlign: 'right', marginBottom: Spacing.xs },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    includeFontPadding: false,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  typeChipText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  typeChipTextActive: { color: Colors.primary, fontWeight: FontWeights.semibold },
  saveBtn: { borderRadius: Radii.lg, overflow: 'hidden', marginTop: Spacing.md, marginBottom: Spacing.xl },
  saveBtnGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
});
