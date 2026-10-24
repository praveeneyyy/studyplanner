import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import {
  BookOpen,
  Plus,
  Calendar,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  FileText,
  X,
  Clock,
  Trash2
} from 'lucide-react';

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Modal State: Subject
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubColor, setNewSubColor] = useState('cs');
  const [newSubPriority, setNewSubPriority] = useState(4);

  // Modal State: Unit
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [newUnitTitle, setNewUnitTitle] = useState('');

  // Modal State: Topic
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [targetUnitId, setTargetUnitId] = useState<string>('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicMinutes, setNewTopicMinutes] = useState(45);
  const [newTopicDifficulty, setNewTopicDifficulty] = useState(3);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      const res = await api.getSubjects();
      if (res?.data) {
        setSubjects(res.data);
        if (res.data.length > 0 && !expandedSubject) setExpandedSubject(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    try {
      await api.createSubject({
        name: newSubName.trim(),
        code: newSubCode.trim(),
        colorToken: newSubColor as any,
        priority: newSubPriority
      });
      setShowAddSubject(false);
      setNewSubName('');
      setNewSubCode('');
      loadSubjects();
    } catch (err) {
      console.error('Failed to create subject:', err);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (window.confirm(`Delete subject "${name}" and all its units and topics?`)) {
      try {
        await api.request(`/subjects/${id}`, { method: 'DELETE' });
        loadSubjects();
      } catch (err) {
        console.error('Failed to delete subject:', err);
      }
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim() || !targetSubjectId) return;
    try {
      await api.request(`/subjects/${targetSubjectId}/units`, {
        method: 'POST',
        body: JSON.stringify({ title: newUnitTitle.trim(), unitNumber: 1 })
      });
      setShowAddUnit(false);
      setNewUnitTitle('');
      loadSubjects();
    } catch (err) {
      console.error('Failed to create unit:', err);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !targetUnitId) return;
    try {
      await api.request(`/units/${targetUnitId}/topics`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTopicTitle.trim(),
          estimatedMinutes: newTopicMinutes,
          difficulty: newTopicDifficulty,
          importance: 4,
          confidence: 1
        })
      });
      setShowAddTopic(false);
      setNewTopicTitle('');
      loadSubjects();
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  };

  const getSubjectColorTag = (token: string, name: string) => {
    if (token === 'cs' || name.includes('Data')) return 'notion-tag-blue';
    if (token === 'math' || name.includes('Operating')) return 'notion-tag-purple';
    if (name.includes('Database')) return 'notion-tag-yellow';
    return 'notion-tag-orange';
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'Subjects & Syllabus' }
        ]}
        subtitle="Curriculum database"
      />

      <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Notion Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl font-bold text-app-text">
              <BookOpen size={24} className="text-app-text shrink-0" />
              <h1 className="text-2xl font-bold tracking-tight text-app-text">Subjects & Syllabus</h1>
            </div>
            <button
              onClick={() => setShowAddSubject(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium transition-opacity"
            >
              <Plus size={13} /> Add Subject
            </button>
          </div>
          <p className="text-xs text-app-muted">
            Hierarchical structure of your degree courses, units, topics, estimated difficulty, and examination milestones.
          </p>
        </div>

        {/* Subjects Database Accordions */}
        {loading ? (
          <div className="py-16 text-center text-xs text-app-muted flex flex-col items-center gap-2">
            <div className="w-4 h-4 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
            <span>Loading syllabus...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-app-borderSubtle rounded-lg space-y-3">
            <BookOpen size={28} className="mx-auto text-app-subtle" />
            <h3 className="text-xs font-semibold text-app-text">No subjects registered</h3>
            <p className="text-xs text-app-muted max-w-sm mx-auto">
              Add your university subjects to begin building your deterministic exam schedule.
            </p>
            <button
              onClick={() => setShowAddSubject(true)}
              className="px-3 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium"
            >
              Add First Subject
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((sub) => {
              const isExpanded = expandedSubject === sub.id;
              const topicCount = (sub.units || []).reduce(
                (acc: number, u: any) => acc + (u.topics?.length || 0),
                0
              );
              const tagClass = getSubjectColorTag(sub.colorToken, sub.name);

              return (
                <div
                  key={sub.id}
                  className="rounded border border-app-borderSubtle bg-app-surface overflow-hidden transition-all"
                >
                  {/* Subject Header Row */}
                  <div
                    onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-app-hover/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`notion-tag ${tagClass}`}>
                        {sub.code || 'SUB'}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-app-text">{sub.name}</h3>
                        <p className="text-[11px] text-app-muted mt-0.5">
                          {sub.units?.length || 0} Units • {topicCount} Topics • Priority {sub.priority}/5
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {sub.examinations?.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-app-muted bg-app-sidebar px-2 py-0.5 rounded border border-app-borderSubtle">
                          <Calendar size={12} className="text-app-subtle" />
                          <span>
                            Exam:{' '}
                            {new Date(sub.examinations[0].examDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(sub.id, sub.name);
                        }}
                        className="p-1 rounded text-app-subtle hover:text-red-500 hover:bg-app-hover transition-colors"
                        title="Delete subject"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button className="text-app-muted hover:text-app-text">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Units & Topics */}
                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-app-borderSubtle bg-app-sidebar/20 space-y-3">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-medium text-app-subtle uppercase tracking-wider">
                          Syllabus Units
                        </span>
                        <button
                          onClick={() => {
                            setTargetSubjectId(sub.id);
                            setShowAddUnit(true);
                          }}
                          className="flex items-center gap-1 text-xs text-app-text hover:underline font-medium"
                        >
                          <Plus size={12} /> Add Unit
                        </button>
                      </div>

                      {sub.units?.length > 0 ? (
                        sub.units.map((unit: any) => (
                          <div
                            key={unit.id}
                            className="p-3 rounded border border-app-borderSubtle bg-app-surface space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
                                <Layers size={13} className="text-app-subtle" />
                                {unit.title}
                              </h4>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-app-muted tabular-nums">
                                  {unit.topics?.length || 0} topics
                                </span>
                                <button
                                  onClick={() => {
                                    setTargetUnitId(unit.id);
                                    setShowAddTopic(true);
                                  }}
                                  className="flex items-center gap-1 text-[11px] text-app-muted hover:text-app-text font-medium"
                                >
                                  <Plus size={11} /> Add Topic
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                              {unit.topics?.map((topic: any) => (
                                <div
                                  key={topic.id}
                                  className="p-2.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover flex flex-col justify-between transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <h5 className="text-xs font-medium text-app-text truncate">{topic.title}</h5>
                                      <span
                                        className={`notion-tag text-[10px] ${
                                          topic.status === 'MASTERED'
                                            ? 'notion-tag-green'
                                            : 'notion-tag-gray'
                                        }`}
                                      >
                                        {topic.status}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-app-muted flex items-center gap-1">
                                      <Clock size={10} /> {topic.estimatedMinutes} min • Diff: {topic.difficulty}/5
                                    </p>
                                  </div>

                                  <div className="mt-2 pt-1.5 border-t border-app-borderSubtle/60 flex items-center justify-between text-[11px]">
                                    <span className="text-app-subtle">Confidence:</span>
                                    <span className="font-semibold text-app-text tabular-nums">
                                      {topic.confidence ? `${topic.confidence * 20}%` : '0%'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-app-muted">
                          No units created for this subject yet. Click "+ Add Unit" above to begin.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Notion Modal: Add Subject */}
        {showAddSubject && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                <h3 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
                  <BookOpen size={16} className="text-app-text" /> Add Academic Subject
                </h3>
                <button
                  onClick={() => setShowAddSubject(false)}
                  className="p-1 rounded text-app-muted hover:text-app-text"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="e.g. Distributed Systems"
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Course Code</label>
                    <input
                      type="text"
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value)}
                      placeholder="e.g. CS401"
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Priority (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={newSubPriority}
                      onChange={(e) => setNewSubPriority(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-borderSubtle">
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(false)}
                    className="px-3 py-1.5 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text hover:bg-app-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90"
                  >
                    Create Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notion Modal: Add Unit */}
        {showAddUnit && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                <h3 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
                  <Layers size={14} /> Add Curriculum Unit
                </h3>
                <button
                  onClick={() => setShowAddUnit(false)}
                  className="p-1 rounded text-app-muted hover:text-app-text"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateUnit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Unit Title</label>
                  <input
                    type="text"
                    required
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder="e.g. Unit 1: Foundations & Architecture"
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-borderSubtle">
                  <button
                    type="button"
                    onClick={() => setShowAddUnit(false)}
                    className="px-3 py-1.5 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text hover:bg-app-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90"
                  >
                    Add Unit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notion Modal: Add Topic */}
        {showAddTopic && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                <h3 className="text-sm font-semibold text-app-text flex items-center gap-1.5">
                  <BookOpen size={14} /> Add Topic to Unit
                </h3>
                <button
                  onClick={() => setShowAddTopic(false)}
                  className="p-1 rounded text-app-muted hover:text-app-text"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateTopic} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Topic Title</label>
                  <input
                    type="text"
                    required
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="e.g. Two-Phase Commit & Consensus"
                    className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Est. Minutes</label>
                    <input
                      type="number"
                      min={15}
                      max={180}
                      step={5}
                      value={newTopicMinutes}
                      onChange={(e) => setNewTopicMinutes(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">Difficulty (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={newTopicDifficulty}
                      onChange={(e) => setNewTopicDifficulty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-surface text-xs text-app-text outline-none focus:border-app-text"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-borderSubtle">
                  <button
                    type="button"
                    onClick={() => setShowAddTopic(false)}
                    className="px-3 py-1.5 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text hover:bg-app-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90"
                  >
                    Add Topic
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
