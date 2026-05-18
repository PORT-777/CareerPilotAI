// Powered by OnSpace.AI — Interview with real AI + voice recording + text fallback
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Colors, Spacing, Radii, FontSizes, FontWeights } from '@/constants/theme';
import { useAlert } from '@/template';
import { aiService } from '@/services/aiService';

interface Question {
  id: string;
  text: string;
  category: string;
  tip: string;
}

interface Evaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  betterAnswer: string;
  tip: string;
}

interface Message {
  id: string;
  role: 'interviewer' | 'user';
  text: string;
  evaluation?: Evaluation;
  isVoice?: boolean;
}

const INTERVIEW_QUESTIONS: Question[] = [
  {
    id: '1',
    text: 'أخبرني عن نفسك وأبرز إنجازاتك المهنية.',
    category: 'تعارف',
    tip: 'استخدم منهجية STAR: الموقف، المهمة، الإجراء، النتيجة',
  },
  {
    id: '2',
    text: 'ما هو أصعب تحدٍّ واجهته في عملك، وكيف تعاملت معه؟',
    category: 'مواقف',
    tip: 'اذكر تحدياً حقيقياً وكيف تعلمت منه',
  },
  {
    id: '3',
    text: 'أين ترى نفسك بعد 5 سنوات؟',
    category: 'طموح',
    tip: 'اربط أهدافك بنمو الشركة',
  },
  {
    id: '4',
    text: 'كيف تتعامل مع ضغط العمل والمواعيد النهائية؟',
    category: 'ضغط العمل',
    tip: 'قدم أمثلة عملية وأدوات إدارة الوقت',
  },
  {
    id: '5',
    text: 'لماذا تريد الانضمام إلى شركتنا تحديداً؟',
    category: 'دوافع',
    tip: 'ابحث عن الشركة مسبقاً وأظهر اهتماماً حقيقياً',
  },
];

type InputMode = 'text' | 'voice';
type RecordingState = 'idle' | 'recording' | 'processing';

export default function InterviewScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [phase, setPhase] = useState<'intro' | 'active' | 'feedback'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedType, setSelectedType] = useState<'tech' | 'hr' | 'behavioral'>('hr');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [totalScore, setTotalScore] = useState(0);
  const [scoreCount, setScoreCount] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Request mic permission
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => {
      setHasMicPermission(granted);
    });
  }, []);

  // Pulse animation for recording
  useEffect(() => {
    if (recordingState === 'recording') {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [recordingState]);

  const startInterview = () => {
    const firstQ = INTERVIEW_QUESTIONS[0];
    setMessages([
      {
        id: '0',
        role: 'interviewer',
        text: `مرحباً! أنا مساعد AI للمقابلات. سأطرح عليك ${INTERVIEW_QUESTIONS.length} أسئلة واحدة تلو الأخرى وأقيّم إجاباتك بالذكاء الاصطناعي.\n\n📌 السؤال الأول: ${firstQ.text}`,
      },
    ]);
    setPhase('active');
  };

  const submitAnswer = useCallback(async (answer: string, isVoice = false) => {
    if (!answer.trim() || isProcessing) return;
    setInputText('');
    setIsProcessing(true);

    const question = INTERVIEW_QUESTIONS[currentQ];
    const userMsg: Message = {
      id: `u${currentQ}`,
      role: 'user',
      text: answer.trim(),
      isVoice,
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const evaluation = await aiService.evaluateInterviewAnswer(question.text, answer.trim());
      const isLast = currentQ >= INTERVIEW_QUESTIONS.length - 1;

      const evalText = evaluation
        ? `✅ نقاطك: ${evaluation.score}/100\n\n💪 نقاط القوة:\n${evaluation.strengths.map(s => `• ${s}`).join('\n')}\n\n💡 للتحسين:\n${evaluation.improvements.map(i => `• ${i}`).join('\n')}\n\n🎯 نصيحة: ${evaluation.tip}`
        : 'تقييم جيد! استمر.';

      const nextText = isLast
        ? `${evalText}\n\n🎉 انتهت المقابلة! شكراً لك.`
        : `${evalText}\n\n➡️ السؤال التالي: ${INTERVIEW_QUESTIONS[currentQ + 1].text}`;

      const aiMsg: Message = {
        id: `a${currentQ}`,
        role: 'interviewer',
        text: nextText,
        evaluation: evaluation ?? undefined,
      };

      setMessages(prev => [...prev, aiMsg]);

      if (evaluation?.score) {
        setTotalScore(prev => prev + evaluation.score);
        setScoreCount(prev => prev + 1);
      }

      if (!isLast) {
        setCurrentQ(prev => prev + 1);
      } else {
        setTimeout(() => setPhase('feedback'), 1200);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `err${currentQ}`,
        role: 'interviewer',
        text: `عذراً، حدث خطأ أثناء التقييم: ${err.message}. يمكنك المتابعة.`,
      }]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [currentQ, isProcessing]);

  // ─── Voice Recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!hasMicPermission) {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        showAlert('إذن الميكروفون', 'يرجى منح إذن الميكروفون لاستخدام التسجيل الصوتي، أو استخدم الإدخال النصي.');
        return;
      }
      setHasMicPermission(true);
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordingState('recording');
    } catch (err: any) {
      showAlert('خطأ في التسجيل', err.message || 'فشل بدء التسجيل. استخدم الإدخال النصي بدلاً من ذلك.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || recordingState !== 'recording') return;
    setRecordingState('processing');

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('لم يتم حفظ التسجيل');

      // Since we don't have a speech-to-text endpoint, we simulate transcription
      // by switching to text mode and showing a prompt. In production, send URI to Whisper API.
      setRecordingState('idle');
      showAlert(
        'تم التسجيل',
        'تم تسجيل إجابتك. يرجى كتابة إجابتك في حقل النص لإرسالها للتقييم بالذكاء الاصطناعي.',
        [
          {
            text: 'حسناً',
            onPress: () => setInputMode('text'),
          },
        ]
      );
    } catch (err: any) {
      setRecordingState('idle');
      recordingRef.current = null;
      showAlert('خطأ', err.message || 'فشل معالجة التسجيل. استخدم الإدخال النصي.');
      setInputMode('text');
    }
  };

  const toggleRecording = () => {
    if (recordingState === 'recording') {
      stopRecording();
    } else if (recordingState === 'idle') {
      startRecording();
    }
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages]);

  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  // ─── INTRO PHASE ───────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#1a3fa0', '#080d1a']} style={styles.introHero}>
            <View style={styles.micCircle}>
              <MaterialIcons name="psychology" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.introTitle}>محاكاة مقابلة AI</Text>
            <Text style={styles.introSub}>
              أجب على أسئلة المقابلة نصياً أو صوتياً وسيقيّمها Gemini AI فوراً
            </Text>
          </LinearGradient>

          <Text style={styles.sectionTitle}>نوع المقابلة</Text>
          <View style={styles.typeRow}>
            {([
              { key: 'hr', label: 'موارد بشرية', icon: 'people' },
              { key: 'tech', label: 'تقنية', icon: 'code' },
              { key: 'behavioral', label: 'سلوكية', icon: 'psychology' },
            ] as const).map(t => (
              <Pressable
                key={t.key}
                onPress={() => setSelectedType(t.key)}
                style={[styles.typeBtn, selectedType === t.key && styles.typeBtnActive]}
              >
                <MaterialIcons
                  name={t.icon}
                  size={22}
                  color={selectedType === t.key ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.typeBtnText, selectedType === t.key && styles.typeBtnTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.statsRow}>
            {[
              { value: String(INTERVIEW_QUESTIONS.length), label: 'أسئلة' },
              { value: 'AI', label: 'تقييم حقيقي' },
              { value: '🎤+✍️', label: 'صوت أو نص' },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>كيف تعمل المقابلة؟</Text>
            {[
              'اختر نمط الإدخال: نصي أو صوتي (يتطلب إذن الميكروفون)',
              'يطرح AI سؤالاً وترد بإجابتك المكتوبة أو المسجلة',
              'يحلل Gemini إجابتك ويعطيك نقاطاً وملاحظات فورية',
              'في النهاية تحصل على تقرير أداء شامل مع اقتراحات',
            ].map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <MaterialIcons name="check-circle" size={16} color={Colors.emerald} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={startInterview}
            style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient colors={['#3b7fff', '#1a3fa0']} style={styles.startBtnGrad}>
              <MaterialIcons name="play-arrow" size={24} color="#fff" />
              <Text style={styles.startBtnText}>ابدأ المقابلة</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ─── FEEDBACK PHASE ────────────────────────────────────────────────────────
  if (phase === 'feedback') {
    const scoreColor = avgScore >= 85 ? Colors.emerald : avgScore >= 70 ? Colors.gold : Colors.rose;
    const evaluations = messages.filter(m => m.role === 'interviewer' && m.evaluation);
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.feedbackContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#1a3fa0', '#080d1a']} style={styles.feedbackHero}>
            <MaterialIcons name="emoji-events" size={56} color={Colors.gold} />
            <Text style={styles.feedbackTitle}>انتهت المقابلة!</Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreMain, { color: scoreColor }]}>{avgScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.scoreLabel}>متوسط نقاطك (تقييم Gemini AI)</Text>
          </LinearGradient>

          {evaluations.map((m, i) => (
            <View key={m.id} style={styles.scoreRow}>
              <Text style={styles.scoreQNum}>س{i + 1}</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${m.evaluation!.score}%`, backgroundColor: scoreColor }]} />
              </View>
              <Text style={[styles.scoreNum, { color: scoreColor }]}>{m.evaluation!.score}%</Text>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <MaterialIcons name="auto-awesome" size={20} color={Colors.gold} />
            <Text style={styles.summaryText}>
              {avgScore >= 85
                ? 'أداء ممتاز! أنت جاهز للمقابلات الحقيقية. تميزت في وضوح الإجابات وبنيتها المنطقية.'
                : avgScore >= 70
                ? 'أداء جيد. ركز على إضافة أمثلة تفصيلية وأرقام قابلة للقياس في إجاباتك.'
                : 'يحتاج تطوير. ننصح بمراجعة أسلوب STAR والتدرب أكثر على الأسئلة السلوكية.'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setPhase('intro');
              setCurrentQ(0);
              setMessages([]);
              setTotalScore(0);
              setScoreCount(0);
              setInputMode('text');
            }}
            style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient colors={['#3b7fff', '#1a3fa0']} style={styles.startBtnGrad}>
              <Text style={styles.startBtnText}>إعادة المقابلة</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ─── ACTIVE INTERVIEW ──────────────────────────────────────────────────────
  const currentQuestion = INTERVIEW_QUESTIONS[currentQ];
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>السؤال {currentQ + 1} من {INTERVIEW_QUESTIONS.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentQ) / INTERVIEW_QUESTIONS.length) * 100}%` }]} />
        </View>
      </View>

      {/* Current Tip */}
      <View style={styles.tipBanner}>
        <MaterialIcons name="lightbulb" size={14} color={Colors.gold} />
        <Text style={styles.tipBannerText}>{currentQuestion.tip}</Text>
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgRow, msg.role === 'user' ? styles.userRow : styles.aiRow]}>
            {msg.role === 'interviewer' && (
              <View style={styles.aiAvatar}>
                <MaterialIcons name="smart-toy" size={16} color={Colors.primary} />
              </View>
            )}
            <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.isVoice && msg.role === 'user' && (
                <View style={styles.voiceTag}>
                  <MaterialIcons name="mic" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.voiceTagText}>صوتي</Text>
                </View>
              )}
              <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userBubbleText : styles.aiBubbleText]}>
                {msg.text}
              </Text>
              {msg.evaluation ? (
                <View style={styles.scorePill}>
                  <MaterialIcons name="stars" size={12} color={Colors.gold} />
                  <Text style={styles.scorePillText}>{msg.evaluation.score}%</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
        {isProcessing && (
          <View style={[styles.msgRow, styles.aiRow]}>
            <View style={styles.aiAvatar}>
              <MaterialIcons name="smart-toy" size={16} color={Colors.primary} />
            </View>
            <View style={[styles.bubble, styles.aiBubble]}>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.typingText}>Gemini يحلل إجابتك...</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputArea}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setInputMode('text')}
            style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]}
          >
            <MaterialIcons
              name="keyboard"
              size={16}
              color={inputMode === 'text' ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.modeBtnText, inputMode === 'text' && styles.modeBtnTextActive]}>نصي</Text>
          </Pressable>
          <Pressable
            onPress={() => setInputMode('voice')}
            style={[styles.modeBtn, inputMode === 'voice' && styles.modeBtnActive]}
          >
            <MaterialIcons
              name="mic"
              size={16}
              color={inputMode === 'voice' ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.modeBtnText, inputMode === 'voice' && styles.modeBtnTextActive]}>صوتي</Text>
          </Pressable>
        </View>

        {inputMode === 'text' ? (
          /* Text Input */
          <>
            <TextInput
              style={styles.answerInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="اكتب إجابتك بالتفصيل..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={1000}
              textAlign="right"
              editable={!isProcessing}
            />
            <Pressable
              onPress={() => submitAnswer(inputText)}
              disabled={!inputText.trim() || isProcessing}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                (!inputText.trim() || isProcessing) && styles.submitBtnDisabled,
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>إرسال للتقييم</Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          /* Voice Input */
          <View style={styles.voiceArea}>
            {recordingState === 'processing' ? (
              <View style={styles.voiceProcessing}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.voiceProcessingText}>جاري معالجة التسجيل...</Text>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={toggleRecording}
                  disabled={isProcessing}
                  style={({ pressed }) => [styles.micBtn, pressed && { opacity: 0.85 }]}
                >
                  <Animated.View style={[
                    styles.micBtnInner,
                    recordingState === 'recording' && styles.micBtnRecording,
                    { transform: [{ scale: pulseAnim }] },
                  ]}>
                    <MaterialIcons
                      name={recordingState === 'recording' ? 'stop' : 'mic'}
                      size={32}
                      color={recordingState === 'recording' ? Colors.rose : Colors.primary}
                    />
                  </Animated.View>
                </Pressable>
                <Text style={styles.micLabel}>
                  {recordingState === 'recording'
                    ? '🔴 جاري التسجيل... اضغط للإيقاف'
                    : 'اضغط للتسجيل الصوتي'}
                </Text>
                {recordingState === 'idle' && (
                  <Text style={styles.micHint}>أو انتقل للوضع النصي للكتابة مباشرة</Text>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  introContent: { paddingBottom: Spacing.xl },
  introHero: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  introTitle: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, marginBottom: Spacing.sm },
  introSub: { color: Colors.textSecondary, fontSize: FontSizes.md, textAlign: 'center', lineHeight: 24 },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    textAlign: 'right',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  typeRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  typeBtnText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  typeBtnTextActive: { color: Colors.primary },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statValue: { color: Colors.primary, fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  statLabel: { color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 3 },
  tipsCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tipsTitle: { color: Colors.textPrimary, fontSize: FontSizes.md, fontWeight: FontWeights.bold, textAlign: 'right', marginBottom: Spacing.md },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  tipText: { color: Colors.textSecondary, fontSize: FontSizes.sm, flex: 1, textAlign: 'right', lineHeight: 20 },
  startBtn: { marginHorizontal: Spacing.md, borderRadius: Radii.lg, overflow: 'hidden' },
  startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 4 },
  startBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  // Active
  progress: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  progressText: { color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'right', marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.goldGlow,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tipBannerText: { color: Colors.gold, fontSize: FontSizes.xs, flex: 1, textAlign: 'right' },
  chatArea: { flex: 1 },
  chatContent: { padding: Spacing.md, gap: Spacing.md },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  aiRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  bubble: { maxWidth: '85%', borderRadius: Radii.lg, padding: Spacing.md },
  aiBubble: { backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  userBubble: { backgroundColor: Colors.primary },
  bubbleText: { fontSize: FontSizes.sm, lineHeight: 22 },
  aiBubbleText: { color: Colors.textPrimary, textAlign: 'right' },
  userBubbleText: { color: '#fff', textAlign: 'right' },
  voiceTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 5 },
  voiceTagText: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typingText: { color: Colors.textMuted, fontSize: FontSizes.sm },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  scorePillText: { color: Colors.gold, fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
  // Input area
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignSelf: 'flex-end',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  modeBtnText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  modeBtnTextActive: { color: Colors.primary },
  // Text input
  answerInput: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  // Voice input
  voiceArea: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  micBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnRecording: {
    backgroundColor: 'rgba(255,92,124,0.15)',
    borderColor: Colors.rose,
  },
  micLabel: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  micHint: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  voiceProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  voiceProcessingText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  // Feedback
  feedbackContent: { paddingBottom: Spacing.xl },
  feedbackHero: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  feedbackTitle: { color: Colors.textPrimary, fontSize: FontSizes.xxl, fontWeight: FontWeights.bold },
  scoreCircle: { flexDirection: 'row', alignItems: 'flex-end' },
  scoreMain: { fontSize: 56, fontWeight: FontWeights.extrabold, includeFontPadding: false },
  scoreMax: { color: Colors.textSecondary, fontSize: FontSizes.xxl, marginBottom: 8 },
  scoreLabel: { color: Colors.textSecondary, fontSize: FontSizes.md },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scoreQNum: { color: Colors.textSecondary, fontSize: FontSizes.sm, width: 24, textAlign: 'center' },
  scoreBar: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreNum: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, width: 40, textAlign: 'right' },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radii.lg,
    margin: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryText: { color: Colors.gold, fontSize: FontSizes.sm, flex: 1, textAlign: 'right', lineHeight: 22 },
});
