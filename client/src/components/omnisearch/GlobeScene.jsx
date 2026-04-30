import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// 1. Emerging Sun / Energy Source (Passes beside it)
function EnergySun() {
  const meshRef = useRef();
  const materialRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Emerge from blank screen slowly over first 3.0s
    const scale = Math.min(t / 3.0, 1);
    const pulse = 1 + Math.sin(t * 3) * 0.05;
    if (meshRef.current) meshRef.current.scale.setScalar(scale * pulse);
    
    if (materialRef.current) {
       materialRef.current.emissiveIntensity = 2 + Math.sin(t * 2) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2.5, 64, 64]} />
      <meshStandardMaterial 
        ref={materialRef}
        color="#ffcc66" 
        emissive="#ff8800" 
        emissiveIntensity={2}
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// 2. Deep Space Warp Stars
function WarpStars() {
  const count = 3000;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 200; 
      arr[i * 3 + 1] = (Math.random() - 0.5) * 200; 
      arr[i * 3 + 2] = 20 - Math.random() * 340; 
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.3} transparent opacity={0.8} />
    </points>
  );
}

// 3. Realistic Earth & Clouds
function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();
  
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const earthMap = useMemo(() => textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'), [textureLoader]);
  const earthBump = useMemo(() => textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'), [textureLoader]);
  const cloudMap = useMemo(() => textureLoader.load('https://unpkg.com/three-globe/example/img/earth-clouds10k.png'), [textureLoader]);
  
  const earthRadius = 15;
  const earthPos = new THREE.Vector3(0, 0, -300);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    let rot = 0;
    let tilt = 0.3; 

    if (t < 9.0) {
       rot = t * 0.1;
    } else if (t >= 9.0 && t <= 15.0) {
       const p = (t - 9.0) / 6.0; 
       const startRot = 9.0 * 0.1; 
       
       // Fine-tuned target rotation to perfectly center India 
       const targetRot = 2.85; 
       const endRot = targetRot + (Math.PI * 2 * 1);
       
       const easeInOut = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
       rot = startRot + (endRot - startRot) * easeInOut;
       
       tilt = 0.3 * (1 - easeInOut);
    } else {
       rot = 2.85; 
       tilt = 0; 
    }
    
    if (earthRef.current) {
      earthRef.current.rotation.y = rot; 
      earthRef.current.rotation.x = tilt; 
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = rot; 
      cloudsRef.current.rotation.x = tilt;
    }
  });

  return (
    <group position={earthPos}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[earthRadius, 64, 64]} />
        <meshStandardMaterial 
          map={earthMap}
          bumpMap={earthBump}
          bumpScale={0.15}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[earthRadius + 0.2, 64, 64]} />
        <meshStandardMaterial 
          map={cloudMap}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// 4. Cinematic Camera Choreographer
function CameraController() {
  const cameraPath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 20),       
      new THREE.Vector3(3, 0, 10),       
      new THREE.Vector3(6, 0, 0),        
      new THREE.Vector3(3, 0, -80),      
      new THREE.Vector3(0, 0, -180),     
      new THREE.Vector3(5, 2, -230),     
      new THREE.Vector3(0, 0, -260),     
      // Tuned Z distance (-267) to perfectly match 1.2x scale of 2D neon map
      new THREE.Vector3(0, 0, -267)      
    ]);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const travelDuration = 15.0; 
    
    let progress = Math.min(t / travelDuration, 1.0);
    
    const easedProgress = progress < 0.5 
      ? 2 * progress * progress 
      : -1 + (4 - 2 * progress) * progress;

    const currentPos = cameraPath.getPointAt(easedProgress);
    state.camera.position.copy(currentPos);
    
    const sunTarget = new THREE.Vector3(0, 0, 0);
    const earthTarget = new THREE.Vector3(0, 0, -300); 
    let lookMix = 0;
    
    if (t > 2.5 && t < 5.0) {
       lookMix = (t - 2.5) / 2.5;
       lookMix = lookMix * lookMix * (3 - 2 * lookMix); 
    } else if (t >= 5.0) {
       lookMix = 1;
    }
    
    const targetPos = new THREE.Vector3().lerpVectors(sunTarget, earthTarget, lookMix);
    state.camera.lookAt(targetPos);
  });
  return null;
}

const GlobeScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 45 }}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none',
      }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#000000']} />
      
      {/* Fog is critical here! It hides Earth completely at the start. 
          Earth is at z=-300. When camera is at z=0, distance is 300 (hidden).
          As camera flies past z=-150, Earth emerges dynamically as a dot! */}
      <fog attach="fog" args={['#000000', 30, 150]} />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#4f46e5" />
      
      <WarpStars />
      <EnergySun />
      <Earth />
      
      <CameraController />
      
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          height={300} 
          intensity={2.0} 
        />
      </EffectComposer>
    </Canvas>
  );
};

export default GlobeScene;
