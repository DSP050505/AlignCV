import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── tiny globe built from lines ── */
function WireframeGlobe({ phase, elapsed }) {
  const groupRef = useRef();

  // Generate wireframe sphere lines
  const lineGeo = useMemo(() => {
    const points = [];
    const R = 2.2;
    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const r = R * Math.cos((lat * Math.PI) / 180);
      const y = R * Math.sin((lat * Math.PI) / 180);
      for (let lon = 0; lon <= 360; lon += 4) {
        const rad = (lon * Math.PI) / 180;
        points.push(new THREE.Vector3(r * Math.cos(rad), y, r * Math.sin(rad)));
        const rad2 = ((lon + 4) * Math.PI) / 180;
        points.push(new THREE.Vector3(r * Math.cos(rad2), y, r * Math.sin(rad2)));
      }
    }
    // Longitude lines
    for (let lon = 0; lon < 360; lon += 20) {
      const rad = (lon * Math.PI) / 180;
      for (let lat = -90; lat < 90; lat += 4) {
        const r1 = R * Math.cos((lat * Math.PI) / 180);
        const y1 = R * Math.sin((lat * Math.PI) / 180);
        const r2 = R * Math.cos(((lat + 4) * Math.PI) / 180);
        const y2 = R * Math.sin(((lat + 4) * Math.PI) / 180);
        points.push(new THREE.Vector3(r1 * Math.cos(rad), y1, r1 * Math.sin(rad)));
        points.push(new THREE.Vector3(r2 * Math.cos(rad), y2, r2 * Math.sin(rad)));
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  // India approximate position highlight (lat ~20, lon ~78)
  const indiaGlowGeo = useMemo(() => {
    const pts = [];
    const R = 2.22;
    // Small cluster of points around India
    for (let lat = 8; lat <= 35; lat += 2) {
      for (let lon = 68; lon <= 90; lon += 2) {
        const r = R * Math.cos((lat * Math.PI) / 180);
        const y = R * Math.sin((lat * Math.PI) / 180);
        const rad = (lon * Math.PI) / 180;
        pts.push(new THREE.Vector3(r * Math.cos(rad), y, r * Math.sin(rad)));
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (phase === 'globe') {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  // Calculate scale based on phase
  const getScale = () => {
    if (phase === 'zoomIn') return 3.5;
    return 1;
  };

  return (
    <group ref={groupRef} scale={getScale()}>
      {/* Globe wireframe */}
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color="#4f46e5"
          transparent
          opacity={phase === 'zoomIn' ? 0.1 : 0.25}
        />
      </lineSegments>

      {/* India glow points */}
      <points geometry={indiaGlowGeo}>
        <pointsMaterial
          color="#818cf8"
          size={0.06}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.35, 32, 32]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/* ── floating particles ── */
function Particles({ count = 200 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.02;
    ref.current.rotation.x += delta * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#818cf8"
        size={0.03}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

const GlobeScene = ({ phase = 'globe' }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <WireframeGlobe phase={phase} />
      <Particles />
    </Canvas>
  );
};

export default GlobeScene;
