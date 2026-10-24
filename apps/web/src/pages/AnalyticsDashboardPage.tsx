import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import { AIPlanBuilderDrawer } from '../components/dashboard/AIPlanBuilderDrawer';
import { StudyPlanPreviewModal } from '../components/dashboard/StudyPlanPreviewModal';
import {
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Repeat,
  Award,
  ChevronRight,
  Plus,
  X,
  LayoutGrid
} from 'lucide-react';

export function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dashboards, activeDashboard, setActiveDashboardId, createDashboard, deleteDashboard } = useDashboard();

  const [metrics, setMetrics] = useState<any>(null);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Plan Builder Drawer & Preview Modal State
  const [showPlanDrawer, setShowPlanDrawer] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [planSuccessToast, setPlanSuccessToast] = useState<string | null>(null);

  // New Dashboard Modal State
  const [showNewDashModal, setShowNewDashModal] = useState(false);
  const [dashName, setDashName] = useState('');
  const [dashIcon, setDashIcon] = useState('LayoutGrid');
  const [dashDesc, setDashDesc] = useState('');
  const [dashSubject, setDashSubject] = useState('ALL');
  const [dashDailyGoal, setDashDailyGoal] = useState(120);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, weakRes, subsRes] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getWeakTopics(),
        api.getSubjects()
      ]);
      if (dashRes?.data) setMetrics(dashRes.data);
      if (weakRes?.data) setWeakTopics(weakRes.data);
      if (subsRes?.data) setSubjects(subsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Keyboard Shortcut: Ctrl+Shift+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement;
      const tagName = (target?.tagName || '').toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || (target as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowPlanDrawer((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenPlanPreview = (draft: any) => {
    setPreviewDraft(draft);
    setShowPreviewModal(true);
  };

  const handlePlanConfirmed = () => {
    setPlanSuccessToast("New AI Study Plan committed successfully! Today's schedule and metrics have been updated.");
    loadData();
    setTimeout(() => setPlanSuccessToast(null), 6000);
  };

  const handleCreateNewDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashName.trim()) return;

    createDashboard({
      name: dashName.trim(),
      icon: dashIcon,
      description: dashDesc.trim() || `Custom study dashboard for ${dashSubject}.`,
      subjectFilter: dashSubject,
      dailyTargetMinutes: dashDailyGoal,
      widgets: ['examAlert', 'primaryAction', 'metricsGrid', 'agendaList', 'weakTopics']
    });

    setShowNewDashModal(false);
    setDashName('');
    setDashDesc('');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-app-muted text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
          <span>Loading workspace...</span>
        </div>
      </div>
    );
  }

  const isAllSubjects = activeDashboard.subjectFilter === 'ALL';
  const filteredSessions = (metrics?.todaysSessions || []).filter((s: any) => {
    if (isAllSubjects) return true;
    const name = s.topic?.unit?.subject?.name || '';
    return name.toLowerCase().includes(activeDashboard.subjectFilter.toLowerCase());
  });

  const nextSession = filteredSessions.find(
    (s: any) => s.status === 'PLANNED' || s.status === 'IN_PROGRESS'
  );

  const nearestExam = metrics?.upcomingExams?.find((e: any) => {
    if (isAllSubjects) return true;
    return e.subjectName?.toLowerCase().includes(activeDashboard.subjectFilter.toLowerCase());
  }) || metrics?.upcomingExams?.[0];

  const filteredWeakTopics = (weakTopics || []).filter((t: any) => {
    if (isAllSubjects) return true;
    const name = t.unit?.subject?.name || '';
    return name.toLowerCase().includes(activeDashboard.subjectFilter.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'All Tools', to: '/tools' },
          { label: 'Custom Dashboards' }
        ]}
        subtitle="Advanced metrics workspace"
      />

      <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-5">
        {/* View Switcher Tabs */}
        <div className="border-b border-app-borderSubtle flex items-center justify-between gap-2 overflow-x-auto select-none pt-1">
          <div className="flex items-center gap-1 -mb-[1px]">
            {dashboards.map((dash) => (
              <button
                key={dash.id}
                onClick={() => setActiveDashboardId(dash.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 text-xs font-medium transition-colors ${
                  activeDashboard.id === dash.id
                    ? 'border-app-text text-app-text font-semibold'
                    : 'border-transparent text-app-muted hover:text-app-text'
                }`}
              >
                <span>{dash.name}</span>
                {!dash.isDefault && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${dash.name}" dashboard?`)) {
                        deleteDashboard(dash.id);
                      }
                    }}
                    className="p-0.5 rounded hover:bg-app-hover text-app-subtle hover:text-red-500 ml-1"
                    title="Delete custom view"
                  >
                    ×
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={() => setShowNewDashModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-app-muted hover:text-app-text transition-colors border-b-2 border-transparent"
              title="Create new custom dashboard view"
            >
              <Plus size={13} />
              <span>Add Dashboard</span>
            </button>
          </div>
        </div>

        {planSuccessToast && (
          <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{planSuccessToast}</span>
            </div>
            <button
              onClick={() => setPlanSuccessToast(null)}
              className="p-1 rounded hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-2xl md:text-3xl">
              <LayoutGrid size={24} className="text-app-text shrink-0" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-app-text">
                {activeDashboard.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlanDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium transition-all shadow-xs"
              >
                <Sparkles size={13} />
                <span>AI Plan Builder</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-app-muted">{activeDashboard.description}</p>
        </div>

        {/* Exam Alert Card */}
        {nearestExam && (
          <div className="p-3.5 rounded-md border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <span>
                <strong>{nearestExam.subjectName}</strong> examination is in <strong>{nearestExam.daysRemaining} days</strong>.
              </span>
            </div>
            <button
              onClick={() => setShowPlanDrawer(true)}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 text-xs font-medium shrink-0"
            >
              Adjust Plan
            </button>
          </div>
        )}

        {/* Primary Action Card */}
        {nextSession ? (
          <div className="p-4 rounded-md border border-app-borderSubtle bg-app-surface space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-app-text uppercase tracking-wider text-[11px]">
                Up Next Today
              </span>
              <span className="text-app-muted">Planned for {nextSession.plannedDurationMinutes || 45} mins</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-app-text">
                  {nextSession.topic?.unit?.subject?.name} — {nextSession.topic?.name}
                </h3>
                <p className="text-xs text-app-muted mt-0.5">
                  Unit {nextSession.topic?.unit?.unitNumber}: {nextSession.topic?.unit?.title}
                </p>
              </div>
              <button
                onClick={() => navigate(`/session/${nextSession.id}`)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-semibold shrink-0"
              >
                <Play size={13} className="fill-current" />
                <span>Start Session</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-md border border-dashed border-app-borderSubtle bg-app-surface/50 text-center space-y-2">
            <p className="text-xs text-app-muted">All scheduled sessions for today are completed!</p>
            <button
              onClick={() => setShowPlanDrawer(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-app-accent hover:underline"
            >
              <Sparkles size={12} />
              <span>Generate more sessions with AI</span>
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-md border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium">Daily Target</span>
            <div className="text-lg font-bold text-app-text">{activeDashboard.dailyTargetMinutes}m</div>
          </div>
          <div className="p-3.5 rounded-md border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium">Studied Today</span>
            <div className="text-lg font-bold text-app-text">{metrics?.totalMinutesToday || 0}m</div>
          </div>
          <div className="p-3.5 rounded-md border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium">Active Streak</span>
            <div className="text-lg font-bold text-app-text">{metrics?.activeStreakDays || 0} days</div>
          </div>
          <div className="p-3.5 rounded-md border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium">Enrolled Subjects</span>
            <div className="text-lg font-bold text-app-text">{subjects.length}</div>
          </div>
        </div>

        {/* Weak Topics */}
        {filteredWeakTopics.length > 0 && (
          <div className="p-4 rounded-md border border-app-borderSubtle bg-app-surface space-y-3">
            <h3 className="text-xs font-semibold text-app-text uppercase tracking-wider">
              Priority Revision Topics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredWeakTopics.slice(0, 4).map((t: any) => (
                <div key={t.id} className="p-2.5 rounded border border-app-borderSubtle/60 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-medium text-app-text truncate max-w-[200px]">{t.name}</div>
                    <div className="text-[11px] text-app-muted">{t.unit?.subject?.name}</div>
                  </div>
                  <button
                    onClick={() => navigate('/ai')}
                    className="p-1 text-app-muted hover:text-app-text"
                    title="Explain topic with AI"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AIPlanBuilderDrawer
        isOpen={showPlanDrawer}
        onClose={() => setShowPlanDrawer(false)}
        onOpenPreview={handleOpenPlanPreview}
      />

      <StudyPlanPreviewModal
        isOpen={showPreviewModal}
        draft={previewDraft}
        onClose={() => setShowPreviewModal(false)}
        onConfirmSuccess={handlePlanConfirmed}
        onReopenDrawer={() => {
          setShowPreviewModal(false);
          setShowPlanDrawer(true);
        }}
      />
    </div>
  );
}
