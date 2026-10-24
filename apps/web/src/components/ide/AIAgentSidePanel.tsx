import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Square,
  Send,
  Plus,
  RotateCcw,
  Copy,
  Check,
  Code,
  AlertCircle,
  HelpCircle,
  Bug,
  Zap,
  CheckSquare,
  ArrowRight,
  X,
  FileCode
} from 'lucide-react';
import { AIChatMessage, ErrorDiagnostic, SupportedLanguage } from '../../types/ide';

interface AIAgentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  code: string;
  output: string;
  diagnostic: ErrorDiagnostic | null;
  onApplyCode: (newCode: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  onSendMessage: (prompt: string, actionType?: string) => Promise<void>;
  messages: AIChatMessage[];
  onClearMessages: () => void;
}

export function AIAgentSidePanel({
  isOpen,
  onClose,
  language,
  code,
  output,
  diagnostic,
  onApplyCode,
  isStreaming,
  onStopStreaming,
  onSendMessage,
  messages,
  onClearMessages
}: AIAgentSidePanelProps) {
  const [inputText, setInputText] = useState('');
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    setInputText('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string, actionType: string) => {
    if (isStreaming) return;
    onSendMessage(prompt, actionType);
  };

  const extractCodeBlock = (content: string): string | null => {
    const match = content.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  return (
    <div className="w-full md:w-[420px] h-full border-l border-app-borderSubtle bg-app-sidebar flex flex-col z-20 select-none text-xs">
      {/* Panel Header */}
      <div className="h-11 px-3 border-b border-app-borderSubtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-app-accent" />
          <span className="font-semibold text-xs text-app-text tracking-tight">
            AI Coding Agent
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-app-surface text-app-subtle border border-app-borderSubtle font-mono">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClearMessages}
            disabled={messages.length === 0 || isStreaming}
            className="p-1 rounded text-app-subtle hover:text-app-text disabled:opacity-40 transition-colors"
            title="New Conversation"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-app-subtle hover:text-app-text transition-colors"
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Message Stream & Welcome Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {messages.length === 0 ? (
          /* Initial Welcome Screen */
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-app-text">
                Hello! What are you working on today?
              </h3>
              <p className="text-xs text-app-muted leading-relaxed">
                I can help you understand code, fix runtime errors, analyze algorithm complexity, generate test cases, and improve your solutions.
              </p>
            </div>

            {/* Context-Aware Recommendations */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-semibold text-app-subtle uppercase tracking-wider block">
                Suggested Actions
              </span>

              {/* Priority 1: If there is an active compiler or runtime error */}
              {diagnostic && (
                <button
                  onClick={() =>
                    handlePromptClick(
                      `Please analyze and fix the ${diagnostic.category} on line ${diagnostic.line}: "${diagnostic.technicalMessage}".`,
                      'fix'
                    )
                  }
                  className="w-full text-left p-2.5 rounded border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs text-red-600 dark:text-red-400 font-medium flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span className="truncate">Fix {diagnostic.category} on Line {diagnostic.line}</span>
                  </div>
                  <ArrowRight size={12} className="flex-shrink-0" />
                </button>
              )}

              {/* Standard Recommendations */}
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() =>
                    handlePromptClick(
                      `Explain my ${language} program step by step, including its time and space complexity.`,
                      'explain'
                    )
                  }
                  className="w-full text-left p-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs text-app-text flex items-center gap-2 transition-colors"
                >
                  <Code size={13} className="text-app-accent flex-shrink-0" />
                  <span>Explain my code</span>
                </button>

                <button
                  onClick={() =>
                    handlePromptClick(
                      `Find potential bugs, edge cases, and off-by-one errors in my ${language} code.`,
                      'find_bugs'
                    )
                  }
                  className="w-full text-left p-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs text-app-text flex items-center gap-2 transition-colors"
                >
                  <Bug size={13} className="text-app-accent flex-shrink-0" />
                  <span>Find bugs and edge cases</span>
                </button>

                <button
                  onClick={() =>
                    handlePromptClick(
                      `Generate comprehensive test cases for this program with sample inputs and expected outputs.`,
                      'testcase'
                    )
                  }
                  className="w-full text-left p-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs text-app-text flex items-center gap-2 transition-colors"
                >
                  <CheckSquare size={13} className="text-app-accent flex-shrink-0" />
                  <span>Generate test cases</span>
                </button>

                <button
                  onClick={() =>
                    handlePromptClick(
                      `How can I improve the performance, readability, and clean architecture of this ${language} code?`,
                      'improve'
                    )
                  }
                  className="w-full text-left p-2 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-xs text-app-text flex items-center gap-2 transition-colors"
                >
                  <Zap size={13} className="text-app-accent flex-shrink-0" />
                  <span>Improve performance & readability</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Conversation Message List */
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const suggestedCode = !isUser ? extractCodeBlock(msg.content) : null;

            return (
              <div
                key={msg.id}
                className={`space-y-1.5 ${isUser ? 'ml-6' : 'mr-2'}`}
              >
                <div className="flex items-center justify-between text-[10px] text-app-subtle">
                  <span className="font-semibold uppercase tracking-wider">
                    {isUser ? 'You' : 'AI Coding Agent'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded border text-xs leading-relaxed ${
                    isUser
                      ? 'bg-app-text text-app-bg border-transparent font-medium'
                      : 'bg-app-surface border-app-borderSubtle text-app-text'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* If assistant returned a code block: provide Copy and Apply actions */}
                  {suggestedCode && (
                    <div className="mt-3 pt-2 border-t border-app-borderSubtle/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopyCode(suggestedCode, idx)}
                        className="px-2 py-1 rounded border border-app-borderSubtle bg-app-surface hover:bg-app-hover text-[11px] font-medium text-app-text flex items-center gap-1 transition-colors"
                      >
                        {copiedCodeIdx === idx ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                        <span>{copiedCodeIdx === idx ? 'Copied' : 'Copy Code'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Apply this corrected code to your active editor? Your current code will be updated.'
                            )
                          ) {
                            onApplyCode(suggestedCode);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-app-text text-app-bg text-[11px] font-medium flex items-center gap-1 hover:opacity-90 transition-opacity"
                        title="Apply suggested code directly into Monaco editor"
                      >
                        <FileCode size={11} />
                        <span>Apply to Editor</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-app-muted py-2 text-xs">
            <div className="w-3 h-3 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
            <span>AI Agent is analyzing your code and drafting response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="p-3 border-t border-app-borderSubtle bg-app-surface space-y-2">
        <div className="relative rounded border border-app-borderSubtle bg-app-bg focus-within:border-app-text transition-colors">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask anything about your code..."
            className="w-full p-2.5 pr-10 text-xs bg-transparent text-app-text placeholder-app-subtle outline-none resize-none"
          />

          {/* Action Button: Transform into Stop button when processing */}
          <div className="absolute right-2 bottom-2">
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="Stop AI Generation"
              >
                <Square size={13} className="fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-1.5 rounded bg-app-text text-app-bg hover:opacity-90 disabled:opacity-30 transition-opacity"
                title="Send Message (Enter)"
              >
                <Send size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-app-subtle px-0.5">
          <span>Enter sends • Shift+Enter new line</span>
          {isStreaming && (
            <button
              onClick={onStopStreaming}
              className="text-red-500 hover:underline flex items-center gap-1 font-medium"
            >
              <Square size={10} className="fill-current" /> Stop generating
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
