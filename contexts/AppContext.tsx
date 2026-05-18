// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/template';
import { jobsService, Job } from '@/services/jobsService';
import { applicationsService, AppRecord } from '@/services/applicationsService';
import { cvService, CVFile } from '@/services/cvService';
import { alertsService, JobAlert } from '@/services/alertsService';

interface AppContextType {
  // Auth
  authUser: { id: string; email: string; username?: string } | null;
  // Jobs
  jobs: Job[];
  loadJobs: (category?: string, query?: string) => Promise<void>;
  jobsLoading: boolean;
  bookmarkedJobs: string[];
  toggleBookmark: (jobId: string) => void;
  // Applications
  applications: AppRecord[];
  appsLoading: boolean;
  loadApplications: () => Promise<void>;
  addApplication: (app: Omit<AppRecord, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  // CVs
  cvFiles: CVFile[];
  loadCVs: () => Promise<void>;
  cvsLoading: boolean;
  // Alerts
  alerts: JobAlert[];
  loadAlerts: () => Promise<void>;
  addAlert: (alert: Omit<JobAlert, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  toggleAlert: (alertId: string, isActive: boolean) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const authUser = user ? { id: user.id, email: user.email, username: user.username } : null;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [applications, setApplications] = useState<AppRecord[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [cvFiles, setCvFiles] = useState<CVFile[]>([]);
  const [cvsLoading, setCvsLoading] = useState(false);
  const [alerts, setAlerts] = useState<JobAlert[]>([]);

  useEffect(() => {
    if (authUser?.id) {
      loadApplications();
      loadCVs();
      loadAlerts();
    }
  }, [authUser?.id]);

  const loadJobs = useCallback(async (category?: string, query?: string) => {
    setJobsLoading(true);
    try {
      const data = await jobsService.getJobs(category, query);
      setJobs(data);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const toggleBookmark = useCallback((jobId: string) => {
    setBookmarkedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  }, []);

  const loadApplications = useCallback(async () => {
    if (!authUser?.id) return;
    setAppsLoading(true);
    try {
      const data = await applicationsService.getApplications(authUser.id);
      setApplications(data);
    } finally {
      setAppsLoading(false);
    }
  }, [authUser?.id]);

  const addApplication = useCallback(async (app: Omit<AppRecord, 'id' | 'user_id' | 'created_at'>) => {
    if (!authUser?.id) return;
    const newApp = await applicationsService.addApplication(authUser.id, app);
    if (newApp) setApplications(prev => [newApp, ...prev]);
  }, [authUser?.id]);

  const loadCVs = useCallback(async () => {
    if (!authUser?.id) return;
    setCvsLoading(true);
    try {
      const data = await cvService.getUserCVs(authUser.id);
      setCvFiles(data);
    } finally {
      setCvsLoading(false);
    }
  }, [authUser?.id]);

  const loadAlerts = useCallback(async () => {
    if (!authUser?.id) return;
    const data = await alertsService.getAlerts(authUser.id);
    setAlerts(data);
  }, [authUser?.id]);

  const addAlert = useCallback(async (alert: Omit<JobAlert, 'id' | 'user_id' | 'created_at'>) => {
    if (!authUser?.id) return;
    const newAlert = await alertsService.createAlert(authUser.id, alert);
    if (newAlert) setAlerts(prev => [newAlert, ...prev]);
  }, [authUser?.id]);

  const toggleAlertFn = useCallback(async (alertId: string, isActive: boolean) => {
    await alertsService.toggleAlert(alertId, isActive);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_active: isActive } : a));
  }, []);

  const deleteAlertFn = useCallback(async (alertId: string) => {
    await alertsService.deleteAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  return (
    <AppContext.Provider
      value={{
        authUser,
        jobs,
        loadJobs,
        jobsLoading,
        bookmarkedJobs,
        toggleBookmark,
        applications,
        appsLoading,
        loadApplications,
        addApplication,
        cvFiles,
        loadCVs,
        cvsLoading,
        alerts,
        loadAlerts,
        addAlert,
        toggleAlert: toggleAlertFn,
        deleteAlert: deleteAlertFn,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
