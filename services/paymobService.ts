// Powered by OnSpace.AI — Paymob subscription payment service
import { getSupabaseClient } from '@/template';

export type SubscriptionPlan = 'monthly' | 'yearly';

export interface PaymobPaymentResult {
  paymentUrl: string;
  orderId: number;
  plan: { amountCents: number; currency: string; label: string };
}

export const paymobService = {
  initiatePayment: async (
    plan: SubscriptionPlan,
    userEmail: string,
    userName?: string
  ): Promise<PaymobPaymentResult> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke('paymob-payment', {
      body: { plan, userEmail, userName },
    });

    if (error) {
      try {
        const { FunctionsHttpError } = await import('@supabase/supabase-js');
        if (error instanceof FunctionsHttpError) {
          const text = await error.context?.text();
          throw new Error(`[Paymob] ${text || error.message}`);
        }
      } catch {
        // ignore nested errors
      }
      throw new Error(error.message);
    }

    if (!data?.paymentUrl) throw new Error('لم يتم الحصول على رابط الدفع');
    return data as PaymobPaymentResult;
  },

  getPlanDetails: (plan: SubscriptionPlan) => {
    const plans = {
      monthly: {
        label: 'شهري',
        price: '299 جنيه',
        priceUSD: '$9.99',
        period: '/شهر',
        savings: null,
        features: [
          'تقديم غير محدود على الوظائف',
          'تحليل CV بالذكاء الاصطناعي',
          'تدريب مقابلات متقدم',
          'تنبيهات وظيفية فورية',
          'وكيل تفاوض AI',
        ],
      },
      yearly: {
        label: 'سنوي',
        price: '2,699 جنيه',
        priceUSD: '$89.99',
        period: '/سنة',
        savings: 'وفر 25%',
        features: [
          'كل مميزات الشهري',
          'أولوية في البحث والمطابقة',
          'تقارير سوق العمل التفصيلية',
          'دعم أولوية 24/7',
          'وصول لقاعدة بيانات الرواتب',
        ],
      },
    };
    return plans[plan];
  },
};
