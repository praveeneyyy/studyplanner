import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TopBar } from '../components/layout/TopBar';
import { Orbit } from 'lucide-react';
import { StudyUniverse } from '../components/3d/StudyUniverse';

export function UniversePage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getSubjects();
        if (res?.data) setSubjects(res.data);
      } catch (err) {
        console.error('Failed to load universe subjects:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-app-bg">
      <TopBar
        breadcrumbs={[
          { label: 'Workspace', to: '/dashboard' },
          { label: '3D Study Universe' }
        ]}
        subtitle="Blender spatial curriculum visualizer"
      />

      <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-4">
        {/* Notion Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-2xl font-bold text-app-text">
            <Orbit size={24} className="text-app-text shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight text-app-text">3D Study Universe</h1>
          </div>
          <p className="text-xs text-app-muted">
            Interactive 3D spatial topology powered by Blender assets. Orbit around your curriculum, inspect topic mastery, and launch study sessions.
          </p>
        </div>

        {/* 3D Canvas */}
        {loading ? (
          <div className="h-[600px] flex items-center justify-center text-xs text-app-muted border border-app-borderSubtle rounded-lg bg-app-surface">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-app-text border-t-transparent rounded-full animate-spin" />
              <span>Loading Blender 3D Universe...</span>
            </div>
          </div>
        ) : (
          <StudyUniverse subjects={subjects} />
        )}
      </div>
    </div>
  );
}
