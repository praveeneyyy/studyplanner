import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

function GemModel({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF('/models/progress_gem.glb');
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.8;
      groupRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} scale={1.8}>
      <primitive object={clonedScene} />
    </group>
  );
}

function FallbackGeometry({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
      meshRef.current.rotation.x += delta * 0.3;
    }
  });
  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[1.2, 0]} />
      <meshStandardMaterial
        color={isDark ? '#5E9E74' : '#2A9D8F'}
        roughness={0.2}
        metalness={0.3}
      />
    </mesh>
  );
}

export function LearningProgressOrb({ size = 24 }: { size?: number }) {
  const { resolvedTheme } = useTheme();
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGLError(true);
    } catch {
      setHasWebGLError(true);
    }
  }, []);

  if (hasWebGLError) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono text-[10px]"
      >
        ◆
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }} className="overflow-hidden flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      >
        <ambientLight intensity={isDark ? 0.9 : 1.2} />
        <directionalLight position={[3, 5, 2]} intensity={isDark ? 1.4 : 1.6} />
        <directionalLight position={[-3, -2, -2]} intensity={0.5} />
        <Suspense fallback={<FallbackGeometry isDark={isDark} />}>
          <GemModel isDark={isDark} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the Blender asset
try {
  useGLTF.preload('/models/progress_gem.glb');
} catch {
  // Graceful preload skip
}
