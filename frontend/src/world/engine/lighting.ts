import * as THREE from 'three';

// Day/night cycle lighting. Full cycle ~8 real minutes. Starts at golden morning.

export const DAY_LENGTH_SECONDS = 480;

export interface DayNightState {
  timeOfDay: number; // 0..1, 0 = midnight, 0.5 = noon
  sunPosition: THREE.Vector3;
  sunIntensity: number;
  moonIntensity: number;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  ambientIntensity: number;
  isNight: boolean;
}

const SKY_DAY = new THREE.Color('#87ceeb');
const SKY_GOLDEN = new THREE.Color('#f2b33d');
const SKY_NIGHT = new THREE.Color('#0a0e2a');
const SKY_SUNSET = new THREE.Color('#e8862e');

export function computeDayNight(timeOfDay: number): DayNightState {
  const sunAngle = (timeOfDay - 0.25) * Math.PI * 2; // 0.25 = sunrise
  const sunHeight = Math.sin(sunAngle);
  const sunPosition = new THREE.Vector3(
    Math.cos(sunAngle) * 100,
    sunHeight * 100,
    40,
  );

  const dayFactor = THREE.MathUtils.clamp(sunHeight * 2.5, 0, 1);
  const sunsetFactor = THREE.MathUtils.clamp(1 - Math.abs(sunHeight) * 4, 0, 1);
  const isNight = sunHeight < -0.05;

  const skyColor = new THREE.Color();
  if (isNight) {
    skyColor.copy(SKY_NIGHT);
  } else {
    skyColor.copy(SKY_DAY).lerp(SKY_SUNSET, sunsetFactor * 0.7);
    if (sunHeight < 0.35 && sunHeight > 0) skyColor.lerp(SKY_GOLDEN, 0.4);
  }

  const fogColor = skyColor.clone();
  const sunIntensity = Math.max(0, sunHeight) * 1.6;
  // Night must stay navigable: moonlight + a raised ambient floor so the
  // village, lanterns and avatars remain readable after dark.
  const moonIntensity = isNight ? 0.55 : 0;
  const ambientIntensity = isNight ? 0.55 : 0.45 + dayFactor * 0.45;

  return {
    timeOfDay,
    sunPosition,
    sunIntensity,
    moonIntensity,
    skyColor,
    fogColor,
    ambientIntensity,
    isNight,
  };
}

export function formatTimeOfDay(timeOfDay: number): string {
  const hours = Math.floor(timeOfDay * 24);
  const minutes = Math.floor((timeOfDay * 24 - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
