// Powered by OnSpace.AI
import { getSupabaseClient } from '@/template';

export interface JobAlert {
  id: string;
  user_id: string;
  title: string;
  keywords: string[];
  location?: string;
  job_type?: string;
  min_salary?: number;
  is_active: boolean;
  created_at: string;
}

export const alertsService = {
  getAlerts: async (userId: string): Promise<JobAlert[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data ?? [];
  },

  createAlert: async (userId: string, alert: Omit<JobAlert, 'id' | 'user_id' | 'created_at'>): Promise<JobAlert | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('job_alerts')
      .insert({ ...alert, user_id: userId })
      .select()
      .single();
    if (error) return null;
    return data;
  },

  toggleAlert: async (alertId: string, isActive: boolean) => {
    const supabase = getSupabaseClient();
    return supabase.from('job_alerts').update({ is_active: isActive }).eq('id', alertId);
  },

  deleteAlert: async (alertId: string) => {
    const supabase = getSupabaseClient();
    return supabase.from('job_alerts').delete().eq('id', alertId);
  },
};
