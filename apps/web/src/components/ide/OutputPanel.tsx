import React, { useState } from 'react';
import {
  Terminal,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ExecutionResult, ErrorDiagnostic } from '../../types/ide';

interface OutputPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClearOutput: () => void;
  onSelectDiagnosticLine: (line: number) => void;
  onAskAIToFix: (diagnostic: ErrorDiagnostic) => void;
  stdin: string;
  onStdinChange: (val: string) => void;
}

type TabType = 'output' | 'problems' | 'terminal' | 'tests';

export function OutputPanel({
  result,
  isRunning,
  onClearOutput,
  onSelectDiagnosticLine,
  onAskAIToFix,
  stdin,
  onStdinChange
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('output');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${result?.stdout || ''}\n${result?.stderr || ''}`.trim();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diagnostic = result?.diagnostic;

  return (
    <div
      className={`border-t border-app-borderSubtle bg-app-sidebar flex flex-col transition-all duration-200 select-none ${
        isCollapsed ? 'h-9' : isExpanded ? 'h-96' : 'h-64'
      }`}
    >
      {/* Panel Top Tab Bar */}
      <div className="h-9 px-3 border-b border-app-borderSubtle flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 -mb-[1px]">
          <button
            onClick={() => {
              setActiveTab('output');
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b-2 font-medium transition-colors ${
              activeTab === 'output' && !isCollapsed
                ? 'border-app-accent text-app-text font-semibold'
                : 'border-transparent text-app-muted hover:text-app-text'
            }`}
          >
            <Terminal size={13} />
            <span>Output</span>
            {result && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  result.success ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('problems');
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b-2 font-medium transition-colors ${
              activeTab === 'problems' && !isCollapsed
                ? 'border-app-accent text-app-text font-semibold'
                : 'border-transparent text-app-muted hover:text-app-text'
            }`}
          >
            <AlertCircle size={13} />
            <span>Problems</span>
            {diagnostic && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/10 text-red-500 font-bold">
                1
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('terminal');
              setIsCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border-b-2 font-medium transition-colors ${
              activeTab === 'terminal' && !isCollapsed
                ? 'border-app-accent text-app-text font-semibold'
                : 'border-transparent text-app-muted hover:text-app-text'
            }`}
          >
            <span>Input (stdin)</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {result && !isCollapsed && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-app-subtle mr-2">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {result.durationMs}ms
              </span>
              <span>•</span>
              <span
                className={`font-mono font-medium ${
                  result.exitCode === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                }`}
              >
                Exit {result.exitCode}
              </span>
            </div>
          )}

          {!isCollapsed && (
            <>
              <button
                onClick={handleCopy}
                disabled={!result}
                className="p-1 rounded text-app-subtle hover:text-app-text disabled:opacity-40 transition-colors"
                title="Copy Console Output"
              >
                <Copy size={13} />
              </button>
              <button
                onClick={onClearOutput}
                disabled={!result}
                className="p-1 rounded text-app-subtle hover:text-app-text disabled:opacity-40 transition-colors"
                title="Clear Output"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-app-subtle hover:text-app-text transition-colors hidden sm:block"
            title={isExpanded ? 'Restore size' : 'Maximize panel'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-app-subtle hover:text-app-text transition-colors"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs select-text">
          {/* TAB 1: OUTPUT CONSOLE */}
          {activeTab === 'output' && (
            <div>
              {isRunning ? (
                <div className="flex items-center gap-2 text-app-muted py-3">
                  <div className="w-3.5 h-3.5 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
                  <span>Executing program in isolated runner...</span>
                </div>
              ) : !result ? (
                <div className="text-app-subtle py-4 font-sans text-xs">
                  Press <kbd className="px-1.5 py-0.5 rounded border border-app-borderSubtle bg-app-surface text-[11px] font-mono">Run</kbd> to compile and execute your code. Real terminal outputs and exceptions appear here.
                </div>
              ) : (
                <div className="space-y-2">
                  {result.stdout && (
                    <pre className="text-app-text font-mono text-xs whitespace-pre-wrap leading-relaxed">
                      {result.stdout}
                    </pre>
                  )}

                  {result.stderr && (
                    <div className="border-l-2 border-red-500 pl-3 py-1 my-1 bg-red-500/5 rounded-r">
                      <pre className="text-red-600 dark:text-red-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                        {result.stderr}
                      </pre>
                    </div>
                  )}

                  {result.timedOut && (
                    <div className="text-amber-600 dark:text-amber-400 font-sans text-xs">
                      [Execution Timed Out: Program was terminated because it exceeded maximum allowable execution duration.]
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROBLEMS & DIAGNOSTICS */}
          {activeTab === 'problems' && (
            <div>
              {diagnostic ? (
                <div className="p-4 rounded border border-red-500/30 bg-app-surface font-sans space-y-3">
                  <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
                    <div className="flex items-center gap-2">
                      <XCircle size={15} className="text-red-500" />
                      <span className="font-semibold text-xs text-app-text">
                        {diagnostic.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectDiagnosticLine(diagnostic.line)}
                        className="text-xs text-app-accent hover:underline flex items-center gap-1"
                      >
                        <span>Line {diagnostic.line}</span>
                        <ArrowRight size={11} />
                      </button>

                      <button
                        onClick={() => onAskAIToFix(diagnostic)}
                        className="px-2.5 py-1 rounded bg-app-text text-app-bg text-[11px] font-medium flex items-center gap-1 hover:opacity-90 transition-opacity"
                      >
                        <Sparkles size={11} /> Ask AI to Fix
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-app-subtle block text-[11px] uppercase tracking-wider">
                        Technical Message
                      </span>
                      <code className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-500/5 px-1.5 py-0.5 rounded block mt-0.5">
                        {diagnostic.technicalMessage}
                      </code>
                    </div>

                    <div>
                      <span className="font-medium text-app-subtle block text-[11px] uppercase tracking-wider">
                        What Happened
                      </span>
                      <p className="text-app-text leading-relaxed">
                        {diagnostic.explanation}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-app-subtle block text-[11px] uppercase tracking-wider">
                        Probable Cause
                      </span>
                      <p className="text-app-muted leading-relaxed">
                        {diagnostic.likelyCause}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-app-subtle block text-[11px] uppercase tracking-wider">
                        Suggested Next Step
                      </span>
                      <p className="text-app-text font-medium leading-relaxed">
                        {diagnostic.suggestedFix}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 font-sans text-xs text-app-muted flex flex-col items-center gap-1.5">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span className="font-semibold text-app-text">No Problems Detected</span>
                  <span className="text-app-subtle">
                    Syntax and execution diagnostics will appear here if errors occur.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TERMINAL INPUT (STDIN) */}
          {activeTab === 'terminal' && (
            <div className="font-sans space-y-2">
              <label className="block text-xs font-medium text-app-muted">
                Standard Input Buffer (passed to program during execution)
              </label>
              <textarea
                value={stdin}
                onChange={(e) => onStdinChange(e.target.value)}
                placeholder="Enter input values here if your code calls input() or Scanner (one per line)..."
                rows={4}
                className="w-full p-2.5 rounded border border-app-borderSubtle bg-app-surface text-xs font-mono text-app-text outline-none focus:border-app-text resize-none"
              />
              <span className="text-[11px] text-app-subtle block">
                Values will be piped directly into standard input when you press Run.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
