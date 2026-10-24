import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import {
  Repeat,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export function RevisionPage() {
  const [queue, setQueue] = useState<any>({ dueToday: [], overdue: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<any>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    try {
      const res = await api.getRevisionQueue();
      if (res?.data) setQueue(res.data);
    } catch (err) {
      console.error('Failed to load revision queue:', err);
    } finally {
      setLoading(false);
    }
  }

  const allDue = [...queue.overdue, ...queue.dueToday];
  const currentItem = allDue[activeItemIndex];

  const handleRateRecall = async (rating: number) => {
    if (!currentItem) return;

    try {
      const res = await api.recordRecall({
        topicId: currentItem.topic.id,
        recallRating: rating
      });
      setRewardNotice(res.data?.reward);
      setIsFlipped(false);

      if (activeItemIndex < allDue.length - 1) {
        setActiveItemIndex(activeItemIndex + 1);
      } else {
        loadQueue();
        setActiveItemIndex(0);
      }
    } catch (err) {
      console.error('Failed to record recall:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'Spaced Repetition' }
        ]}
        subtitle="SuperMemo SM-2 flashcard queue"
      />

      <div className="p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-2xl font-bold text-app-text">
            <Repeat size={24} className="text-app-text shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight text-app-text">Spaced Repetition</h1>
          </div>
          <p className="text-xs text-app-muted">
            Adaptive active recall queue governed by SuperMemo SM-2. Cards advance in interval to cement concepts into permanent memory.
          </p>
        </div>

        {rewardNotice && (
          <div className="notion-callout text-xs text-app-text">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span>+{rewardNotice.xpAwarded} XP awarded for verified active recall session!</span>
              <button onClick={() => setRewardNotice(null)} className="underline text-[11px] text-app-muted">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Queue Metrics Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded border border-app-borderSubtle bg-app-surface text-center space-y-0.5">
            <span className="text-[11px] text-app-muted font-medium block">Due Today</span>
            <span className="text-xl font-bold text-app-text tabular-nums">{queue.dueToday.length}</span>
          </div>
          <div className="p-3 rounded border border-app-borderSubtle bg-app-surface text-center space-y-0.5">
            <span className="text-[11px] text-app-muted font-medium block">Overdue</span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{queue.overdue.length}</span>
          </div>
          <div className="p-3 rounded border border-app-borderSubtle bg-app-surface text-center space-y-0.5">
            <span className="text-[11px] text-app-muted font-medium block">Next 7 Days</span>
            <span className="text-xl font-bold text-app-text tabular-nums">{queue.upcoming.length}</span>
          </div>
        </div>

        {/* Active Recall Card Workspace */}
        {loading ? (
          <div className="py-16 text-center text-xs text-app-muted flex flex-col items-center gap-2">
            <div className="w-4 h-4 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
            <span>Loading active recall deck...</span>
          </div>
        ) : currentItem ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-app-muted">
              <span>
                Card {activeItemIndex + 1} of {allDue.length}
              </span>
              <span className="notion-tag notion-tag-blue">
                {currentItem.topic.unit?.subject?.name} • {currentItem.reviewStatus}
              </span>
            </div>

            {/* Notion Flashcard Box */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[280px] p-8 rounded border border-app-borderSubtle bg-app-surface shadow-xs cursor-pointer hover:border-app-text transition-all flex flex-col justify-between select-none relative"
            >
              <div className="flex items-center justify-between text-[11px] text-app-subtle">
                <span className="font-medium uppercase tracking-wider">
                  {isFlipped ? 'Answer & Working Explanation' : 'Concept / Verification Prompt'}
                </span>
                <span>Click anywhere to flip</span>
              </div>

              <div className="my-auto text-center py-6">
                {!isFlipped ? (
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-app-text tracking-tight">{currentItem.topic.title}</h3>
                    <p className="text-xs text-app-muted max-w-md mx-auto">
                      Test your recall: State the primary definition, key equation, and architectural trade-offs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-left max-w-lg mx-auto bg-app-sidebar p-4 rounded border border-app-borderSubtle text-xs">
                    <h4 className="font-semibold text-app-text">Verified Concept Key</h4>
                    <p className="text-app-text leading-relaxed">
                      {currentItem.topic.description ||
                        'Paging eliminates external fragmentation by mapping non-contiguous physical frames to contiguous logical pages. Key equation: EMAT = (epsilon + m)alpha + (epsilon + 2m)(1 - alpha).'}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] text-app-subtle">
                {isFlipped ? 'Rate your recall accuracy below to schedule next interval:' : 'Tap card to reveal answer'}
              </div>
            </div>

            {/* Recall Accuracy Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => handleRateRecall(1)}
                className="py-2.5 px-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text text-xs transition-colors flex flex-col items-center gap-0.5"
              >
                <span className="font-medium">Again (1)</span>
                <span className="text-[10px] text-red-600 dark:text-red-400">Reset 1d</span>
              </button>

              <button
                onClick={() => handleRateRecall(2)}
                className="py-2.5 px-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text text-xs transition-colors flex flex-col items-center gap-0.5"
              >
                <span className="font-medium">Hard (2)</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">Short step</span>
              </button>

              <button
                onClick={() => handleRateRecall(3)}
                className="py-2.5 px-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text text-xs transition-colors flex flex-col items-center gap-0.5"
              >
                <span className="font-medium">Good (3)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Expand</span>
              </button>

              <button
                onClick={() => handleRateRecall(4)}
                className="py-2.5 px-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text text-xs transition-colors flex flex-col items-center gap-0.5"
              >
                <span className="font-medium">Easy (4)</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">Max leap</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center border border-app-borderSubtle bg-app-surface rounded space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-app-text">All Revisions Completed!</h3>
            <p className="text-xs text-app-muted max-w-sm mx-auto">
              You are completely caught up with your scheduled active recall queue for today.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
