import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Play,
  Code2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface TopicNode {
  id: string;
  title: string;
  subjectName: string;
  subjectColor: string;
  masteryScore: number;
  status: string;
  prerequisites?: string[];
  tier: number; // 1: Foundations, 2: Core, 3: Advanced, 4: Mastery
}

interface KnowledgeGraphViewProps {
  subjects: any[];
  onSelectTopic: (topic: any) => void;
  onStartFocus?: (topic: any) => void;
}

export function KnowledgeGraphView({
  subjects,
  onSelectTopic,
  onStartFocus
}: KnowledgeGraphViewProps) {
  const navigate = useNavigate();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Derive all topics with calculated prerequisite tiers
  const topics: TopicNode[] = useMemo(() => {
    if (!subjects || !Array.isArray(subjects)) return [];
    const list: TopicNode[] = [];

    const getSubjectColor = (name: string, index: number) => {
      const colors = ['#2563EB', '#7C3AED', '#D97706', '#059669', '#DB2777'];
      return colors[index % colors.length];
    };

    subjects.forEach((subj, sIdx) => {
      const subjColor = getSubjectColor(subj.name, sIdx);
      const units = subj.units || [];
      
      units.forEach((unit: any, uIdx: number) => {
        const uTopics = unit.topics || [];
        uTopics.forEach((t: any, tIdx: number) => {
          // Calculate tier based on position / difficulty
          let tier = 1;
          const diff = String(t.difficulty || '').toUpperCase();
          if (diff === 'HARD' || uIdx >= 3) {
            tier = 4;
          } else if (diff === 'MEDIUM' || uIdx === 2) {
            tier = 3;
          } else if (uIdx === 1 || tIdx > 1) {
            tier = 2;
          }

          list.push({
            id: t.id,
            title: t.title || t.name,
            subjectName: subj.name,
            subjectColor: subjColor,
            masteryScore: t.masteryScore ?? (t.status === 'COMPLETED' ? 88 : t.status === 'IN_PROGRESS' ? 62 : 35),
            status: t.status || 'PLANNED',
            tier
          });
        });
      });
    });

    return list;
  }, [subjects]);

  const filteredTopics = useMemo(() => {
    if (selectedSubjectId === 'ALL') return topics;
    return topics.filter((t) => t.subjectName === selectedSubjectId);
  }, [topics, selectedSubjectId]);

  const tiers = [
    { tier: 1, label: 'Phase 1: Foundations & Prerequisites', description: 'Elementary axioms, memory models & baseline theory' },
    { tier: 2, label: 'Phase 2: Core Mechanics', description: 'Operational algorithms, data layouts & system calls' },
    { tier: 3, label: 'Phase 3: Advanced Architectures', description: 'Optimization paradigms, trees & concurrency' },
    { tier: 4, label: 'Phase 4: Synthesis & Deep Mastery', description: 'System-level integration, NP problems & design' }
  ];

  const uniqueSubjectNames = useMemo(() => {
    const set = new Set<string>();
    topics.forEach((t) => set.add(t.subjectName));
    return Array.from(set);
  }, [topics]);

  const activeTopic = topics.find((t) => t.id === selectedNodeId);

  return (
    <div className="w-full h-full flex flex-col bg-app-surface text-app-text select-none overflow-hidden">
      {/* Subject Filter Pills Bar */}
      <div className="p-3 border-b border-app-borderSubtle bg-app-surface/90 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter size={13} className="text-app-muted" />
          <span className="text-[11px] font-semibold text-app-subtle uppercase tracking-wider">
            Filter Curriculum:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedSubjectId('ALL')}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
              selectedSubjectId === 'ALL'
                ? 'bg-app-text text-app-bg font-medium shadow-2xs'
                : 'text-app-muted hover:text-app-text hover:bg-app-hover border border-app-borderSubtle'
            }`}
          >
            All Courses ({topics.length} topics)
          </button>
          {uniqueSubjectNames.map((sName) => (
            <button
              key={sName}
              onClick={() => setSelectedSubjectId(sName)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                selectedSubjectId === sName
                  ? 'bg-app-text text-app-bg font-medium shadow-2xs'
                  : 'text-app-muted hover:text-app-text hover:bg-app-hover border border-app-borderSubtle'
              }`}
            >
              {sName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Multi-Tier Prerequisite DAG Flow */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {tiers.map((tMeta, tierIdx) => {
          const tierTopics = filteredTopics.filter((t) => t.tier === tMeta.tier);
          if (tierTopics.length === 0) return null;

          return (
            <div key={tMeta.tier} className="space-y-3 relative">
              {/* Prerequisite Flow Connector Line */}
              {tierIdx < tiers.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-app-border to-transparent -z-10" />
              )}

              {/* Tier Heading */}
              <div className="flex items-baseline justify-between border-b border-app-borderSubtle pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-app-hover text-app-text text-[11px] font-bold font-mono flex items-center justify-center border border-app-borderSubtle">
                    {tMeta.tier}
                  </span>
                  <h3 className="text-xs font-semibold text-app-text tracking-tight uppercase">
                    {tMeta.label}
                  </h3>
                </div>
                <span className="text-[11px] text-app-muted hidden sm:inline">
                  {tMeta.description}
                </span>
              </div>

              {/* Node Cards in this Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {tierTopics.map((topic) => {
                  const isMastered = topic.masteryScore >= 80;
                  const isDeveloping = topic.masteryScore >= 50 && topic.masteryScore < 80;
                  const isSelected = selectedNodeId === topic.id;

                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setSelectedNodeId(topic.id);
                        onSelectTopic(topic);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-app-text shadow-sm bg-app-hover'
                          : 'border-app-borderSubtle bg-app-surface hover:border-app-border hover:shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${topic.subjectColor}15`,
                              color: topic.subjectColor
                            }}
                          >
                            {topic.subjectName}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isMastered
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                : isDeveloping
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {topic.masteryScore}%
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-app-text group-hover:text-app-accent transition-colors line-clamp-2">
                          {topic.title}
                        </h4>
                      </div>

                      {/* Progress Track */}
                      <div className="space-y-1 pt-1 border-t border-app-borderSubtle/60">
                        <div className="w-full bg-app-borderSubtle h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isMastered ? 'bg-emerald-500' : isDeveloping ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${topic.masteryScore}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-app-muted">
                          <span>{isMastered ? 'Mastered' : isDeveloping ? 'In Progress' : 'Prerequisite'}</span>
                          <span className="font-mono">Tier {topic.tier}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Bottom Action Bar */}
      {activeTopic && (
        <div className="p-3.5 border-t border-app-borderSubtle bg-app-surface flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: activeTopic.subjectColor }}
            />
            <div className="min-w-0">
              <span className="text-[10px] text-app-subtle uppercase tracking-wider block">
                {activeTopic.subjectName} • Tier {activeTopic.tier} Prerequisite
              </span>
              <h4 className="text-xs font-bold text-app-text truncate">{activeTopic.title}</h4>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                if (onStartFocus) {
                  onStartFocus(activeTopic);
                } else {
                  navigate(`/planner`);
                }
              }}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Play size={11} className="fill-current" />
              <span>Deep Focus Session</span>
            </button>

            <button
              onClick={() => navigate('/ai')}
              className="px-3 py-1.5 rounded-lg border border-app-borderSubtle hover:bg-app-hover text-app-text text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles size={12} className="text-app-accent" />
              <span>Ask AI Tutor</span>
            </button>

            <button
              onClick={() => navigate('/ide')}
              className="px-3 py-1.5 rounded-lg border border-app-borderSubtle hover:bg-app-hover text-app-text text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Code2 size={12} />
              <span>Code in IDE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
