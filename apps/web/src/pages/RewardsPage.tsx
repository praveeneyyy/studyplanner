import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TopBar } from '../components/layout/TopBar';
import {
  Award,
  Flame,
  CheckCircle2,
  Lock,
  History,
  TrendingUp,
  Brain,
  Target
} from 'lucide-react';
import { LearningProgressOrb } from '../components/3d/LearningProgressOrb';

export function RewardsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, achRes, ledRes] = await Promise.all([
          api.getRewardsSummary(),
          api.getAchievements(),
          api.getRewardLedger(1, 10)
        ]);
        if (sumRes?.data) setSummary(sumRes.data);
        if (achRes?.data) setAchievements(achRes.data);
        if (ledRes?.data?.entries) setLedger(ledRes.data.entries);
      } catch (err) {
        console.error('Failed to load rewards data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'Rewards & XP' }
        ]}
        subtitle="Verified productivity achievements"
      />

      <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Notion Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-2xl font-bold text-app-text">
            <Award size={24} className="text-app-text shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight text-app-text">Rewards & Achievements</h1>
          </div>
          <p className="text-xs text-app-muted">
            Productivity rewards earned from verified study sessions, spaced repetition completions, and quiz performance.
          </p>
        </div>

        {/* Level Progression Hero */}
        <div className="p-5 rounded border border-app-borderSubtle bg-app-surface space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-app-sidebar border border-app-borderSubtle flex items-center justify-center flex-shrink-0">
                <LearningProgressOrb size={36} />
              </div>
              <div>
                <span className="text-[10px] font-medium text-app-subtle uppercase tracking-wider block">
                  Current Rank
                </span>
                <h2 className="text-base font-semibold text-app-text">
                  Level {summary?.currentLevel || user?.currentLevel || 1} • {summary?.levelTitle || 'Consistent Scholar'}
                </h2>
                <p className="text-xs text-app-muted">
                  Total Verified Ledger Balance: <span className="font-semibold text-app-text tabular-nums">{user?.totalXP || 0} XP</span>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1">
              <div className="flex justify-between text-xs text-app-muted">
                <span>Progress to Level {(summary?.currentLevel || 1) + 1}</span>
                <span className="font-semibold text-app-text tabular-nums">{summary?.progressPercent || 45}%</span>
              </div>
              <div className="w-full bg-app-sidebar h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-app-text h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${summary?.progressPercent || 45}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-app-subtle font-mono">
                <span>{summary?.minXP || 200} XP</span>
                <span>{summary?.nextLevelXP || 600} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-app-borderSubtle pb-1">
            <h3 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
              <Award size={13} />
              Verified Badges ({achievements.filter((a) => a.isUnlocked).length}/{achievements.length})
            </h3>
            <span className="text-[11px] text-app-muted">Cryptographically verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3.5 rounded border transition-all flex flex-col justify-between ${
                  ach.isUnlocked
                    ? 'border-app-borderSubtle bg-app-surface shadow-2xs'
                    : 'border-app-borderSubtle bg-app-sidebar/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="notion-tag notion-tag-blue font-mono text-[10px]">
                      +{ach.xpReward} XP
                    </span>
                    {ach.isUnlocked ? (
                      <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Lock size={12} className="text-app-subtle" />
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-app-text">{ach.title}</h4>
                  <p className="text-[11px] text-app-muted mt-1 leading-relaxed">{ach.description}</p>
                </div>

                {ach.isUnlocked && ach.unlockedAt && (
                  <span className="text-[10px] text-app-subtle pt-2 block border-t border-app-borderSubtle/60 mt-2">
                    Unlocked: {new Date(ach.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verified Reward Ledger Table */}
        <div className="rounded border border-app-borderSubtle bg-app-surface overflow-hidden space-y-2 p-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
              <History size={13} />
              Immutable Reward Ledger
            </h3>
            <span className="text-[11px] text-app-subtle">Audit Trail</span>
          </div>

          <div className="overflow-x-auto border border-app-borderSubtle rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-app-borderSubtle bg-app-sidebar/60 text-app-muted text-[11px]">
                <tr>
                  <th className="py-2 px-3 border-r border-app-borderSubtle/60">Date & Time</th>
                  <th className="py-2 px-3 border-r border-app-borderSubtle/60">Event Type</th>
                  <th className="py-2 px-3 border-r border-app-borderSubtle/60">Audit Description</th>
                  <th className="py-2 px-3 text-right">XP Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-borderSubtle/60">
                {ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-app-hover/50 transition-colors">
                    <td className="py-2 px-3 border-r border-app-borderSubtle/60 text-app-muted font-mono text-[11px] tabular-nums">
                      {new Date(entry.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-3 border-r border-app-borderSubtle/60">
                      <span className="notion-tag notion-tag-gray text-[10px]">
                        {entry.eventType}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-app-borderSubtle/60 text-app-text">
                      {entry.description}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{entry.xpAwarded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
