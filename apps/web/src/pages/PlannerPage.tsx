import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import { AIPlanBuilderDrawer } from '../components/dashboard/AIPlanBuilderDrawer';
import { StudyPlanPreviewModal } from '../components/dashboard/StudyPlanPreviewModal';
import { DeepFocusModal } from '../components/study/DeepFocusModal';
import {
  Table as TableIcon,
  Kanban,
  Calendar as CalendarIcon,
  List as ListIcon,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play,
  Filter,
  Search,
  Plus,
  Clock,
  ArrowUpDown,
  X,
  FilePlus,
  BookOpen,
  Sliders
} from 'lucide-react';

type DatabaseView = 'table' | 'board' | 'calendar' | 'list';

export function PlannerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<DatabaseView>('table');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [regenerating, setRegenerating] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // AI Plan Builder Drawer & Preview Modal State
  const [showPlanDrawer, setShowPlanDrawer] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeFocusSession, setActiveFocusSession] = useState<any | null>(null);

  // Modal 1: Create Custom Study Plan
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [planTitle, setPlanTitle] = useState('Final Semester Sprint');
  const [planDailyHours, setPlanDailyHours] = useState(4);
  const [planSessionDuration, setPlanSessionDuration] = useState(45);
  const [planBreakMinutes, setPlanBreakMinutes] = useState(10);
  const [planTargetDate, setPlanTargetDate] = useState('2026-11-20');

  // Modal 2: Add Manual Study Block
  const [showNewBlockModal, setShowNewBlockModal] = useState(false);
  const [blockTopicId, setBlockTopicId] = useState('');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().slice(0, 10));
  const [blockTime, setBlockTime] = useState('14:00');
  const [blockDuration, setBlockDuration] = useState(45);
  const [blockType, setBlockType] = useState('LEARN');
  const [blockNotes, setBlockNotes] = useState('');

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
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowPlanDrawer((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchParams.get('builder') === 'true') {
      setShowPlanDrawer(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadSessions();
    loadSubjects();
  }, [currentDate]);

  async function loadSessions() {
    try {
      const res = await api.getSessions();
      if (res?.data) setSessions(res.data);
    } catch (err) {
      console.error('Failed to load study sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    try {
      const res = await api.getSubjects();
      if (res?.data) {
        setSubjectsList(res.data);
        // default select first topic if available
        const firstTopic = res.data?.[0]?.units?.[0]?.topics?.[0];
        if (firstTopic) setBlockTopicId(firstTopic.id);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  }

  const handleCreateNewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegenerating(true);
    setShowNewPlanModal(false);
    setNotice(null);
    try {
      await api.confirmPlan({
        dailyHoursLimit: planDailyHours,
        sessionDurationMinutes: planSessionDuration,
        breakMinutes: planBreakMinutes,
        targetEndDate: planTargetDate
      });
      setNotice(`New plan "${planTitle}" successfully created and committed.`);
      loadSessions();
    } catch (err: any) {
      setNotice(err.message || 'Plan generation failed.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCreateCustomBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTopicId) return;

    try {
      const startDateTime = new Date(`${blockDate}T${blockTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + blockDuration * 60 * 1000);

      await api.request('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          topicId: blockTopicId,
          scheduledStart: startDateTime.toISOString(),
          scheduledEnd: endDateTime.toISOString(),
          durationMinutes: blockDuration,
          sessionType: blockType,
          notes: blockNotes
        })
      });

      setShowNewBlockModal(false);
      setNotice('Study block successfully added to your database.');
      loadSessions();
    } catch (err: any) {
      setNotice(err.message || 'Failed to create block.');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setNotice(null);
    try {
      await api.confirmPlan({
        dailyHoursLimit: 4,
        sessionDurationMinutes: 45,
        breakMinutes: 10
      });
      setNotice('Adaptive study schedule successfully recalculated and committed.');
      loadSessions();
    } catch (err: any) {
      setNotice(err.message || 'Recalculation failed.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRecoverMissed = async () => {
    setRecovering(true);
    setNotice(null);
    try {
      const res = await api.recoverMissedSessions();
      setNotice(res.data?.message || 'Recovered missed sessions.');
      loadSessions();
    } catch (err: any) {
      setNotice(err.message || 'Recovery failed.');
    } finally {
      setRecovering(false);
    }
  };

  // Distinct subjects for filter
  const subjects = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      const name = s.topic?.unit?.subject?.name;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [sessions]);

  // Flattened topics for block creator
  const flattenedTopics = useMemo(() => {
    const list: any[] = [];
    subjectsList.forEach((s) => {
      s.units?.forEach((u: any) => {
        u.topics?.forEach((t: any) => {
          list.push({ id: t.id, title: `${s.name}: ${t.title}` });
        });
      });
    });
    return list;
  }, [subjectsList]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const title = s.topic?.title || 'Study Session';
      const subj = s.topic?.unit?.subject?.name || '';
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subj.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubj =
        selectedSubjectFilter === 'ALL' || subj === selectedSubjectFilter;
      return matchesSearch && matchesSubj;
    });
  }, [sessions, searchQuery, selectedSubjectFilter]);

  // Helper for Notion status pill
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="notion-tag notion-tag-green">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="notion-tag notion-tag-blue">In progress</span>;
      default:
        return <span className="notion-tag notion-tag-gray">Not started</span>;
    }
  };

  // Helper for Subject tag
  const getSubjectBadge = (name?: string) => {
    if (!name) return <span className="notion-tag notion-tag-gray">General</span>;
    if (name.includes('Data') || name.includes('Algo')) {
      return <span className="notion-tag notion-tag-blue">{name}</span>;
    }
    if (name.includes('Operating')) {
      return <span className="notion-tag notion-tag-purple">{name}</span>;
    }
    if (name.includes('Database')) {
      return <span className="notion-tag notion-tag-yellow">{name}</span>;
    }
    return <span className="notion-tag notion-tag-orange">{name}</span>;
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'Study Plan' }
        ]}
        subtitle="Adaptive database schedule"
      />

      <div className="p-6 max-w-6xl w-full mx-auto space-y-4">
        {/* Page Title & Notion Icon */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl">
              <CalendarIcon size={24} className="text-app-text" />
              <h1 className="text-2xl font-bold tracking-tight text-app-text">Study Plan</h1>
            </div>

            {/* Top Primary Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
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
                    alert(`Export failed: ${err.message || 'Could not export calendar'}`);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs font-medium text-app-text transition-colors"
                title="Download RFC 5545 .ics calendar to sync with Google Calendar, Apple Calendar, or Outlook"
              >
                <CalendarIcon size={13} className="text-app-accent" />
                <span>Export .ics</span>
              </button>

              <button
                onClick={() => setShowPlanDrawer(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium transition-all shadow-xs"
                title="Create a new custom adaptive study plan (Ctrl+Shift+L)"
              >
                <Sparkles size={13} className="text-app-accent" />
                <span>Build with AI</span>
                <span className="hidden sm:inline-block ml-1 text-[10px] opacity-75 font-mono px-1 py-0.2 rounded border border-current">
                  Ctrl+Shift+L
                </span>
              </button>

              <button
                onClick={() => setShowNewBlockModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs font-medium text-app-text transition-colors"
                title="Manually insert a study block"
              >
                <Plus size={13} />
                <span>Add Block</span>
              </button>

              <button
                onClick={() => setShowNewPlanModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs text-app-muted hover:text-app-text transition-colors"
                title="Manual plan generator modal"
              >
                <Sliders size={12} />
                <span>Manual</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-app-muted">
            Deterministic daily time blocks that enforce your syllabus constraints, exam dates, and mastery metrics.
          </p>
        </div>

        {notice && (
          <div className="notion-callout text-xs text-app-text">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span>{notice}</span>
              <button onClick={() => setNotice(null)} className="underline text-[11px] text-app-muted">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Database Controls & View Tabs */}
        <div className="border-b border-app-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          {/* Notion View Switcher Tabs */}
          <div className="flex items-center gap-1 -mb-[1px] overflow-x-auto">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 text-xs font-medium transition-colors ${
                activeView === 'table'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <TableIcon size={14} /> Table
            </button>
            <button
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 text-xs font-medium transition-colors ${
                activeView === 'board'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <Kanban size={14} /> Board
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 text-xs font-medium transition-colors ${
                activeView === 'calendar'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-b-2 text-xs font-medium transition-colors ${
                activeView === 'list'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <ListIcon size={14} /> List
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 pb-2 sm:pb-0">
            <button
              onClick={handleRecoverMissed}
              disabled={recovering}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-app-borderSubtle hover:bg-app-hover text-xs text-app-text transition-colors disabled:opacity-50"
              title="Reschedule missed sessions into remaining capacity"
            >
              <RotateCcw size={12} /> {recovering ? 'Recovering...' : 'Recover Missed'}
            </button>

            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-app-borderSubtle hover:bg-app-hover text-xs text-app-text transition-colors disabled:opacity-50"
              title="Recalculate schedule"
            >
              <Sparkles size={12} /> {regenerating ? 'Calculating...' : 'Rebalance'}
            </button>
          </div>
        </div>

        {/* Database Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-1 text-xs text-app-muted">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-app-borderSubtle bg-app-surface w-full">
              <Search size={13} className="text-app-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by topic or subject..."
                className="bg-transparent border-none text-app-text placeholder-app-subtle text-xs focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded border border-app-borderSubtle bg-app-surface">
              <Filter size={12} className="text-app-muted" />
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="bg-transparent text-xs text-app-text border-none focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-app-subtle tabular-nums">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'block' : 'blocks'}
            </span>
          </div>
        </div>

        {/* Loading & Empty States */}
        {loading ? (
          <div className="py-16 text-center text-xs text-app-muted flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
            <span>Loading database views...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-app-borderSubtle rounded-lg space-y-3">
            <CalendarIcon size={28} className="mx-auto text-app-subtle" />
            <h3 className="text-xs font-semibold text-app-text">No study sessions found</h3>
            <p className="text-xs text-app-muted max-w-sm mx-auto">
              Create a custom plan or add your first study block to start scheduling your syllabus.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowNewBlockModal(true)}
                className="px-3 py-1.5 rounded border border-app-borderSubtle hover:bg-app-hover text-xs font-medium"
              >
                + Add Block
              </button>
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium"
              >
                Create Adaptive Plan
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* VIEW 1: NOTION TABLE VIEW */}
            {activeView === 'table' && (
              <div className="border border-app-borderSubtle rounded overflow-hidden bg-app-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-app-borderSubtle bg-app-sidebar/60 text-app-muted text-[11px] font-medium">
                        <th className="py-2 px-3 border-r border-app-borderSubtle/60 w-1/3">Topic Block</th>
                        <th className="py-2 px-3 border-r border-app-borderSubtle/60">Subject</th>
                        <th className="py-2 px-3 border-r border-app-borderSubtle/60">Status</th>
                        <th className="py-2 px-3 border-r border-app-borderSubtle/60">Type</th>
                        <th className="py-2 px-3 border-r border-app-borderSubtle/60">Scheduled Time</th>
                        <th className="py-2 px-3 border-r border-app-borderSubtle/60">Duration</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-borderSubtle/60">
                      {filteredSessions.map((session) => {
                        const isCompleted = session.status === 'COMPLETED';
                        const startTime = new Date(session.scheduledStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        const endTime = new Date(session.scheduledEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        const dateStr = new Date(session.scheduledStart).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        });

                        return (
                          <tr
                            key={session.id}
                            className="hover:bg-app-hover/50 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/session/${session.id}`)}
                          >
                            <td className="py-2.5 px-3 border-r border-app-borderSubtle/60 font-medium text-app-text">
                              <div className="flex items-center gap-2">
                                <Clock size={12} className="text-app-muted shrink-0" />
                                <span className={`truncate ${isCompleted ? 'line-through text-app-muted' : ''}`}>
                                  {session.topic?.title || 'Study Session'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 border-r border-app-borderSubtle/60">
                              {getSubjectBadge(session.topic?.unit?.subject?.name)}
                            </td>
                            <td className="py-2.5 px-3 border-r border-app-borderSubtle/60">
                              {getStatusBadge(session.status)}
                            </td>
                            <td className="py-2.5 px-3 border-r border-app-borderSubtle/60 text-app-muted">
                              <span className="notion-tag notion-tag-gray">{session.sessionType}</span>
                            </td>
                            <td className="py-2.5 px-3 border-r border-app-borderSubtle/60 text-app-muted tabular-nums">
                              {dateStr} • {startTime} - {endTime}
                            </td>
                            <td className="py-2.5 px-3 border-r border-app-borderSubtle/60 text-app-muted tabular-nums">
                              {session.durationMinutes} min
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isCompleted ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] inline-flex items-center gap-1">
                                  <CheckCircle2 size={13} /> Done
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveFocusSession(session);
                                  }}
                                  className="px-2 py-0.5 rounded border border-app-borderSubtle hover:bg-app-hover text-app-text font-medium text-[11px] inline-flex items-center gap-1"
                                >
                                  <Play size={10} className="fill-current" />
                                  <span>{session.status === 'IN_PROGRESS' ? 'Resume' : 'Focus'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 2: NOTION BOARD (KANBAN) VIEW */}
            {activeView === 'board' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* To Do Column */}
                <div className="bg-app-sidebar/50 border border-app-borderSubtle rounded p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-medium text-app-muted pb-1 border-b border-app-borderSubtle/60">
                    <span className="flex items-center gap-1.5">
                      <span className="notion-tag notion-tag-gray">To Do / Planned</span>
                    </span>
                    <span className="tabular-nums">
                      {filteredSessions.filter((s) => s.status === 'PLANNED').length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {filteredSessions
                      .filter((s) => s.status === 'PLANNED')
                      .map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setActiveFocusSession(session)}
                          className="p-3 bg-app-surface border border-app-borderSubtle rounded shadow-sm hover:border-app-borderStrong cursor-pointer space-y-2 transition-all"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-semibold text-app-text line-clamp-2">
                              {session.topic?.title || 'Study Session'}
                            </h4>
                          </div>
                          <div>{getSubjectBadge(session.topic?.unit?.subject?.name)}</div>
                          <div className="flex items-center justify-between text-[11px] text-app-muted pt-1 border-t border-app-borderSubtle/60">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {session.durationMinutes}m
                            </span>
                            <span className="hover:text-app-text font-medium flex items-center gap-1">
                              <Play size={10} className="fill-current" /> Start
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* In Progress Column */}
                <div className="bg-app-sidebar/50 border border-app-borderSubtle rounded p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-medium text-app-muted pb-1 border-b border-app-borderSubtle/60">
                    <span className="flex items-center gap-1.5">
                      <span className="notion-tag notion-tag-blue">In Progress</span>
                    </span>
                    <span className="tabular-nums">
                      {filteredSessions.filter((s) => s.status === 'IN_PROGRESS').length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {filteredSessions
                      .filter((s) => s.status === 'IN_PROGRESS')
                      .map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setActiveFocusSession(session)}
                          className="p-3 bg-app-surface border border-blue-400 dark:border-blue-600 rounded shadow-sm cursor-pointer space-y-2"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-semibold text-app-text line-clamp-2">
                              {session.topic?.title || 'Study Session'}
                            </h4>
                          </div>
                          <div>{getSubjectBadge(session.topic?.unit?.subject?.name)}</div>
                          <div className="flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400 pt-1 border-t border-app-borderSubtle/60 font-medium">
                            <span>Active Study Session</span>
                            <span className="flex items-center gap-1">
                              <Play size={10} className="fill-current" /> Resume
                            </span>
                          </div>
                        </div>
                      ))}
                    {filteredSessions.filter((s) => s.status === 'IN_PROGRESS').length === 0 && (
                      <div className="py-6 text-center text-xs text-app-subtle">
                        No active study block right now.
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed Column */}
                <div className="bg-app-sidebar/50 border border-app-borderSubtle rounded p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-medium text-app-muted pb-1 border-b border-app-borderSubtle/60">
                    <span className="flex items-center gap-1.5">
                      <span className="notion-tag notion-tag-green">Completed</span>
                    </span>
                    <span className="tabular-nums">
                      {filteredSessions.filter((s) => s.status === 'COMPLETED').length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {filteredSessions
                      .filter((s) => s.status === 'COMPLETED')
                      .map((session) => (
                        <div
                          key={session.id}
                          className="p-3 bg-app-surface/60 border border-app-borderSubtle rounded space-y-2 opacity-75"
                        >
                          <h4 className="text-xs font-semibold text-app-muted line-through">
                            {session.topic?.title || 'Study Session'}
                          </h4>
                          <div>{getSubjectBadge(session.topic?.unit?.subject?.name)}</div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 pt-1 border-t border-app-borderSubtle/60 flex items-center gap-1 font-medium">
                            <CheckCircle2 size={12} /> {session.actualDurationMinutes || session.durationMinutes}m completed
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: NOTION CALENDAR VIEW */}
            {activeView === 'calendar' && (
              <div className="border border-app-borderSubtle rounded bg-app-surface overflow-hidden">
                <div className="p-3 border-b border-app-borderSubtle flex items-center justify-between bg-app-sidebar/40">
                  <span className="text-xs font-semibold text-app-text">
                    {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
                      className="p-1 rounded hover:bg-app-hover"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-2 py-0.5 rounded border border-app-borderSubtle hover:bg-app-hover text-[11px]"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
                      className="p-1 rounded hover:bg-app-hover"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 border-b border-app-borderSubtle text-center text-[11px] font-medium text-app-muted bg-app-sidebar/20">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="py-1.5 border-r border-app-borderSubtle/60 last:border-r-0">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 min-h-[400px]">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const dayDate = new Date(currentDate);
                    dayDate.setDate(currentDate.getDate() - currentDate.getDay() + i);
                    const isToday = dayDate.toDateString() === new Date().toDateString();

                    const daySessions = filteredSessions.filter((s) => {
                      return new Date(s.scheduledStart).toDateString() === dayDate.toDateString();
                    });

                    return (
                      <div
                        key={i}
                        className={`p-2 border-r border-b border-app-borderSubtle/60 last:border-r-0 min-h-[120px] ${
                          isToday ? 'bg-app-accentSubtle/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[11px]">
                          <span className={`font-mono ${isToday ? 'font-bold text-app-accent' : 'text-app-muted'}`}>
                            {dayDate.getDate()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {daySessions.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => setActiveFocusSession(s)}
                              className="p-1 rounded bg-app-surface border border-app-borderSubtle hover:bg-app-hover text-[10px] cursor-pointer truncate shadow-xs"
                              title={s.topic?.title}
                            >
                              <span className="font-semibold block truncate text-app-text">
                                {s.topic?.title}
                              </span>
                              <span className="text-app-muted block truncate">
                                {new Date(s.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 4: NOTION LIST VIEW */}
            {activeView === 'list' && (
              <div className="space-y-1 bg-app-surface border border-app-borderSubtle rounded p-2">
                {filteredSessions.map((session) => {
                  const isCompleted = session.status === 'COMPLETED';
                  return (
                    <div
                      key={session.id}
                      onClick={() => setActiveFocusSession(session)}
                      className="flex items-center justify-between px-3 py-2 rounded hover:bg-app-hover cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Clock size={13} className="text-app-muted shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium text-app-text ${
                            isCompleted ? 'line-through text-app-muted' : ''
                          }`}
                        >
                          {session.topic?.title || 'Study Session'}
                        </span>
                        {getSubjectBadge(session.topic?.unit?.subject?.name)}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-app-muted">
                        <span className="tabular-nums">
                          {new Date(session.scheduledStart).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="tabular-nums">{session.durationMinutes}m</span>
                        <span className="text-app-text font-medium group-hover:underline">Open →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Modal 1: Create Custom Study Plan */}
        {showNewPlanModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                <h3 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
                  <CalendarIcon size={16} className="text-app-text" /> Create Adaptive Study Plan
                </h3>
                <button
                  onClick={() => setShowNewPlanModal(false)}
                  className="p-1 rounded text-app-muted hover:text-app-text"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateNewPlan} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Plan Title</label>
                  <input
                    type="text"
                    required
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="e.g. Pre-Midterm Comprehensive Plan"
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Daily Limit (Hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      step={0.5}
                      value={planDailyHours}
                      onChange={(e) => setPlanDailyHours(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Target End Date</label>
                    <input
                      type="date"
                      required
                      value={planTargetDate}
                      onChange={(e) => setPlanTargetDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Block Duration</label>
                    <select
                      value={planSessionDuration}
                      onChange={(e) => setPlanSessionDuration(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none cursor-pointer"
                    >
                      <option value={25}>25 min (Pomodoro)</option>
                      <option value={45}>45 min (Standard Focus)</option>
                      <option value={60}>60 min (Deep Work)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Rest Interval</label>
                    <select
                      value={planBreakMinutes}
                      onChange={(e) => setPlanBreakMinutes(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none cursor-pointer"
                    >
                      <option value={5}>5 min</option>
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                    </select>
                  </div>
                </div>

                <div className="notion-callout text-[11px] text-app-muted">
                  <Sparkles size={13} className="text-amber-500 shrink-0" />
                  <span>Automatically calculates conflict-free blocks, SM-2 revisions, and a 15% pre-exam buffer.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-borderSubtle">
                  <button
                    type="button"
                    onClick={() => setShowNewPlanModal(false)}
                    className="px-3 py-1.5 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text hover:bg-app-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Generate & Commit Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Add Manual Study Block */}
        {showNewBlockModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                <h3 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
                  <FilePlus size={14} className="text-app-text shrink-0" />
                  <span>Add Custom Study Block</span>
                </h3>
                <button
                  onClick={() => setShowNewBlockModal(false)}
                  className="p-1 rounded text-app-muted hover:text-app-text"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateCustomBlock} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Select Topic</label>
                  <select
                    required
                    value={blockTopicId}
                    onChange={(e) => setBlockTopicId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none cursor-pointer"
                  >
                    {flattenedTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={blockTime}
                      onChange={(e) => setBlockTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={15}
                      max={180}
                      step={15}
                      value={blockDuration}
                      onChange={(e) => setBlockDuration(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Session Type</label>
                    <select
                      value={blockType}
                      onChange={(e) => setBlockType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none cursor-pointer"
                    >
                      <option value="LEARN">LEARN (First Pass)</option>
                      <option value="REVISE">REVISE (Spaced Rep)</option>
                      <option value="PRACTICE">PRACTICE (Problems)</option>
                      <option value="EXAM_PREP">EXAM_PREP (Milestone)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Preparation Goals / Notes</label>
                  <input
                    type="text"
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    placeholder="e.g. Solve 3 practice recurrence questions"
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-borderSubtle">
                  <button
                    type="button"
                    onClick={() => setShowNewBlockModal(false)}
                    className="px-3 py-1.5 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text hover:bg-app-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Add Study Block
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
          onOpenPreview={(draft) => {
            setPreviewDraft(draft);
            setShowPreviewModal(true);
          }}
          onPlanConfirmed={() => {
            setNotice('New adaptive study plan committed! Schedule updated.');
            loadSessions();
          }}
        />

        {/* Structured Multi-View Study Plan Preview & Verification Modal */}
        <StudyPlanPreviewModal
          isOpen={showPreviewModal}
          draft={previewDraft}
          onClose={() => setShowPreviewModal(false)}
          onConfirmSuccess={() => {
            setNotice('New adaptive study plan committed! Schedule updated.');
            loadSessions();
          }}
          onReopenDrawer={() => setShowPlanDrawer(true)}
        />

        {/* Interactive Deep Focus Modal */}
        <DeepFocusModal
          isOpen={Boolean(activeFocusSession)}
          onClose={() => setActiveFocusSession(null)}
          session={activeFocusSession}
          onSessionCompleted={() => {
            setNotice('Session completed! +50 XP awarded to your academic profile.');
            loadSessions();
            setActiveFocusSession(null);
          }}
        />
      </div>
    </div>
  );
}
