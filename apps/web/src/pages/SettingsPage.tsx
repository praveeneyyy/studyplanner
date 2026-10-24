import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TopBar } from '../components/layout/TopBar';
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Trash2,
  CheckCircle2,
  Sliders,
  User,
  Shield
} from 'lucide-react';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [dailyGoal, setDailyGoal] = useState(120);
  const [sessionPref, setSessionPref] = useState(45);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await api.getPreferences();
        if (res?.data) {
          setDailyGoal(res.data.dailyStudyMinutesGoal || 120);
          setSessionPref(res.data.sessionDurationPref || 45);
          setReducedMotion(Boolean(res.data.reducedMotion));
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      }
    }
    loadPrefs();
  }, []);

  const handleSavePreferences = async () => {
    try {
      await api.updatePreferences({
        dailyStudyMinutesGoal: dailyGoal,
        sessionDurationPref: sessionPref,
        reducedMotion
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.request('/auth/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-planner-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleClearWorkspace = async () => {
    if (
      window.confirm(
        'Clear all subjects, study plans, sessions, notes, and custom dashboards? You will start with a completely fresh, empty workspace.'
      )
    ) {
      try {
        await api.request('/preferences/clear-workspace', { method: 'POST' });
        localStorage.removeItem('study_custom_dashboards');
        localStorage.removeItem('study_notes_list');
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Failed to clear workspace:', err);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure you want to permanently delete your account and all study data? This cannot be undone.')) {
      try {
        await api.request('/auth/profile', { method: 'DELETE' });
        logout();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: 'Preferences' }
        ]}
        subtitle="Workspace settings & profile"
      />

      <div className="p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-2xl font-bold text-app-text">
            <Sliders size={24} className="text-app-text shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight text-app-text">Preferences</h1>
          </div>
          <p className="text-xs text-app-muted">
            Manage appearance themes, daily study availability constraints, and data privacy.
          </p>
        </div>

        {savedNotice && (
          <div className="notion-callout text-xs text-app-text">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>Preferences successfully saved and synchronized.</span>
          </div>
        )}

        {/* 1. Theme & Appearance */}
        <div className="p-5 rounded border border-app-borderSubtle bg-app-surface space-y-3">
          <h3 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
            <Sun size={13} />
            Interface Theme
          </h3>
          <p className="text-xs text-app-muted">
            Choose light, dark, or system matching theme for your Notion-style learning workspace.
          </p>

          <div className="flex gap-2 max-w-md pt-1">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                theme === 'light'
                  ? 'bg-app-hover border-app-text text-app-text font-semibold'
                  : 'border-app-borderSubtle bg-app-surface text-app-muted hover:bg-app-hover'
              }`}
            >
              <Sun size={13} /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                theme === 'dark'
                  ? 'bg-app-hover border-app-text text-app-text font-semibold'
                  : 'border-app-borderSubtle bg-app-surface text-app-muted hover:bg-app-hover'
              }`}
            >
              <Moon size={13} /> Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                theme === 'system'
                  ? 'bg-app-hover border-app-text text-app-text font-semibold'
                  : 'border-app-borderSubtle bg-app-surface text-app-muted hover:bg-app-hover'
              }`}
            >
              <Monitor size={13} /> System
            </button>
          </div>
        </div>

        {/* 2. Study Schedule Parameters */}
        <div className="p-5 rounded border border-app-borderSubtle bg-app-surface space-y-4">
          <h3 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
            <Sliders size={13} />
            Study Schedule Constraints
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-app-muted mb-1">
                <span>Daily Study Goal</span>
                <span className="font-semibold text-app-text tabular-nums">{dailyGoal} minutes ({Math.round(dailyGoal / 60 * 10) / 10}h)</span>
              </div>
              <input
                type="range"
                min={30}
                max={480}
                step={15}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-app-text cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-app-muted mb-1">
                <span>Default Session Block Duration</span>
                <span className="font-semibold text-app-text tabular-nums">{sessionPref} minutes</span>
              </div>
              <input
                type="range"
                min={25}
                max={90}
                step={5}
                value={sessionPref}
                onChange={(e) => setSessionPref(Number(e.target.value))}
                className="w-full accent-app-text cursor-pointer"
              />
            </div>

            <button
              onClick={handleSavePreferences}
              className="px-3.5 py-1.5 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Save Schedule Settings
            </button>
          </div>
        </div>

        {/* 3. Data Portability & Export */}
        <div className="p-5 rounded border border-app-borderSubtle bg-app-surface space-y-3">
          <h3 className="text-xs font-semibold text-app-text flex items-center gap-1.5">
            <Download size={13} />
            Data Portability
          </h3>
          <p className="text-xs text-app-muted">
            Export a full JSON archive containing your syllabus, study session history, notes, and reward records.
          </p>

          <button
            onClick={handleExportData}
            className="px-3 py-1.5 rounded border border-app-borderSubtle hover:bg-app-hover text-xs font-medium text-app-text flex items-center gap-1.5 transition-colors"
          >
            <Download size={12} /> Export Complete Data (.json)
          </button>
        </div>

        {/* 4. Clean Slate Reset */}
        <div className="p-5 rounded border border-amber-200 dark:border-amber-950 bg-amber-50/20 dark:bg-amber-950/10 space-y-2">
          <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Trash2 size={13} />
            Clean Slate Workspace Reset
          </h3>
          <p className="text-xs text-app-muted">
            Clears all predefined and current subjects, study plans, sessions, tasks, notes, and custom dashboards, giving you a completely fresh slate to build your own learning workflow.
          </p>
          <button
            onClick={handleClearWorkspace}
            className="px-3 py-1.5 rounded border border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-xs font-medium transition-colors"
          >
            Clear All Workspace Data & Examples
          </button>
        </div>

        {/* 5. Danger Zone */}
        <div className="p-5 rounded border border-red-200 dark:border-red-950 bg-red-50/20 dark:bg-red-950/10 space-y-2">
          <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <Trash2 size={13} />
            Account Deletion
          </h3>
          <p className="text-xs text-app-muted">
            Permanently deletes your scholar profile, syllabi, notes, and XP ledger.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-3 py-1.5 rounded border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
