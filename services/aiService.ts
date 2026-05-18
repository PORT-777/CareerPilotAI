// Powered by OnSpace.AI — Real AI via OnSpace AI (Gemini 3 Flash)
import { getSupabaseClient } from '@/template';

export interface AIMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentType?: 'discovery' | 'application' | 'skill' | 'interview' | 'negotiation' | 'main';
}

export interface SkillGap {
  skill: string;
  skillAr: string;
  currentLevel: number;
  requiredLevel: number;
  course?: string;
  courseUrl?: string;
}

export interface ResumeAnalysis {
  score: number;
  atsScore: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  missingKeywords?: string[];
  targetRoles?: string[];
  experienceYears?: number;
  summary?: string;
}

export interface CVAnalysisResult {
  score: number;
  atsScore: number;
  extractedSkills: string[];
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  targetRoles: string[];
  experienceYears: number;
  summary: string;
}

const BACKEND_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const aiService = {
  /**
   * Real AI chat — streams response from OnSpace AI via Edge Function.
   * Calls onChunk for each streaming text chunk, returns final full string.
   */
  chat: async (
    message: string,
    history: { role: string; content: string }[] = [],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(`${BACKEND_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Error: ${errText}`);
    }

    const reader = response.body?.getReader();
    let fullContent = '';

    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const parsed = JSON.parse(line.replace('data: ', ''));
              const delta = parsed.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                fullContent += delta;
                onChunk?.(delta);
              }
            } catch {
              // ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } else {
      // Fallback: non-streaming (mobile)
      const text = await response.text();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const parsed = JSON.parse(line.replace('data: ', ''));
            const delta = parsed.choices?.[0]?.delta?.content ?? '';
            fullContent += delta;
          } catch {
            // ignore
          }
        }
      }
      if (fullContent) onChunk?.(fullContent);
    }

    return fullContent || 'عذراً، لم أتمكن من الاستجابة. حاول مرة أخرى.';
  },

  /**
   * Analyzes a CV using OnSpace AI via Edge Function.
   * Passes the real filePath so the edge function can download and read the actual PDF.
   */
  analyzeCV: async (cvId: string, filePath?: string): Promise<CVAnalysisResult | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke('cv-analyze', {
      body: { cvId, filePath },
    });

    if (error) {
      const { FunctionsHttpError } = await import('@supabase/supabase-js');
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          throw new Error(`[CV-Analyze] ${text || error.message}`);
        } catch {
          throw new Error(error.message);
        }
      }
      throw new Error(error.message);
    }

    return data?.analysis ?? null;
  },

  /**
   * Evaluates an interview answer using OnSpace AI (Gemini).
   * Returns structured evaluation with score, strengths, improvements.
   */
  evaluateInterviewAnswer: async (
    question: string,
    answer: string
  ): Promise<{ score: number; strengths: string[]; improvements: string[]; betterAnswer: string; tip: string } | null> => {
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(`${BACKEND_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        mode: 'interview',
        message: `السؤال: ${question}\n\nإجابة المتقدم: ${answer}`,
        history: [],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Interview Eval Error: ${errText}`);
    }

    const data = await response.json();
    return data?.evaluation ?? null;
  },

  analyzeResume: async (): Promise<ResumeAnalysis> => {
    await new Promise(r => setTimeout(r, 800));
    return {
      score: 78,
      strengths: ['خبرة React Native قوية', 'مشاريع متنوعة', 'شهادات معتمدة'],
      improvements: ['أضف أرقام نتائج محددة', 'حسّن قسم الملخص', 'أضف مهارات لغوية'],
      keywords: ['React Native', 'TypeScript', 'Node.js', 'AWS', 'Agile'],
      atsScore: 82,
    };
  },

  getSkillGaps: async (): Promise<SkillGap[]> => {
    await new Promise(r => setTimeout(r, 800));
    return [
      {
        skill: 'Machine Learning',
        skillAr: 'التعلم الآلي',
        currentLevel: 30,
        requiredLevel: 70,
        course: 'Machine Learning Specialization - Coursera',
        courseUrl: 'https://coursera.org',
      },
      {
        skill: 'Cloud Architecture (AWS)',
        skillAr: 'هندسة السحابة (AWS)',
        currentLevel: 55,
        requiredLevel: 80,
        course: 'AWS Solutions Architect - Udemy',
        courseUrl: 'https://udemy.com',
      },
      {
        skill: 'System Design',
        skillAr: 'تصميم الأنظمة',
        currentLevel: 60,
        requiredLevel: 85,
        course: 'Grokking System Design - Educative',
        courseUrl: 'https://educative.io',
      },
      {
        skill: 'Leadership',
        skillAr: 'القيادة',
        currentLevel: 70,
        requiredLevel: 90,
        course: 'Engineering Leadership - LinkedIn Learning',
        courseUrl: 'https://linkedin.com/learning',
      },
    ];
  },
};
