import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useWorldStore } from '../state/useWorldStore';
import { computeDayNight } from '../engine/lighting';
import { getQualitySettings } from '../engine/quality';
import { worldClock, tickWorldClock } from '../engine/worldClock';

// Procedural sky: gradient dome, sun/moon, blocky clouds, stars.

const CLOUD_COUNT = 12;

export function Sky() {
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const lockedToDay = useWorldStore((s) => s.lockedToDay);
  const quality = useWorldStore((s) => s.quality);
  const q = getQualitySettings(quality);
  const { scene } = useThree();

  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Points>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);

  const skyUniforms = useMemo(() => ({
    topColor: { value: new THREE.Color('#4a90d9') },
    bottomColor: { value: new THREE.Color('#87ceeb') },
    offset: { value: 20 },
    exponent: { value: 0.7 },
  }), []);

  const starPositions = useMemo(() => {
    const positions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const r = 180;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  const cloudPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      arr.push([
        (Math.random() - 0.5) * 200,
        40 + Math.random() * 15,
        (Math.random() - 0.5) * 200,
      ]);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    const state = useWorldStore.getState();
    tickWorldClock(delta, state.lockedToDay);
    const t = worldClock.timeOfDay;
    const dn = computeDayNight(t);

    if (sunRef.current) {
      sunRef.current.position.copy(dn.sunPosition);
      sunRef.current.intensity = dn.sunIntensity * 1.5;
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = dn.ambientIntensity;
    }
    if (skyMatRef.current) {
      skyMatRef.current.uniforms.topColor.value.copy(dn.skyColor).multiplyScalar(0.6);
      skyMatRef.current.uniforms.bottomColor.value.copy(dn.skyColor);
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.002;
      const mat = (cloudsRef.current.children[0] as THREE.Mesh)?.material as THREE.MeshBasicMaterial | undefined;
      if (mat) mat.opacity = dn.isNight ? 0.15 : 0.85;
    }
    if (starsRef.current) {
      const mat = starsRef.current.material as THREE.PointsMaterial;
      mat.opacity = dn.isNight ? 0.9 : 0;
    }
    if (sunMeshRef.current) {
      sunMeshRef.current.position.copy(dn.sunPosition);
    }
    const fog = scene.fog as THREE.Fog | null;
    if (fog) fog.color.copy(dn.fogColor);
  });

  const dn = computeDayNight(timeOfDay);

  return (
    <>
      <mesh>
        <sphereGeometry args={[200, 24, 16]} />
        <shaderMaterial
          ref={skyMatRef}
          uniforms={skyUniforms}
          vertexShader={`
            varying vec3 vWorldPosition;
            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
              float h = normalize(vWorldPosition + offset).y;
              gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
          `}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <directionalLight
        ref={sunRef}
        position={dn.sunPosition.toArray()}
        intensity={dn.sunIntensity * 1.5}
        castShadow={q.shadows}
        shadow-mapSize-width={q.shadows ? 1024 : 0}
        shadow-mapSize-height={q.shadows ? 1024 : 0}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={200}
        color={dn.isNight ? '#8899cc' : '#fff4e0'}
      />
      <hemisphereLight
        ref={hemiRef}
        intensity={dn.ambientIntensity}
        color={dn.isNight ? '#334466' : '#87ceeb'}
        groundColor={dn.isNight ? '#1a1a2e' : '#8a5a33'}
      />
      <ambientLight intensity={dn.isNight ? 0.15 : 0.25} />

      {/* Sun */}
      <mesh ref={sunMeshRef} position={dn.sunPosition.toArray()}>
        <boxGeometry args={[6, 6, 6]} />
        <meshBasicMaterial color={dn.isNight ? '#e8e8f0' : '#ffd870'} />
      </mesh>

      {/* Blocky clouds */}
      <group ref={cloudsRef}>
        {cloudPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <boxGeometry args={[8 + (i % 3) * 3, 2, 5 + (i % 2) * 2]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        ))}
      </group>

      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={300}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.8} color="#ffffff" transparent opacity={0} sizeAttenuation />
      </points>
    </>
  );
}
