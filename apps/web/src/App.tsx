import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { ToolsPage } from './pages/ToolsPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { PlannerPage } from './pages/PlannerPage';
import { NotesPage } from './pages/NotesPage';
import { SessionWorkspacePage } from './pages/SessionWorkspacePage';
import { AITutorPage } from './pages/AITutorPage';
import { RevisionPage } from './pages/RevisionPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { RewardsPage } from './pages/RewardsPage';
import { UniversePage } from './pages/UniversePage';
import { SettingsPage } from './pages/SettingsPage';
import { IDEPage } from './pages/IDEPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DashboardProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* Professional Multi-Language Student IDE */}
                <Route path="/ide" element={<IDEPage />} />
                <Route path="/editor" element={<IDEPage />} />

                {/* Protected Workspace Routes */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<HomePage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/tools" element={<ToolsPage />} />
                  <Route path="/analytics" element={<AnalyticsDashboardPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/session/:id" element={<SessionWorkspacePage />} />
                  <Route path="/ai" element={<AITutorPage />} />
                  <Route path="/revision" element={<RevisionPage />} />
                  <Route path="/quizzes" element={<QuizzesPage />} />
                  <Route path="/rewards" element={<RewardsPage />} />
                  <Route path="/universe" element={<UniversePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DashboardProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
