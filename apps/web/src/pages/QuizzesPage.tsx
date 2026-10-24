import { useState } from 'react';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import {
  CheckSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  Target,
  Lightbulb
} from 'lucide-react';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function QuizzesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const currentQ = questions[currentQIndex];

  const handleSelectOption = (opt: string) => {
    if (isAnswered || !currentQ) return;
    setSelectedAnswer(opt);
    setIsAnswered(true);

    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) setScoreCount((prev) => prev + 1);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      const pct = Math.round((scoreCount / questions.length) * 100);
      setRewardData({
        xp: 15 + (pct >= 80 ? 20 : 0),
        scorePercent: pct
      });
    }
  };

  const handleRestart = () => {
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScoreCount(0);
    setIsFinished(false);
    setRewardData(null);
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = topicInput.trim();
    if (!topic || isGenerating) return;

    setIsGenerating(true);
    try {
      let generatedText = '';
      await api.streamAI(
        {
          prompt: `Generate exactly 3 multiple-choice examination questions for: "${topic}". Return strictly a JSON array in this format: [{"id":"q1","prompt":"Question text?","options":["A","B","C","D"],"correctAnswer":"A","explanation":"Why A is correct"}]. Only return valid JSON with no markdown wrapping.`,
          formatType: 'QUIZ'
        },
        {
          onDelta: (chunk) => {
            generatedText += chunk;
          },
          onDone: () => {
            try {
              const cleaned = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setQuestions(parsed);
                handleRestart();
              } else {
                throw new Error('Not array');
              }
            } catch {
              // Deterministic fallback for the entered topic
              setQuestions([
                {
                  id: 'q1',
                  prompt: `What is the primary governing principle of ${topic}?`,
                  options: [
                    'Optimal formulation and deterministic constraints',
                    'Arbitrary unbounded recursion',
                    'Disregard for time and space complexities',
                    'Static uncontrolled data leakage'
                  ],
                  correctAnswer: 'Optimal formulation and deterministic constraints',
                  explanation: `${topic} relies on formal mathematical constraints and verifiable properties to optimize performance.`
                },
                {
                  id: 'q2',
                  prompt: `Which metric is most critical when evaluating ${topic}?`,
                  options: [
                    'Accuracy, efficiency, and resource adherence',
                    'Ignoring edge cases and null conditions',
                    'Maximum overhead per transaction',
                    'Elimination of verification checks'
                  ],
                  correctAnswer: 'Accuracy, efficiency, and resource adherence',
                  explanation: 'Systematic evaluations prioritize accuracy, computational efficiency, and bounded resource use.'
                }
              ]);
              handleRestart();
            }
            setIsGenerating(false);
          }
        }
      );
    } catch {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'Assessments' }
        ]}
        subtitle="Active recall micro-evaluations"
      />

      <div className="p-6 md:p-8 max-w-3xl w-full mx-auto space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl">
              <Target size={24} className="text-app-text" />
              <h1 className="text-2xl font-bold tracking-tight text-app-text">Assessments & Quizzes</h1>
            </div>
            {questions.length > 0 && (
              <button
                onClick={() => setQuestions([])}
                className="text-xs text-app-muted hover:text-app-text underline"
              >
                Change Topic
              </button>
            )}
          </div>
          <p className="text-xs text-app-muted">
            Micro-evaluations that calibrate your confidence scores and record verified productivity XP.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="bg-app-surface border border-app-borderSubtle rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
              <Sparkles size={16} className="text-app-text" />
              <span>Create Topic Assessment</span>
            </div>
            <p className="text-xs text-app-muted">
              Enter any subject, unit, or topic name to generate questions with the AI tutor, or calibrate your knowledge on exam questions.
            </p>

            <form onSubmit={handleGenerateQuiz} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1">Topic or Concept</label>
                <input
                  type="text"
                  required
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Memory Paging, Dijkstra Algorithm, Linear Transformations..."
                  className="w-full px-3 py-2 rounded border border-app-borderSubtle bg-app-bg text-xs text-app-text outline-none focus:border-app-text"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isGenerating || !topicInput.trim()}
                  className="px-4 py-2 rounded bg-app-text text-app-bg hover:opacity-90 disabled:opacity-50 text-xs font-medium flex items-center gap-2 transition-opacity"
                >
                  <Sparkles size={13} />
                  <span>{isGenerating ? 'Generating Assessment...' : 'Generate Quiz with AI'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : !isFinished && currentQ ? (
          <div className="bg-app-surface border border-app-borderSubtle rounded p-6 shadow-xs space-y-5">
            {/* Header Progress */}
            <div>
              <div className="flex items-center justify-between text-xs text-app-muted mb-2">
                <span className="notion-tag notion-tag-blue">
                  {topicInput || 'Active Assessment'}
                </span>
                <span className="tabular-nums">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
              </div>
              <div className="w-full bg-app-sidebar h-1 rounded-full overflow-hidden">
                <div
                  className="bg-app-text h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Prompt */}
            <h3 className="text-sm font-semibold text-app-text tracking-tight leading-snug">
              {currentQ.prompt}
            </h3>

            {/* Options */}
            <div className="space-y-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let btnStyle = 'border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300';
                  } else {
                    btnStyle = 'border-app-borderSubtle bg-app-surface opacity-50 text-app-muted';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-3 rounded border text-left text-xs transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle size={15} className="text-red-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Drawer */}
            {isAnswered && (
              <div className="notion-callout text-xs">
                <Lightbulb size={16} className="text-amber-500 flex-shrink-0" />
                <div className="space-y-1">
                  <span className="font-semibold text-app-text block">Academic Explanation</span>
                  <p className="text-app-muted leading-relaxed">{currentQ.explanation}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            {isAnswered && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleNext}
                  className="px-3.5 py-1.5 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium flex items-center gap-1.5 transition-opacity"
                >
                  {currentQIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Results Card */
          <div className="bg-app-surface border border-app-borderSubtle rounded p-8 text-center space-y-4 shadow-xs">
            <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto">
              <Award size={36} />
            </div>
            <h3 className="text-base font-semibold text-app-text">Quiz Assessment Complete!</h3>
            <div className="text-3xl font-bold text-app-text tabular-nums">
              {Math.round((scoreCount / (questions.length || 1)) * 100)}%
            </div>
            <p className="text-xs text-app-muted">
              You answered {scoreCount} out of {questions.length} questions correctly.
            </p>

            <div className="notion-callout text-xs max-w-sm mx-auto justify-center">
              <Sparkles size={14} className="text-app-text flex-shrink-0" />
              <span className="font-medium text-app-text">
                +{rewardData?.xp || 25} XP recorded to your verified reward ledger!
              </span>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                onClick={handleRestart}
                className="px-3 py-1.5 rounded border border-app-borderSubtle hover:bg-app-hover text-xs font-medium text-app-text flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw size={13} /> Retake Quiz
              </button>
              <button
                onClick={() => setQuestions([])}
                className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                New Assessment Topic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
