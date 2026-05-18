// Powered by OnSpace.AI
import { getSupabaseClient } from '@/template';

export interface AppRecord {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  next_step?: string;
  cv_customized: boolean;
  job_url?: string;
  notes?: string;
  created_at: string;
}

export const applicationsService = {
  getApplications: async (userId: string): Promise<AppRecord[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_date', { ascending: false });
    if (error) return [];
    return data ?? [];
  },

  addApplication: async (userId: string, app: Omit<AppRecord, 'id' | 'user_id' | 'created_at'>): Promise<AppRecord | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('applications')
      .insert({ ...app, user_id: userId })
      .select()
      .single();
    if (error) return null;
    return data;
  },

  updateStatus: async (appId: string, status: AppRecord['status'], nextStep?: string) => {
    const supabase = getSupabaseClient();
    return supabase
      .from('applications')
      .update({ status, next_step: nextStep })
      .eq('id', appId);
  },

  deleteApplication: async (appId: string) => {
    const supabase = getSupabaseClient();
    return supabase.from('applications').delete().eq('id', appId);
  },
};
