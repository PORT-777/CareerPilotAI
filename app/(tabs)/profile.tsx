
// Powered by OnSpace.AI
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { useAlert } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/template';
import { useRouter } from 'expo-router';
import { notificationsService } from '@/services/notificationsService';
import { useEffect } from 'react';

const SETTINGS_SECTIONS = [
  {
    title: 'إعدادات الوكيل',
    items: [
      { icon: 'smart-toy', label: 'مستوى الأتمتة', value: 'عالي', color: Colors.primary },
      { icon: 'notifications', label: 'تنبيهات الوظائف', value: 'مفعّل', color: Colors.emerald },
      { icon: 'language', label: 'لغة التطبيق', value: 'العربية', color: Colors.gold },
    ],
  },
  {
    title: 'التفضيلات الوظيفية',
    items: [
      { icon: 'work', label: 'نوع العقد', value: 'دوام كامل + هجين', color: Colors.primary },
      { icon: 'location-on', label: 'الموقع', value: 'الرياض، عن بُعد', color: Colors.rose },
      { icon: 'attach-money', label: 'الراتب المستهدف', value: '30K-40K SAR', color: Colors.emerald },
    ],
  },
  {
    title: 'الخصوصية والأمان',
    items: [
      { icon: 'lock', label: 'خصوصية البيانات', value: 'آمن', color: Colors.emerald },
      { icon: 'visibility', label: 'مراجعة قبل التقديم', value: 'مفعّل', color: Colors.primary },
      { icon: 'delete', label: 'حذف البيانات', value: '', color: Colors.rose },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { authUser } = useApp();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    // Request push notification permissions on profile load
    notificationsService.registerForPushNotifications().then(token => {
      if (token) {
        notificationsService.scheduleDailyReminder();
      }
    });
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Hero */}
      <LinearGradient
        colors={['#1a3fa0', '#080d1a']}
        style={styles.profileHero}
      >
        <Pressable onPress={() => router.push('/cv-manager')} style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{(user?.username ?? authUser?.email ?? 'U')[0].toUpperCase()}</Text>
          </View>{/* Closing tag for the inner View */}
          <View style={styles.avatarBadge}>
            <MaterialIcons name="verified" size={18} color={Colors.gold} />
          </View>
        </Pressable>
        <Text style={styles.userName}>{user?.username ?? authUser?.email?.split('@')[0] ?? 'المستخدم'}</Text>
        <Text style={styles.userTitle}>{authUser?.email ?? ''}</Text>

        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Pressable onPress={() => router.push('/cv-manager')}>
              <Text style={[styles.profileStatValue, { color: Colors.primary }]}>CV</Text>
            </Pressable>
            <Text style={styles.profileStatLabel}>سيري الذاتية</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Pressable onPress={() => router.push('/interview')}>
              <Text style={[styles.profileStatValue, { color: Colors.gold }]}>AI</Text>
            </Pressable>
            <Text style={styles.profileStatLabel}>مقابلة</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Pressable onPress={() => router.push('/alerts')}>
              <Text style={[styles.profileStatValue, { color: Colors.emerald }]}>🔔</Text>
            </Pressable>
            <Text style={styles.profileStatLabel}>تنبيهات</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Links */}
      <View style={styles.quickLinksRow}>
        <Pressable onPress={() => router.push('/cv-manager')} style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.8 }]}>
          <MaterialIcons name="description" size={22} color={Colors.primary} />
          <Text style={styles.quickLinkText}>سيرتي</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/interview')} style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.8 }]}>
          <MaterialIcons name="mic" size={22} color={Colors.gold} />
          <Text style={styles.quickLinkText}>مقابلة</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/alerts')} style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.8 }]}>
          <MaterialIcons name="notifications" size={22} color={Colors.emerald} />
          <Text style={styles.quickLinkText}>تنبيهات</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/ai-chat')} style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.8 }]}>
          <MaterialIcons name="smart-toy" size={22} color={Colors.rose} />
          <Text style={styles.quickLinkText}>وكيل AI</Text>
        </Pressable>
      </View>

      {/* Subscription Banner */}
      <Pressable onPress={() => router.push('/subscription')} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <LinearGradient
          colors={[Colors.gold, '#c4831a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.premiumBanner}
        >
          <MaterialIcons name="star" size={24} color={Colors.textInverse} />
          <View style={styles.premiumContent}>
            <Text style={styles.premiumTitle}>ترقية إلى Premium</Text>
            <Text style={styles.premiumDesc}>تقديم غير محدود · تدريب مقابلات متقدم · تفاوض AI</Text>
          </View>
          <View style={styles.premiumPrice}>
            <Text style={styles.premiumPriceValue}>$9.99</Text>
            <Text style={styles.premiumPriceUnit}>/شهر</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Logout */}
      <Pressable
        onPress={() => showAlert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'خروج', style: 'destructive', onPress: () => logout() },
        ])}
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
      >
        <MaterialIcons name="logout" size={20} color={Colors.rose} />
        <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
      </Pressable>

      {/* Settings */}
      {SETTINGS_SECTIONS.map(section => (
        <View key={section.title} style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>{section.title}</Text>
          <View style={styles.settingsGroup}>
            {section.items.map((item, i) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.settingsItem,
                  i < section.items.length - 1 && styles.settingsItemBorder,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.settingsIcon, { backgroundColor: `${item.color}20` }]}>
                  <MaterialIcons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <View style={styles.settingsRight}>
                  {item.value ? <Text style={styles.settingsValue}>{item.value}</Text> : null}
                  <MaterialIcons name="arrow-back-ios" size={16} color={Colors.textMuted} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xl },
  profileHero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarLetter: { color: Colors.textPrimary, fontSize: FontSizes.xxxl, fontWeight: FontWeights.bold, includeFontPadding: false },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  userName: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, marginBottom: 4 },
  userTitle: { color: Colors.textSecondary, fontSize: FontSizes.md, marginBottom: 4 },
  userLocation: { color: Colors.textMuted, fontSize: FontSizes.sm, marginBottom: Spacing.lg },
  quickLinksRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  quickLink: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  quickLinkText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,92,124,0.1)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.rose,
  },
  logoutBtnText: {
    color: Colors.rose,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  profileStat: { flex: 1, alignItems: 'center' },
  profileStatValue: { color: Colors.textPrimary, fontSize: FontSizes.xl, fontWeight: FontWeights.bold, includeFontPadding: false },
  profileStatLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, marginTop: 3 },
  profileStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  targetCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    margin: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, justifyContent: 'flex-end' },
  targetTitle: { color: Colors.gold, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  targetValue: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.bold, textAlign: 'right', marginBottom: 4 },
  targetSalary: { color: Colors.emerald, fontSize: FontSizes.sm, textAlign: 'right' },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  premiumContent: { flex: 1 },
  premiumTitle: { color: Colors.textInverse, fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  premiumDesc: { color: 'rgba(8,13,26,0.7)', fontSize: FontSizes.xs, marginTop: 3 },
  premiumPrice: { alignItems: 'center' },
  premiumPriceValue: { color: Colors.textInverse, fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  premiumPriceUnit: { color: 'rgba(8,13,26,0.7)', fontSize: FontSizes.xs },
  settingsSection: { marginBottom: Spacing.lg, paddingHorizontal: Spacing.md },
  settingsSectionTitle: { color: Colors.textSecondary, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, marginBottom: Spacing.sm, textAlign: 'right' },
  settingsGroup: { backgroundColor: Colors.surfaceCard, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingsIcon: { width: 36, height: 36, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, color: Colors.textPrimary, fontSize: FontSizes.md, textAlign: 'right' },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  settingsValue: { color: Colors.textSecondary, fontSize: FontSizes.sm },
});
