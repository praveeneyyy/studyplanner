import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, X, Orbit, List } from 'lucide-react';
import { KnowledgeGraphView } from '../universe/KnowledgeGraphView';

interface TopicNodeData {
  id: string;
  title: string;
  subjectName: string;
  color: string;
  masteryScore: number;
  status: string;
}

interface SubjectPlanetData {
  id: string;
  name: string;
  color: string;
  topics: TopicNodeData[];
  orbitRadius: number;
  speed: number;
}

// Blender 3D Central Study Plinth & Knowledge Orb
function CentralStudyModel() {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('/models/study_workspace.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} scale={1.5} position={[0, -0.6, 0]}>
      <primitive object={clonedScene} />
      <Html distanceFactor={16} position={[0, 2.2, 0]} center>
        <div className="bg-app-surface/90 backdrop-blur-sm px-2.5 py-1 rounded border border-app-borderSubtle text-[11px] font-semibold text-app-text whitespace-nowrap shadow-sm pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Core Knowledge Hub
        </div>
      </Html>
    </group>
  );
}

function FallbackCentralSun() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.3;
  });
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial
        color="#FFB703"
        emissive="#FB8500"
        emissiveIntensity={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// 3D Subject Planet Node with Orbiting Topic Moons
function SubjectPlanet({
  planet,
  onSelectTopic
}: {
  planet: SubjectPlanetData;
  onSelectTopic: (topic: TopicNodeData) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * planet.speed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Subject Center Planet */}
      <mesh position={[planet.orbitRadius, 0, 0]}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshStandardMaterial color={planet.color} roughness={0.3} metalness={0.1} />
        <Html distanceFactor={18} position={[0, 1.4, 0]} center>
          <div className="bg-app-surface/90 backdrop-blur-sm px-2 py-0.5 rounded border border-app-borderSubtle text-[11px] font-semibold text-app-text whitespace-nowrap shadow-sm pointer-events-none">
            {planet.name}
          </div>
        </Html>
      </mesh>

      {/* Orbit Ring Line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitRadius - 0.03, planet.orbitRadius + 0.03, 64]} />
        <meshBasicMaterial color="#787774" opacity={0.25} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Orbiting Topic Moons */}
      {planet.topics.map((topic, idx) => {
        const angle = (idx / (planet.topics.length || 1)) * Math.PI * 2;
        const moonDist = 2.0;
        const moonX = planet.orbitRadius + Math.cos(angle) * moonDist;
        const moonZ = Math.sin(angle) * moonDist;

        // Mastery color: Mastered (Emerald), Developing (Sage), Weak (Crimson)
        const moonColor =
          topic.masteryScore >= 80 ? '#2A9D8F' : topic.masteryScore >= 50 ? '#CB912F' : '#EB5757';

        return (
          <mesh
            key={topic.id}
            position={[moonX, 0, moonZ]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTopic(topic);
            }}
          >
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial
              color={moonColor}
              emissive={moonColor}
              emissiveIntensity={0.3}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function StudyUniverse({ subjects }: { subjects: any[] }) {
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<TopicNodeData | null>(null);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const isDark = resolvedTheme === 'dark';

  // Transform curriculum data into planetary system
  const planets: SubjectPlanetData[] = useMemo(() => {
    return (subjects || []).map((subj, idx) => {
      const allTopics: TopicNodeData[] = [];
      (subj.units || []).forEach((u: any) => {
        (u.topics || []).forEach((t: any) => {
          allTopics.push({
            id: t.id,
            title: t.title,
            subjectName: subj.name,
            color: subj.colorToken === 'cs' ? '#28456C' : subj.colorToken === 'math' ? '#492F64' : '#89632A',
            masteryScore: t.confidence * 20,
            status: t.status
          });
        });
      });

      return {
        id: subj.id,
        name: subj.name,
        color: subj.colorToken === 'cs' ? '#28456C' : subj.colorToken === 'math' ? '#492F64' : '#89632A',
        topics: allTopics.slice(0, 5),
        orbitRadius: 6.2 + idx * 4.2,
        speed: 0.14 / (idx + 1)
      };
    });
  }, [subjects]);

  return (
    <div className="relative w-full h-[650px] rounded-lg border border-app-borderSubtle bg-app-surface overflow-hidden">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="bg-app-surface/90 backdrop-blur border border-app-borderSubtle rounded p-0.5 flex items-center text-xs">
          <button
            onClick={() => setViewMode('3D')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === '3D' ? 'bg-app-text text-app-bg' : 'text-app-muted hover:text-app-text'
            }`}
          >
            <Orbit size={13} /> 3D Blender Space
          </button>
          <button
            onClick={() => setViewMode('2D')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === '2D' ? 'bg-app-text text-app-bg' : 'text-app-muted hover:text-app-text'
            }`}
          >
            <List size={13} /> Knowledge Graph
          </button>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 bg-app-surface/90 backdrop-blur border border-app-borderSubtle rounded px-3 py-1 text-[11px] text-app-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered (80%+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Developing (50-79%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Needs Attention (&lt;50%)
          </span>
        </div>
      </div>

      {/* 3D Canvas View */}
      {viewMode === '3D' ? (
        <Canvas camera={{ position: [0, 20, 26], fov: 45 }}>
          <ambientLight intensity={isDark ? 0.9 : 1.3} />
          <directionalLight position={[10, 20, 15]} intensity={1.5} />
          <pointLight position={[0, 8, 0]} intensity={2.5} color="#FBF3DB" />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={6}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2.05}
          />

          {/* Central Blender 3D Study Model */}
          <Suspense fallback={<FallbackCentralSun />}>
            <CentralStudyModel />
          </Suspense>

          {planets.map((planet) => (
            <SubjectPlanet key={planet.id} planet={planet} onSelectTopic={setSelectedTopic} />
          ))}
        </Canvas>
      ) : (
        /* Interactive Multi-Tier Prerequisite Knowledge Graph */
        <div className="h-full pt-14">
          <KnowledgeGraphView
            subjects={subjects}
            onSelectTopic={(t) => setSelectedTopic(t)}
            onStartFocus={() => navigate('/planner')}
          />
        </div>
      )}

      {/* Selected Topic Quick Drawer Modal */}
      {selectedTopic && (
        <div className="absolute bottom-4 right-4 z-20 w-80 bg-app-surface border border-app-borderStrong rounded-lg p-3.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-[10px] font-semibold text-app-muted uppercase tracking-wider block">
                {selectedTopic.subjectName}
              </span>
              <h4 className="text-xs font-semibold text-app-text">{selectedTopic.title}</h4>
            </div>
            <button
              onClick={() => setSelectedTopic(null)}
              className="p-1 rounded text-app-muted hover:text-app-text hover:bg-app-hover"
            >
              <X size={14} />
            </button>
          </div>

          <div className="my-2.5 py-2 border-y border-app-borderSubtle flex items-center justify-between text-xs">
            <span className="text-app-muted">Mastery Estimate:</span>
            <span className="font-semibold text-app-text tabular-nums">{selectedTopic.masteryScore}%</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => navigate('/planner')}
              className="flex-1 py-1 px-2.5 rounded bg-app-text text-app-bg text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Play size={12} className="fill-current" /> Study Now
            </button>
            <button
              onClick={() => navigate('/ai')}
              className="py-1 px-2.5 rounded border border-app-borderStrong hover:bg-app-hover text-app-text text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={12} /> Ask AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

try {
  useGLTF.preload('/models/study_workspace.glb');
} catch {
  // Preload graceful pass
}
