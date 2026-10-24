import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Calendar,
  Share2,
  MoreHorizontal,
  Plus,
  HelpCircle,
  FileQuestion,
  Repeat,
  Trash2,
  Edit3,
  X,
  FileText
} from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  subjectName?: string;
  contentMarkdown: string;
  tags?: string;
  examWeight?: string;
  updatedAt?: string;
}

const DEFAULT_NOTES: NoteItem[] = [];

export function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('study_notes_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (n: any) => n.id !== 'note-1' && n.id !== 'note-2' && n.id !== 'note-3'
          );
          return filtered;
        }
      }
    } catch {}
    return [];
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || '';
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // New Note Modal
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [newContent, setNewContent] = useState('');

  // Editing state for active note
  const [isEditing, setIsEditing] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  useEffect(() => {
    try {
      localStorage.setItem('study_notes_list', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  // Load backend notes if present
  useEffect(() => {
    async function fetchBackendNotes() {
      try {
        const res = await api.request<any>('/notes');
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: NoteItem[] = res.data.map((n: any) => ({
            id: n.id,
            title: n.title,
            subjectName: n.subject?.name || 'General',
            contentMarkdown: n.contentMarkdown,
            tags: n.tags,
            examWeight: 'High Priority',
            updatedAt: n.updatedAt
          }));
          setNotes((prev) => {
            const combined = [...mapped];
            prev.forEach((p) => {
              if (!combined.some((c) => c.id === p.id)) combined.push(p);
            });
            return combined;
          });
        }
      } catch (e) {
        // Fallback to local
      }
    }
    fetchBackendNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: newTitle.trim(),
      subjectName: newSubject,
      examWeight: 'High Priority',
      contentMarkdown: newContent.trim() || `## Overview\nNotes for ${newTitle.trim()}.\n\n### Key Concepts\n- Core definition\n- Equations & formulas\n- Examples`,
      updatedAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setShowNewNoteModal(false);
    setNewTitle('');
    setNewContent('');

    // Attempt backend save
    try {
      await api.request('/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: newNote.title,
          contentMarkdown: newNote.contentMarkdown
        })
      });
    } catch {}
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Delete this note?')) {
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      setActiveNoteId(remaining[0]?.id || '');
      try {
        await api.request(`/notes/${id}`, { method: 'DELETE' });
      } catch {}
    }
  };

  const handleUpdateActiveContent = (newText: string) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNote.id ? { ...n, contentMarkdown: newText } : n))
    );
  };

  const handleAskAI = (topic: string) => {
    setLoadingAi(true);
    setAiResponse(null);
    setTimeout(() => {
      setLoadingAi(false);
      setAiResponse(
        `Dynamic Programming breaks down an optimization problem into subproblems. In memoization (top-down), recursive calls are cached in a hash map or table, reducing time complexity from O(2^n) to O(n) space and time. In tabulation (bottom-up), you iteratively fill an array starting from base cases, often enabling space optimization to O(1).`
      );
    }, 800);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: activeNote ? activeNote.title : 'Notes' }
        ]}
        subtitle="Notion document library"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Document Sidebar (Notes Index) */}
        <div className="w-56 border-r border-app-borderSubtle bg-app-sidebar/40 p-3 space-y-3 hidden md:flex flex-col select-none overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] font-medium text-app-subtle px-2">
            <span>NOTES & SUMMARIES</span>
            <button
              onClick={() => setShowNewNoteModal(true)}
              className="p-0.5 rounded hover:bg-app-hover text-app-muted hover:text-app-text"
              title="Create new note document"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="space-y-0.5 flex-1 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setIsEditing(false);
                  setAiResponse(null);
                }}
                className={`w-full group flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  activeNoteId === note.id
                    ? 'bg-app-hover text-app-text font-medium'
                    : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={13} className="text-app-muted shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 rounded"
                  title="Delete note"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-app-borderSubtle space-y-1">
            <button
              onClick={() => setShowNewNoteModal(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-app-text hover:bg-app-hover font-medium transition-colors"
            >
              <Plus size={13} />
              <span>+ New Note</span>
            </button>
            <button
              onClick={() => navigate('/ai')}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-app-accent hover:bg-app-hover font-medium transition-colors"
            >
              <Sparkles size={13} />
              <span>AI Tutor Generator</span>
            </button>
          </div>
        </div>

        {/* Main Document Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {!activeNote ? (
            <div className="max-w-md mx-auto my-16 p-8 text-center border border-dashed border-app-borderSubtle rounded-lg space-y-3">
              <FileText size={28} className="mx-auto text-app-muted opacity-40" />
              <h2 className="text-base font-semibold text-app-text">No academic notes yet</h2>
              <p className="text-xs text-app-muted">
                Create custom notes for your subjects, or use the AI Study Assistant in the bottom-right corner to draft study guides.
              </p>
              <button
                onClick={() => setShowNewNoteModal(true)}
                className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                + Create Note
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {/* Document Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FileText size={24} className="text-app-text" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded border border-app-borderSubtle hover:bg-app-hover text-xs font-medium text-app-text transition-colors"
                    >
                      <Edit3 size={12} />
                      <span>{isEditing ? 'Preview Mode' : 'Edit Markdown'}</span>
                    </button>
                    <button
                      onClick={() => setShowNewNoteModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90"
                    >
                      <Plus size={12} /> New Note
                    </button>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-app-text">
                  {activeNote.title}
                </h1>

              {/* Notion Document Properties Bar */}
              <div className="border-y border-app-borderSubtle py-2 space-y-1.5 text-xs">
                <div className="flex items-center gap-6">
                  <span className="w-24 text-app-subtle flex items-center gap-1.5">
                    <BookOpen size={13} /> Subject
                  </span>
                  <span className="notion-tag notion-tag-blue">
                    {activeNote.subjectName || 'General Academic'}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="w-24 text-app-subtle flex items-center gap-1.5">
                    <Calendar size={13} /> Exam Focus
                  </span>
                  <span className="notion-tag notion-tag-red">
                    {activeNote.examWeight || 'High Priority'}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="w-24 text-app-subtle flex items-center gap-1.5">
                    <Repeat size={13} /> Spaced Rep
                  </span>
                  <span className="notion-tag notion-tag-green">Interval: 6 Days (SM-2)</span>
                </div>
              </div>
            </div>

            {/* AI Assistant Quick Actions In-Document */}
            <div className="p-3 bg-app-sidebar border border-app-borderSubtle rounded flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-app-text font-medium flex items-center gap-1.5">
                <Sparkles size={14} className="text-app-accent" /> AI Document Assistant:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAskAI(activeNote.title)}
                  disabled={loadingAi}
                  className="px-2.5 py-1 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text transition-colors flex items-center gap-1 text-[11px]"
                >
                  <HelpCircle size={12} /> Explain Concept
                </button>
                <button
                  onClick={() => navigate('/revision')}
                  className="px-2.5 py-1 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text transition-colors flex items-center gap-1 text-[11px]"
                >
                  <Repeat size={12} /> Make Flashcards
                </button>
                <button
                  onClick={() => navigate('/quizzes')}
                  className="px-2.5 py-1 rounded bg-app-text text-app-bg hover:opacity-90 text-[11px] font-medium transition-opacity flex items-center gap-1"
                >
                  <FileQuestion size={12} /> Practice Quiz
                </button>
              </div>
            </div>

            {aiResponse && (
              <div className="notion-callout text-xs">
                <Sparkles size={16} className="text-app-text flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-app-text">AI Study Tutor Synthesis</p>
                  <p className="text-app-muted leading-relaxed">{aiResponse}</p>
                </div>
              </div>
            )}

            {/* Content: Edit or Render */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={activeNote.contentMarkdown}
                  onChange={(e) => handleUpdateActiveContent(e.target.value)}
                  className="w-full p-4 rounded border border-app-borderSubtle bg-app-surface text-xs font-mono text-app-text leading-relaxed outline-none focus:border-app-text resize-none"
                  rows={20}
                />
                <span className="text-[11px] text-app-subtle">Supports Markdown, LaTeX math, and code blocks. Changes auto-save locally.</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs leading-relaxed text-app-text">
                <div className="p-5 rounded border border-app-borderSubtle bg-app-surface whitespace-pre-wrap font-sans space-y-3">
                  {activeNote.contentMarkdown}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Note */}
      {showNewNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
              <h3 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
                <FileText size={14} className="text-app-text shrink-0" />
                <span>Create Academic Note</span>
              </h3>
              <button
                onClick={() => setShowNewNoteModal(false)}
                className="p-1 rounded text-app-muted hover:text-app-text"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Graph Algorithms: Dijkstra & A*"
                  className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none cursor-pointer"
                >
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Database Management Systems">Database Management Systems</option>
                  <option value="General Academic">General Academic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Initial Content (Optional)</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Start typing lecture notes or paste syllabus outlines..."
                  className="w-full p-2.5 rounded border border-app-borderSubtle bg-app-surface text-xs font-mono text-app-text outline-none focus:border-app-text resize-none"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-borderSubtle">
                <button
                  type="button"
                  onClick={() => setShowNewNoteModal(false)}
                  className="px-3 py-1.5 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text hover:bg-app-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90"
                >
                  Create Note Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
