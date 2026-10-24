import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import { AIPlanBuilderDrawer } from '../components/dashboard/AIPlanBuilderDrawer';
import { StudyPlanPreviewModal } from '../components/dashboard/StudyPlanPreviewModal';
import { DeepFocusModal } from '../components/study/DeepFocusModal';
import {
  Sparkles,
  Calendar,
  Code2,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Send,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  CalendarCheck2
} from 'lucide-react';
import {
  SvgRepoAcademicCap,
  SvgRepoSparkle,
  SvgRepoCodeBracket,
  SvgRepoCalendarSchedule
} from '../components/ui/SvgRepoIcons';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // AI Prompt Box State
  const [prompt, setPrompt] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [isCommittingPlan, setIsCommittingPlan] = useState(false);

  // Today's Study Sessions State (Real data)
  const [todaysSessions, setTodaysSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // AI Plan Builder Drawer & Preview Modal State
  const [showPlanDrawer, setShowPlanDrawer] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [planSuccessToast, setPlanSuccessToast] = useState<string | null>(null);
  const [activeFocusSession, setActiveFocusSession] = useState<any | null>(null);

  const handleExportCalendar = async () => {
    try {
      const blob = await api.exportCalendarIcs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `academic-study-schedule-${new Date().toISOString().slice(0, 10)}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Calendar export failed: ${err.message || 'Error exporting .ics'}`);
    }
  };

  // Load Real Sessions for Today
  const loadSessions = useCallback(async () => {
    try {
      const res = await api.getSessions();
      if (res?.data && Array.isArray(res.data)) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const filtered = res.data.filter((s: any) => {
          const sDate = (s.scheduledStart || s.date || '').slice(0, 10);
          return sDate === todayStr || s.status === 'IN_PROGRESS';
        });
        setTodaysSessions(filtered);
      }
    } catch (err) {
      console.error('Failed to load today sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Global Keyboard Shortcut: Ctrl+Shift+L to trigger AI Plan Builder
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

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  // Intent detector for study plan requests
  const isStudyPlanRequest = (text: string) => {
    const t = text.toLowerCase().trim();
    return (
      t.includes('study plan') ||
      t.includes('study-plan') ||
      t.includes('create plan') ||
      t.includes('make plan') ||
      t.includes('build plan') ||
      t.includes('plan my study') ||
      t.includes('plan study') ||
      t.includes('study schedule') ||
      t.includes('exam schedule') ||
      t.includes('timetable') ||
      t.includes('study sprint') ||
      t.includes('revision plan') ||
      t.includes('prep plan') ||
      (t.includes('plan') && (t.includes('dsa') || t.includes('exam') || t.includes('week') || t.includes('day') || t.includes('java') || t.includes('subject') || t.includes('study') || t.includes('semester')))
    );
  };

  // Handle Primary AI Input submission
  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isAskingAI) return;

    const userPrompt = prompt.trim();
    setIsAskingAI(true);
    setAiAnswer(null);
    setGeneratedPlan(null);

    // If user prompt requests a study plan, build and display the plan immediately!
    if (isStudyPlanRequest(userPrompt)) {
      try {
        const res = await api.generateAiPlanDraft({
          prompt: userPrompt,
          constraints: {},
          history: []
        });

        if (res?.data?.draft) {
          const draft = res.data.draft;
          setGeneratedPlan(draft);
          setPreviewDraft(draft);
          // Pop full multi-view interactive preview modal immediately
          setShowPreviewModal(true);
        } else {
          setAiAnswer('Could not generate a feasible study schedule for this prompt. Please specify hours or subjects.');
        }
      } catch (err: any) {
        console.error('Failed to generate study plan:', err);
        setAiAnswer(`Study Plan Generation Failed: ${err.message || 'Please check connection and try again.'}`);
      } finally {
        setIsAskingAI(false);
      }
      return;
    }

    try {
      const res = await api.aiChat({ message: userPrompt });
      if (res?.answer) {
        setAiAnswer(res.answer);
      } else if ((res as any)?.reply) {
        setAiAnswer((res as any).reply);
      } else {
        setAiAnswer("Here is the conceptual breakdown for your request. You can continue this discussion or request step-by-step code in the dedicated AI workspace.");
      }
    } catch (err: any) {
      console.error('Failed to get AI answer on homepage:', err);
      setAiAnswer(
        "I'm ready to help you with this topic! Click 'Open in AI Workspace' below to start an interactive deep-dive with code tracing and exam formats."
      );
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleOpenPlanPreview = (draft: any) => {
    setPreviewDraft(draft);
    setShowPreviewModal(true);
  };

  const handlePlanConfirmed = () => {
    setPlanSuccessToast("New AI Study Plan committed successfully! Today's schedule has been updated.");
    loadSessions();
    setTimeout(() => setPlanSuccessToast(null), 6000);
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg min-h-screen">
      <TopBar
        breadcrumbs={[
          { label: firstName ? `${firstName}'s Space` : 'Workspace', to: '/dashboard' },
          { label: 'Home' }
        ]}
        subtitle="Minimal study workspace"
      />

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-6 py-10 md:py-16 space-y-10">
        {/* Toast Alert */}
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
              ×
            </button>
          </div>
        )}

        {/* 1. Calm Welcome Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-app-surface text-app-muted border border-app-borderSubtle">
            <Sparkles size={12} className="text-app-accent" />
            <span>{getGreeting()}, {firstName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-app-text">
            What are you working on today?
          </h1>
          <p className="text-xs md:text-sm text-app-muted">
            Ask an academic question, plan an upcoming exam, or jump back into your code editor.
          </p>
        </div>

        {/* 2. Focused Primary AI Input Box */}
        <div className="relative rounded-xl bg-app-surface border border-app-borderSubtle shadow-xs focus-within:border-app-text focus-within:ring-1 focus-within:ring-app-text transition-all">
          <form onSubmit={handleAskAI} className="p-3 sm:p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className="text-app-accent mt-0.5 shrink-0" />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskAI();
                  }
                }}
                rows={2}
                placeholder="Ask anything about your syllabus, algorithm complexity, code errors, or exam preparations..."
                className="w-full bg-transparent text-xs md:text-sm text-app-text placeholder-app-muted focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-app-borderSubtle/60 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-app-subtle">
                <span className="hidden sm:inline">Press Enter ↵ to ask</span>
              </div>

              <div className="flex items-center gap-2">
                {prompt.trim() && (
                  <button
                    type="button"
                    onClick={() => navigate(`/ai?q=${encodeURIComponent(prompt.trim())}`)}
                    className="text-xs text-app-muted hover:text-app-text px-2 py-1 rounded hover:bg-app-hover transition-colors"
                  >
                    Open in Workspace
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!prompt.trim() || isAskingAI}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-text text-app-bg hover:opacity-90 disabled:opacity-40 text-xs font-medium transition-all"
                >
                  {isAskingAI ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <span>Ask AI</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Generated Study Plan Card */}
          {generatedPlan && (
            <div className="p-4 sm:p-5 rounded-b-xl border-t border-app-borderSubtle bg-app-surface space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-app-borderSubtle">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Sparkles size={11} />
                    <span>Study Plan Generated</span>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-app-text">
                    {generatedPlan.title || 'Personalized Study Plan'}
                  </h3>
                  <p className="text-xs text-app-muted">
                    Deterministic, conflict-free schedule formulated from your syllabus and study capacity.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportCalendar}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text rounded-lg transition-colors"
                    title="Export schedule to .ics calendar file"
                  >
                    <Calendar size={13} className="text-app-accent" />
                    <span>Export .ics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPlanPreview(generatedPlan)}
                    className="px-3 py-1.5 text-xs font-medium text-app-muted hover:text-app-text hover:bg-app-hover rounded-lg transition-colors border border-app-borderSubtle"
                  >
                    Inspect Full Schedule
                  </button>
                  <button
                    type="button"
                    disabled={isCommittingPlan}
                    onClick={async () => {
                      setIsCommittingPlan(true);
                      try {
                        await api.confirmAiPlanDraft(generatedPlan);
                        handlePlanConfirmed();
                        setGeneratedPlan(null);
                      } catch (err: any) {
                        alert(`Failed to save plan: ${err.message || 'Unknown error'}`);
                      } finally {
                        setIsCommittingPlan(false);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isCommittingPlan ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Saving Plan...</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>Commit to Schedule</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 4 Metric Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-app-hover/50 border border-app-borderSubtle space-y-0.5">
                  <span className="text-[10px] text-app-subtle uppercase tracking-wider block">Duration</span>
                  <span className="text-xs font-semibold text-app-text font-mono">
                    {generatedPlan.durationDays || 21} Days
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-app-hover/50 border border-app-borderSubtle space-y-0.5">
                  <span className="text-[10px] text-app-subtle uppercase tracking-wider block">Total Study Time</span>
                  <span className="text-xs font-semibold text-app-text font-mono">
                    {generatedPlan.totalPlannedHours || Math.round((generatedPlan.totalPlannedMinutes || 0) / 60)} Hours
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-app-hover/50 border border-app-borderSubtle space-y-0.5">
                  <span className="text-[10px] text-app-subtle uppercase tracking-wider block">Total Sessions</span>
                  <span className="text-xs font-semibold text-app-text font-mono">
                    {generatedPlan.sessionCount || generatedPlan.sessions?.length || 0} Sessions
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-app-hover/50 border border-app-borderSubtle space-y-0.5">
                  <span className="text-[10px] text-app-subtle uppercase tracking-wider block">Daily Pace</span>
                  <span className="text-xs font-semibold text-app-text font-mono">
                    {generatedPlan.weekdayHours || 3}h wk / {generatedPlan.weekendHours || 5}h wkd
                  </span>
                </div>
              </div>

              {/* First Sessions Snapshot */}
              {generatedPlan.sessions && generatedPlan.sessions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-app-muted">
                    <span className="font-medium text-app-text">Upcoming Study Schedule:</span>
                    <span className="text-[11px] text-app-subtle">
                      {generatedPlan.sessions.length} total blocks planned
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {generatedPlan.sessions.slice(0, 3).map((s: any, idx: number) => (
                      <div
                        key={s.id || idx}
                        className="p-2.5 rounded-lg bg-app-hover/30 border border-app-borderSubtle flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded bg-app-surface border border-app-borderSubtle text-[10px] font-mono flex items-center justify-center shrink-0 text-app-muted font-semibold">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 truncate">
                            <span className="font-medium text-app-text block truncate">
                              {s.topicTitle || 'Study Session'}
                            </span>
                            <span className="text-[11px] text-app-muted truncate block">
                              {s.subjectName || 'Curriculum'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-app-subtle shrink-0">
                          <span className="hidden sm:inline">{s.dayOfWeekName || ''} {s.dayDateString || ''}</span>
                          <span className="font-mono text-app-muted bg-app-surface px-1.5 py-0.5 rounded border border-app-borderSubtle">
                            {s.durationMinutes}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inline AI Answer Display */}
          {aiAnswer && !generatedPlan && (
            <div className="p-4 rounded-b-xl border-t border-app-borderSubtle bg-app-hover/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-app-muted">
                <span className="font-semibold text-app-text flex items-center gap-1.5">
                  <Sparkles size={12} className="text-app-accent" />
                  <span>AI Tutor Response</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(`Study plan for ${prompt || 'this subject'}`);
                      handleAskAI();
                    }}
                    className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    <SvgRepoCalendarSchedule size={11} />
                    <span>Create Study Plan for this</span>
                  </button>
                  <button
                    onClick={handleCopyAnswer}
                    className="flex items-center gap-1 text-[11px] hover:text-app-text text-app-muted px-2 py-0.5 rounded hover:bg-app-surface transition-colors"
                  >
                    {copiedAnswer ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedAnswer ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/ai?q=${encodeURIComponent(prompt)}`)}
                    className="flex items-center gap-1 text-[11px] font-medium text-app-text hover:underline"
                  >
                    <span>Continue in Workspace</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-app-text leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-1">
                {aiAnswer}
              </div>
            </div>
          )}
        </div>

        {/* 3. Essential Quick Actions (Level 2 Workspaces) */}
        <div className="space-y-3">
          <span className="text-[11px] font-semibold text-app-subtle uppercase tracking-wider">
            Primary Workspaces
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Ask AI */}
            <div
              onClick={() => navigate('/ai')}
              className="group p-4 rounded-xl bg-app-surface border border-app-borderSubtle hover:border-app-border hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <SvgRepoSparkle size={18} />
                </div>
                <h3 className="text-sm font-semibold text-app-text group-hover:text-app-accent transition-colors">
                  Ask AI
                </h3>
                <p className="text-xs text-app-muted leading-relaxed">
                  Interactive tutoring, step-by-step derivations, and academic explanations.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-app-muted group-hover:text-app-text font-medium pt-1">
                <span>Open Assistant</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Action 2: Plan My Study */}
            <div
              onClick={() => setShowPlanDrawer(true)}
              className="group p-4 rounded-xl bg-app-surface border border-app-borderSubtle hover:border-app-border hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <SvgRepoCalendarSchedule size={18} />
                </div>
                <h3 className="text-sm font-semibold text-app-text group-hover:text-app-accent transition-colors">
                  Plan My Study
                </h3>
                <p className="text-xs text-app-muted leading-relaxed">
                  Design an adaptive exam schedule with constraint-balanced study blocks.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-app-muted group-hover:text-app-text font-medium pt-1">
                <span>Plan Schedule</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Action 3: Open IDE */}
            <div
              onClick={() => navigate('/ide')}
              className="group p-4 rounded-xl bg-app-surface border border-app-borderSubtle hover:border-app-border hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <SvgRepoCodeBracket size={18} />
                </div>
                <h3 className="text-sm font-semibold text-app-text group-hover:text-app-accent transition-colors">
                  Open IDE
                </h3>
                <p className="text-xs text-app-muted leading-relaxed">
                  Monaco editor with multi-language execution and real-time AI error diagnostics.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-app-muted group-hover:text-app-text font-medium pt-1">
                <span>Launch Editor</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Compact Today's Overview (Real Data Only) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-app-subtle uppercase tracking-wider">
              Today's Schedule
            </span>
            {todaysSessions.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCalendar}
                  className="flex items-center gap-1 text-xs text-app-muted hover:text-app-text font-medium transition-colors"
                  title="Download .ics schedule for Google, Apple, or Outlook Calendar"
                >
                  <Calendar size={12} className="text-app-accent" />
                  <span>Export iCal (.ics)</span>
                </button>
                <span className="text-app-subtle">•</span>
                <button
                  onClick={() => navigate('/planner')}
                  className="text-xs text-app-muted hover:text-app-text font-medium transition-colors"
                >
                  Full Calendar →
                </button>
              </div>
            )}
          </div>

          {isLoadingSessions ? (
            <div className="p-6 text-center rounded-xl bg-app-surface border border-app-borderSubtle text-xs text-app-muted flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span>Checking today's schedule...</span>
            </div>
          ) : todaysSessions.length > 0 ? (
            <div className="rounded-xl border border-app-borderSubtle bg-app-surface divide-y divide-app-borderSubtle overflow-hidden">
              {todaysSessions.slice(0, 3).map((session: any) => {
                const isDone = session.status === 'COMPLETED';
                const isInProgress = session.status === 'IN_PROGRESS';
                return (
                  <div
                    key={session.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-app-hover/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-app-hover flex items-center justify-center shrink-0">
                        <Clock size={14} className="text-app-muted" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-app-text truncate">
                          {session.topic?.name || session.title || 'Study Session'}
                        </h4>
                        <p className="text-[11px] text-app-muted truncate">
                          {session.topic?.unit?.subject?.name || session.subjectName || 'General Academic Focus'} • {session.plannedDurationMinutes || 45} mins
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : isInProgress
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            : 'bg-app-hover text-app-muted'
                        }`}
                      >
                        {isDone ? 'Completed' : isInProgress ? 'In Progress' : 'Planned'}
                      </span>

                      {!isDone && (
                        <button
                          onClick={() => setActiveFocusSession(session)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium transition-opacity"
                        >
                          <Play size={10} className="fill-current" />
                          <span>{isInProgress ? 'Resume Focus' : 'Start Focus'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Clean, Honest Onboarding Empty State
            <div className="p-6 sm:p-8 text-center rounded-xl bg-app-surface border border-dashed border-app-borderSubtle space-y-3">
              <CalendarCheck2 size={24} className="mx-auto text-app-muted opacity-40" />
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-semibold text-app-text">
                  No study sessions scheduled for today
                </h4>
                <p className="text-xs text-app-muted max-w-sm mx-auto">
                  Generate a balanced, conflict-free study schedule with the AI Plan Builder or view your enrolled course syllabus.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowPlanDrawer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-text text-app-bg hover:opacity-90 text-xs font-medium transition-opacity"
                >
                  <Sparkles size={12} />
                  <span>Plan Study Sessions</span>
                </button>
                <button
                  onClick={() => navigate('/subjects')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-hover text-app-text hover:bg-app-borderSubtle text-xs font-medium transition-colors"
                >
                  <BookOpen size={12} />
                  <span>View Syllabus</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Subtle Access to Level 3: All Tools & Features */}
        <div className="pt-4 border-t border-app-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-app-muted">
          <span>Looking for revision flashcards, 3D universe, notes, or custom dashboards?</span>
          <button
            onClick={() => navigate('/tools')}
            className="inline-flex items-center gap-1 font-semibold text-app-text hover:underline"
          >
            <span>Explore all 19 tools & workspaces</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* AI Plan Builder Drawer */}
      <AIPlanBuilderDrawer
        isOpen={showPlanDrawer}
        onClose={() => setShowPlanDrawer(false)}
        onOpenPreview={handleOpenPlanPreview}
      />

      {/* Study Plan Preview Modal */}
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

      {/* Interactive Deep Focus / Pomodoro Modal */}
      <DeepFocusModal
        isOpen={Boolean(activeFocusSession)}
        onClose={() => setActiveFocusSession(null)}
        session={activeFocusSession}
        onSessionCompleted={() => {
          loadSessions();
          setActiveFocusSession(null);
        }}
      />
    </div>
  );
}
