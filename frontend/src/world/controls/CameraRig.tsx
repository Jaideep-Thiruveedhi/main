import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useWorldStore } from '../state/useWorldStore';

// Third-person camera that follows the player, with mouse-look and touch drag.

export function CameraRig() {
  const { camera, gl } = useThree();
  const playerPosition = useWorldStore((s) => s.playerPosition);
  const reduceMotion = useWorldStore((s) => s.reduceMotion);
  // Start looking from the home courtyard across the village toward the centre.
  const yaw = useRef(-1.42);
  const pitch = useRef(0.38);
  const distance = useRef(13);
  const isDragging = useRef(false);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        // Only start drag if not on a UI element
        if ((e.target as HTMLElement).closest('[data-ui]')) return;
        isDragging.current = true;
        lastTouch.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && document.pointerLockElement === canvas) {
        yaw.current -= e.movementX * 0.003;
        pitch.current = THREE.MathUtils.clamp(pitch.current + e.movementY * 0.003, -0.2, 1.2);
      } else if (isDragging.current && lastTouch.current && e.pointerType === 'touch') {
        const dx = e.clientX - lastTouch.current.x;
        const dy = e.clientY - lastTouch.current.y;
        yaw.current -= dx * 0.005;
        pitch.current = THREE.MathUtils.clamp(pitch.current + dy * 0.005, -0.2, 1.2);
        lastTouch.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onPointerUp = () => {
      isDragging.current = false;
      lastTouch.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      distance.current = THREE.MathUtils.clamp(distance.current + e.deltaY * 0.01, 4, 16);
    };
    const onClick = () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock?.();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel);
    canvas.addEventListener('click', onClick);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
    };
  }, [gl]);

  useFrame(() => {
    const target = new THREE.Vector3(playerPosition[0], playerPosition[1] + 1.5, playerPosition[2]);
    const offset = new THREE.Vector3(
      Math.sin(yaw.current) * Math.cos(pitch.current) * distance.current,
      Math.sin(pitch.current) * distance.current,
      Math.cos(yaw.current) * Math.cos(pitch.current) * distance.current,
    );
    const desired = target.clone().add(offset);
    if (reduceMotion) {
      camera.position.copy(desired);
    } else {
      camera.position.lerp(desired, 0.08);
    }
    camera.lookAt(target);
  });

  return null;
}
