import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Calendar,
  Sparkles,
  BookOpen,
  FileText,
  Repeat,
  CheckSquare,
  Award,
  Orbit,
  Settings,
  Sun,
  Moon,
  LogOut,
  ArrowRight,
  PlusCircle,
  Code2,
  LucideIcon
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Subjects';
  icon: LucideIcon;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const { logout } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    // Navigation
    {
      id: 'nav-home',
      title: 'Home (What are you working on today?)',
      category: 'Navigation',
      icon: Home,
      action: () => navigate('/dashboard')
    },
    {
      id: 'nav-tools',
      title: 'All Tools & Workspaces (Complete Feature Library)',
      category: 'Navigation',
      icon: LayoutGrid,
      action: () => navigate('/tools')
    },
    {
      id: 'nav-ai',
      title: 'AI Study Assistant (Curriculum Tutor & Formats)',
      category: 'Navigation',
      icon: Sparkles,
      action: () => navigate('/ai')
    },
    {
      id: 'nav-planner',
      title: 'Study Planner (Table, Board, Calendar, List)',
      category: 'Navigation',
      icon: Calendar,
      action: () => navigate('/planner')
    },
    {
      id: 'nav-analytics',
      title: 'Custom Dashboards & Analytics',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => navigate('/analytics')
    },
    {
      id: 'nav-ide',
      title: 'Code IDE (Multi-Language Development & AI Coding Agent)',
      category: 'Navigation',
      icon: Code2,
      action: () => navigate('/ide')
    },
    {
      id: 'nav-notes',
      title: 'Academic Notes',
      category: 'Navigation',
      icon: FileText,
      action: () => navigate('/notes')
    },
    {
      id: 'nav-ai',
      title: 'AI Study Assistant',
      category: 'Navigation',
      icon: Sparkles,
      action: () => navigate('/ai')
    },
    {
      id: 'nav-subjects',
      title: 'Subjects & Syllabus',
      category: 'Navigation',
      icon: BookOpen,
      action: () => navigate('/subjects')
    },
    {
      id: 'nav-revision',
      title: 'Spaced Repetition (Flashcards)',
      category: 'Navigation',
      icon: Repeat,
      action: () => navigate('/revision')
    },
    {
      id: 'nav-quizzes',
      title: 'Assessments & Quizzes',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => navigate('/quizzes')
    },
    {
      id: 'nav-rewards',
      title: 'Rewards & Achievements',
      category: 'Navigation',
      icon: Award,
      action: () => navigate('/rewards')
    },
    {
      id: 'nav-universe',
      title: '3D Study Universe (Blender)',
      category: 'Navigation',
      icon: Orbit,
      action: () => navigate('/universe')
    },
    {
      id: 'nav-settings',
      title: 'Workspace Preferences',
      category: 'Navigation',
      icon: Settings,
      action: () => navigate('/settings')
    },

    // Actions
    {
      id: 'act-new-session',
      title: 'Start Deep Study Session',
      category: 'Actions',
      icon: PlusCircle,
      action: () => navigate('/planner')
    },
    {
      id: 'act-ai-ask',
      title: 'Ask AI Tutor a Question',
      category: 'Actions',
      icon: Sparkles,
      action: () => navigate('/ai')
    },
    {
      id: 'act-toggle-theme',
      title: `Toggle Theme (Currently: ${theme})`,
      category: 'Actions',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    },
    {
      id: 'act-logout',
      title: 'Log out of Workspace',
      category: 'Actions',
      icon: LogOut,
      action: logout
    }
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-app-borderSubtle">
          <Search size={18} className="text-app-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, notes, subjects, or actions..."
            className="flex-1 bg-transparent border-none text-app-text placeholder-app-muted text-sm focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono text-app-muted bg-app-sidebar border border-app-borderSubtle rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-app-muted">
              No matching pages or commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-app-hover text-app-text'
                      : 'text-app-text hover:bg-app-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isSelected ? 'text-app-accent' : 'text-app-muted'} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-app-muted uppercase tracking-wider">{item.category}</span>
                    {isSelected && <ArrowRight size={13} className="text-app-muted" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-app-borderSubtle bg-app-sidebar flex items-center justify-between text-[11px] text-app-muted">
          <span>Navigate with <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
          <span>Select with <kbd className="font-mono">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
}
