import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Square,
  Save,
  Sun,
  Moon,
  Sparkles,
  Settings,
  ChevronDown,
  ArrowLeft,
  Code2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SupportedLanguage } from '../../types/ide';
import { LANGUAGE_REGISTRY } from './LanguageRegistry';

interface IDETopBarProps {
  projectName: string;
  activeFileName: string;
  isModified?: boolean;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRun: () => void;
  onStop: () => void;
  isRunning: boolean;
  onSave: () => void;
  isAIPanelOpen: boolean;
  onToggleAIPanel: () => void;
  isAIStreaming: boolean;
  onStopAIStreaming: () => void;
}

export function IDETopBar({
  projectName,
  activeFileName,
  isModified,
  selectedLanguage,
  onLanguageChange,
  onRun,
  onStop,
  isRunning,
  onSave,
  isAIPanelOpen,
  onToggleAIPanel,
  isAIStreaming,
  onStopAIStreaming
}: IDETopBarProps) {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const isDarkMode = resolvedTheme === 'dark';

  const langConfig = LANGUAGE_REGISTRY[selectedLanguage];

  return (
    <header className="h-11 px-3 border-b border-app-borderSubtle bg-app-sidebar flex items-center justify-between text-xs select-none">
      {/* Left Region: Logo, Project, File Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1 rounded text-app-subtle hover:text-app-text hover:bg-app-hover transition-colors flex items-center gap-1"
          title="Return to Workspace Dashboard"
        >
          <ArrowLeft size={14} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-app-text text-app-bg flex items-center justify-center font-bold">
            <Code2 size={13} />
          </div>
          <span className="font-semibold text-xs text-app-text tracking-tight hidden sm:inline">
            Student IDE
          </span>
        </div>

        <span className="text-app-subtle hidden sm:inline">/</span>

        <span className="font-medium text-app-muted truncate max-w-[120px] hidden md:inline">
          {projectName}
        </span>

        <span className="text-app-subtle hidden md:inline">/</span>

        <div className="flex items-center gap-1.5 font-medium text-app-text">
          <span className="font-mono text-xs">{activeFileName}</span>
          {isModified && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-app-accent flex-shrink-0"
              title="Unsaved changes (Ctrl+S to save)"
            />
          )}
        </div>
      </div>

      {/* Center Region: Execution & Run Controls */}
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <div className="relative flex items-center">
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="appearance-none bg-app-surface border border-app-borderSubtle rounded px-2.5 py-1 pr-6 text-xs font-medium text-app-text outline-none hover:bg-app-hover cursor-pointer transition-colors"
          >
            {Object.entries(LANGUAGE_REGISTRY).map(([key, val]) => (
              <option key={key} value={key}>
                {val.name} ({val.runtimeLabel})
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 text-app-subtle pointer-events-none"
          />
        </div>

        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          title="Execute active program (F5 or Ctrl+Enter)"
        >
          {isRunning ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play size={12} className="fill-current" />
          )}
          <span>Run</span>
        </button>

        {/* Stop Button */}
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="px-2.5 py-1 rounded border border-app-borderSubtle bg-app-surface hover:bg-red-50 dark:hover:bg-red-950/30 text-app-muted hover:text-red-500 disabled:opacity-40 font-medium text-xs flex items-center gap-1.5 transition-colors"
          title="Stop execution process"
        >
          <Square size={11} className="fill-current" />
          <span className="hidden sm:inline">Stop</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          className="p-1.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-muted hover:text-app-text transition-colors"
          title="Save File (Ctrl+S)"
        >
          <Save size={13} />
        </button>
      </div>

      {/* Right Region: AI Agent Toggle, Theme, Settings */}
      <div className="flex items-center gap-2">
        {/* Context-Sensitive AI Agent Button (Transforms into Stop control when streaming) */}
        {isAIStreaming ? (
          <button
            onClick={onStopAIStreaming}
            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs animate-pulse"
            title="Stop AI Generation (1-Click Cancel)"
          >
            <Square size={12} className="fill-current" />
            <span>Stop AI</span>
          </button>
        ) : (
          <button
            onClick={onToggleAIPanel}
            className={`px-2.5 py-1 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isAIPanelOpen
                ? 'bg-app-text text-app-bg border-transparent'
                : 'border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-text'
            }`}
            title="Toggle AI Coding Agent Side Panel"
          >
            <Sparkles size={13} className={isAIPanelOpen ? '' : 'text-app-accent'} />
            <span className="hidden sm:inline">AI Agent</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-muted hover:text-app-text transition-colors"
          title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
        >
          {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-app-muted hover:text-app-text transition-colors"
          title="IDE & Workspace Settings"
        >
          <Settings size={13} />
        </button>
      </div>
    </header>
  );
}
