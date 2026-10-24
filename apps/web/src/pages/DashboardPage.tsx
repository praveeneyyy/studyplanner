import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard, CustomDashboard } from '../context/DashboardContext';
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
  Trash2,
  Sliders,
  Filter,
  Check,
  LayoutGrid,
  FileText,
  LayoutDashboard,
  Target,
  Zap,
  BarChart3,
  Code2
} from 'lucide-react';

function renderDashboardIcon(iconKey?: string) {
  switch (iconKey) {
    case 'code':
      return <Code2 size={13} className="text-app-text flex-shrink-0" />;
    case 'study':
      return <BookOpen size={13} className="text-app-text flex-shrink-0" />;
    case 'target':
      return <Target size={13} className="text-app-text flex-shrink-0" />;
    case 'fast':
      return <Zap size={13} className="text-app-text flex-shrink-0" />;
    case 'analytics':
      return <BarChart3 size={13} className="text-app-text flex-shrink-0" />;
    default:
      return <LayoutDashboard size={13} className="text-app-text flex-shrink-0" />;
  }
}

export function DashboardPage() {
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

  // Global Keyboard Shortcut: Ctrl+Shift+L (and fallback Ctrl+L) to toggle AI Plan Builder Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = document.activeElement;
      const tagName = (target?.tagName || '').toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || (target as HTMLElement)?.isContentEditable;

      if (isInput) return;

      // Primary shortcut: Ctrl+Shift+L or Cmd+Shift+L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowPlanDrawer((prev) => !prev);
      }
      // Alternate fallback: Ctrl+L where allowed by browser
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'l') {
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
    setPlanSuccessToast('New AI Study Plan committed successfully! Today\'s schedule and metrics have been updated.');
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

  // Filter sessions by active dashboard subject filter
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
          { label: 'Workspace', to: '/dashboard' },
          { label: activeDashboard.name }
        ]}
        subtitle="Notion academic dashboard"
      />

      <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-5">
        {/* Notion View Switcher Tabs for Dashboards */}
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
                {renderDashboardIcon(dash.icon)}
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

            {/* "+ New Dashboard" Button */}
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

        {/* Plan Confirmation Toast Banner */}
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

        {/* Notion Header for Active Dashboard */}
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
                title="Open AI Study Plan Architect (Ctrl+Shift+L)"
              >
                <Sparkles size={13} className="text-app-accent" />
                <span>Build Plan with AI</span>
                <span className="hidden sm:inline-block ml-1 text-[10px] opacity-75 font-mono px-1 py-0.2 rounded border border-current">
                  Ctrl+Shift+L
                </span>
              </button>

              <button
                onClick={() => setShowNewDashModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs text-app-text transition-colors"
              >
                <Plus size={12} /> New View
              </button>
            </div>
          </div>
          <p className="text-xs text-app-muted">{activeDashboard.description}</p>

          {/* Notion Properties Grid */}
          <div className="border-y border-app-borderSubtle py-2 space-y-1 text-xs">
            <div className="flex items-center gap-6">
              <span className="w-24 text-app-subtle">Course Focus</span>
              <span className="notion-tag notion-tag-blue">
                {activeDashboard.subjectFilter === 'ALL' ? 'All Enrolled Subjects' : activeDashboard.subjectFilter}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="w-24 text-app-subtle">Daily Target</span>
              <span className="notion-tag notion-tag-green">
                {activeDashboard.dailyTargetMinutes || 120} minutes ({Math.round(((activeDashboard.dailyTargetMinutes || 120) / 60) * 10) / 10}h)
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="w-24 text-app-subtle">Target Exam</span>
              <span className="notion-tag notion-tag-red">
                {nearestExam ? `${nearestExam.title} in ${nearestExam.daysLeft}d` : 'No upcoming exam'}
              </span>
            </div>
          </div>
        </div>

        {/* Nearest Exam Callout */}
        {nearestExam && (
          <div className="notion-callout">
            <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-app-text">
                  Upcoming Exam: {nearestExam.title} ({nearestExam.subjectName})
                </p>
                <p className="text-app-muted">
                  Scheduled in <strong className="text-app-text">{nearestExam.daysLeft} days</strong>. Verify that revision blocks are completed.
                </p>
              </div>
              <button
                onClick={() => navigate('/planner')}
                className="self-start sm:self-auto px-2.5 py-1 rounded border border-app-borderSubtle hover:bg-app-hover text-app-text font-medium text-[11px] flex items-center gap-1"
              >
                View Schedule <ArrowRight size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Primary Study Action Card */}
        <div className="p-4 rounded border border-app-borderSubtle bg-app-surface shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-app-subtle uppercase tracking-wider">
              PRIMARY STUDY ACTION
            </span>
            <span className="text-xs text-app-muted">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-app-text">
                {nextSession ? nextSession.topic?.title : 'All Scheduled Blocks Completed!'}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-app-muted">
                {nextSession ? (
                  <>
                    <span className="notion-tag notion-tag-blue">
                      {nextSession.topic?.unit?.subject?.name || 'Subject'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {nextSession.durationMinutes} min block
                    </span>
                    <span>•</span>
                    <span className="notion-tag notion-tag-gray">{nextSession.sessionType}</span>
                  </>
                ) : (
                  <span>Great job! Review due flashcards or take an assessment quiz.</span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {nextSession ? (
                <button
                  onClick={() => navigate(`/session/${nextSession.id}`)}
                  className="px-3.5 py-1.5 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium flex items-center gap-1.5 transition-opacity"
                >
                  <Play size={12} className="fill-current" /> Begin Study Block
                </button>
              ) : (
                <button
                  onClick={() => navigate('/revision')}
                  className="px-3 py-1.5 rounded border border-app-borderSubtle hover:bg-app-hover text-app-text text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Repeat size={12} /> Review Cards
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4 Notion-Style Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium flex items-center justify-between">
              Daily Target
              <Clock size={13} className="text-app-subtle" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-app-text tabular-nums">
                {metrics?.completedTodayMinutes || 0}
              </span>
              <span className="text-xs text-app-muted">/ {activeDashboard.dailyTargetMinutes || 120}m</span>
            </div>
            <div className="w-full bg-app-sidebar rounded-full h-1 overflow-hidden mt-2">
              <div
                className="bg-app-text h-1 rounded-full transition-all duration-300"
                style={{ width: `${metrics?.dailyAdherencePercent || 0}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium flex items-center justify-between">
              Syllabus Progress
              <TrendingUp size={13} className="text-app-subtle" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-app-text tabular-nums">
                {metrics?.syllabusCompletionPercent || 0}%
              </span>
              <span className="text-xs text-app-muted">
                ({metrics?.masteredTopics || 0}/{metrics?.totalTopics || 0})
              </span>
            </div>
            <div className="w-full bg-app-sidebar rounded-full h-1 overflow-hidden mt-2">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${metrics?.syllabusCompletionPercent || 0}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium flex items-center justify-between">
              Flashcards Due
              <Repeat size={13} className="text-app-subtle" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-app-text tabular-nums">
                {metrics?.dueRevisionsCount || 0}
              </span>
              <span className="text-xs text-app-muted">cards today</span>
            </div>
            <button
              onClick={() => navigate('/revision')}
              className="text-[10px] text-app-muted hover:text-app-text hover:underline block pt-1"
            >
              Start Review Session →
            </button>
          </div>

          <div className="p-3.5 rounded border border-app-borderSubtle bg-app-surface space-y-1">
            <span className="text-[11px] text-app-muted font-medium flex items-center justify-between">
              Level & XP
              <Award size={13} className="text-app-subtle" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-app-text tabular-nums">
                Lvl {user?.currentLevel || 1}
              </span>
              <span className="text-xs text-app-muted">({user?.totalXP || 0} XP)</span>
            </div>
            <button
              onClick={() => navigate('/rewards')}
              className="text-[10px] text-app-muted hover:text-app-text hover:underline block pt-1"
            >
              View Achievements →
            </button>
          </div>
        </div>

        {/* Two-Column Agenda & Attention Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
          {/* Left Column (2/3): Today's Schedule Agenda */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between border-b border-app-borderSubtle pb-1">
              <h3 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
                <Calendar size={13} />
                Today's Scheduled Blocks ({filteredSessions.length})
              </h3>
              <button
                onClick={() => navigate('/planner')}
                className="text-[11px] text-app-muted hover:text-app-text hover:underline"
              >
                View Full Database →
              </button>
            </div>

            <div className="space-y-1.5">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session: any) => {
                  const isCompleted = session.status === 'COMPLETED';
                  const startTime = new Date(session.scheduledStart).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const endTime = new Date(session.scheduledEnd).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={session.id}
                      onClick={() => navigate(`/session/${session.id}`)}
                      className="p-2.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span>
                          {isCompleted ? (
                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                          ) : (
                            <FileText size={15} className="text-app-subtle shrink-0" />
                          )}
                        </span>
                        <div className="truncate">
                          <span className={`font-medium text-app-text truncate block ${isCompleted ? 'line-through text-app-muted' : ''}`}>
                            {session.topic?.title || 'Study Block'}
                          </span>
                          <span className="text-[11px] text-app-muted">
                            {session.topic?.unit?.subject?.name} • {session.durationMinutes}m
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-app-muted tabular-nums">
                          {startTime} - {endTime}
                        </span>
                        {isCompleted ? (
                          <span className="notion-tag notion-tag-green">Done</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/session/${session.id}`);
                            }}
                            className="px-2 py-0.5 rounded border border-app-borderSubtle text-[11px] font-medium text-app-text hover:bg-app-hover"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center border border-dashed border-app-borderSubtle rounded text-xs text-app-muted space-y-3">
                  <p>No study blocks scheduled for {activeDashboard.name} today.</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowPlanDrawer(true)}
                      className="px-3 py-1.5 rounded bg-app-text text-app-bg text-[11px] font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                    >
                      <Sparkles size={12} className="text-app-accent" />
                      <span>Build Plan with AI (Ctrl+Shift+L)</span>
                    </button>
                    <button
                      onClick={() => navigate('/planner')}
                      className="px-3 py-1.5 rounded border border-app-borderSubtle hover:bg-app-hover text-app-text text-[11px] font-medium"
                    >
                      Open Planner Database
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1/3): Attention Needed (Weak Topics) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-app-borderSubtle pb-1">
              <h3 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-500" /> Focus Needed Topics
              </h3>
              <button
                onClick={() => navigate('/subjects')}
                className="text-[11px] text-app-muted hover:text-app-text hover:underline"
              >
                Syllabus →
              </button>
            </div>

            <div className="space-y-1.5">
              {filteredWeakTopics.length > 0 ? (
                filteredWeakTopics.slice(0, 5).map((topic: any) => (
                  <div
                    key={topic.id}
                    className="p-2.5 rounded border border-app-borderSubtle bg-app-surface space-y-1 text-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-medium text-app-text truncate">{topic.title}</span>
                      <span className="notion-tag notion-tag-red">
                        {topic.confidence ? `${topic.confidence * 20}%` : '<50%'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-app-muted pt-1">
                      <span className="truncate">{topic.unit?.subject?.name || 'Subject'}</span>
                      <button
                        onClick={() => navigate('/ai')}
                        className="text-app-accent hover:underline flex items-center gap-1 font-medium"
                      >
                        <Sparkles size={11} /> Ask AI
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center border border-dashed border-app-borderSubtle rounded text-xs text-app-muted">
                  No weak topics identified in this course view.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Create Custom Dashboard */}
        {showNewDashModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                <h3 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-app-text" /> Create Custom Dashboard
                </h3>
                <button
                  onClick={() => setShowNewDashModal(false)}
                  className="p-1 rounded text-app-muted hover:text-app-text"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateNewDashboard} className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-app-muted mb-1">Theme</label>
                    <select
                      value={dashIcon}
                      onChange={(e) => setDashIcon(e.target.value)}
                      className="w-full px-2 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text outline-none cursor-pointer"
                    >
                      <option value="analytics">Analytics</option>
                      <option value="code">Development</option>
                      <option value="study">Syllabus</option>
                      <option value="target">Goals</option>
                      <option value="fast">Sprint</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-app-muted mb-1">Dashboard Name</label>
                    <input
                      type="text"
                      required
                      value={dashName}
                      onChange={(e) => setDashName(e.target.value)}
                      placeholder="e.g. Algorithms Final Sprint"
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Course / Subject Scope</label>
                  <select
                    value={dashSubject}
                    onChange={(e) => setDashSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none cursor-pointer"
                  >
                    <option value="ALL">All Subjects (Comprehensive)</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.code || 'Course'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">
                    Daily Study Target: {dashDailyGoal} minutes ({Math.round(dashDailyGoal / 60 * 10) / 10}h)
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={480}
                    step={15}
                    value={dashDailyGoal}
                    onChange={(e) => setDashDailyGoal(Number(e.target.value))}
                    className="w-full accent-app-text cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Brief Description (Optional)</label>
                  <input
                    type="text"
                    value={dashDesc}
                    onChange={(e) => setDashDesc(e.target.value)}
                    placeholder="e.g. Focus dashboard for December exam"
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-borderSubtle">
                  <button
                    type="button"
                    onClick={() => setShowNewDashModal(false)}
                    className="px-3 py-1.5 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text hover:bg-app-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Context-Aware AI Study Plan Builder Drawer */}
        <AIPlanBuilderDrawer
          isOpen={showPlanDrawer}
          onClose={() => setShowPlanDrawer(false)}
          onOpenPreview={handleOpenPlanPreview}
          onPlanConfirmed={handlePlanConfirmed}
        />

        {/* Structured Multi-View Study Plan Preview & Verification Modal */}
        <StudyPlanPreviewModal
          isOpen={showPreviewModal}
          draft={previewDraft}
          onClose={() => setShowPreviewModal(false)}
          onConfirmSuccess={handlePlanConfirmed}
          onReopenDrawer={() => setShowPlanDrawer(true)}
        />
      </div>
    </div>
  );
}
