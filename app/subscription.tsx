// Powered by OnSpace.AI — Paymob Subscription Screen
import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { useAlert } from '@/template';
import { useApp } from '@/hooks/useApp';
import { paymobService, SubscriptionPlan } from '@/services/paymobService';

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { authUser } = useApp();
  const { showAlert } = useAlert();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [loading, setLoading] = useState(false);

  const monthly = paymobService.getPlanDetails('monthly');
  const yearly = paymobService.getPlanDetails('yearly');

  const handleSubscribe = async () => {
    if (!authUser?.email) {
      showAlert('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول أولاً للاشتراك.');
      return;
    }
    setLoading(true);
    try {
      const result = await paymobService.initiatePayment(
        selectedPlan,
        authUser.email,
        authUser.username
      );
      await Linking.openURL(result.paymentUrl);
    } catch (err: any) {
      showAlert('خطأ في الدفع', err.message || 'فشل إنشاء جلسة الدفع. حاول مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const FEATURES_FREE = [
    '5 تقديمات شهرياً',
    'بحث أساسي عن الوظائف',
    'تنبيه وظيفي واحد',
    'تحليل CV محدود',
  ];

  const planDetails = paymobService.getPlanDetails(selectedPlan);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient colors={['#c4831a', '#f0c040', '#c4831a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <MaterialIcons name="star" size={40} color={Colors.textInverse} />
        <Text style={styles.heroTitle}>ترقية إلى Premium</Text>
        <Text style={styles.heroSubtitle}>احصل على كل الأدوات للحصول على وظيفة أحلامك</Text>
      </LinearGradient>

      {/* Plan Selector */}
      <View style={styles.planSelector}>
        <Pressable
          onPress={() => setSelectedPlan('monthly')}
          style={[styles.planTab, selectedPlan === 'monthly' && styles.planTabActive]}
        >
          <Text style={[styles.planTabText, selectedPlan === 'monthly' && styles.planTabTextActive]}>شهري</Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedPlan('yearly')}
          style={[styles.planTab, selectedPlan === 'yearly' && styles.planTabActive]}
        >
          <View style={styles.planTabInner}>
            <Text style={[styles.planTabText, selectedPlan === 'yearly' && styles.planTabTextActive]}>سنوي</Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>وفر 25%</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Price Card */}
      <LinearGradient colors={['#1a3fa0', '#3b7fff']} style={styles.priceCard}>
        <Text style={styles.planLabel}>{planDetails.label}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>{planDetails.price}</Text>
          <Text style={styles.pricePeriod}>{planDetails.period}</Text>
        </View>
        <Text style={styles.priceUSD}>{planDetails.priceUSD} تقريباً</Text>
        {planDetails.savings ? (
          <View style={styles.savingsChip}>
            <Text style={styles.savingsChipText}>{planDetails.savings}</Text>
          </View>
        ) : null}
      </LinearGradient>

      {/* Features Comparison */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ما تحصل عليه مع Premium</Text>
        <View style={styles.featuresCard}>
          {planDetails.features.map(f => (
            <View key={f} style={styles.featureRow}>
              <MaterialIcons name="check-circle" size={18} color={Colors.emerald} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Free vs Premium */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المجاني مقابل Premium</Text>
        <View style={styles.compareRow}>
          <View style={[styles.compareCard, styles.compareCardFree]}>
            <Text style={styles.compareCardTitle}>مجاني</Text>
            {FEATURES_FREE.map(f => (
              <View key={f} style={styles.compareItem}>
                <MaterialIcons name="remove-circle-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.compareItemText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.compareCard, styles.compareCardPremium]}>
            <Text style={styles.compareCardTitle}>⭐ Premium</Text>
            {planDetails.features.map(f => (
              <View key={f} style={styles.compareItem}>
                <MaterialIcons name="check-circle" size={14} color={Colors.emerald} />
                <Text style={[styles.compareItemText, { color: Colors.textPrimary }]}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Subscribe Button */}
      <Pressable
        onPress={handleSubscribe}
        disabled={loading}
        style={({ pressed }) => [styles.subscribeBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
      >
        <LinearGradient colors={[Colors.gold, '#c4831a']} style={styles.subscribeBtnGrad}>
          {loading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <>
                <MaterialIcons name="payment" size={22} color={Colors.textInverse} />
                <Text style={styles.subscribeBtnText}>اشترك الآن · {planDetails.price}</Text>
              </>
          }
        </LinearGradient>
      </Pressable>

      {/* Paymob Trust */}
      <View style={styles.trustRow}>
        <MaterialIcons name="lock" size={14} color={Colors.textMuted} />
        <Text style={styles.trustText}>دفع آمن عبر Paymob · يمكن الإلغاء في أي وقت</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.lg },
  hero: {
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroTitle: { color: Colors.textInverse, fontSize: FontSizes.xxl, fontWeight: FontWeights.extrabold },
  heroSubtitle: { color: 'rgba(8,13,26,0.75)', fontSize: FontSizes.md, textAlign: 'center' },
  planSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  planTabActive: { backgroundColor: Colors.primary },
  planTabInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  planTabText: { color: Colors.textMuted, fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  planTabTextActive: { color: Colors.textPrimary },
  savingsBadge: { backgroundColor: Colors.emerald, borderRadius: Radii.full, paddingHorizontal: 6, paddingVertical: 2 },
  savingsBadgeText: { color: '#fff', fontSize: 10, fontWeight: FontWeights.bold },
  priceCard: {
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  planLabel: { color: 'rgba(255,255,255,0.75)', fontSize: FontSizes.sm },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs },
  priceValue: { color: '#fff', fontSize: 40, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  pricePeriod: { color: 'rgba(255,255,255,0.75)', fontSize: FontSizes.md, marginBottom: 6 },
  priceUSD: { color: 'rgba(255,255,255,0.55)', fontSize: FontSizes.sm },
  savingsChip: { backgroundColor: Colors.emerald, borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: 4, marginTop: 4 },
  savingsChipText: { color: '#fff', fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  section: { gap: Spacing.sm },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSizes.md, fontWeight: FontWeights.semibold, textAlign: 'right' },
  featuresCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureText: { color: Colors.textPrimary, fontSize: FontSizes.md, flex: 1, textAlign: 'right' },
  compareRow: { flexDirection: 'row', gap: Spacing.sm },
  compareCard: {
    flex: 1,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  compareCardFree: { backgroundColor: Colors.surfaceCard, borderColor: Colors.border },
  compareCardPremium: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  compareCardTitle: { color: Colors.textPrimary, fontSize: FontSizes.sm, fontWeight: FontWeights.bold, textAlign: 'center', marginBottom: 4 },
  compareItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  compareItemText: { color: Colors.textMuted, fontSize: FontSizes.xs, flex: 1 },
  subscribeBtn: { borderRadius: Radii.xl, overflow: 'hidden' },
  subscribeBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  subscribeBtnText: { color: Colors.textInverse, fontSize: FontSizes.lg, fontWeight: FontWeights.extrabold },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  trustText: { color: Colors.textMuted, fontSize: FontSizes.xs },
});
