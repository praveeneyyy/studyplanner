import React from 'react';
import { X, FileCode } from 'lucide-react';
import { IDEFile } from '../../types/ide';

interface EditorTabsProps {
  files: IDEFile[];
  activeFileId: string;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

export function EditorTabs({
  files,
  activeFileId,
  onSelectTab,
  onCloseTab
}: EditorTabsProps) {
  return (
    <div className="h-9 border-b border-app-borderSubtle bg-app-sidebar flex items-center overflow-x-auto select-none px-1 gap-1 text-xs">
      {files.map((file) => {
        const isActive = activeFileId === file.id;

        return (
          <div
            key={file.id}
            onClick={() => onSelectTab(file.id)}
            className={`group h-8 px-3 rounded-t flex items-center gap-2 cursor-pointer border-t-2 transition-colors ${
              isActive
                ? 'bg-app-surface text-app-text font-medium border-app-accent'
                : 'text-app-muted hover:bg-app-hover/50 hover:text-app-text border-transparent'
            }`}
          >
            <FileCode size={13} className={isActive ? 'text-app-accent' : 'text-app-subtle'} />
            <span className="truncate max-w-[140px] text-xs">{file.name}</span>

            {file.isModified ? (
              <span
                className="w-2 h-2 rounded-full bg-app-accent flex-shrink-0"
                title="Unsaved changes"
              />
            ) : null}

            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(file.id);
                }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-app-hover text-app-subtle hover:text-app-text transition-opacity"
                title="Close tab"
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
