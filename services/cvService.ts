// Powered by OnSpace.AI
import { getSupabaseClient } from '@/template';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export interface CVFile {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  is_primary: boolean;
  extracted_skills?: string[];
  score?: number;
  created_at: string;
}

export const cvService = {
  pickCV: async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0];
  },

  uploadCV: async (userId: string, file: DocumentPicker.DocumentPickerAsset): Promise<CVFile | null> => {
    const supabase = getSupabaseClient();
    const ext = file.name.split('.').pop() ?? 'pdf';
    const path = `${userId}/${Date.now()}.${ext}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('user-cvs')
      .upload(path, binary, { contentType: file.mimeType ?? 'application/pdf' });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage.from('user-cvs').getPublicUrl(path);

    // Mock AI analysis
    const mockSkills = ['React Native', 'TypeScript', 'Node.js', 'JavaScript', 'API Design'];
    const mockScore = Math.floor(Math.random() * 20) + 75;

    const { data, error } = await supabase
      .from('user_cvs')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_url: urlData.publicUrl || path,
        file_size: file.size,
        is_primary: false,
        extracted_skills: mockSkills,
        score: mockScore,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getUserCVs: async (userId: string): Promise<CVFile[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_cvs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data ?? [];
  },

  setPrimary: async (cvId: string, userId: string) => {
    const supabase = getSupabaseClient();
    // Remove all primary
    await supabase.from('user_cvs').update({ is_primary: false }).eq('user_id', userId);
    // Set new primary
    return supabase.from('user_cvs').update({ is_primary: true }).eq('id', cvId);
  },

  deleteCV: async (cvId: string) => {
    const supabase = getSupabaseClient();
    return supabase.from('user_cvs').delete().eq('id', cvId);
  },
};
