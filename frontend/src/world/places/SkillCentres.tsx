import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { adaptRecommendations, type CentreBuilding } from '../adapters';
import { useWorldStore } from '../state/useWorldStore';
import { t } from '../../i18n';

// Skill-centre district.
//
// Verified Match Protocol, shown physically:
//   Interest Match = translucent blue "blueprint" ghost with wireframe frame
//                    and scaffolding.
//   Verified Match = solid, lit building with a golden beacon beam.
// Never colour-only: every centre also gets a text label + icon.

function GhostCentre({ centre }: { centre: CentreBuilding }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.02;
  });
  const [x, y, z] = centre.position;
  return (
    <group ref={ref} position={[x, y, z]}>
      {/* translucent blueprint body */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[7, 6, 5]} />
        <meshBasicMaterial color="#5a9aec" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* wireframe edges */}
      <lineSegments position={[0, 3, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(7, 6, 5)]} />
        <lineBasicMaterial color="#5a9aec" transparent opacity={0.9} />
      </lineSegments>
      {/* scaffolding poles */}
      {[[-3.5, -2.5], [3.5, -2.5], [-3.5, 2.5], [3.5, 2.5]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 3, pz]}>
          <boxGeometry args={[0.2, 6, 0.2]} />
          <meshBasicMaterial color="#8ab4f8" transparent opacity={0.7} />
        </mesh>
      ))}
      {/* scaffolding cross-braces */}
      {[1.5, 4.5].map((sy) => (
        <mesh key={sy} position={[0, sy, -2.5]}>
          <boxGeometry args={[7, 0.15, 0.15]} />
          <meshBasicMaterial color="#8ab4f8" transparent opacity={0.6} />
        </mesh>
      ))}
      {/* flat "plan" on the ground */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshBasicMaterial color="#5a9aec" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function BuiltCentre({ centre }: { centre: CentreBuilding }) {
  const beam = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!beam.current) return;
    const mat = beam.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.35 + Math.sin(clock.elapsedTime * 2) * 0.15;
  });
  const [x, y, z] = centre.position;
  return (
    <group position={[x, y, z]}>
      {/* solid walls */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 6, 5]} />
        <meshLambertMaterial color="#f5efe0" />
      </mesh>
      {/* terracotta roof */}
      <mesh position={[0, 6.3, 0]} castShadow>
        <boxGeometry args={[7.6, 0.6, 5.6]} />
        <meshLambertMaterial color="#c1633a" />
      </mesh>
      {/* open door (dark recess) */}
      <mesh position={[0, 1.2, 2.55]}>
        <boxGeometry args={[1.4, 2.4, 0.2]} />
        <meshLambertMaterial color="#3a2410" />
      </mesh>
      {/* lit windows */}
      {[-2, 2].map((wx) => (
        <mesh key={wx} position={[wx, 3, 2.55]}>
          <boxGeometry args={[1.2, 1.2, 0.2]} />
          <meshBasicMaterial color="#ffd870" />
        </mesh>
      ))}
      {/* golden beacon beam */}
      <mesh ref={beam} position={[0, 14, 0]}>
        <cylinderGeometry args={[0.7, 0.35, 16, 8]} />
        <meshBasicMaterial color="#F2B33D" transparent opacity={0.4} />
      </mesh>
      <pointLight position={[0, 6, 0]} color="#F2B33D" intensity={3} distance={18} />
    </group>
  );
}

function BuildingAnimation({ centre }: { centre: CentreBuilding }) {
  const [progress, setProgress] = useState(0);
  const group = useRef<THREE.Group>(null);
  const verified = progress >= 1;

  useFrame((_, delta) => {
    if (progress >= 1 || !group.current) return;
    // "Place the final blocks": the ghost solidifies block by block.
    setProgress((p) => Math.min(1, p + delta * 0.7));
  });

  return (
    <group ref={group}>
      {verified ? <BuiltCentre centre={centre} /> : <GhostCentre centre={centre} />}
      {progress > 0 && progress < 1 && (
        <mesh position={[centre.position[0], centre.position[1] + progress * 7, centre.position[2]]}>
          <boxGeometry args={[8, 0.3, 6]} />
          <meshBasicMaterial color="#F2B33D" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

export const SkillCentres: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const centres = adaptRecommendations();

  return (
    <group>
      {centres.map((c) => (
        <React.Fragment key={c.id}>
          {c.verified ? <BuiltCentre centre={c} /> : <BuildingAnimation centre={c} />}
          {/* Status label: icon + text, never colour alone */}
          <CentreLabel centre={c} />
        </React.Fragment>
      ))}
    </group>
  );
};

function CentreLabel({ centre }: { centre: CentreBuilding }) {
  const language = useWorldStore((s) => s.language);
  const text = centre.verified
    ? `🏠 ${t(language, 'match.verified')}`
    : `📐 ${t(language, 'match.interest')}`;
  return (
    <HtmlLabel position={[centre.position[0], centre.position[1] + 9, centre.position[2]]} text={text} verified={centre.verified} />
  );
}

// Small self-contained billboard label (avoids pulling in drei Html for every label)
function HtmlLabel({ position, text, verified }: { position: [number, number, number]; text: string; verified: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const tex = useRef<THREE.SpriteMaterial | null>(null);
  const sprite = useRef<THREE.Sprite | null>(null);

  const canvas = React.useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 96;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = verified ? 'rgba(42,49,104,0.9)' : 'rgba(20,40,80,0.9)';
    ctx.strokeStyle = verified ? '#F2B33D' : '#5a9aec';
    ctx.lineWidth = 6;
    const r = 18;
    ctx.beginPath();
    ctx.moveTo(r, 4); ctx.lineTo(c.width - r, 4);
    ctx.quadraticCurveTo(c.width - 4, 4, c.width - 4, 4 + r);
    ctx.lineTo(c.width - 4, c.height - r - 4);
    ctx.quadraticCurveTo(c.width - 4, c.height - 4, c.width - r, c.height - 4);
    ctx.lineTo(r, c.height - 4);
    ctx.quadraticCurveTo(4, c.height - 4, 4, c.height - r - 4);
    ctx.lineTo(4, 4 + r);
    ctx.quadraticCurveTo(4, 4, r, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Hind, Noto Sans Devanagari, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, c.height / 2 + 2);
    return c;
  }, [text, verified]);

  React.useEffect(() => {
    if (!sprite.current) return;
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    if (tex.current) tex.current.map = map;
  }, [canvas]);

  return (
    <sprite ref={sprite} position={position} scale={[7.5, 1.4, 1]}>
      <spriteMaterial ref={tex} transparent depthTest={false} />
    </sprite>
  );
}
