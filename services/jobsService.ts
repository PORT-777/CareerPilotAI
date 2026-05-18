// Powered by OnSpace.AI — Real jobs from Supabase DB
import { getSupabaseClient } from '@/template';

export interface Job {
  id: string;
  title: string;
  titleAr: string;
  company: string;
  location: string;
  locationAr: string;
  salary: string;
  type: 'full-time' | 'part-time' | 'remote' | 'hybrid';
  typeAr: string;
  category: string;
  matchScore: number;
  description: string;
  descriptionAr: string;
  requirements: string[];
  requirementsAr: string[];
  skills: string[];
  posted: string;
  postedAr: string;
  companyLogo?: string;
  isBookmarked?: boolean;
  platform: string;
}

// Map Supabase snake_case row → Job interface
function mapRow(row: any): Job {
  return {
    id: row.id,
    title: row.title ?? '',
    titleAr: row.title_ar ?? row.title ?? '',
    company: row.company ?? '',
    location: row.location ?? '',
    locationAr: row.location_ar ?? row.location ?? '',
    salary: row.salary ?? '',
    type: row.job_type ?? 'full-time',
    typeAr: row.job_type_ar ?? '',
    category: row.category ?? 'tech',
    matchScore: row.match_score ?? 0,
    description: row.description ?? '',
    descriptionAr: row.description_ar ?? row.description ?? '',
    requirements: row.requirements ?? [],
    requirementsAr: row.requirements_ar ?? [],
    skills: row.skills ?? [],
    posted: row.posted_label ?? '',
    postedAr: row.posted_label_ar ?? '',
    companyLogo: row.company_logo,
    platform: row.platform ?? '',
  };
}

export const jobsService = {
  getJobs: async (category?: string, query?: string): Promise<Job[]> => {
    const supabase = getSupabaseClient();
    let q = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('match_score', { ascending: false });

    if (category && category !== 'all') {
      q = q.eq('category', category);
    }

    if (query && query.trim()) {
      q = q.or(
        `title.ilike.%${query}%,title_ar.ilike.%${query}%,company.ilike.%${query}%`
      );
    }

    const { data, error } = await q;
    if (error) {
      console.error('jobsService.getJobs error:', error.message);
      return [];
    }
    return (data ?? []).map(mapRow);
  },

  getJobById: async (id: string): Promise<Job | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapRow(data);
  },

  getRecommendedJobs: async (): Promise<Job[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('match_score', { ascending: false })
      .limit(3);
    if (error) return [];
    return (data ?? []).map(mapRow);
  },

  searchBySkills: async (skills: string[]): Promise<Job[]> => {
    if (!skills.length) return jobsService.getRecommendedJobs();
    const supabase = getSupabaseClient();
    // Filter jobs that contain at least one of the user's skills
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .overlaps('skills', skills)
      .order('match_score', { ascending: false })
      .limit(10);
    if (error) return [];
    return (data ?? []).map(mapRow);
  },
};
