import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import { IDEFile, SupportedLanguage } from '../../types/ide';

interface FileExplorerProps {
  files: IDEFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, language: SupportedLanguage) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile
}: FileExplorerProps) {
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isFolderOpen, setIsFolderOpen] = useState(true);

  const getLanguageFromFileName = (name: string): SupportedLanguage => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return 'python';
      case 'js':
      case 'mjs':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'java':
        return 'java';
      case 'c':
        return 'c';
      case 'cpp':
      case 'cc':
        return 'cpp';
      case 'cs':
        return 'csharp';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'kt':
        return 'kotlin';
      case 'swift':
        return 'swift';
      case 'sql':
        return 'sql';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'sh':
      case 'bash':
        return 'bash';
      default:
        return 'python';
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const lang = getLanguageFromFileName(name);
    onCreateFile(name, lang);
    setNewFileName('');
    setShowNewFileModal(false);
  };

  const handleStartRename = (file: IDEFile) => {
    setEditingFileId(file.id);
    setEditingName(file.name);
  };

  const handleSaveRename = (fileId: string) => {
    if (editingName.trim()) {
      onRenameFile(fileId, editingName.trim());
    }
    setEditingFileId(null);
  };

  return (
    <div className="w-56 h-full border-r border-app-borderSubtle bg-app-sidebar flex flex-col select-none text-xs">
      {/* Sidebar Header */}
      <div className="p-2.5 px-3 border-b border-app-borderSubtle flex items-center justify-between">
        <span className="font-semibold tracking-wider text-[11px] text-app-muted uppercase">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewFileModal(true)}
            className="p-1 rounded text-app-muted hover:text-app-text hover:bg-app-hover transition-colors"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
        </div>
      </div>

      {/* Project Tree */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {/* Workspace Root Folder */}
        <div
          onClick={() => setIsFolderOpen(!isFolderOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-app-text font-medium hover:bg-app-hover cursor-pointer"
        >
          {isFolderOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {isFolderOpen ? <FolderOpen size={14} className="text-app-accent" /> : <Folder size={14} className="text-app-accent" />}
          <span className="truncate">src</span>
          <span className="text-[10px] text-app-subtle ml-auto">{files.length}</span>
        </div>

        {/* Files List */}
        {isFolderOpen && (
          <div className="pl-4 space-y-0.5">
            {files.map((file) => {
              const isActive = activeFileId === file.id;
              const isEditingThis = editingFileId === file.id;

              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-app-hover text-app-text font-medium'
                      : 'text-app-muted hover:bg-app-hover/60 hover:text-app-text'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-1">
                    <FileCode size={13} className={isActive ? 'text-app-accent' : 'text-app-subtle'} />
                    {isEditingThis ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleSaveRename(file.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(file.id);
                          if (e.key === 'Escape') setEditingFileId(null);
                        }}
                        autoFocus
                        className="bg-app-surface text-app-text px-1 py-0.5 rounded border border-app-borderStrong text-xs w-full outline-none"
                      />
                    ) : (
                      <span className="truncate text-xs">{file.name}</span>
                    )}
                    {file.isModified && (
                      <span className="w-1.5 h-1.5 rounded-full bg-app-accent flex-shrink-0" title="Unsaved changes" />
                    )}
                  </div>

                  {/* Hover Actions */}
                  {!isEditingThis && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(file);
                        }}
                        className="p-0.5 rounded text-app-subtle hover:text-app-text"
                        title="Rename file"
                      >
                        <Edit2 size={11} />
                      </button>
                      {files.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete ${file.name}?`)) {
                              onDeleteFile(file.id);
                            }
                          }}
                          className="p-0.5 rounded text-app-subtle hover:text-red-500"
                          title="Delete file"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-app-surface border border-app-borderSubtle rounded-lg shadow-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-app-borderSubtle pb-2">
              <span className="text-xs font-semibold text-app-text flex items-center gap-1.5">
                <FilePlus size={14} /> New Source File
              </span>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="p-1 rounded text-app-muted hover:text-app-text"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-app-muted mb-1">
                  File Name with Extension (e.g. solution.py, app.js, Test.java)
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. main.py"
                  autoFocus
                  className="w-full px-2.5 py-1.5 rounded border border-app-borderSubtle bg-app-bg text-xs text-app-text outline-none focus:border-app-text"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-app-borderSubtle">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-2.5 py-1 rounded border border-app-borderSubtle text-xs text-app-muted hover:text-app-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-app-text text-app-bg text-xs font-medium hover:opacity-90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
