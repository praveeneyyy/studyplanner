import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  FileText,
  Star,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeepFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSessionCompleted?: (result: any) => void;
}

export function DeepFocusModal({
  isOpen,
  onClose,
  session,
  onSessionCompleted
}: DeepFocusModalProps) {
  const navigate = useNavigate();

  const [durationMinutes, setDurationMinutes] = useState(
    session?.durationMinutes || session?.plannedDurationMinutes || 45
  );
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notes, setNotes] = useState(session?.notes || '');
  const [reflectionScore, setReflectionScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReward, setCompletedReward] = useState<any>(null);

  const timerRef = useRef<any>(null);
  const initialSeconds = durationMinutes * 60;

  // Sync session props
  useEffect(() => {
    if (session) {
      const mins = session.durationMinutes || session.plannedDurationMinutes || 45;
      setDurationMinutes(mins);
      setSecondsRemaining(mins * 60);
      setNotes(session.notes || '');
      setCompletedReward(null);
    }
  }, [session]);

  // Timer loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, soundEnabled]);

  // Clean Web Audio tone synthesizer (sine chime at 523Hz / 659Hz)
  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, delay: number, duration: number) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }, delay);
      };

      playTone(523.25, 0, 0.4);   // C5
      playTone(659.25, 200, 0.6); // E5
      playTone(783.99, 450, 0.9); // G5
    } catch {
      // Audio not supported in environment
    }
  };

  if (!isOpen || !session) return null;

  const toggleTimer = async () => {
    if (!isRunning && session.status === 'PLANNED') {
      try {
        await api.startSession(session.id);
      } catch (err) {
        console.warn('Could not mark session started on server:', err);
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = (mins: number = durationMinutes) => {
    setIsRunning(false);
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const addTime = (mins: number) => {
    setSecondsRemaining((prev) => prev + mins * 60);
  };

  const handleCompleteSession = async () => {
    setIsSubmitting(true);
    try {
      const elapsedMins = Math.max(
        1,
        Math.round((initialSeconds - secondsRemaining) / 60)
      );
      const res = await api.completeSession(session.id, {
        actualDurationMinutes: elapsedMins,
        reflectionScore,
        notes
      });
      setCompletedReward(res?.data?.reward || { xpAwarded: 50, streakUpdated: true });
      if (onSessionCompleted) {
        onSessionCompleted(res?.data);
      }
    } catch (err: any) {
      alert(`Could not complete session: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((initialSeconds - secondsRemaining) / initialSeconds) * 100)
  );

  const subjectName =
    session.topic?.unit?.subject?.name || session.subjectName || 'Academic Curriculum';
  const topicTitle = session.topic?.name || session.topic?.title || session.title || 'Study Session';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-app-surface border border-app-borderSubtle rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-app-borderSubtle flex items-center justify-between bg-app-surface select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-app-text tracking-wide uppercase">
              Deep Focus Room
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-hover rounded transition-colors"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button
              onClick={() => {
                onClose();
                navigate(`/session/${session.id}`);
              }}
              className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-hover rounded transition-colors"
              title="Expand to Full Workspace"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-hover rounded transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Reward Modal Over state */}
        {completedReward ? (
          <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-app-text">Session Completed!</h3>
              <p className="text-xs text-app-muted max-w-xs mx-auto">
                Great deep focus work on <span className="font-semibold text-app-text">{topicTitle}</span>.
              </p>
            </div>

            <div className="p-3 bg-app-hover/50 rounded-xl border border-app-borderSubtle flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-app-subtle block uppercase">XP Earned</span>
                <span className="font-bold text-amber-500 font-mono text-sm">+50 XP</span>
              </div>
              <div className="h-6 w-px bg-app-borderSubtle" />
              <div>
                <span className="text-[10px] text-app-subtle block uppercase">Consistency</span>
                <span className="font-semibold text-emerald-500 text-sm">Streak Active</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-app-text text-app-bg text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Return to Planner
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Subject / Topic Banner */}
            <div className="text-center space-y-1">
              <span className="text-[11px] font-semibold text-app-subtle uppercase tracking-wider block">
                {subjectName}
              </span>
              <h3 className="text-base font-bold text-app-text truncate">{topicTitle}</h3>
            </div>

            {/* Circular Timer Display */}
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-52 h-52 -rotate-90 transform">
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  className="stroke-app-borderSubtle"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  className="stroke-emerald-500 transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 92}
                  strokeDashoffset={2 * Math.PI * 92 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold font-mono tracking-tight text-app-text tabular-nums">
                  {timeFormatted}
                </span>
                <span className="text-[11px] text-app-muted mt-1 font-medium">
                  {isRunning ? 'Focus In Progress' : 'Ready to Start'}
                </span>
              </div>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center justify-center gap-1.5">
              {[
                { label: '25m', mins: 25 },
                { label: '45m', mins: 45 },
                { label: '60m', mins: 60 },
                { label: '5m Break', mins: 5 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => resetTimer(preset.mins)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    durationMinutes === preset.mins
                      ? 'bg-app-text text-app-bg border-app-text font-medium'
                      : 'border-app-borderSubtle text-app-muted hover:text-app-text hover:bg-app-hover'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => resetTimer()}
                className="p-2.5 rounded-xl border border-app-borderSubtle text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
                title="Reset Timer"
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={toggleTimer}
                className={`px-8 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-xs ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause size={15} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={15} className="fill-current" />
                    <span>Start Focus</span>
                  </>
                )}
              </button>

              <button
                onClick={() => addTime(5)}
                className="px-3 py-2 rounded-xl border border-app-borderSubtle text-app-muted hover:text-app-text hover:bg-app-hover text-xs font-medium transition-colors"
                title="Add 5 Minutes"
              >
                +5m
              </button>
            </div>

            {/* Scratchpad & Notes */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-app-muted">
                <span className="flex items-center gap-1 font-medium">
                  <FileText size={12} />
                  <span>Session Key Takeaways</span>
                </span>
                <span className="text-[10px] text-app-subtle">Saved to history</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type key formulas, concepts learned, or doubts for later revision..."
                rows={2}
                className="w-full p-2.5 rounded-lg bg-app-hover/50 border border-app-borderSubtle text-xs text-app-text placeholder:text-app-subtle focus:outline-none focus:border-app-border resize-none font-mono"
              />
            </div>

            {/* Complete & Claim XP Button */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-app-borderSubtle">
              <div className="flex items-center gap-1 text-xs text-app-muted">
                <span className="text-[11px] text-app-subtle">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReflectionScore(star)}
                    className="p-0.5 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={13}
                      className={star <= reflectionScore ? 'fill-amber-500 text-amber-500' : 'text-app-subtle'}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={handleCompleteSession}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-app-text text-app-bg hover:opacity-90 text-xs font-semibold transition-opacity flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Finish & Claim XP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
