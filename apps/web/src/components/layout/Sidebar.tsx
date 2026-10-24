import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Home,
  LayoutDashboard,
  Calendar,
  Sparkles,
  BookOpen,
  FileText,
  Repeat,
  CheckSquare,
  Award,
  Orbit,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Folder,
  Star,
  Plus,
  Code2,
  LayoutGrid,
  LucideIcon
} from 'lucide-react';
import { SvgRepoAcademicCap } from '../ui/SvgRepoIcons';
import { CommandPalette } from './CommandPalette';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const PRIMARY_WORKSPACE_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/ai', label: 'AI Assistant', icon: Sparkles },
  { to: '/planner', label: 'Study Planner', icon: Calendar },
  { to: '/ide', label: 'Code IDE', icon: Code2, badge: 'New' },
  { to: '/tools', label: 'All Tools', icon: LayoutGrid, badge: '19' }
];

const SECONDARY_WORKSPACE_ITEMS: NavItem[] = [
  { to: '/subjects', label: 'Syllabus & Topics', icon: BookOpen },
  { to: '/revision', label: 'Spaced Repetition', icon: Repeat },
  { to: '/notes', label: 'Academic Notes', icon: FileText },
  { to: '/universe', label: '3D Study Universe', icon: Orbit },
  { to: '/rewards', label: 'Rewards & XP', icon: Award },
  { to: '/analytics', label: 'Custom Dashboards', icon: LayoutDashboard }
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [subjectsExpanded, setSubjectsExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [secondaryExpanded, setSecondaryExpanded] = useState(true);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <aside
        className={`h-screen sticky top-0 bg-app-sidebar border-r border-app-borderSubtle flex flex-col transition-all duration-200 select-none z-30 ${
          collapsed ? 'w-14' : 'w-60'
        }`}
      >
        {/* Workspace Identity Bar */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-app-borderSubtle/60">
          {!collapsed ? (
            <div className="flex items-center justify-between w-full">
              <div
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 hover:bg-app-hover px-1.5 py-1 rounded cursor-pointer transition-colors max-w-[170px]"
                title="Academic Workspace"
              >
                <div className="w-5 h-5 rounded bg-app-text text-app-bg flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-app-text truncate block">
                    {user?.fullName ? `${user.fullName}'s Study` : 'Academic Space'}
                  </span>
                </div>
                <ChevronDown size={13} className="text-app-muted flex-shrink-0 ml-0.5" />
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 text-app-muted hover:text-app-text hover:bg-app-hover rounded transition-colors"
                title="Collapse sidebar"
              >
                <ChevronsLeft size={15} />
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1">
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-hover rounded transition-colors"
                title="Expand sidebar"
              >
                <SvgRepoAcademicCap size={16} className="text-app-text" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Search Action */}
        <div className="px-2 pt-2 pb-1">
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-app-muted hover:bg-app-hover hover:text-app-text transition-colors ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title="Search workspace (Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="flex-shrink-0" />
              {!collapsed && <span>Search</span>}
            </div>
            {!collapsed && (
              <kbd className="px-1 text-[10px] font-mono text-app-subtle bg-app-surface border border-app-borderSubtle rounded">
                ⌘K
              </kbd>
            )}
          </button>
        </div>

        {/* Scrollable Navigation Tree */}
        <div className="flex-1 px-2 py-1 space-y-4 overflow-y-auto">
          {/* FAVORITES SECTION */}
          {!collapsed && (
            <div>
              <div
                onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-app-subtle hover:text-app-muted cursor-pointer transition-colors"
              >
                <span>FAVORITES</span>
                {favoritesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </div>
              {favoritesExpanded && (
                <div className="space-y-0.5 mt-0.5">
                  <NavLink
                    to="/planner"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2 py-1 rounded text-xs font-normal transition-colors ${
                        isActive
                          ? 'bg-app-hover text-app-text font-medium'
                          : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                      }`
                    }
                  >
                    <Calendar size={13} className="text-app-muted shrink-0" />
                    <span className="truncate">Active Exam Plan</span>
                  </NavLink>
                  <NavLink
                    to="/notes"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2 py-1 rounded text-xs font-normal transition-colors ${
                        isActive
                          ? 'bg-app-hover text-app-text font-medium'
                          : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                      }`
                    }
                  >
                    <FileText size={13} className="text-app-muted shrink-0" />
                    <span className="truncate">Algorithms Review</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* PRIMARY WORKSPACES SECTION */}
          <div>
            {!collapsed && (
              <div className="px-2 py-1 text-[11px] font-medium text-app-subtle">
                CORE WORKSPACES
              </div>
            )}
            <div className="space-y-0.5">
              {PRIMARY_WORKSPACE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 px-2 py-1 rounded text-xs transition-colors ${
                      isActive
                        ? 'bg-app-hover text-app-text font-medium'
                        : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-app-accent' : 'text-app-muted'}`} />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-app-surface text-app-subtle border border-app-borderSubtle">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* SECONDARY & SPECIALIZED TOOLS */}
          <div>
            {!collapsed && (
              <div
                onClick={() => setSecondaryExpanded(!secondaryExpanded)}
                className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-app-subtle hover:text-app-muted cursor-pointer transition-colors"
              >
                <span>STUDY & TOOLS</span>
                {secondaryExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </div>
            )}
            {(collapsed || secondaryExpanded) && (
              <div className="space-y-0.5">
                {SECONDARY_WORKSPACE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2.5 px-2 py-1 rounded text-xs transition-colors ${
                        isActive
                          ? 'bg-app-hover text-app-text font-medium'
                          : 'text-app-muted hover:bg-app-hover hover:text-app-text'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={14} className={`flex-shrink-0 ${isActive ? 'text-app-accent' : 'text-app-muted'}`} />
                      {!collapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* NESTED SUBJECT PAGES */}
          {!collapsed && (
            <div>
              <div
                onClick={() => setSubjectsExpanded(!subjectsExpanded)}
                className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-app-subtle hover:text-app-muted cursor-pointer transition-colors"
              >
                <span>CURRENT SUBJECTS</span>
                {subjectsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </div>
              {subjectsExpanded && (
                <div className="space-y-0.5 mt-0.5 pl-1 border-l border-app-borderSubtle/60 ml-2.5">
                  <NavLink
                    to="/subjects"
                    className="flex items-center gap-2 px-2 py-1 rounded text-xs text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="truncate">Data Structures & Algo</span>
                  </NavLink>
                  <NavLink
                    to="/subjects"
                    className="flex items-center gap-2 px-2 py-1 rounded text-xs text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="truncate">Operating Systems</span>
                  </NavLink>
                  <NavLink
                    to="/subjects"
                    className="flex items-center gap-2 px-2 py-1 rounded text-xs text-app-muted hover:bg-app-hover hover:text-app-text transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="truncate">Database Systems</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Preferences & User Panel */}
        <div className="p-2 border-t border-app-borderSubtle/80 space-y-2">
          {/* Settings Nav Item */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                isActive
                  ? 'bg-app-hover text-app-text font-medium'
                  : 'text-app-muted hover:bg-app-hover hover:text-app-text'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Preferences' : undefined}
          >
            <Settings size={15} className="flex-shrink-0" />
            {!collapsed && <span>Preferences</span>}
          </NavLink>

          {/* Theme Mode Segmented Switcher */}
          {!collapsed ? (
            <div className="flex items-center justify-between bg-app-surface border border-app-borderSubtle p-0.5 rounded text-[11px]">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-0.5 px-1.5 rounded flex items-center justify-center gap-1 transition-colors ${
                  theme === 'light' ? 'bg-app-hover font-medium text-app-text' : 'text-app-muted'
                }`}
                title="Light Mode"
              >
                <Sun size={12} /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-0.5 px-1.5 rounded flex items-center justify-center gap-1 transition-colors ${
                  theme === 'dark' ? 'bg-app-hover font-medium text-app-text' : 'text-app-muted'
                }`}
                title="Dark Mode"
              >
                <Moon size={12} /> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 py-0.5 px-1.5 rounded flex items-center justify-center gap-1 transition-colors ${
                  theme === 'system' ? 'bg-app-hover font-medium text-app-text' : 'text-app-muted'
                }`}
                title="Auto Theme"
              >
                <Monitor size={12} /> Auto
              </button>
            </div>
          ) : (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex justify-center py-1 text-app-muted hover:text-app-text rounded hover:bg-app-hover"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          )}

          {/* Profile & Logout row */}
          {user && (
            <div className={`flex items-center justify-between pt-1 ${collapsed ? 'justify-center' : ''}`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-app-accentSubtle text-app-accent font-semibold flex items-center justify-center text-[10px] flex-shrink-0">
                  {user.fullName.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="truncate text-[11px] leading-tight">
                    <p className="font-medium text-app-text truncate">{user.fullName}</p>
                    <p className="text-app-muted truncate">
                      Lvl {user.currentLevel || 1} • {user.totalXP || 0} XP
                    </p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <button
                  onClick={logout}
                  className="p-1 text-app-muted hover:text-app-error hover:bg-app-hover rounded transition-colors"
                  title="Log out"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
