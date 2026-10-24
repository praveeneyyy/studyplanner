import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import { ErrorDiagnostic } from '../../types/ide';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  diagnostic?: ErrorDiagnostic | null;
  targetLine?: number | null;
  fontSize?: number;
  wordWrap?: boolean;
}

export function CodeEditor({
  value,
  language,
  onChange,
  diagnostic,
  targetLine,
  fontSize = 14,
  wordWrap = false
}: CodeEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom Notion / VS Code high-contrast dark and light themes
    monaco.editor.defineTheme('notion-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' }
      ],
      colors: {
        'editor.background': '#191919',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#222222',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#e6edf3',
        'editorCursor.foreground': '#58a6ff',
        'editor.selectionBackground': '#264f78'
      }
    });

    monaco.editor.defineTheme('notion-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cf222e' },
        { token: 'string', foreground: '0a3069' },
        { token: 'number', foreground: '0550ae' },
        { token: 'type', foreground: '953800' },
        { token: 'function', foreground: '8250df' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1f2328',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editorLineNumber.foreground': '#8c959f',
        'editorLineNumber.activeForeground': '#1f2328',
        'editorCursor.foreground': '#0969da',
        'editor.selectionBackground': '#b6e3ff'
      }
    });

    monaco.editor.setTheme(isDarkMode ? 'notion-dark' : 'notion-light');
  };

  // Sync theme changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDarkMode ? 'notion-dark' : 'notion-light');
    }
  }, [isDarkMode]);

  // Sync error markers / diagnostics into Monaco editor model
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    if (diagnostic && diagnostic.line > 0) {
      const lineCount = model.getLineCount();
      const safeLine = Math.min(diagnostic.line, lineCount);

      monacoRef.current.editor.setModelMarkers(model, 'owner', [
        {
          startLineNumber: safeLine,
          startColumn: 1,
          endLineNumber: safeLine,
          endColumn: model.getLineMaxColumn(safeLine),
          message: `${diagnostic.category}: ${diagnostic.technicalMessage}\n${diagnostic.explanation}`,
          severity: monacoRef.current.MarkerSeverity.Error
        }
      ]);
    } else {
      monacoRef.current.editor.setModelMarkers(model, 'owner', []);
    }
  }, [diagnostic]);

  // Jump to line when targetLine is triggered from Problems panel
  useEffect(() => {
    if (targetLine && targetLine > 0 && editorRef.current) {
      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
      editorRef.current.focus();
    }
  }, [targetLine]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-app-surface">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        theme={isDarkMode ? 'vs-dark' : 'light'}
        options={{
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineHeight: 22,
          wordWrap: wordWrap ? 'on' : 'off',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          renderLineHighlight: 'all',
          padding: { top: 12, bottom: 12 },
          suggestOnTriggerCharacters: true,
          folding: true,
          tabSize: 2,
          renderWhitespace: 'selection'
        }}
      />
    </div>
  );
}
