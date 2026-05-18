// Powered by OnSpace.AI — Push Notifications service
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSupabaseClient } from '@/template';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationsService = {
  /**
   * Request permissions and return the Expo push token.
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    if (Platform.OS === 'web') return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch {
      return null;
    }
  },

  /**
   * Send a local notification immediately (for job alert matches).
   */
  sendLocalJobAlert: async (jobTitle: string, company: string, matchPercent?: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `وظيفة جديدة تناسبك! ${matchPercent ? `(${matchPercent}% تطابق)` : ''}`,
        body: `${jobTitle} في ${company}`,
        data: { type: 'job_alert', jobTitle, company },
      },
      trigger: null, // immediate
    });
  },

  /**
   * Schedule a daily job search reminder.
   */
  scheduleDailyReminder: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'وكيل AI الوظيفي',
        body: 'وجد وكيلك وظائف جديدة اليوم! تحقق منها الآن.',
        data: { type: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  },

  /**
   * Send a local notification for CV analysis completion.
   */
  sendCVAnalysisComplete: async (score: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'تم تحليل سيرتك الذاتية ✓',
        body: `حصلت على ${score} نقطة. اضغط لعرض التفاصيل والتحسينات المقترحة.`,
        data: { type: 'cv_analyzed', score },
      },
      trigger: null,
    });
  },

  /**
   * Clear all badge counts.
   */
  clearBadge: async () => {
    await Notifications.setBadgeCountAsync(0);
  },
};
