import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import { SvgRepoAcademicCap } from '../components/ui/SvgRepoIcons';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ fullName, email, password, academicLevel });
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4 select-none">
      <div className="max-w-sm w-full bg-app-surface border border-app-borderSubtle rounded-lg p-6 md:p-8 shadow-xs">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-app-sidebar border border-app-borderSubtle mb-3 text-app-text">
            <SvgRepoAcademicCap size={32} />
          </div>
          <h2 className="text-xl font-bold text-app-text tracking-tight">Create Workspace</h2>
          <p className="text-xs text-app-muted mt-1">Begin your personalized examination preparation roadmap</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none transition-colors"
              placeholder="Elena Rostova"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none transition-colors"
              placeholder="elena@university.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none transition-colors"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Academic Level</label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full px-3 py-1.5 bg-app-surface border border-app-borderSubtle rounded text-xs text-app-text focus:border-app-text outline-none cursor-pointer"
            >
              <option value="Undergraduate">Undergraduate (Engineering / Science)</option>
              <option value="Graduate">Master's / Graduate Student</option>
              <option value="Medical">Medical / Healthcare</option>
              <option value="HighSchool">Senior Secondary / High School</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 px-3 rounded bg-app-text text-app-bg hover:opacity-90 disabled:opacity-40 font-medium text-xs flex items-center justify-center gap-1.5 transition-opacity"
          >
            {loading ? 'Creating...' : 'Continue to Onboarding'} <ArrowRight size={13} />
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-app-muted">
          Already registered?{' '}
          <Link to="/login" className="text-app-text font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
