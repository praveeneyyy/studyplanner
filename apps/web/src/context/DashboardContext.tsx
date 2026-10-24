import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DashboardWidgetConfig {
  id: string;
  label: string;
  enabled: boolean;
}

export interface CustomDashboard {
  id: string;
  name: string;
  icon: string;
  description: string;
  subjectFilter: string; // 'ALL' or subject name / code
  dailyTargetMinutes?: number;
  widgets: string[]; // list of widget IDs
  isDefault?: boolean;
  createdAt: string;
}

interface DashboardContextType {
  dashboards: CustomDashboard[];
  activeDashboardId: string;
  activeDashboard: CustomDashboard;
  setActiveDashboardId: (id: string) => void;
  createDashboard: (data: Omit<CustomDashboard, 'id' | 'createdAt'>) => CustomDashboard;
  deleteDashboard: (id: string) => void;
  updateDashboard: (id: string, data: Partial<CustomDashboard>) => void;
}

const DEFAULT_DASHBOARDS: CustomDashboard[] = [
  {
    id: 'default-main',
    name: 'Main Workspace',
    icon: 'home',
    description: 'Personalized syllabus progress, scheduled study blocks, and active revision queue.',
    subjectFilter: 'ALL',
    dailyTargetMinutes: 120,
    widgets: ['examAlert', 'primaryAction', 'metricsGrid', 'agendaList', 'weakTopics'],
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [dashboards, setDashboards] = useState<CustomDashboard[]>(() => {
    try {
      const saved = localStorage.getItem('study_custom_dashboards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy predefined mock dashboards like 'os-sprint'
          const filtered = parsed.filter((d: any) => d.id !== 'os-sprint');
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {
      console.error('Failed to load custom dashboards from storage:', e);
    }
    return DEFAULT_DASHBOARDS;
  });

  const [activeDashboardId, setActiveDashboardId] = useState<string>(() => {
    return dashboards[0]?.id || 'default-main';
  });

  useEffect(() => {
    try {
      localStorage.setItem('study_custom_dashboards', JSON.stringify(dashboards));
    } catch (e) {
      console.error('Failed to persist dashboards:', e);
    }
  }, [dashboards]);

  const activeDashboard =
    dashboards.find((d) => d.id === activeDashboardId) || dashboards[0] || DEFAULT_DASHBOARDS[0];

  const createDashboard = (data: Omit<CustomDashboard, 'id' | 'createdAt'>): CustomDashboard => {
    const newDash: CustomDashboard = {
      ...data,
      id: `dash-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    };
    setDashboards((prev) => [...prev, newDash]);
    setActiveDashboardId(newDash.id);
    return newDash;
  };

  const deleteDashboard = (id: string) => {
    if (dashboards.length <= 1) return;
    setDashboards((prev) => prev.filter((d) => d.id !== id));
    if (activeDashboardId === id) {
      const remaining = dashboards.filter((d) => d.id !== id);
      setActiveDashboardId(remaining[0]?.id || 'default-main');
    }
  };

  const updateDashboard = (id: string, data: Partial<CustomDashboard>) => {
    setDashboards((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data } : d))
    );
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboards,
        activeDashboardId,
        activeDashboard,
        setActiveDashboardId,
        createDashboard,
        deleteDashboard,
        updateDashboard
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider');
  return ctx;
}
