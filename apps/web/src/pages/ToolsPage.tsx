import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import {
  Calendar,
  Sparkles,
  Code2,
  BookOpen,
  Repeat,
  FileText,
  CheckSquare,
  Orbit,
  Award,
  Settings,
  Search,
  ArrowRight,
  Terminal,
  Cpu,
  BrainCircuit,
  Sliders,
  RotateCcw,
  LayoutDashboard,
  Clock,
  Layers,
  LucideIcon
} from 'lucide-react';

export type ToolCategory = 'ALL' | 'STUDY' | 'AI' | 'DEVELOPMENT' | 'PRODUCTIVITY' | 'SETTINGS';

interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  categoryLabel: string;
  description: string;
  icon: LucideIcon;
  to: string;
  badge?: string;
  badgeColor?: string;
}

const ALL_TOOLS: ToolItem[] = [
  // STUDY
  {
    id: 'planner',
    name: 'Adaptive Study Planner',
    category: 'STUDY',
    categoryLabel: 'Study',
    description: 'Algorithmic constraint-based examination scheduling with workload balancing and exam buffers.',
    icon: Calendar,
    to: '/planner',
    badge: 'Core'
  },
  {
    id: 'subjects',
    name: 'Subjects & Syllabus',
    category: 'STUDY',
    categoryLabel: 'Study',
    description: 'Course unit hierarchies, topic confidence ratings, syllabus coverage, and target exam milestones.',
    icon: BookOpen,
    to: '/subjects'
  },
  {
    id: 'revision',
    name: 'Spaced Repetition Decks',
    category: 'STUDY',
    categoryLabel: 'Study',
    description: 'SuperMemo SM-2 active recall flashcards with dynamic ease factors and interval decay queues.',
    icon: Repeat,
    to: '/revision',
    badge: 'SM-2'
  },
  {
    id: 'notes',
    name: 'Academic Notes',
    category: 'STUDY',
    categoryLabel: 'Study',
    description: 'Structured course revision notes, markdown summaries, formulas, and concept cheat sheets.',
    icon: FileText,
    to: '/notes'
  },
  {
    id: 'quizzes',
    name: 'Practice Assessments',
    category: 'STUDY',
    categoryLabel: 'Study',
    description: 'Self-testing micro-quizzes, active recall diagnostics, and historical accuracy tracking.',
    icon: CheckSquare,
    to: '/quizzes'
  },

  // AI & TUTORING
  {
    id: 'ai-tutor',
    name: 'AI Study Assistant',
    category: 'AI',
    categoryLabel: 'AI & Tutoring',
    description: 'Conversational academic tutor supporting 16 specialized curriculum response formats.',
    icon: Sparkles,
    to: '/ai',
    badge: '16 Formats'
  },
  {
    id: 'ai-plan-builder',
    name: 'AI Study Plan Builder',
    category: 'AI',
    categoryLabel: 'AI & Tutoring',
    description: 'Conversational schedule designer that drafts conflict-free study plans from your natural language constraints.',
    icon: BrainCircuit,
    to: '/planner?builder=true',
    badge: 'Interactive'
  },
  {
    id: 'ai-error-explainer',
    name: 'Code Error Explainer',
    category: 'AI',
    categoryLabel: 'AI & Tutoring',
    description: 'Automated syntax and runtime diagnostic assistant with line markers and algorithmic optimization hints.',
    icon: Cpu,
    to: '/ide'
  },
  {
    id: 'ai-revision-generator',
    name: 'Revision Notes Generator',
    category: 'AI',
    categoryLabel: 'AI & Tutoring',
    description: 'Generate high-yield bulleted cheat sheets and exam revision summaries for any syllabus topic.',
    icon: FileText,
    to: '/ai?format=SHORT_NOTES'
  },

  // DEVELOPMENT
  {
    id: 'ide',
    name: 'Student Code IDE',
    category: 'DEVELOPMENT',
    categoryLabel: 'Development',
    description: 'Professional Monaco code editor supporting JavaScript, Python, JSON, and SQL syntax.',
    icon: Code2,
    to: '/ide',
    badge: 'Monaco'
  },
  {
    id: 'execution-sandbox',
    name: 'Code Execution Sandbox',
    category: 'DEVELOPMENT',
    categoryLabel: 'Development',
    description: 'Secure isolated in-process execution environment with strict 5-second timeout guards and memory limits.',
    icon: Terminal,
    to: '/ide'
  },

  // PRODUCTIVITY & ANALYTICS
  {
    id: 'todays-agenda',
    name: "Today's Study Agenda",
    category: 'PRODUCTIVITY',
    categoryLabel: 'Productivity',
    description: 'Chronological daily study queue with focused session workspaces, timers, and progress tracking.',
    icon: Clock,
    to: '/dashboard'
  },
  {
    id: 'universe',
    name: '3D Study Universe',
    category: 'PRODUCTIVITY',
    categoryLabel: 'Productivity',
    description: 'Interactive celestial Three.js orbital topology visualizing subject mastery and knowledge retention.',
    icon: Orbit,
    to: '/universe',
    badge: 'Three.js'
  },
  {
    id: 'rewards',
    name: 'Rewards & XP Ledger',
    category: 'PRODUCTIVITY',
    categoryLabel: 'Productivity',
    description: 'Verified zero-trust experience point ledger, level milestones, streaks, and study achievements.',
    icon: Award,
    to: '/rewards'
  },
  {
    id: 'recovery',
    name: 'Missed Session Recovery',
    category: 'PRODUCTIVITY',
    categoryLabel: 'Productivity',
    description: 'One-click intelligent rebalancing of overdue sessions into upcoming free daily time slots.',
    icon: RotateCcw,
    to: '/planner'
  },
  {
    id: 'analytics-dashboards',
    name: 'Custom Dashboards & Metrics',
    category: 'PRODUCTIVITY',
    categoryLabel: 'Productivity',
    description: 'Multi-view customizable study dashboards with exam countdowns, subject filters, and target gauges.',
    icon: LayoutDashboard,
    to: '/analytics'
  },

  // SETTINGS
  {
    id: 'settings-profile',
    name: 'Profile & Institution',
    category: 'SETTINGS',
    categoryLabel: 'Settings',
    description: 'Configure academic degree level, enrolled institution, timezone, and student profile information.',
    icon: Settings,
    to: '/settings'
  },
  {
    id: 'settings-preferences',
    name: 'Study Preferences',
    category: 'SETTINGS',
    categoryLabel: 'Settings',
    description: 'Customize daily study minute goals, default session lengths, break intervals, and audio alerts.',
    icon: Sliders,
    to: '/settings'
  },
  {
    id: 'settings-appearance',
    name: 'Appearance & Themes',
    category: 'SETTINGS',
    categoryLabel: 'Settings',
    description: 'Toggle Light, Dark, or System theme synchronization with token-based CSS variables.',
    icon: Layers,
    to: '/settings'
  }
];

const CATEGORIES: Array<{ key: ToolCategory; label: string }> = [
  { key: 'ALL', label: 'All Tools' },
  { key: 'STUDY', label: 'Study & Planning' },
  { key: 'AI', label: 'AI & Tutoring' },
  { key: 'DEVELOPMENT', label: 'Development' },
  { key: 'PRODUCTIVITY', label: 'Productivity' },
  { key: 'SETTINGS', label: 'Settings' }
];

export function ToolsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('ALL');

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'ALL' || tool.category === selectedCategory;
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { ALL: ALL_TOOLS.length };
    for (const t of ALL_TOOLS) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-app-bg min-h-screen">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'All Tools & Features' }
        ]}
        subtitle="Complete tool library"
      />

      <div className="p-6 md:p-10 max-w-5xl w-full mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-app-surface text-app-muted border border-app-borderSubtle">
            <span>Tool Library</span>
            <span>•</span>
            <span className="font-semibold text-app-text">{ALL_TOOLS.length} Available Tools</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-app-text">
            All Tools & Workspaces
          </h1>
          <p className="text-xs md:text-sm text-app-muted max-w-2xl">
            Access the complete ecosystem of study planners, AI academic tutors, development environments, and productivity utilities. Select any tool to open its dedicated workspace.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="space-y-3 pt-2">
          {/* Search Input Bar */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name, topic, or capability (e.g., flashcards, IDE, tutor, schedule)..."
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-app-surface border border-app-borderSubtle rounded-lg text-app-text placeholder-app-muted focus:outline-none focus:border-app-text transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-app-muted hover:text-app-text"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
            {CATEGORIES.map((cat) => {
              const count = countsByCategory[cat.key] || 0;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-app-text text-app-bg'
                      : 'bg-app-surface text-app-muted hover:text-app-text border border-app-borderSubtle hover:bg-app-hover'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-app-bg/20 text-app-bg'
                        : 'bg-app-hover text-app-subtle'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.to)}
                  className="group relative p-4 rounded-lg bg-app-surface border border-app-borderSubtle hover:border-app-border hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-8 h-8 rounded-md bg-app-hover text-app-text flex items-center justify-center shrink-0 group-hover:bg-app-text group-hover:text-app-bg transition-colors">
                        <Icon size={16} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-app-subtle uppercase tracking-wider">
                          {tool.categoryLabel}
                        </span>
                        {tool.badge && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-app-hover text-app-text border border-app-borderSubtle">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-app-text group-hover:text-app-accent transition-colors flex items-center gap-1.5">
                        <span>{tool.name}</span>
                      </h3>
                      <p className="text-xs text-app-muted leading-relaxed mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-3 border-t border-app-borderSubtle/60 flex items-center justify-between text-xs text-app-muted group-hover:text-app-text transition-colors">
                    <span className="text-[11px] font-medium">Open Workspace</span>
                    <ArrowRight
                      size={13}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-lg bg-app-surface border border-dashed border-app-borderSubtle space-y-3">
            <Search size={24} className="mx-auto text-app-muted opacity-40" />
            <h3 className="text-sm font-semibold text-app-text">No tools match your search</h3>
            <p className="text-xs text-app-muted max-w-sm mx-auto">
              No active tools found for "{searchQuery}" in {selectedCategory.toLowerCase()}. Try searching for "IDE", "flashcards", "planner", or clear your filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-medium text-app-text underline hover:opacity-80 pt-1"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
