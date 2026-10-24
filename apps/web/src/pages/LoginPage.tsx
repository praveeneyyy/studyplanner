import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  User,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SvgRepoAcademicCap } from '../components/ui/SvgRepoIcons';

export function LoginPage() {
  const { login, quickLogin, guestLogin } = useAuth();
  const navigate = useNavigate();

  const [loadingScholar, setLoadingScholar] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = async (scholar: 'swetha' | 'prathima') => {
    setError(null);
    setLoadingScholar(scholar);
    try {
      await quickLogin(scholar);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || `Failed to log in as ${scholar}. Please try again.`);
    } finally {
      setLoadingScholar(null);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoadingScholar('guest');
    try {
      await guestLogin();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to start guest session.');
    } finally {
      setLoadingScholar(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualPassword.trim()) return;
    setError(null);
    setLoadingScholar('manual');
    try {
      await login(manualEmail.trim(), manualPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setLoadingScholar(null);
    }
  };

  const isAuthenticating = loadingScholar !== null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4 select-none">
      <div className="max-w-sm w-full bg-app-surface border border-app-borderSubtle rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Minimal Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl border border-app-borderSubtle bg-app-surface flex items-center justify-center mx-auto text-app-text shadow-2xs">
            <SvgRepoAcademicCap className="w-5 h-5 text-app-text" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-app-text">AI Smart Study Planner</h1>
            <p className="text-xs text-app-muted mt-0.5">Select a workspace to continue</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Scholar Quick Logon Options */}
        <div className="space-y-2">
          {/* Swetha */}
          <button
            type="button"
            disabled={isAuthenticating}
            onClick={() => handleQuickLogin('swetha')}
            className="w-full group p-3 rounded-xl border border-app-borderSubtle bg-app-surface hover:bg-app-hover/70 hover:border-app-border active:scale-[0.99] transition-all flex items-center justify-between text-left disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center shrink-0 border border-emerald-500/20">
                SW
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-semibold text-app-text group-hover:text-app-text transition-colors">
                  Swetha
                </div>
                <div className="text-[11px] text-app-muted truncate">
                  Computer Science & Engineering
                </div>
              </div>
            </div>

            <div className="shrink-0 pl-2 text-app-subtle group-hover:text-app-text transition-colors">
              {loadingScholar === 'swetha' ? (
                <Loader2 size={15} className="animate-spin text-app-text" />
              ) : (
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              )}
            </div>
          </button>

          {/* Prathima */}
          <button
            type="button"
            disabled={isAuthenticating}
            onClick={() => handleQuickLogin('prathima')}
            className="w-full group p-3 rounded-xl border border-app-borderSubtle bg-app-surface hover:bg-app-hover/70 hover:border-app-border active:scale-[0.99] transition-all flex items-center justify-between text-left disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                PR
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-semibold text-app-text group-hover:text-app-text transition-colors">
                  Prathima
                </div>
                <div className="text-[11px] text-app-muted truncate">
                  Information Technology & AI
                </div>
              </div>
            </div>

            <div className="shrink-0 pl-2 text-app-subtle group-hover:text-app-text transition-colors">
              {loadingScholar === 'prathima' ? (
                <Loader2 size={15} className="animate-spin text-app-text" />
              ) : (
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              )}
            </div>
          </button>

          {/* Guest Login */}
          <button
            type="button"
            disabled={isAuthenticating}
            onClick={handleGuestLogin}
            className="w-full group p-3 rounded-xl border border-dashed border-app-borderSubtle hover:border-app-text/40 bg-app-surface/60 hover:bg-app-hover/50 active:scale-[0.99] transition-all flex items-center justify-between text-left disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 font-medium text-xs flex items-center justify-center shrink-0 border border-neutral-500/20">
                <Sparkles size={15} />
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-semibold text-app-text">
                  Guest Login
                </div>
                <div className="text-[11px] text-app-muted truncate">
                  Instant preview · No password required
                </div>
              </div>
            </div>

            <div className="shrink-0 pl-2 text-app-subtle group-hover:text-app-text transition-colors">
              {loadingScholar === 'guest' ? (
                <Loader2 size={15} className="animate-spin text-app-text" />
              ) : (
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              )}
            </div>
          </button>
        </div>

        {/* Minimal Accordion for Manual Login */}
        <div className="pt-2 border-t border-app-borderSubtle">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full py-1 text-center text-xs text-app-muted hover:text-app-text transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{showManualForm ? 'Hide manual sign in' : 'Sign in with credentials'}</span>
            {showManualForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showManualForm && (
            <form onSubmit={handleManualSubmit} className="mt-4 space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-app-muted mb-1 flex items-center gap-1">
                  <User size={12} />
                  <span>Username or Email</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="e.g. swetha or prathima"
                  className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded-lg text-xs text-app-text focus:border-app-text focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-app-muted mb-1 flex items-center gap-1">
                  <KeyRound size={12} />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded-lg text-xs text-app-text focus:border-app-text focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2 px-3 rounded-lg bg-app-text text-app-bg hover:opacity-90 disabled:opacity-40 font-medium text-xs flex items-center justify-center gap-1.5 transition-opacity"
              >
                {loadingScholar === 'manual' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="flex items-center justify-between text-[11px] text-app-subtle pt-2">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>Encrypted Session</span>
          </div>
          <Link to="/register" className="hover:text-app-text transition-colors">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
}
