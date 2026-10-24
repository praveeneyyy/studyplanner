import React, { useState } from 'react';
import { api } from '../../lib/api';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  X,
  Sliders,
  Sparkles,
  List,
  CalendarDays,
  Table as TableIcon,
  PieChart,
  Search,
  ArrowRight,
  Loader2,
  BrainCircuit,
  Award,
  ChevronDown,
  ChevronRight,
  Edit2
} from 'lucide-react';

export interface StudyPlanPreviewModalProps {
  isOpen: boolean;
  draft: any;
  onClose: () => void;
  onConfirmSuccess: () => void;
  onReopenDrawer: () => void;
}

type PreviewTab = 'agenda' | 'calendar' | 'table' | 'subjects';

export function StudyPlanPreviewModal({
  isOpen,
  draft,
  onClose,
  onConfirmSuccess,
  onReopenDrawer
}: StudyPlanPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('agenda');
  const [currentDraft, setCurrentDraft] = useState<any>(draft);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isTuning, setIsTuning] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState(45);

  React.useEffect(() => {
    setCurrentDraft(draft);
  }, [draft]);

  if (!isOpen || !currentDraft) return null;

  const handleTune = async (action: 'LIGHTER' | 'INTENSIFY_WEAK' | 'EXTEND_DEADLINE') => {
    setIsTuning(true);
    try {
      const res = await api.adjustAiPlanDraft({
        draft: currentDraft,
        action
      });
      if (res?.data?.draft) {
        setCurrentDraft(res.data.draft);
      }
    } catch (err) {
      console.error('Failed to tune draft schedule:', err);
    } finally {
      setIsTuning(false);
    }
  };

  const handleCommitPlan = async () => {
    setIsCommitting(true);
    try {
      await api.confirmAiPlanDraft(currentDraft);
      onConfirmSuccess();
      onClose();
    } catch (err: any) {
      alert(`Failed to save plan: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleExportICS = async () => {
    try {
      const blob = await api.exportCalendarIcs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-schedule-${new Date().toISOString().slice(0, 10)}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Calendar export failed: ${err.message || 'Error exporting .ics'}`);
    }
  };

  const toggleDayCollapse = (dateStr: string) => {
    setCollapsedDays((prev) => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  // Filtered sessions for table view
  const filteredSessions = (currentDraft.sessions || []).filter((s: any) => {
    if (subjectFilter !== 'ALL' && s.subjectId !== subjectFilter) return false;
    if (typeFilter !== 'ALL' && s.sessionType !== typeFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTopic = (s.topicTitle || '').toLowerCase().includes(q);
      const matchSubj = (s.subjectName || '').toLowerCase().includes(q);
      if (!matchTopic && !matchSubj) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl bg-app-surface border border-app-borderSubtle rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-app-text animate-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-app-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-app-sidebar/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-app-accent" />
              <h2 className="text-base font-bold text-app-text tracking-tight">
                {currentDraft.title}
              </h2>
              <span
                className={`notion-tag text-[10px] ${
                  currentDraft.isFeasible ? 'notion-tag-green' : 'notion-tag-yellow'
                }`}
              >
                {currentDraft.isFeasible ? 'Feasible & Conflict-Free' : 'Workload Warning'}
              </span>
            </div>
            <p className="text-xs text-app-muted">
              Deterministic schedule • {currentDraft.durationDays} days • {currentDraft.weekdayHours}h weekdays / {currentDraft.weekendHours}h weekends
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Adjustment Pills */}
            <div className="flex items-center gap-1.5 border border-app-borderSubtle bg-app-surface p-1 rounded text-xs">
              <button
                onClick={() => handleTune('LIGHTER')}
                disabled={isTuning}
                className="px-2 py-1 rounded hover:bg-app-hover text-[11px] text-app-text transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Reduce daily hours by 20%"
              >
                <Sliders size={11} />
                <span>Make Lighter</span>
              </button>
              <button
                onClick={() => handleTune('INTENSIFY_WEAK')}
                disabled={isTuning}
                className="px-2 py-1 rounded hover:bg-app-hover text-[11px] text-app-text transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Focus more on weak topics"
              >
                <BrainCircuit size={11} />
                <span>Focus Weak</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-app-hover text-app-muted hover:text-app-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Feasibility Warning Banner if any */}
        {currentDraft.feasibilityWarning && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="flex-1">{currentDraft.feasibilityWarning}</span>
            <button
              onClick={() => handleTune('EXTEND_DEADLINE')}
              className="text-[11px] underline font-medium hover:opacity-80"
            >
              Extend Deadline +7d
            </button>
          </div>
        )}

        {/* Summary Metrics Bar */}
        <div className="px-6 py-3 border-b border-app-borderSubtle bg-app-surface grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs select-none">
          <div className="p-2 rounded border border-app-borderSubtle bg-app-sidebar/40">
            <div className="text-[10px] uppercase text-app-subtle tracking-wider font-semibold">Total Planned</div>
            <div className="text-base font-bold font-mono text-app-text mt-0.5">
              {currentDraft.totalPlannedHours} hrs
            </div>
            <div className="text-[10px] text-app-muted">{currentDraft.sessionCount} sessions</div>
          </div>

          <div className="p-2 rounded border border-app-borderSubtle bg-app-sidebar/40">
            <div className="text-[10px] uppercase text-app-subtle tracking-wider font-semibold">Syllabus Coverage</div>
            <div className="text-base font-bold font-mono text-app-text mt-0.5">
              {currentDraft.syllabusCoveragePercent}%
            </div>
            <div className="text-[10px] text-app-muted">All Core Units</div>
          </div>

          <div className="p-2 rounded border border-app-borderSubtle bg-app-sidebar/40">
            <div className="text-[10px] uppercase text-app-subtle tracking-wider font-semibold">Daily Load</div>
            <div className="text-base font-bold font-mono text-app-text mt-0.5">
              {currentDraft.weekdayHours}h / {currentDraft.weekendHours}h
            </div>
            <div className="text-[10px] text-app-muted">Weekday / Weekend</div>
          </div>

          <div className="p-2 rounded border border-app-borderSubtle bg-app-sidebar/40">
            <div className="text-[10px] uppercase text-app-subtle tracking-wider font-semibold">Pre-Exam Buffer</div>
            <div className="text-base font-bold font-mono text-app-text mt-0.5">
              {currentDraft.mockTestDays} Days
            </div>
            <div className="text-[10px] text-app-muted">Mock Tests & Review</div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2 rounded border border-app-borderSubtle bg-app-sidebar/40">
            <div className="text-[10px] uppercase text-app-subtle tracking-wider font-semibold">Subjects Included</div>
            <div className="text-base font-bold font-mono text-app-text mt-0.5">
              {currentDraft.subjectBreakdown?.length || 0}
            </div>
            <div className="text-[10px] text-app-muted">Prioritized Weighting</div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 border-b border-app-borderSubtle flex items-center justify-between gap-2 bg-app-surface select-none pt-2">
          <div className="flex items-center gap-1 -mb-[1px]">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-colors ${
                activeTab === 'agenda'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <List size={13} />
              <span>Daily Agenda</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <CalendarDays size={13} />
              <span>Weekly Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-colors ${
                activeTab === 'table'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <TableIcon size={13} />
              <span>Table View ({currentDraft.sessions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-medium transition-colors ${
                activeTab === 'subjects'
                  ? 'border-app-text text-app-text font-semibold'
                  : 'border-transparent text-app-muted hover:text-app-text'
              }`}
            >
              <PieChart size={13} />
              <span>Subject Breakdown</span>
            </button>
          </div>
        </div>

        {/* View Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: DAILY AGENDA VIEW */}
          {activeTab === 'agenda' && (
            <div className="space-y-4">
              {currentDraft.dailyAgenda?.map((day: any, dIdx: number) => {
                const isCollapsed = collapsedDays[day.dayDateString];
                const dayDate = new Date(day.dayDateString);
                const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                return (
                  <div
                    key={dIdx}
                    className="border border-app-borderSubtle rounded-md overflow-hidden bg-app-surface transition-all"
                  >
                    <div
                      onClick={() => toggleDayCollapse(day.dayDateString)}
                      className="px-4 py-2.5 bg-app-sidebar/60 border-b border-app-borderSubtle flex items-center justify-between cursor-pointer hover:bg-app-hover select-none"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        <span className="font-semibold text-xs text-app-text">
                          Day {day.dayIndex + 1}: {day.dayOfWeekName}, {day.dayDateString}
                        </span>
                        {isWeekend && (
                          <span className="notion-tag notion-tag-purple text-[9px]">Weekend Sprint</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-app-muted font-mono">
                        <span>{day.sessions.length} sessions</span>
                        <span>•</span>
                        <span>{Math.round((day.totalMinutes / 60) * 10) / 10} hrs</span>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-3 space-y-2">
                        {day.sessions.map((session: any, sIdx: number) => {
                          const startT = new Date(session.scheduledStart).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          const endT = new Date(session.scheduledEnd).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          const isRev = session.sessionType === 'REVISE';
                          const isMock = session.sessionType === 'MOCK_TEST';

                          return (
                            <React.Fragment key={session.id || sIdx}>
                              <div className="p-2.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-sidebar/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-start sm:items-center gap-2.5">
                                  <div className="font-mono text-app-subtle text-[11px] whitespace-nowrap">
                                    {startT} - {endT}
                                  </div>

                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-app-text">
                                        {session.topicTitle}
                                      </span>
                                      <span
                                        className={`notion-tag text-[9px] ${
                                          isMock
                                            ? 'notion-tag-yellow'
                                            : isRev
                                            ? 'notion-tag-purple'
                                            : 'notion-tag-blue'
                                        }`}
                                      >
                                        {session.sessionType}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-app-muted flex items-center gap-2">
                                      <span>{session.subjectName}</span>
                                      {session.unitTitle && (
                                        <>
                                          <span>•</span>
                                          <span className="text-app-subtle">{session.unitTitle}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[11px] text-app-muted">
                                  <span className="flex items-center gap-1">
                                    <Clock size={11} /> {session.durationMinutes}m
                                  </span>
                                  <span className="notion-tag notion-tag-gray text-[9px]">
                                    P{Math.round(session.priorityScore || 3)}
                                  </span>
                                </div>
                              </div>

                              {/* 15m rest break between sessions */}
                              {sIdx < day.sessions.length - 1 && (
                                <div className="px-4 py-1 text-[10px] text-app-subtle font-mono flex items-center gap-1.5 select-none">
                                  <div className="w-1.5 h-1.5 rounded-full bg-app-subtle/50" />
                                  <span>15m Rest Break / Brain Reset</span>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: WEEKLY CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5">
                {currentDraft.dailyAgenda?.map((day: any, dIdx: number) => {
                  const dayDate = new Date(day.dayDateString);
                  const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                  return (
                    <div
                      key={dIdx}
                      className={`p-2.5 rounded border flex flex-col justify-between min-h-[160px] text-xs transition-colors ${
                        isWeekend
                          ? 'bg-app-sidebar/50 border-app-borderStrong'
                          : 'bg-app-surface border-app-borderSubtle'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-app-borderSubtle">
                          <span className="font-semibold text-app-text text-[11px]">
                            {day.dayOfWeekName}
                          </span>
                          <span className="text-[10px] font-mono text-app-subtle">
                            {day.dayDateString.slice(5)}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          {day.sessions.slice(0, 3).map((sess: any, i: number) => (
                            <div
                              key={i}
                              className="p-1 rounded bg-app-sidebar border border-app-borderSubtle text-[10px] truncate"
                              title={sess.topicTitle}
                            >
                              <span className="font-medium text-app-text mr-1">
                                {sess.sessionType === 'MOCK_TEST' ? 'MOCK' : sess.sessionType === 'REVISE' ? 'REV' : 'LRN'}:
                              </span>
                              <span className="text-app-muted truncate">{sess.topicTitle}</span>
                            </div>
                          ))}
                          {day.sessions.length > 3 && (
                            <div className="text-[9px] text-app-subtle text-center font-mono">
                              +{day.sessions.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-app-borderSubtle flex items-center justify-between font-mono text-[10px] text-app-muted">
                        <span>{day.sessions.length} blks</span>
                        <span className="font-semibold text-app-text">
                          {Math.round((day.totalMinutes / 60) * 10) / 10}h
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TABLE VIEW */}
          {activeTab === 'table' && (
            <div className="space-y-3">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-app-subtle" />
                    <input
                      type="text"
                      placeholder="Filter topics or subjects..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-app-text placeholder:text-app-subtle focus:outline-hidden focus:border-app-accent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="text-xs p-1.5 rounded border border-app-borderSubtle bg-app-surface text-app-text"
                  >
                    <option value="ALL">All Subjects</option>
                    {currentDraft.subjectBreakdown?.map((s: any) => (
                      <option key={s.subjectId} value={s.subjectId}>
                        {s.subjectName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-xs p-1.5 rounded border border-app-borderSubtle bg-app-surface text-app-text"
                  >
                    <option value="ALL">All Session Types</option>
                    <option value="LEARN">Learn Sessions</option>
                    <option value="REVISE">Revision Sessions</option>
                    <option value="MOCK_TEST">Mock Tests</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="border border-app-borderSubtle rounded-md overflow-x-auto bg-app-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-app-sidebar/80 border-b border-app-borderSubtle text-app-muted select-none text-[11px]">
                      <th className="py-2 px-3 font-semibold">Date & Time</th>
                      <th className="py-2 px-3 font-semibold">Subject</th>
                      <th className="py-2 px-3 font-semibold">Topic Title</th>
                      <th className="py-2 px-3 font-semibold">Type</th>
                      <th className="py-2 px-3 font-semibold">Duration</th>
                      <th className="py-2 px-3 font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-borderSubtle">
                    {filteredSessions.map((session: any, idx: number) => {
                      const startT = new Date(session.scheduledStart).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const endT = new Date(session.scheduledEnd).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={session.id || idx} className="hover:bg-app-hover/50 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-app-subtle">
                            {session.dayDateString} ({startT})
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-medium text-app-text">
                            {session.subjectName}
                          </td>
                          <td className="py-2 px-3 text-app-text max-w-xs truncate">
                            {session.topicTitle}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span
                              className={`notion-tag text-[9px] ${
                                session.sessionType === 'MOCK_TEST'
                                  ? 'notion-tag-yellow'
                                  : session.sessionType === 'REVISE'
                                  ? 'notion-tag-purple'
                                  : 'notion-tag-blue'
                              }`}
                            >
                              {session.sessionType}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-app-muted">
                            {session.durationMinutes}m
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-app-subtle">
                            P{Math.round(session.priorityScore || 3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SUBJECT BREAKDOWN VIEW */}
          {activeTab === 'subjects' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentDraft.subjectBreakdown?.map((subject: any) => (
                <div
                  key={subject.subjectId}
                  className="p-4 rounded border border-app-borderSubtle bg-app-surface space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-app-text">{subject.subjectName}</h4>
                      <p className="text-[11px] text-app-muted">
                        {subject.uniqueTopicCount} topics scheduled
                      </p>
                    </div>
                    <span className="notion-tag notion-tag-blue text-xs font-mono">
                      {subject.percentage}% of schedule
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-app-muted">
                      <span>{subject.plannedHours} planned hours</span>
                      <span>{subject.sessionCount} sessions</span>
                    </div>
                    <div className="w-full bg-app-borderSubtle h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-app-accent h-full"
                        style={{ width: `${Math.min(100, subject.percentage * 1.5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 py-4 border-t border-app-borderSubtle flex flex-col sm:flex-row items-center justify-between gap-3 bg-app-sidebar/60 select-none">
          <button
            onClick={() => {
              onClose();
              onReopenDrawer();
            }}
            className="text-xs text-app-muted hover:text-app-text flex items-center gap-1.5 underline"
          >
            <Sparkles size={13} />
            <span>Refine constraints with AI Architect</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExportICS}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded border border-app-borderSubtle hover:bg-app-hover text-xs text-app-text font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Download iCal (.ics) file to sync with Google, Apple, or Outlook Calendar"
            >
              <Calendar size={13} className="text-app-accent" />
              <span>Export .ics</span>
            </button>

            <button
              onClick={onClose}
              disabled={isCommitting}
              className="flex-1 sm:flex-initial px-4 py-2 rounded border border-app-borderSubtle hover:bg-app-hover text-xs text-app-text transition-colors"
            >
              Discard Draft
            </button>

            <button
              onClick={handleCommitPlan}
              disabled={isCommitting}
              className="flex-1 sm:flex-initial px-5 py-2 rounded bg-app-text text-app-bg hover:opacity-90 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              {isCommitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Committing Sessions...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Accept & Commit Plan to Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
