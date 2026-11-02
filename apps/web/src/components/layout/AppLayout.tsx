import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AIAgentAvatar } from '../ai/AIAgentAvatar';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import { Home, Calendar, Code2, Sparkles, Menu, X } from 'lucide-react';

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const { isMobileNavOpen, closeMobileNav, toggleMobileNav } = useLayout();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg text-app-muted text-sm font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading academic workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-app-bg relative overflow-x-hidden">
      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          onClick={closeMobileNav}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Responsive Sidebar (Drawer on mobile, sticky bar on desktop) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:transform-none md:static transition-transform duration-200 ease-in-out ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar onCloseMobile={closeMobileNav} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </main>

      {/* Floating AI Agent Avatar */}
      <AIAgentAvatar />

      {/* Mobile Bottom Navigation Bar (Thumb-Ergonomic 1-tap switching for phones & small screens) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-app-surface/95 backdrop-blur-md border-t border-app-borderSubtle px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] flex items-center justify-around text-[10px] select-none shadow-sm"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-colors ${
              isActive ? 'text-app-text font-semibold' : 'text-app-muted hover:text-app-text'
            }`
          }
        >
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/planner"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-colors ${
              isActive ? 'text-app-text font-semibold' : 'text-app-muted hover:text-app-text'
            }`
          }
        >
          <Calendar size={18} />
          <span>Planner</span>
        </NavLink>

        <NavLink
          to="/ide"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-colors ${
              isActive ? 'text-app-text font-semibold' : 'text-app-muted hover:text-app-text'
            }`
          }
        >
          <Code2 size={18} />
          <span>IDE</span>
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-colors ${
              isActive ? 'text-app-text font-semibold' : 'text-app-muted hover:text-app-text'
            }`
          }
        >
          <Sparkles size={18} />
          <span>AI Tutor</span>
        </NavLink>

        <button
          onClick={toggleMobileNav}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-colors ${
            isMobileNavOpen ? 'text-app-accent font-semibold' : 'text-app-muted hover:text-app-text'
          }`}
          aria-label="Toggle all tools and workspace navigation"
        >
          {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
