import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AIAgentAvatar } from '../ai/AIAgentAvatar';
import { useAuth } from '../../context/AuthContext';

export function AppLayout() {
  const { user, isLoading } = useAuth();

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
    <div className="min-h-screen flex bg-app-bg relative">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
      {/* Persistent Notion AI Agent Avatar */}
      <AIAgentAvatar />
    </div>
  );
}
