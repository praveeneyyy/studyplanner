import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { IDETopBar } from '../components/ide/IDETopBar';
import { FileExplorer } from '../components/ide/FileExplorer';
import { EditorTabs } from '../components/ide/EditorTabs';
import { CodeEditor } from '../components/ide/CodeEditor';
import { OutputPanel } from '../components/ide/OutputPanel';
import { AIAgentSidePanel } from '../components/ide/AIAgentSidePanel';
import { LANGUAGE_REGISTRY } from '../components/ide/LanguageRegistry';
import {
  IDEFile,
  SupportedLanguage,
  ExecutionResult,
  ErrorDiagnostic,
  AIChatMessage
} from '../types/ide';

const DEFAULT_FILES: IDEFile[] = [
  {
    id: 'file-1',
    name: 'main.py',
    path: '/src/main.py',
    language: 'python',
    content: LANGUAGE_REGISTRY.python.starterCode,
    isModified: false
  },
  {
    id: 'file-2',
    name: 'index.js',
    path: '/src/index.js',
    language: 'javascript',
    content: LANGUAGE_REGISTRY.javascript.starterCode,
    isModified: false
  },
  {
    id: 'file-3',
    name: 'queries.sql',
    path: '/src/queries.sql',
    language: 'sql',
    content: LANGUAGE_REGISTRY.sql.starterCode,
    isModified: false
  }
];

export function IDEPage() {
  // File System State
  const [files, setFiles] = useState<IDEFile[]>(() => {
    try {
      const saved = localStorage.getItem('student_ide_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return files[0]?.id || 'file-1';
  });

  // Open Tabs State (list of file IDs)
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    return files.map((f) => f.id);
  });

  // Code Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [targetLine, setTargetLine] = useState<number | null>(null);
  const [stdin, setStdin] = useState('');

  // AI Agent State
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isAIStreaming, setIsAIStreaming] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active File lookup
  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || DEFAULT_FILES[0];
  const activeLangConfig = LANGUAGE_REGISTRY[activeFile.language] || LANGUAGE_REGISTRY.python;

  // Persist files in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('student_ide_files', JSON.stringify(files));
    } catch {}
  }, [files]);

  // Global Keyboard Shortcuts (F5 or Ctrl+Enter to Run, Ctrl+S to Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, isRunning]);

  // Editor Content Change Handler
  const handleCodeChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, content: newContent, isModified: true } : f
      )
    );
  };

  // Language Change Handler
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    const config = LANGUAGE_REGISTRY[newLang];
    const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
    const newName = `${baseName}${config.extension}`;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id
          ? {
              ...f,
              name: newName,
              language: newLang,
              content: f.content.trim() ? f.content : config.starterCode,
              isModified: true
            }
          : f
      )
    );
  };

  // Run Code Action
  const handleRunCode = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setExecutionResult(null);
    setTargetLine(null);

    try {
      const res = await api.request<ExecutionResult>('/execution/run', {
        method: 'POST',
        body: JSON.stringify({
          language: activeFile.language,
          code: activeFile.content,
          stdin
        })
      });

      setExecutionResult(res);

      // If an error diagnostic occurred, open the Problems tab by setting result
      if (res.diagnostic) {
        setTargetLine(res.diagnostic.line);
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: err.message || 'Execution request failed to connect to runner.',
        durationMs: 0,
        diagnostic: null
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Stop Running Code
  const handleStopCode = async () => {
    setIsRunning(false);
    try {
      await api.request('/execution/active/stop', { method: 'POST' });
    } catch {}
  };

  // Save Active File
  const handleSave = () => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, isModified: false } : f))
    );
  };

  // Create New File
  const handleCreateFile = (name: string, language: SupportedLanguage) => {
    const newFile: IDEFile = {
      id: `file-${Date.now()}`,
      name,
      path: `/src/${name}`,
      language,
      content: LANGUAGE_REGISTRY[language]?.starterCode || '',
      isModified: false
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabIds((prev) => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
  };

  // Delete File
  const handleDeleteFile = (fileId: string) => {
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    setOpenTabIds((prev) => prev.filter((id) => id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0]?.id || '');
    }
  };

  // Rename File
  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
  };

  // Close Tab
  const handleCloseTab = (fileId: string) => {
    const remaining = openTabIds.filter((id) => id !== fileId);
    setOpenTabIds(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0] || '');
    }
  };

  // Select Tab
  const handleSelectTab = (fileId: string) => {
    if (!openTabIds.includes(fileId)) {
      setOpenTabIds((prev) => [...prev, fileId]);
    }
    setActiveFileId(fileId);
  };

  // AI Agent: Apply suggested code directly into Monaco editor
  const handleApplyAICode = (newCode: string) => {
    handleCodeChange(newCode);
    setTargetLine(null);
  };

  // AI Agent: Send message
  const handleSendAIMessage = async (prompt: string, actionType: string = 'general') => {
    if (isAIStreaming) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAIStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const res = await api.request<any>('/execution/ai-assist', {
        method: 'POST',
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          language: activeFile.language,
          code: activeFile.content,
          output: `${executionResult?.stdout || ''}\n${executionResult?.stderr || ''}`.trim(),
          errorDiagnostic: executionResult?.diagnostic || null,
          prompt,
          actionType
        })
      });

      const assistantMsg: AIChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: res.answer || res.message || 'Analysis complete.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setAiMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const cancelledMsg: AIChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: 'AI operation cancelled by student.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages((prev) => [...prev, cancelledMsg]);
      } else {
        const errMsg: AIChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: `Unable to complete AI analysis: ${err.message || 'Please check your connection and try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages((prev) => [...prev, errMsg]);
      }
    } finally {
      setIsAIStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // AI Agent: 1-click stop streaming
  const handleStopAIStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAIStreaming(false);
  };

  // Ask AI to fix a specific problem from Problems tab
  const handleAskAIToFixProblem = (diag: ErrorDiagnostic) => {
    setIsAIPanelOpen(true);
    handleSendAIMessage(
      `Please explain and fix the ${diag.category} on line ${diag.line}: "${diag.technicalMessage}".`,
      'fix'
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-app-bg text-app-text font-sans">
      {/* 1. Top Application Bar */}
      <IDETopBar
        projectName="Student Project"
        activeFileName={activeFile.name}
        isModified={activeFile.isModified}
        selectedLanguage={activeFile.language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRunCode}
        onStop={handleStopCode}
        isRunning={isRunning}
        onSave={handleSave}
        isAIPanelOpen={isAIPanelOpen}
        onToggleAIPanel={() => setIsAIPanelOpen(!isAIPanelOpen)}
        isAIStreaming={isAIStreaming}
        onStopAIStreaming={handleStopAIStreaming}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Explorer Sidebar */}
        <FileExplorer
          files={files}
          activeFileId={activeFile.id}
          onSelectFile={handleSelectTab}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
        />

        {/* Center: Editor Canvas & Output Terminal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor Tabs Strip */}
          <EditorTabs
            files={files.filter((f) => openTabIds.includes(f.id))}
            activeFileId={activeFile.id}
            onSelectTab={setActiveFileId}
            onCloseTab={handleCloseTab}
          />

          {/* Monaco Code Editor */}
          <div className="flex-1 relative overflow-hidden">
            <CodeEditor
              value={activeFile.content}
              language={activeLangConfig.monacoLanguage}
              onChange={handleCodeChange}
              diagnostic={executionResult?.diagnostic}
              targetLine={targetLine}
            />
          </div>

          {/* Output & Diagnostics Panel */}
          <OutputPanel
            result={executionResult}
            isRunning={isRunning}
            onClearOutput={() => setExecutionResult(null)}
            onSelectDiagnosticLine={(line) => setTargetLine(line)}
            onAskAIToFix={handleAskAIToFixProblem}
            stdin={stdin}
            onStdinChange={setStdin}
          />
        </div>

        {/* Right: Dedicated AI Agent Side Panel */}
        <AIAgentSidePanel
          isOpen={isAIPanelOpen}
          onClose={() => setIsAIPanelOpen(false)}
          language={activeFile.language}
          code={activeFile.content}
          output={`${executionResult?.stdout || ''}\n${executionResult?.stderr || ''}`.trim()}
          diagnostic={executionResult?.diagnostic || null}
          onApplyCode={handleApplyAICode}
          isStreaming={isAIStreaming}
          onStopStreaming={handleStopAIStreaming}
          onSendMessage={handleSendAIMessage}
          messages={aiMessages}
          onClearMessages={() => setAiMessages([])}
        />
      </div>
    </div>
  );
}
