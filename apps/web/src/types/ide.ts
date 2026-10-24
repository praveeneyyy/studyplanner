export type SupportedLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'kotlin'
  | 'swift'
  | 'sql'
  | 'html'
  | 'css'
  | 'json'
  | 'bash';

export interface LanguageDefinition {
  id: SupportedLanguage;
  name: string;
  extension: string;
  monacoLanguage: string;
  runtimeStatus: 'ready' | 'in-memory' | 'browser' | 'compiler-needed';
  runtimeLabel: string;
  starterCode: string;
}

export interface IDEFile {
  id: string;
  name: string;
  path: string;
  language: SupportedLanguage;
  content: string;
  isModified?: boolean;
}

export interface ErrorDiagnostic {
  line: number;
  category: string;
  technicalMessage: string;
  explanation: string;
  likelyCause: string;
  suggestedFix: string;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  diagnostic?: ErrorDiagnostic | null;
  timedOut?: boolean;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  codeSuggestion?: string;
  applied?: boolean;
}
