// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useAlert } from '@/template';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';

type Mode = 'login' | 'register' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) showAlert('خطأ في تسجيل الدخول', error);
  };

  const handleSendOTP = async () => {
    if (!email) {
      showAlert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 6) {
      showAlert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    const { error } = await sendOTP(email.trim());
    if (error) {
      showAlert('خطأ', error);
    } else {
      setMode('otp');
      showAlert('تم الإرسال', 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      showAlert('خطأ', 'يرجى إدخال رمز التحقق');
      return;
    }
    const { error } = await verifyOTPAndLogin(email.trim(), otp, { password });
    if (error) showAlert('خطأ', error);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <LinearGradient colors={['#3b7fff', '#1a3fa0']} style={styles.logoGrad}>
            <MaterialIcons name="smart-toy" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>CareerPilot AI</Text>
          <Text style={styles.tagline}>وكيلك الوظيفي الذكي</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {mode === 'otp' ? (
            <>
              <Text style={styles.cardTitle}>رمز التحقق</Text>
              <Text style={styles.cardSub}>أُرسل إلى {email}</Text>
              <View style={styles.otpContainer}>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="----"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
              </View>
              <Pressable
                onPress={handleVerifyOTP}
                disabled={operationLoading}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient colors={['#3b7fff', '#1a3fa0']} style={styles.btnGrad}>
                  {operationLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>تحقق وإنشاء الحساب</Text>
                  }
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => setMode('register')} style={styles.backBtn}>
                <Text style={styles.backBtnText}>رجوع</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </Text>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>البريد الإلكتروني</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name="email" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@email.com"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور</Text>
                <View style={styles.inputWrap}>
                  <Pressable onPress={() => setShowPass(p => !p)}>
                    <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={18} color={Colors.textMuted} />
                  </Pressable>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPass}
                    textAlign="right"
                  />
                </View>
              </View>

              {/* Confirm Password (register only) */}
              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>تأكيد كلمة المرور</Text>
                  <View style={styles.inputWrap}>
                    <MaterialIcons name="lock" size={18} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPass}
                      textAlign="right"
                    />
                  </View>
                </View>
              )}

              {/* Primary Action */}
              <Pressable
                onPress={mode === 'login' ? handleLogin : handleSendOTP}
                disabled={operationLoading}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient colors={['#3b7fff', '#1a3fa0']} style={styles.btnGrad}>
                  {operationLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>
                        {mode === 'login' ? 'تسجيل الدخول' : 'إرسال رمز التحقق'}
                      </Text>
                  }
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>أو</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Switch Mode */}
              <Pressable
                onPress={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setOtp('');
                  setConfirmPassword('');
                }}
                style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.switchBtnText}>
                  {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
                  <Text style={styles.switchBtnLink}>
                    {mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
                  </Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md, flexGrow: 1, justifyContent: 'center' },
  logoBlock: { alignItems: 'center', marginBottom: Spacing.xl },
  logoGrad: {
    width: 80,
    height: 80,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: FontWeights.extrabold },
  tagline: { color: Colors.textSecondary, fontSize: FontSizes.md, marginTop: 4 },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'right',
    marginBottom: Spacing.xs,
  },
  cardSub: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'right',
    marginBottom: Spacing.lg,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
    textAlign: 'right',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.md,
    includeFontPadding: false,
  },
  primaryBtn: { borderRadius: Radii.md, overflow: 'hidden', marginTop: Spacing.sm },
  btnGrad: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  btnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  switchBtn: { alignItems: 'center' },
  switchBtnText: { color: Colors.textSecondary, fontSize: FontSizes.md },
  switchBtnLink: { color: Colors.primary, fontWeight: FontWeights.bold },
  otpContainer: { marginBottom: Spacing.lg },
  otpInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    color: Colors.textPrimary,
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    paddingVertical: Spacing.lg,
    letterSpacing: 12,
    includeFontPadding: false,
  },
  backBtn: { alignItems: 'center', marginTop: Spacing.md },
  backBtnText: { color: Colors.textSecondary, fontSize: FontSizes.md },
});
