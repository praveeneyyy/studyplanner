import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
  FileText,
  ListTodo,
  Clock,
  ArrowLeft,
  Coffee,
  Check,
  Award
} from 'lucide-react';

export function SessionWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distractionFree, setDistractionFree] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'notes' | 'ai'>('checklist');

  // Checklist & Notes
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Review core conceptual definitions', done: false },
    { id: 2, text: 'Analyze architectural diagrams and working principles', done: false },
    { id: 3, text: 'Work through 1 mathematical or code derivation', done: false },
    { id: 4, text: 'Self-test key terms using active recall', done: false }
  ]);
  const [notesText, setNotesText] = useState('');

  // AI Drawer inside session
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);

  // Completion Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [reflectionScore, setReflectionScore] = useState(4);
  const [rewardOutcome, setRewardOutcome] = useState<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await api.getSessions();
        const found = res?.data?.find((s: any) => s.id === id);
        if (found) {
          setSession(found);
          const durationSecs = (found.durationMinutes || 45) * 60;
          setSecondsRemaining(durationSecs);
          if (found.notes) setNotesText(found.notes);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [id]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            setShowCompleteModal(true);
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const toggleTimer = async () => {
    if (!isRunning && session?.status === 'PLANNED') {
      try {
        await api.startSession(session.id);
      } catch (err) {
        console.error('Failed to start session on backend:', err);
      }
    }
    setIsRunning(!isRunning);
  };

  const addFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
  };

  const handleFinishEarly = () => {
    setIsRunning(false);
    setShowCompleteModal(true);
  };

  const handleConfirmCompletion = async () => {
    const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    try {
      const res = await api.completeSession(session.id, {
        actualDurationMinutes: actualMinutes,
        reflectionScore,
        notes: notesText
      });
      setRewardOutcome(res.data?.reward);
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim() || aiStreaming) return;
    setAiStreaming(true);
    setAiResponse('');

    await api.streamAI(
      {
        prompt: aiPrompt,
        formatType: 'EXAM_5M',
        topicId: session?.topicId
      },
      {
        onDelta: (chunk: string) => {
          setAiResponse((prev) => prev + chunk);
        },
        onDone: () => {
          setAiStreaming(false);
        },
        onError: (err: any) => {
          console.error(err);
          setAiStreaming(false);
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-app-muted">
        Loading focus workspace...
      </div>
    );
  }

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className={`min-h-screen flex flex-col bg-app-bg ${distractionFree ? 'fixed inset-0 z-50' : ''}`}>
      {/* Notion Workspace Header */}
      <header className="h-11 px-4 bg-app-surface border-b border-app-borderSubtle flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/planner')}
            className="p-1 rounded text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
            title="Exit Session"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-app-muted">Study Session</span>
            <span className="text-app-subtle">/</span>
            <span className="font-semibold text-app-text truncate max-w-xs">
              {session?.topic?.title || 'Focused Block'}
            </span>
            <span className="notion-tag notion-tag-blue text-[10px] ml-1">
              {session?.topic?.unit?.subject?.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDistractionFree(!distractionFree)}
            className="p-1.5 rounded text-app-muted hover:text-app-text hover:bg-app-hover text-xs flex items-center gap-1 transition-colors"
            title={distractionFree ? 'Exit distraction-free mode' : 'Enter distraction-free mode'}
          >
            {distractionFree ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="hidden sm:inline text-[11px]">{distractionFree ? 'Standard' : 'Focus Mode'}</span>
          </button>
          <button
            onClick={handleFinishEarly}
            className="px-2.5 py-1 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1"
          >
            <Check size={12} /> Finish & Earn XP
          </button>
        </div>
      </header>

      {/* Main Workspace Body: Left Timer, Right Context Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Focus Timer & Controls */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 bg-app-surface border-r border-app-borderSubtle space-y-6">
          <div className="text-center space-y-2">
            <span className={`notion-tag text-[10px] uppercase tracking-wider ${isRunning ? 'notion-tag-green' : 'notion-tag-gray'}`}>
              {isRunning ? 'Focused Deep Work' : 'Session Paused'}
            </span>
            <div className="text-7xl sm:text-8xl font-bold tracking-tight text-app-text font-mono tabular-nums">
              {timeFormatted}
            </div>
            <p className="text-xs text-app-muted">
              Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
            </p>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTimer}
              className="px-6 py-2 rounded bg-app-text text-app-bg hover:opacity-90 font-medium text-xs flex items-center gap-1.5 transition-opacity"
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
              {isRunning ? 'Pause Timer' : 'Start Focus Clock'}
            </button>

            <button
              onClick={addFiveMinutes}
              className="px-3 py-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs font-medium text-app-text transition-colors flex items-center gap-1"
              title="Add 5 minutes to clock"
            >
              <Clock size={12} /> +5m
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Support Tabs */}
        <div className="lg:col-span-5 flex flex-col bg-app-surface overflow-hidden">
          {/* Tab Selector */}
          <div className="h-10 px-4 border-b border-app-borderSubtle flex items-center gap-2 bg-app-sidebar/40">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'checklist' ? 'bg-app-surface text-app-text font-medium shadow-2xs' : 'text-app-muted hover:text-app-text'
              }`}
            >
              <ListTodo size={12} /> Objectives
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'notes' ? 'bg-app-surface text-app-text font-medium shadow-2xs' : 'text-app-muted hover:text-app-text'
              }`}
            >
              <FileText size={12} /> Notes
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'ai' ? 'bg-app-surface text-app-text font-medium shadow-2xs' : 'text-app-muted hover:text-app-text'
              }`}
            >
              <Sparkles size={12} className="text-app-accent" /> Ask AI
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5 overflow-y-auto">
            {activeTab === 'checklist' && (
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-app-subtle uppercase tracking-wider block">
                  SESSION OBJECTIVES
                </span>
                <div className="space-y-1.5">
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      className="p-2.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover flex items-start gap-2.5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => {
                          setChecklist(
                            checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                          );
                        }}
                        className="mt-0.5 accent-app-text w-3.5 h-3.5 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${item.done ? 'line-through text-app-muted' : 'text-app-text'}`}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-2 h-full flex flex-col">
                <span className="text-[11px] font-semibold text-app-subtle uppercase tracking-wider block">
                  SESSION NOTEPAD (PERSISTENT)
                </span>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record key definitions, equations, and examination points..."
                  className="w-full flex-1 p-3 bg-app-surface border border-app-borderSubtle rounded text-xs font-mono text-app-text focus:border-app-text outline-none resize-none leading-relaxed"
                  rows={16}
                />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-app-subtle uppercase tracking-wider block">
                  IN-SESSION AI TUTOR
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    placeholder="Ask a quick question about this topic..."
                    className="flex-1 p-2 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none placeholder-app-subtle"
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={aiStreaming}
                    className="px-3 py-1.5 bg-app-text text-app-bg text-xs font-medium rounded hover:opacity-90 disabled:opacity-40"
                  >
                    Ask
                  </button>
                </div>

                {aiResponse && (
                  <div className="p-3 rounded border border-app-borderSubtle bg-app-sidebar text-xs text-app-text leading-relaxed whitespace-pre-wrap font-sans">
                    {aiResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app-borderSubtle rounded-lg max-w-sm w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-100">
            {!rewardOutcome ? (
              <>
                <div className="text-center space-y-1">
                  <div className="inline-flex p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-sm font-semibold text-app-text">Session Completed!</h3>
                  <p className="text-xs text-app-muted">
                    Total verified study time: {Math.max(1, Math.round(elapsedSeconds / 60))} minutes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-app-muted mb-2 text-center">
                    Rate your comprehension of this topic:
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setReflectionScore(score)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-all ${
                          reflectionScore === score
                            ? 'bg-app-text text-app-bg shadow-sm'
                            : 'bg-app-sidebar border border-app-borderSubtle text-app-muted hover:text-app-text'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirmCompletion}
                  className="w-full py-2 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Confirm & Claim Verified XP
                </button>
              </>
            ) : (
              <div className="text-center space-y-3 py-1">
                <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto">
                  <Award size={32} />
                </div>
                <h3 className="text-base font-semibold text-app-text">
                  +{rewardOutcome.xpAwarded || 25} XP Awarded!
                </h3>
                <p className="text-xs text-app-muted">
                  Your study session has been verified and permanently written to the reward ledger.
                </p>
                <div className="p-2.5 rounded bg-app-sidebar text-xs font-medium text-app-text">
                  Total XP: {rewardOutcome.totalXP} • Level {rewardOutcome.levelInfo?.level}
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-1.5 rounded bg-app-text text-app-bg text-xs font-medium"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
