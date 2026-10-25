import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import {
  Sparkles,
  Send,
  Plus,
  Copy,
  Check,
  FileText,
  CheckSquare,
  Repeat,
  RotateCcw,
  BookOpen,
  MessageSquare,
  HelpCircle
} from 'lucide-react';

const ANSWER_FORMATS = [
  { key: 'EXPLAIN', label: 'Explain' },
  { key: 'SIMPLE', label: 'Simple (ELI5)' },
  { key: 'DETAILED', label: 'Detailed' },
  { key: 'STEP_BY_STEP', label: 'Step-by-Step' },
  { key: 'EXAM_2M', label: '2-Mark' },
  { key: 'EXAM_5M', label: '5-Mark' },
  { key: 'EXAM_10M', label: '10-Mark' },
  { key: 'EXAM_15M', label: '15-Mark' },
  { key: 'SHORT_NOTES', label: 'Short Notes' },
  { key: 'BULLET_POINTS', label: 'Bullet Points' },
  { key: 'TABLE', label: 'Comparison' },
  { key: 'CODE', label: 'Code & Trace' },
  { key: 'MATH_DERIVATION', label: 'Math Derivation' },
  { key: 'FLASHCARDS', label: 'Flashcards' },
  { key: 'QUIZ', label: 'Quiz' }
];

export function AITutorPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q');
  const formatParam = searchParams.get('format');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputPrompt, setInputPrompt] = useState(queryParam || '');
  const [selectedFormat, setSelectedFormat] = useState(formatParam || 'EXPLAIN');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      const [convsRes, subsRes] = await Promise.all([
        api.getConversations(),
        api.getSubjects()
      ]);
      if (convsRes?.data) {
        setConversations(convsRes.data);
        if (convsRes.data.length > 0) {
          selectConversation(convsRes.data[0].id);
        }
      }
      if (subsRes?.data) setSubjects(subsRes.data);
    } catch (err) {
      console.error('Failed to load initial AI context:', err);
    }
  }

  async function selectConversation(id: string) {
    setActiveConvId(id);
    try {
      const res = await api.getConversation(id);
      if (res?.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }

  const handleNewConversation = async () => {
    try {
      const res = await api.createConversation('New Study Discussion');
      if (res?.data) {
        setConversations([res.data, ...conversations]);
        setActiveConvId(res.data.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || isStreaming) return;

    let convId = activeConvId;
    if (!convId) {
      const newConv = await api.createConversation(inputPrompt.slice(0, 30));
      convId = newConv.data.id;
      setActiveConvId(convId);
      setConversations([newConv.data, ...conversations]);
    }

    const userMsg = { sender: 'user', content: inputPrompt, formatType: selectedFormat };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsStreaming(true);

    const assistantMsgPlaceholder = {
      sender: 'assistant',
      content: '',
      formatType: selectedFormat,
      providerUsed: 'academic-curriculum'
    };
    setMessages((prev) => [...prev, assistantMsgPlaceholder]);

    await api.streamAI(
      {
        conversationId: convId || undefined,
        prompt: userMsg.content,
        formatType: selectedFormat as any,
        topicId: selectedTopicId || undefined
      },
      {
        onDelta: (chunk: string) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.sender === 'assistant') {
              last.content += chunk;
            }
            return updated;
          });
        },
        onDone: () => {
          setIsStreaming(false);
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
        onError: (err: any) => {
          console.error(err);
          setIsStreaming(false);
        }
      }
    );
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSaveToNotes = async (topicId?: string) => {
    if (!topicId) {
      setNotice('Select a syllabus topic first to associate this note.');
      return;
    }
    try {
      await api.request('/ai/generate-notes', {
        method: 'POST',
        body: JSON.stringify({ topicId })
      });
      setNotice('Saved structured academic notes to your workspace!');
    } catch (err: any) {
      setNotice(err.message || 'Failed to save note.');
    }
  };

  const allTopics: any[] = [];
  subjects.forEach((s) => {
    s.units?.forEach((u: any) => {
      u.topics?.forEach((t: any) => {
        allTopics.push({ id: t.id, title: `${s.name}: ${t.title}` });
      });
    });
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'AI Study Assistant' }
        ]}
        subtitle="16 exam-oriented answer formats"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Conversation Index Sidebar */}
        <div className="w-56 border-r border-app-borderSubtle bg-app-sidebar/50 hidden md:flex flex-col select-none">
          <div className="p-2 border-b border-app-borderSubtle">
            <button
              onClick={handleNewConversation}
              className="w-full py-1.5 px-2.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs font-medium text-app-text flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus size={13} /> New Discussion
            </button>
          </div>

          <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            <div className="text-[10px] font-medium text-app-subtle px-2 py-1">DISCUSSIONS</div>
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs truncate flex items-center gap-2 transition-colors ${
                  activeConvId === c.id
                    ? 'bg-app-hover text-app-text font-medium'
                    : 'text-app-muted hover:text-app-text hover:bg-app-hover'
                }`}
              >
                <MessageSquare size={13} className="text-app-muted flex-shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Conversation Canvas */}
        <div className="flex-1 flex flex-col bg-app-surface overflow-hidden">
          {notice && (
            <div className="notion-callout text-xs text-app-text mx-4 mt-2">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <span>{notice}</span>
                <button onClick={() => setNotice(null)} className="underline text-[11px] text-app-muted">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Context Selector & Model Info */}
          <div className="p-2 px-6 border-b border-app-borderSubtle flex flex-wrap items-center justify-between gap-3 bg-app-sidebar/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-app-subtle">Topic Context:</span>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="bg-app-surface border border-app-borderSubtle rounded px-2 py-0.5 text-xs text-app-text outline-none cursor-pointer"
              >
                <option value="">General Academic Context</option>
                {allTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-app-muted flex items-center gap-2">
              <span className="notion-tag notion-tag-green">Curriculum Verified</span>
            </div>
          </div>

          {/* 16 Format Pill Bar */}
          <div className="px-6 py-2 border-b border-app-borderSubtle bg-app-surface flex items-center gap-1.5 overflow-x-auto">
            {ANSWER_FORMATS.map((fmt) => (
              <button
                key={fmt.key}
                onClick={() => setSelectedFormat(fmt.key)}
                className={`notion-tag transition-colors cursor-pointer ${
                  selectedFormat === fmt.key
                    ? 'notion-tag-blue font-semibold ring-1 ring-blue-500/40'
                    : 'notion-tag-gray hover:bg-app-hover'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-app-surface border border-app-borderSubtle flex items-center justify-center text-app-text mx-auto shadow-xs">
                  <Sparkles size={24} className="text-app-accent" />
                </div>
                <h3 className="text-sm font-semibold text-app-text">How can I assist your study today?</h3>
                <p className="text-xs text-app-muted">
                  Ask any conceptual question, request a 2/5/10-mark exam essay, or generate flashcards and code traces.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full pt-2">
                  <button
                    onClick={() => setInputPrompt('Explain Virtual Memory & Paging with diagram')}
                    className="p-2.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-left hover:bg-app-hover text-app-text"
                  >
                    "Explain Virtual Memory & Paging"
                  </button>
                  <button
                    onClick={() => setInputPrompt('Derive eigenvalues from characteristic equation')}
                    className="p-2.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-left hover:bg-app-hover text-app-text"
                  >
                    "Derive Eigenvalues Formula"
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 max-w-2xl ${
                      isUser ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-app-subtle px-1">
                      <span className="font-medium text-app-muted">{isUser ? 'You' : 'AI Assistant'}</span>
                      {msg.formatType && (
                        <span className="notion-tag notion-tag-gray text-[10px]">
                          {msg.formatType}
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-app-text text-app-bg rounded-lg'
                          : 'bg-app-surface border border-app-borderSubtle text-app-text rounded-lg shadow-2xs whitespace-pre-wrap font-sans'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {!isUser && msg.content && (
                      <div className="flex items-center gap-2 pt-0.5 text-[11px] text-app-muted">
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="hover:text-app-text flex items-center gap-1"
                        >
                          {copiedIdx === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleSaveToNotes(selectedTopicId)}
                          className="hover:text-app-text flex items-center gap-1"
                        >
                          <FileText size={12} /> Save to Notes
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Input Bar */}
          <div className="p-3 px-6 border-t border-app-borderSubtle bg-app-surface">
            <div className="flex items-center gap-2 border border-app-borderSubtle bg-app-surface rounded px-3 py-1.5 focus-within:border-app-text transition-colors">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Ask academic question (Format: ${selectedFormat})...`}
                className="flex-1 bg-transparent text-xs text-app-text outline-none placeholder-app-subtle"
              />
              <button
                onClick={handleSend}
                disabled={isStreaming || !inputPrompt.trim()}
                className="p-1 rounded text-app-muted hover:text-app-text disabled:opacity-30 transition-colors"
                title="Send query"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
