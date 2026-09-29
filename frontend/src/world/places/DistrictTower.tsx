import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { adaptDistrictCells, type DistrictCell } from '../adapters';
import { useWorldStore } from '../state/useWorldStore';
import { t } from '../../i18n';

// Panchayat watch-tower. On top, a block bar chart per trade per block:
// bar height = anonymised demand, a glowing pin = verified capacity,
// and a RED segment where demand exceeds verified capacity (a real gap).
//
// Every number here comes from the Layer-5 planning adapter (which mirrors the
// /planning/matrix API). Nothing is invented in the UI.

const TOWER_TOP = 18;
const MAX_BAR = 9;
const BAR_W = 1.5;
const BAR_D = 1.5;
const GAP = 1.0;

function GapBar({ cell, index }: { cell: DistrictCell; index: number }) {
  const demandH = (cell.demand / 40) * MAX_BAR;
  const capacityH = (cell.capacity / 40) * MAX_BAR;
  const gapH = Math.max(0, demandH - capacityH);
  const isGap = cell.gap > 0;
  const grow = useRef(0);

  useFrame((_, delta) => {
    if (grow.current < 1) grow.current = Math.min(1, grow.current + delta * 1.6);
  });

  const k = grow.current;
  const x = (index - 2) * (BAR_W + GAP);
  const z = index % 2 === 0 ? -0.9 : 0.9;

  return (
    <group position={[x, 0, z]}>
      {/* verified capacity: solid gold */}
      {capacityH > 0 && (
        <mesh position={[0, (capacityH * k) / 2, 0]} castShadow>
          <boxGeometry args={[BAR_W, Math.max(0.05, capacityH * k), BAR_D]} />
          <meshLambertMaterial color="#F2B33D" emissive="#F2B33D" emissiveIntensity={0.25} />
        </mesh>
      )}
      {/* unmet demand: red = a real, queryable gap */}
      {gapH > 0 && (
        <mesh position={[0, capacityH * k + (gapH * k) / 2, 0]} castShadow>
          <boxGeometry args={[BAR_W, Math.max(0.05, gapH * k), BAR_D]} />
          <meshLambertMaterial color="#e0342c" emissive="#e0342c" emissiveIntensity={0.35} />
        </mesh>
      )}
      {/* trade label sprite */}
      <TradeLabel
        text={cell.trade}
        gap={isGap}
        position={[0, demandH * k + 1.4, 0]}
      />
    </group>
  );
}

function TradeLabel({ text, gap, position }: { text: string; gap: boolean; position: [number, number, number] }) {
  const canvas = React.useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 80;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'rgba(42,49,104,0.9)';
    ctx.strokeStyle = gap ? '#e0342c' : '#F2B33D';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(4, 4, c.width - 8, c.height - 8, 14);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px Hind, Noto Sans Devanagari, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${gap ? '⚠ ' : ''}${text}`, c.width / 2, c.height / 2 + 2);
    return c;
  }, [text, gap]);

  const sprite = useRef<THREE.Sprite>(null);
  React.useEffect(() => {
    if (!sprite.current) return;
    sprite.current.material.map = new THREE.CanvasTexture(canvas);
    sprite.current.material.needsUpdate = true;
  }, [canvas]);

  return <sprite ref={sprite} position={position} scale={[4.2, 1.3, 1]}><spriteMaterial transparent depthTest={false} /></sprite>;
}

export const DistrictTower: React.FC = () => {
  const language = useWorldStore((s) => s.language);
  const cells = adaptDistrictCells();
  const [top, setTop] = useState(false);

  return (
    <group position={[16, 0, -34]}>
      {/* tower shaft (the terrain generator already builds the block tower;
          this adds the interactive chart deck on top) */}
      <mesh position={[1.5, TOWER_TOP + 1, 1.5]} onClick={() => setTop((v) => !v)}>
        <boxGeometry args={[7, 0.5, 7]} />
        <meshLambertMaterial color="#a0663a" />
      </mesh>
      {top && (
        <group position={[1.5, TOWER_TOP + 1.4, 1.5]}>
          {/* deck */}
          <mesh position={[0, -0.2, 0]} receiveShadow>
            <boxGeometry args={[7.4, 0.3, 7.4]} />
            <meshLambertMaterial color="#8a6a4a" />
          </mesh>
          {cells.map((cell, i) => (
            <GapBar key={`${cell.block}-${cell.trade}`} cell={cell} index={i} />
          ))}
          {/* briefing lectern */}
          <mesh position={[0, 1.1, 3]}>
            <boxGeometry args={[2.4, 2, 0.2]} />
            <meshLambertMaterial color="#c1633a" />
          </mesh>
          <BriefLabel y={2.6} z={3} />
        </group>
      )}
      {!top && (
        <sprite position={[1.5, TOWER_TOP + 3.4, 1.5]} scale={[5, 1.5, 1]}>
          <spriteMaterial />
        </sprite>
      )}
    </group>
  );
}

function BriefLabel({ y, z }: { y: number; z: number }) {
  const language = useWorldStore((s) => s.language);
  const canvas = React.useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 96;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'rgba(251,241,222,0.95)';
    ctx.strokeStyle = '#D9734E';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(4, 4, c.width - 8, c.height - 8, 16);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2A3168';
    ctx.font = 'bold 40px Hind, Noto Sans Devanagari, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t(language, 'planner.brief'), c.width / 2, c.height / 2 + 2);
    return c;
  }, [language]);

  const sprite = useRef<THREE.Sprite>(null);
  React.useEffect(() => {
    if (!sprite.current) return;
    sprite.current.material.map = new THREE.CanvasTexture(canvas);
    sprite.current.material.needsUpdate = true;
  }, [canvas]);

  return <sprite ref={sprite} position={[0, y, z]} scale={[6, 1.2, 1]}><spriteMaterial transparent depthTest={false} /></sprite>;
}
