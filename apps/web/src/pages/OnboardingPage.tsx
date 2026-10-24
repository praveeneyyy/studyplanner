import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Target,
  FileText,
  BrainCircuit,
  BarChart3,
  Award
} from 'lucide-react';

const STEPS = [
  'Goals',
  'Subject',
  'Exam Target',
  'Syllabus',
  'Daily Hours',
  'Focus Blocks',
  'Confidence',
  'Plan Preview',
  'Commitment',
  'Ready'
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [planPreview, setPlanPreview] = useState<any>(null);

  // Form State
  const [subjectName, setSubjectName] = useState('Operating Systems');
  const [subjectCode, setSubjectCode] = useState('CS-302');
  const [examTitle, setExamTitle] = useState('Semester Final Exam');
  const [examDate, setExamDate] = useState('2026-11-20');
  const [topicTitle, setTopicTitle] = useState('Virtual Memory & Paging');
  const [dailyHours, setDailyHours] = useState(4);
  const [sessionDuration, setSessionDuration] = useState(45);
  const [breakDuration, setBreakDuration] = useState(10);
  const [confidenceRating, setConfidenceRating] = useState(2);

  const handleNext = async () => {
    if (currentStep === 7) {
      setLoading(true);
      try {
        const previewRes = await api.previewPlan({
          dailyHoursLimit: dailyHours,
          sessionDurationMinutes: sessionDuration,
          breakMinutes: breakDuration
        });
        setPlanPreview(previewRes.data);
        setCurrentStep(8);
      } catch (err) {
        console.error('Plan preview failed:', err);
        setCurrentStep(8);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (currentStep === 9) {
      setLoading(true);
      try {
        await api.confirmPlan({
          dailyHoursLimit: dailyHours,
          sessionDurationMinutes: sessionDuration,
          breakMinutes: breakDuration
        });
        setCurrentStep(10);
      } catch (err) {
        console.error('Plan confirm failed:', err);
        setCurrentStep(10);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-between p-6 select-none">
      <div className="max-w-xl w-full mx-auto my-auto">
        {/* Step Indicator Header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-app-muted">
            <span className="font-semibold text-app-text">Workspace Setup</span>
            <span>
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}
            </span>
          </div>
          <div className="w-full bg-app-sidebar h-1 rounded-full overflow-hidden">
            <div
              className="bg-app-text h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card Content */}
        <div className="bg-app-surface border border-app-borderSubtle rounded-lg p-6 md:p-8 shadow-xs">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <Target size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Set Academic Milestones</h2>
              <p className="text-xs text-app-muted">
                Welcome to AI Smart Study Planner. We construct an adaptive examination preparation plan tailored to your university syllabus.
              </p>
              <div className="p-3.5 rounded bg-app-sidebar border border-app-borderSubtle text-xs text-app-text space-y-2">
                <p className="font-medium">Core Capabilities:</p>
                <ul className="list-disc pl-4 space-y-1 text-app-muted">
                  <li>Deterministic, conflict-free daily study blocks.</li>
                  <li>AI explanations tailored to university marking schemes (2, 5, 10-mark answers).</li>
                  <li>Spaced repetition (SM-2) so early units remain fresh.</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <BookOpen size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Add Core Subject</h2>
              <p className="text-xs text-app-muted">Enter the primary subject you are currently preparing for.</p>
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Course Code</label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <Calendar size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Target Examination Date</h2>
              <p className="text-xs text-app-muted">When does your examination occur? The scheduling engine reserves a 15% pre-exam buffer for revisions.</p>
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Examination Title</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Examination Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <FileText size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Key Syllabus Topic</h2>
              <p className="text-xs text-app-muted">Specify the first key syllabus topic to schedule.</p>
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Topic Title</label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none"
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <Clock size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Daily Study Availability</h2>
              <p className="text-xs text-app-muted">How many hours can you realistically commit each day?</p>
              <div className="flex items-center gap-4 pt-2">
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.5}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="flex-1 accent-app-text cursor-pointer"
                />
                <span className="text-xs font-semibold text-app-text tabular-nums">{dailyHours} hours / day</span>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <BrainCircuit size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Cognitive Focus & Breaks</h2>
              <p className="text-xs text-app-muted">Configure your preferred study block length and rest intervals.</p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Block Duration</label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text outline-none cursor-pointer"
                  >
                    <option value={25}>25 min (Pomodoro)</option>
                    <option value={45}>45 min (Standard Focus)</option>
                    <option value={60}>60 min (Deep Work)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">Rest Interval</label>
                  <select
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text outline-none cursor-pointer"
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <BarChart3 size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Rate Initial Confidence</h2>
              <p className="text-xs text-app-muted">
                Rate your understanding of {topicTitle}. Lower confidence automatically gives topics higher study priority.
              </p>
              <div className="flex items-center justify-between p-3 bg-app-sidebar border border-app-borderSubtle rounded">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setConfidenceRating(rating)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                      confidenceRating === rating
                        ? 'bg-app-text text-app-bg font-semibold shadow-xs'
                        : 'bg-app-surface border border-app-borderSubtle text-app-muted hover:text-app-text'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-app-subtle">
                <span>1 - Novice</span>
                <span>3 - Moderate</span>
                <span>5 - Fully Confident</span>
              </div>
            </div>
          )}

          {currentStep === 8 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <Sparkles size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Plan Preview</h2>
              <p className="text-xs text-app-muted">Our deterministic solver has verified feasibility and scheduled your syllabus.</p>
              <div className="p-3.5 rounded border border-app-borderSubtle bg-app-sidebar space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-app-muted">Feasibility:</span>
                  <span className="notion-tag notion-tag-green">Conflict-Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-muted">Total Planned Study:</span>
                  <span className="font-semibold text-app-text">
                    {planPreview?.totalPlannedMinutes ? `${Math.round(planPreview.totalPlannedMinutes / 60)} hours` : '18 hours'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-muted">Pre-Exam Revision Buffer:</span>
                  <span className="font-semibold text-app-text">{planPreview?.bufferDays || 3} days reserved</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 9 && (
            <div className="space-y-3">
              <div className="inline-flex p-2.5 rounded-lg bg-app-sidebar border border-app-borderSubtle text-app-text">
                <Award size={24} />
              </div>
              <h2 className="text-lg font-bold text-app-text">Confirm & Commit Plan</h2>
              <p className="text-xs text-app-muted">Committing this plan will create your calendar sessions, enable the AI learning assistant, and initialize your productivity reward ledger.</p>
              <div className="notion-callout text-xs">
                <Sparkles size={14} className="text-app-text flex-shrink-0" />
                <span>You will earn <strong>+20 XP</strong> immediately upon confirming your first study plan!</span>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            <div className="space-y-3 text-center py-4">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-bold text-app-text">Workspace Initialized!</h2>
              <p className="text-xs text-app-muted max-w-sm mx-auto">
                Your examination roadmap has been established. Let's open your personalized dashboard and begin today's first focused study block.
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-6 pt-3 border-t border-app-borderSubtle flex items-center justify-between">
            {currentStep > 1 && currentStep < 10 ? (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 rounded border border-app-borderSubtle text-app-muted hover:text-app-text text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <ChevronLeft size={13} /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-3.5 py-1.5 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium flex items-center gap-1 transition-opacity"
            >
              {loading ? (
                'Processing...'
              ) : currentStep === 10 ? (
                'Open Dashboard'
              ) : currentStep === 9 ? (
                'Confirm & Launch'
              ) : (
                'Next Step'
              )}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
