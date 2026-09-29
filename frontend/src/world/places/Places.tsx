import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useWorldStore, PLACES, PlaceId } from '../state/useWorldStore';
import { t } from '../../i18n';

// Renders all 10 places with floating Hindi name-plates and interaction prompts.

function NamePlate({ position, name, icon }: { position: [number, number, number]; name: string; icon: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={ref} position={position}>
      <Html center distanceFactor={30} style={{ pointerEvents: 'none' }}>
        <div className="px-3 py-1.5 rounded-xl text-white font-bold text-sm whitespace-nowrap"
          style={{ background: 'rgba(42,49,104,0.85)', border: '2px solid #F2B33D' }}>
          <span className="mr-1.5">{icon}</span>{name}
        </div>
      </Html>
    </group>
  );
}

function PlaceMarker({ placeId, position, name, icon }: { placeId: PlaceId; position: [number, number, number]; name: string; icon: string }) {
  const setCurrentPlace = useWorldStore((s) => s.setCurrentPlace);
  const setActivePanel = useWorldStore((s) => s.setActivePanel);
  const role = useWorldStore((s) => s.role);
  const place = PLACES.find((p) => p.id === placeId)!;
  const locked = place.staffOnly && role === 'beneficiary';
  const panelId = placeId === 'fieldWorker' ? 'worker' : placeId === 'districtPlanner' ? 'planner' : placeId;

  return (
    <group position={position}>
      {/* Interaction zone marker */}
      <mesh
        position={[0, 0.5, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (locked) return;
          setCurrentPlace(placeId);
          setActivePanel(panelId as any);
        }}
      >
        <boxGeometry args={[2, 1, 2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {/* Glowing base ring */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2, 32]} />
        <meshBasicMaterial color={locked ? '#888888' : '#F2B33D'} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <NamePlate position={[0, 8, 0]} name={name} icon={icon} />
      {locked && (
        <NamePlate position={[0, 6.5, 0]} name="🔒" icon="" />
      )}
    </group>
  );
}

const PLACE_ICONS: Record<PlaceId, string> = {
  home: '🏠', journey: '🛤️', training: '🎓', jobs: '💼', careers: '📈',
  aid: '🏦', community: '👥', assistant: '🪔', fieldWorker: '🚙', districtPlanner: '🗼',
};

export function Places() {
  const language = useWorldStore((s) => s.language);

  return (
    <group>
      {PLACES.map((place) => (
        <PlaceMarker
          key={place.id}
          placeId={place.id}
          position={[place.position[0], 5, place.position[2]]}
          name={t(language, `places.${place.id}`)}
          icon={PLACE_ICONS[place.id]}
        />
      ))}
    </group>
  );
}
