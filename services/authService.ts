// Powered by OnSpace.AI
import { getSupabaseClient } from '@/template';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
}

export const authService = {
  getCurrentUser: async (): Promise<AuthUser | null> => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return {
      id: user.id,
      email: user.email ?? '',
      username: profile?.username ?? user.email?.split('@')[0],
    };
  },

  updateProfile: async (userId: string, updates: { username?: string }) => {
    const supabase = getSupabaseClient();
    return supabase.from('user_profiles').update(updates).eq('id', userId);
  },
};
