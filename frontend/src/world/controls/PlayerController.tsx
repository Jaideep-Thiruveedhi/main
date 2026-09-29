import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useWorldStore, PLACES, type PlaceId } from '../state/useWorldStore';
import { isSolid } from '../engine/blocks';
import { getWorld, getWorldBlock } from '../engine/world';
import { CHUNK_HEIGHT } from '../engine/chunks';

// Third-person player controller: WASD + touch joystick, jump, collision, step-up.

// Spawn in the open courtyard of the home compound, north of the houses, with
// a clear line of sight across the village.
const SPAWN: [number, number, number] = [-20, 6, 3];
const GRAVITY = -20;
const JUMP_VELOCITY = 7;
const WALK_SPEED = 5;
const SPRINT_SPEED = 8;
const PLAYER_HEIGHT = 1.8;

export function PlayerController() {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const onGround = useRef(false);
  const keys = useRef<Record<string, boolean>>({});
  const joystick = useRef<{ x: number; y: number } | null>(null);
  const setPlayerPosition = useWorldStore((s) => s.setPlayerPosition);
  const reduceMotion = useWorldStore((s) => s.reduceMotion);

  const worldChunks = useRef(getWorld());

  const getBlockAt = (wx: number, wy: number, wz: number): number => {
    return getWorldBlock(wx, Math.floor(wy), wz);
  };

  const collides = (x: number, y: number, z: number): boolean => {
    // Check player AABB against solid blocks
    const minX = Math.floor(x - 0.3);
    const maxX = Math.floor(x + 0.3);
    const minY = Math.floor(y);
    const maxY = Math.floor(y + PLAYER_HEIGHT);
    const minZ = Math.floor(z - 0.3);
    const maxZ = Math.floor(z + 0.3);
    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (isSolid(getBlockAt(bx, by, bz))) return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Snap the player onto the topmost solid block at spawn so we never
  // start floating above, or sinking into, the ground.
  useEffect(() => {
    const group = playerRef.current;
    if (!group) return;
    const [sx, , sz] = SPAWN;
    let y = SPAWN[1];
    for (let probe = CHUNK_HEIGHT - 1; probe >= 0; probe--) {
      if (isSolid(getBlockAt(sx, probe, sz))) { y = probe + 1; break; }
    }
    group.position.set(sx, y, sz);
    velocity.current.set(0, 0, 0);
    onGround.current = true;
  }, []);

  // Expose joystick setter for touch controls
  useEffect(() => {
    (window as any).__setJoystick = (v: { x: number; y: number } | null) => {
      joystick.current = v;
    };
  }, []);

  useFrame((_, delta) => {
    if (!playerRef.current) return;
    const dt = Math.min(delta, 0.05);
    const pos = playerRef.current.position;

    // Fast travel / debug teleport: snap and cancel any auto-walk.
    const st = useWorldStore.getState();
    if (st.teleportRequest) {
      const tr = st.teleportRequest;
      let y = tr.y;
      if (!isSolid(getBlockAt(tr.x, tr.y, tr.z))) {
        for (let probe = CHUNK_HEIGHT - 1; probe >= 0; probe--) {
          if (isSolid(getBlockAt(tr.x, probe, tr.z))) { y = probe + 1; break; }
        }
      }
      pos.set(tr.x, y, tr.z);
      velocity.current.set(0, 0, 0);
      onGround.current = true;
      st.clearTeleport();
      st.setAutoWalkTarget(null);
    }

    // Input direction (camera-relative)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

    const move = new THREE.Vector3();
    if (keys.current['KeyW'] || keys.current['ArrowUp']) move.add(forward);
    if (keys.current['KeyS'] || keys.current['ArrowDown']) move.sub(forward);
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) move.sub(right);
    if (keys.current['KeyD'] || keys.current['ArrowRight']) move.add(right);
    if (joystick.current) {
      move.add(forward.clone().multiplyScalar(-joystick.current.y));
      move.add(right.clone().multiplyScalar(joystick.current.x));
    }

    // Auto-walk ("go there"): steer toward the target, or teleport if the
    // user asked for reduced motion.
    const state = useWorldStore.getState();
    const target = state.autoWalkTarget;
    if (target) {
      const tdx = target[0] - pos.x;
      const tdz = target[2] - pos.z;
      const dist = Math.hypot(tdx, tdz);
      if (dist < 1.8) {
        state.setAutoWalkTarget(null);
      } else if (state.reduceMotion) {
        pos.x = target[0];
        pos.z = target[2];
        state.setAutoWalkTarget(null);
      } else {
        move.x += tdx / dist;
        move.z += tdz / dist;
      }
    }

    if (move.lengthSq() > 0) move.normalize();

    const speed = keys.current['ShiftLeft'] || keys.current['ShiftRight'] ? SPRINT_SPEED : WALK_SPEED;
    const dx = move.x * speed * dt;
    const dz = move.z * speed * dt;

    // Horizontal collision with step-up
    const tryMove = (mx: number, mz: number): boolean => {
      const nx = pos.x + mx;
      const nz = pos.z + mz;
      if (!collides(nx, pos.y, nz)) { pos.x = nx; pos.z = nz; return true; }
      // step up 1 block
      if (!collides(nx, pos.y + 1, nz)) { pos.x = nx; pos.z = nz; pos.y += 1; return true; }
      return false;
    };
    tryMove(dx, 0);
    tryMove(0, dz);

    // Gravity + jump
    velocity.current.y += GRAVITY * dt;
    if ((keys.current['Space']) && onGround.current) {
      velocity.current.y = JUMP_VELOCITY;
      onGround.current = false;
    }
    const ny = pos.y + velocity.current.y * dt;
    if (collides(pos.x, ny, pos.z)) {
      if (velocity.current.y < 0) onGround.current = true;
      velocity.current.y = 0;
    } else {
      pos.y = ny;
      onGround.current = false;
    }

    // Safe respawn if fallen
    if (pos.y < -10) {
      pos.set(...SPAWN);
      velocity.current.set(0, 0, 0);
    }

    // Proximity: which place is the player standing next to?
    let nearest: PlaceId | null = null;
    let nearestDist = 6;
    for (const p of PLACES) {
      const d = Math.hypot(p.position[0] - pos.x, p.position[2] - pos.z);
      if (d < nearestDist) { nearestDist = d; nearest = p.id; }
    }
    if (nearest !== useWorldStore.getState().nearbyPlace) {
      useWorldStore.getState().setNearbyPlace(nearest);
    }

    // 'E' opens the nearby place's panel
    if ((keys.current['KeyE'] || keys.current['Enter']) && nearest) {
      keys.current['KeyE'] = false;
      const s = useWorldStore.getState();
      s.setCurrentPlace(nearest);
      s.setActivePanel(
        (nearest === 'fieldWorker' ? 'worker'
          : nearest === 'districtPlanner' ? 'planner'
          : nearest) as any
      );
    }

    // Walk bob
    if (move.lengthSq() > 0 && onGround.current && !reduceMotion) {
      pos.y += Math.sin(performance.now() * 0.01) * 0.03;
    }

    setPlayerPosition([pos.x, pos.y, pos.z]);
  });

  return (
    <group ref={playerRef} position={SPAWN}>
      {/* Simple blocky player avatar */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.6, 1.2, 0.4]} />
        <meshLambertMaterial color="#3a6ac1" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshLambertMaterial color="#e8b88a" />
      </mesh>
      {/* Soft light so the player stays visible after dark */}
      <pointLight position={[0, 1.6, 0]} color="#ffd9a0" intensity={1.4} distance={12} />
    </group>
  );
}
