import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Maximize2
} from 'lucide-react';

export interface AIPlanBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreview: (draft: any) => void;
  onPlanConfirmed?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  draft?: any;
}

const QUICK_PROMPT_CHIPS = [
  {
    label: '3-Week Semester Sprint',
    prompt: 'I have examinations in 3 weeks. Schedule 3 hours on weekdays and 5 hours on weekends, prioritize difficult topics, and reserve the final 2 days for mock exams.'
  },
  {
    label: 'Focus on Weak Topics & DSA',
    prompt: 'I struggle with Data Structures and Algorithms and my weak topics. Prioritize these with early scheduling and daily active revision.'
  },
  {
    label: 'Balanced 14-Day Routine',
    prompt: 'Create a balanced 14-day study plan with 3 hours daily, spaced repetition, and 10-minute rest breaks between 45-minute sessions.'
  },
  {
    label: 'Light Workload Schedule',
    prompt: 'Create a lighter study routine with 2 hours on weekdays and 3.5 hours on weekends, covering high-priority exam topics first.'
  }
];

const GENERATION_STAGES = [
  'Reading student syllabus, exams, and weak topics...',
  'Analyzing workload capacity and topic priorities...',
  'Computing deterministic, conflict-free time slots...',
  'Generating structured multi-view study schedule...'
];

export function AIPlanBuilderDrawer({
  isOpen,
  onClose,
  onOpenPreview,
  onPlanConfirmed
}: AIPlanBuilderDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStageIndex, setGenerationStageIndex] = useState(0);
  const [studentContext, setStudentContext] = useState<any>(null);
  const [latestDraft, setLatestDraft] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load student context on mount
  useEffect(() => {
    async function loadContext() {
      setLoadingContext(true);
      try {
        const res = await api.getPlannerContext();
        if (res?.data) {
          setStudentContext(res.data);
        }
      } catch (err) {
        console.error('Failed to load planner context:', err);
      } finally {
        setLoadingContext(false);
      }
    }

    if (isOpen) {
      loadContext();
    }
  }, [isOpen]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && studentContext) {
      const subjectNames = studentContext.subjects?.map((s: any) => s.name).slice(0, 3).join(', ');
      const examCount = studentContext.examinations?.length || 0;
      const weakCount = studentContext.weakTopics?.length || 0;

      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: `Hello ${studentContext.user?.fullName || 'Student'}! I am your **Context-Aware Study Plan Architect**.

I have read your academic context:
• **${studentContext.subjects?.length || 0} Enrolled Subjects** (${subjectNames || 'General Curriculum'})
• **${examCount} Upcoming Examination Milestones**
• **${weakCount} Identified Weak Topics / Priority Areas**

Tell me your study goals, exam timeline, or daily availability (for example: *"3 hours on weekdays, 5 on weekends, prioritize difficult topics"*), and I will build a tailored, conflict-free schedule for you.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [studentContext, messages.length]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating, generationStageIndex]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle stage animation during generation
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setGenerationStageIndex((prev) => (prev + 1) % GENERATION_STAGES.length);
      }, 1400);
    } else {
      setGenerationStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isGenerating) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const res = await api.generateAiPlanDraft({
        prompt: text,
        constraints: {},
        history: messages.map((m) => ({ role: m.sender, content: m.text }))
      });

      if (res?.data) {
        const { draft, message } = res.data;
        setLatestDraft(draft);

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          draft
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      console.error('Error generating AI plan draft:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: `I encountered an issue building your study plan: ${err.message || 'Network error'}. Please try again or refine your prompt.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdjustDraft = async (action: 'LIGHTER' | 'INTENSIFY_WEAK' | 'EXTEND_DEADLINE') => {
    if (!latestDraft || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await api.adjustAiPlanDraft({
        draft: latestDraft,
        action
      });

      if (res?.data) {
        const { draft, message } = res.data;
        setLatestDraft(draft);

        setMessages((prev) => [
          ...prev,
          {
            id: `adjust-${Date.now()}`,
            sender: 'assistant',
            text: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            draft
          }
        ]);
      }
    } catch (err: any) {
      console.error('Failed to adjust plan draft:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-app-surface border-l border-app-borderSubtle shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-app-borderSubtle flex items-center justify-between bg-app-sidebar/60 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-app-text">AI Study Plan Architect</h2>
                <span className="notion-tag notion-tag-blue text-[10px] py-0 px-1.5 font-mono">
                  Context-Aware
                </span>
              </div>
              <p className="text-[11px] text-app-muted">
                Synthesizes curriculum constraints into deterministic schedules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-app-subtle border border-app-borderSubtle px-1.5 py-0.5 rounded font-mono">
              Ctrl+Shift+L
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-app-hover text-app-muted hover:text-app-text transition-colors"
              title="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Student Context Ribbon */}
        {studentContext && (
          <div className="px-5 py-2 bg-app-surface border-b border-app-borderSubtle flex items-center justify-between text-[11px] text-app-muted overflow-x-auto select-none">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <BookOpen size={12} className="text-app-subtle" />
                <span>
                  <strong className="text-app-text">{studentContext.subjects?.length || 0}</strong> Subjects
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-app-subtle" />
                <span>
                  <strong className="text-app-text">{studentContext.examinations?.length || 0}</strong> Exams
                </span>
              </span>
              <span className="flex items-center gap-1">
                <BrainCircuit size={12} className="text-app-subtle" />
                <span>
                  <strong className="text-app-text">{studentContext.weakTopics?.length || 0}</strong> Priority Topics
                </span>
              </span>
            </div>

            {studentContext.activePlan && (
              <span className="notion-tag notion-tag-green text-[10px]">
                Active Plan Running
              </span>
            )}
          </div>
        )}

        {/* Message Conversation Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-6 h-6 rounded bg-app-sidebar border border-app-borderSubtle flex items-center justify-center text-app-text shrink-0 mt-0.5">
                  <Bot size={13} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded p-3.5 space-y-2.5 ${
                  msg.sender === 'user'
                    ? 'bg-app-text text-app-bg border border-transparent'
                    : 'bg-app-sidebar border border-app-borderSubtle text-app-text'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">{msg.text}</div>

                {/* Render Draft Summary Card if attached */}
                {msg.draft && (
                  <div className="mt-3 p-3 rounded border border-app-borderStrong bg-app-surface text-app-text space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-app-text truncate">
                        <Calendar size={13} className="text-app-accent shrink-0" />
                        <span className="truncate">{msg.draft.title}</span>
                      </div>
                      <span
                        className={`notion-tag text-[10px] ${
                          msg.draft.isFeasible ? 'notion-tag-green' : 'notion-tag-yellow'
                        }`}
                      >
                        {msg.draft.isFeasible ? 'Feasible & Conflict-Free' : 'Workload Warning'}
                      </span>
                    </div>

                    {/* KPI Quick Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                      <div className="p-1.5 rounded bg-app-sidebar border border-app-borderSubtle">
                        <div className="text-app-subtle text-[9px] uppercase">Planned Time</div>
                        <div className="font-semibold text-app-text mt-0.5">
                          {msg.draft.totalPlannedHours} hrs
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-app-sidebar border border-app-borderSubtle">
                        <div className="text-app-subtle text-[9px] uppercase">Total Sessions</div>
                        <div className="font-semibold text-app-text mt-0.5">
                          {msg.draft.sessionCount} blocks
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-app-sidebar border border-app-borderSubtle">
                        <div className="text-app-subtle text-[9px] uppercase">Coverage</div>
                        <div className="font-semibold text-app-text mt-0.5">
                          {msg.draft.syllabusCoveragePercent}%
                        </div>
                      </div>
                    </div>

                    {msg.draft.feasibilityWarning && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                        <span>{msg.draft.feasibilityWarning}</span>
                      </div>
                    )}

                    {/* Action to Launch Full Multi-View Preview */}
                    <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={() => onOpenPreview(msg.draft)}
                        className="flex-1 py-1.5 px-3 rounded bg-app-text text-app-bg hover:opacity-90 font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <Maximize2 size={12} />
                        <span>Inspect Schedule (4 Views)</span>
                      </button>

                      <button
                        onClick={() => handleAdjustDraft('LIGHTER')}
                        disabled={isGenerating}
                        className="py-1.5 px-2.5 rounded border border-app-borderSubtle hover:bg-app-hover text-app-text text-[11px] flex items-center justify-center gap-1 transition-colors"
                        title="Reduce daily hours by 20%"
                      >
                        <Sliders size={11} />
                        <span>Lighter</span>
                      </button>

                      <button
                        onClick={() => handleAdjustDraft('INTENSIFY_WEAK')}
                        disabled={isGenerating}
                        className="py-1.5 px-2.5 rounded border border-app-borderSubtle hover:bg-app-hover text-app-text text-[11px] flex items-center justify-center gap-1 transition-colors"
                        title="Prioritize weak topics"
                      >
                        <BrainCircuit size={11} />
                        <span>Focus Weak</span>
                      </button>
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] font-mono text-right ${
                    msg.sender === 'user' ? 'text-app-bg/70' : 'text-app-subtle'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded bg-app-text text-app-bg flex items-center justify-center shrink-0 mt-0.5">
                  <User size={13} />
                </div>
              )}
            </div>
          ))}

          {/* In-Flight Generation Indicator */}
          {isGenerating && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-6 h-6 rounded bg-app-sidebar border border-app-borderSubtle flex items-center justify-center text-app-text shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
              <div className="bg-app-sidebar border border-app-borderSubtle p-3 rounded max-w-[85%] space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs text-app-text">
                  <div className="flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin text-app-accent" />
                    <span className="font-medium">{GENERATION_STAGES[generationStageIndex]}</span>
                  </div>
                  <button
                    onClick={handleCancelGeneration}
                    className="text-[11px] text-app-muted hover:text-red-500 underline"
                  >
                    Cancel
                  </button>
                </div>
                <div className="w-full bg-app-borderSubtle h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-app-accent h-full transition-all duration-500"
                    style={{ width: `${((generationStageIndex + 1) / GENERATION_STAGES.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2 border-t border-app-borderSubtle bg-app-sidebar/40 overflow-x-auto select-none">
          <div className="flex items-center gap-1.5 w-max">
            <span className="text-[10px] text-app-subtle uppercase tracking-wider font-semibold mr-1">
              Suggestions:
            </span>
            {QUICK_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-full border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-[11px] text-app-text whitespace-nowrap transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-app-borderSubtle bg-app-surface">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="Describe your study requirements (e.g. 3 weeks, 3h weekdays / 5h weekends, prioritize DSA)..."
                disabled={isGenerating}
                className="w-full text-xs p-2.5 rounded border border-app-borderStrong bg-app-surface text-app-text placeholder:text-app-subtle focus:outline-hidden focus:border-app-accent resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!inputValue.trim() || isGenerating}
              className="p-2.5 rounded bg-app-text text-app-bg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center shrink-0"
              title="Send requirements"
            >
              <Send size={14} />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[10px] text-app-subtle select-none">
            <span>Press Enter to send • Shift+Enter for new line</span>
            <span>Shortcut: Ctrl+Shift+L</span>
          </div>
        </div>
      </div>
    </div>
  );
}
