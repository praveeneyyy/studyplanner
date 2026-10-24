import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Flame, Play, Bell, Search, Share2, MoreHorizontal } from 'lucide-react';
import { LearningProgressOrb } from '../3d/LearningProgressOrb';

interface TopBarProps {
  breadcrumbs?: Array<{ label: string; to?: string }>;
  title?: string;
  subtitle?: string;
  onOpenSearch?: () => void;
}

export function TopBar({ breadcrumbs, title, subtitle, onOpenSearch }: TopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userWorkspaceName = user?.fullName ? `${user.fullName}'s Workspace` : 'Workspace';

  // Normalize breadcrumbs to replace static workspace label with active user's name
  const formattedBreadcrumbs = breadcrumbs?.map((crumb) => {
    if (crumb.label === 'Workspace' || crumb.label?.includes("'s Workspace")) {
      return { ...crumb, label: userWorkspaceName };
    }
    return crumb;
  });

  return (
    <header className="h-11 px-4 bg-app-surface border-b border-app-borderSubtle flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Breadcrumb Path */}
      <div className="flex items-center gap-1.5 text-xs text-app-muted overflow-hidden">
        {formattedBreadcrumbs && formattedBreadcrumbs.length > 0 ? (
          formattedBreadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-app-subtle">/</span>}
              {crumb.to ? (
                <button
                  onClick={() => navigate(crumb.to!)}
                  className="hover:text-app-text hover:underline truncate max-w-[140px]"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-app-text font-medium truncate max-w-[180px]">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-app-muted">Workspace</span>
            <span className="text-app-subtle">/</span>
            <span className="text-app-text font-medium">{title || 'Academic Space'}</span>
          </div>
        )}
        {subtitle && (
          <span className="hidden md:inline-block text-[11px] text-app-subtle ml-2 pl-2 border-l border-app-borderSubtle">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Streak Counter */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
          <Flame size={12} className="fill-amber-500 text-amber-500" />
          <span>Active Streak</span>
        </div>

        {/* Blender 3D Progress Gem & XP Indicator */}
        <div
          onClick={() => navigate('/rewards')}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-app-borderSubtle hover:bg-app-hover cursor-pointer transition-colors"
          title="Productivity XP and Achievements"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <LearningProgressOrb size={20} />
          </div>
          <span className="text-[11px] font-medium text-app-text tabular-nums">
            {user?.totalXP || 0} XP
          </span>
        </div>

        {/* Quick Search Shortcut */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-app-muted hover:text-app-text hover:bg-app-hover rounded transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search size={13} />
        </button>

        {/* Start Session Action Button */}
        <button
          onClick={() => navigate('/planner')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-text text-app-bg hover:opacity-90 text-xs font-medium transition-opacity"
        >
          <Play size={11} className="fill-current" />
          <span>Start Session</span>
        </button>
      </div>
    </header>
  );
}
