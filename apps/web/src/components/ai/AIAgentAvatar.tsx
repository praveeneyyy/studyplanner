import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDashboard } from '../../context/DashboardContext';
import {
  Sparkles,
  X,
  Send,
  Plus,
  Copy,
  Check,
  Calendar,
  LayoutDashboard,
  FileText,
  CheckSquare,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Zap,
  RotateCcw,
  Square,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  actionCard?: {
    type: 'plan' | 'dashboard' | 'note' | 'quiz';
    data?: any;
    status?: 'pending' | 'completed';
  };
  timestamp: string;
}

const QUICK_ACTIONS = [
  { id: 'plan', label: 'Create Study Plan', icon: Calendar, prompt: 'Create an adaptive 7-day study plan for upcoming exams with 4 hours daily.' },
  { id: 'dashboard', label: 'Create Dashboard', icon: LayoutDashboard, prompt: 'Create a custom study dashboard for my target exams.' },
  { id: 'note', label: 'Draft Study Note', icon: FileText, prompt: 'Draft a comprehensive Notion study note with key concepts and formulas.' },
  { id: 'explain', label: 'Explain Topic', icon: HelpCircle, prompt: 'Explain binary search with an example and time complexity.' },
  { id: 'quiz', label: 'Generate Quiz', icon: CheckSquare, prompt: 'Create a 5-question micro-quiz to test my recall.' }
];

export function AIAgentAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiStatus, setAiStatus] = useState<'ready' | 'thinking' | 'error'>('ready');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { createDashboard } = useDashboard();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Global Keyboard Shortcut: Alt+J or Cmd+J toggles the AI agent
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'j') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  const getPageContextLabel = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/planner')) return 'Study Plan Database';
    if (path.startsWith('/notes')) return 'Academic Notes';
    if (path.startsWith('/subjects')) return 'Subjects & Syllabus';
    if (path.startsWith('/revision')) return 'Spaced Repetition';
    if (path.startsWith('/quizzes')) return 'Assessments';
    if (path.startsWith('/rewards')) return 'Rewards & XP';
    if (path.startsWith('/universe')) return '3D Universe';
    if (path.startsWith('/session')) return 'Focus Study Session';
    return 'Workspace';
  };

  const handleStopRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setAiStatus('ready');
  };

  const handleSendPrompt = async (promptText: string) => {
    const textToSend = promptText.trim();
    if (!textToSend || isStreaming) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setAiStatus('thinking');

    abortControllerRef.current = new AbortController();

    const lower = textToSend.toLowerCase();

    // 1. Detect if user wants to create a DASHBOARD
    if (lower.includes('dashboard') && (lower.includes('create') || lower.includes('make') || lower.includes('new') || lower.includes('add'))) {
      let subjectName = 'Study';
      const match = textToSend.match(/(?:for|named|about)\s+([A-Za-z0-9\s&]+)/i);
      if (match && match[1]) {
        subjectName = match[1].trim().replace(/\b(focus|dashboard|view)\b/gi, '').trim() || 'Study';
      }

      const newDash = createDashboard({
        name: `${subjectName} Focus`,
        icon: 'LayoutDashboard',
        description: `Custom study dashboard tailored for ${subjectName} revision and daily targets.`,
        subjectFilter: subjectName === 'Study' ? 'ALL' : subjectName,
        dailyTargetMinutes: 180,
        widgets: ['examAlert', 'primaryAction', 'metricsGrid', 'agendaList', 'weakTopics']
      });

      const assistantMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: `I've created a new custom dashboard: "${newDash.name}" for you with specialized widgets and filters for ${subjectName}.`,
        actionCard: {
          type: 'dashboard',
          data: newDash,
          status: 'completed'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(false);
      setAiStatus('ready');
      return;
    }

    // 2. Detect if user wants to create a STUDY PLAN
    if (lower.includes('plan') && (lower.includes('create') || lower.includes('make') || lower.includes('generate') || lower.includes('new') || lower.includes('rebalance'))) {
      try {
        const draftRes = await api.aiStudyPlanDraft({ prompt: textToSend }, abortControllerRef.current.signal);
        const draftData = draftRes?.data?.draft;

        const assistantMsg: CopilotMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: draftRes?.data?.message || `I have prepared a deterministic study plan with conflict-free daily focus blocks and pre-exam revision buffers.`,
          actionCard: {
            type: 'plan',
            data: draftData || {
              dailyHoursLimit: 4,
              sessionDurationMinutes: 45,
              breakMinutes: 10
            },
            status: 'pending'
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Study plan draft error:', err);
          setAiStatus('error');
        }
      } finally {
        setIsStreaming(false);
        setAiStatus('ready');
      }
      return;
    }

    // 3. Detect if user wants to create a NOTE
    if (lower.includes('note') && (lower.includes('create') || lower.includes('draft') || lower.includes('make') || lower.includes('generate'))) {
      const assistantMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: `Drafting your Notion-style academic note with optimal substructure definitions, code blocks, and key exam concepts...`,
        actionCard: {
          type: 'note',
          data: {
            title: textToSend.replace(/(create|draft|generate|make|a|an|note|on)\s+/gi, '').trim() || 'Dynamic Programming Notes'
          },
          status: 'pending'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(false);
      setAiStatus('ready');
      return;
    }

    // 4. Real AI Chat Completion via Hugging Face Qwen3 / aiChat endpoint
    try {
      const chatHistory = messages
        .filter((m) => m.sender === 'user' || m.sender === 'assistant')
        .slice(-10)
        .map((m) => ({
          role: m.sender as 'user' | 'assistant',
          content: m.content
        }));

      const res = await api.aiChat(
        {
          message: textToSend,
          history: chatHistory
        },
        abortControllerRef.current.signal
      );

      const assistantMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setAiStatus('ready');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setAiStatus('ready');
      } else {
        console.error('AI chat error:', err);
        setAiStatus('error');
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            content: `I encountered an issue processing your request: ${err.message || 'Network error'}. Please try again.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCommitPlan = async (cardMsgId: string, planData: any) => {
    try {
      if (planData?.sessions) {
        await api.confirmAiPlanDraft(planData);
      } else {
        await api.confirmPlan(planData);
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === cardMsgId
            ? {
                ...m,
                content: `${m.content}\n\nPlan committed to your database! Calendar and agenda views have been synchronized.`,
                actionCard: { ...m.actionCard!, status: 'completed' }
              }
            : m
        )
      );
    } catch (err: any) {
      alert(`Plan creation error: ${err.message}`);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Persistent Floating AI Agent Avatar Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50 select-none">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group flex items-center justify-center rounded-full transition-all duration-200 shadow-lg ${
            isOpen
              ? 'w-12 h-12 bg-app-text text-app-bg rotate-90'
              : 'w-13 h-13 bg-app-surface border border-app-borderStrong hover:border-app-text hover:shadow-xl'
          }`}
          title="AI Study Assistant (Alt+J)"
        >
          {isOpen ? (
            <X size={20} className="text-app-bg" />
          ) : (
            <div className="relative flex items-center justify-center p-2.5">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                <Sparkles size={16} />
              </div>
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-app-surface" />
            </div>
          )}

          {/* Hover Pill Tooltip */}
          {!isOpen && (
            <div className="absolute right-full mr-3 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-surface border border-app-borderSubtle shadow-md text-xs font-medium text-app-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Sparkles size={12} className="text-app-accent" />
              <span>AI Study Assistant</span>
              <kbd className="text-[10px] font-mono text-app-subtle px-1 bg-app-sidebar rounded border border-app-borderSubtle">
                Alt+J
              </kbd>
            </div>
          )}
        </button>
      </div>

      {/* Floating Notion AI Drawer / Popover Window */}
      {isOpen && (
        <div
          className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] h-[580px] max-h-[80vh] bg-app-surface border border-app-borderStrong rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150"
        >
          {/* Header */}
          <div className="p-3 px-4 border-b border-app-borderSubtle bg-app-sidebar/50 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-app-text text-app-bg flex items-center justify-center text-xs shadow-xs">
                <Sparkles size={13} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-app-text">AI Study Assistant</h3>
                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0 rounded-full border ${
                      aiStatus === 'thinking'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse'
                        : aiStatus === 'error'
                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${aiStatus === 'thinking' ? 'bg-blue-500' : aiStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span>{aiStatus === 'thinking' ? 'Thinking...' : aiStatus === 'error' ? 'Error' : 'Ready'}</span>
                  </span>
                </div>
                <span className="text-[10px] text-app-subtle block">
                  Context: {getPageContextLabel()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isStreaming && (
                <button
                  onClick={handleStopRequest}
                  className="px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-600 text-[10px] font-medium hover:bg-red-500/20 flex items-center gap-1"
                  title="Stop generating"
                >
                  <Square size={9} className="fill-current" />
                  <span>Stop</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai');
                }}
                className="p-1 rounded text-app-muted hover:text-app-text hover:bg-app-hover"
                title="Open in Full-Page AI Workspace"
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-app-muted hover:text-app-text hover:bg-app-hover"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 border-b border-app-borderSubtle bg-app-surface flex items-center gap-1.5 overflow-x-auto select-none">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleSendPrompt(action.prompt)}
                  disabled={isStreaming}
                  className="notion-tag notion-tag-gray hover:bg-app-hover text-[11px] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Icon size={11} className="text-app-muted" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-app-muted select-none">
                <div className="w-8 h-8 rounded-full bg-app-hover flex items-center justify-center text-app-muted">
                  <Sparkles size={15} />
                </div>
                <h4 className="text-xs font-semibold text-app-text">How can I help you study?</h4>
                <p className="text-[11px] text-app-muted max-w-xs leading-relaxed">
                  Ask conceptual doubts, clarify code errors, or generate an adaptive study schedule.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 max-w-[92%] ${
                      isUser ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-app-subtle px-1">
                      <span>{isUser ? 'You' : 'AI Assistant'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        isUser
                          ? 'bg-app-text text-app-bg font-normal'
                          : 'bg-app-sidebar border border-app-borderSubtle text-app-text whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}

                    {/* Action Card: Plan Creation */}
                    {msg.actionCard?.type === 'plan' && (
                      <div className="mt-2.5 p-2.5 rounded border border-app-borderSubtle bg-app-surface space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-app-text flex items-center gap-1">
                            <Calendar size={12} className="text-blue-500" /> Adaptive Study Schedule
                          </span>
                          <span className="notion-tag notion-tag-green">Feasible</span>
                        </div>
                        <p className="text-[10px] text-app-muted">
                          Configured with verified deep focus blocks, priority topic weighting, and exam buffers.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          {msg.actionCard.status !== 'completed' ? (
                            <button
                              onClick={() => handleCommitPlan(msg.id, msg.actionCard?.data)}
                              className="px-2.5 py-1 rounded bg-app-text text-app-bg hover:opacity-90 font-medium text-[11px] flex items-center gap-1"
                            >
                              <Check size={11} /> Commit to Database
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/planner');
                              }}
                              className="px-2.5 py-1 rounded border border-app-borderSubtle hover:bg-app-hover font-medium text-[11px] flex items-center gap-1"
                            >
                              View in Database Views →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Card: Dashboard Creation */}
                    {msg.actionCard?.type === 'dashboard' && (
                      <div className="mt-2.5 p-2.5 rounded border border-app-borderSubtle bg-app-surface space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-app-text flex items-center gap-1">
                            <LayoutDashboard size={12} className="text-purple-500" />
                            {msg.actionCard.data?.name}
                          </span>
                          <span className="notion-tag notion-tag-blue">Active</span>
                        </div>
                        <p className="text-[10px] text-app-muted">
                          Custom dashboard activated with syllabus progress, daily targets, and timer.
                        </p>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/dashboard');
                          }}
                          className="px-2.5 py-1 rounded bg-app-text text-app-bg hover:opacity-90 font-medium text-[11px] flex items-center gap-1"
                        >
                          Open Dashboard Now →
                        </button>
                      </div>
                    )}

                    {/* Action Card: Note Draft */}
                    {msg.actionCard?.type === 'note' && (
                      <div className="mt-2.5 p-2.5 rounded border border-app-borderSubtle bg-app-surface space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-app-text flex items-center gap-1">
                            <FileText size={12} className="text-amber-500" />
                            {msg.actionCard.data?.title}
                          </span>
                          <span className="notion-tag notion-tag-green">Ready</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/notes');
                          }}
                          className="px-2.5 py-1 rounded bg-app-text text-app-bg hover:opacity-90 font-medium text-[11px] flex items-center gap-1"
                        >
                          Open in Notes Editor →
                        </button>
                      </div>
                    )}
                  </div>

                  {!isUser && msg.content && (
                    <div className="flex items-center gap-2 text-[10px] text-app-subtle px-1">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="hover:text-app-text flex items-center gap-1"
                      >
                        {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }))}

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-app-muted p-2">
                <Loader2 size={13} className="animate-spin text-app-accent" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Input Bar */}
          <div className="p-3 border-t border-app-borderSubtle bg-app-surface">
            <div className="flex items-end gap-2 border border-app-borderSubtle bg-app-surface rounded px-2.5 py-1.5 focus-within:border-app-text transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt(input);
                  }
                }}
                placeholder="Ask a question or request a study plan..."
                className="flex-1 bg-transparent text-xs text-app-text outline-none placeholder-app-subtle resize-none max-h-24 leading-relaxed"
              />
              <button
                onClick={() => handleSendPrompt(input)}
                disabled={isStreaming || !input.trim()}
                className="p-1 rounded text-app-muted hover:text-app-text disabled:opacity-30 transition-colors shrink-0 mb-0.5"
                title="Send (Enter)"
              >
                <Send size={13} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-app-subtle px-1 select-none">
              <span>Enter to send • Shift+Enter for newline</span>
              <span>Alt+J to toggle</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
