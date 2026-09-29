// Shared mutable world clock - read every frame without triggering React re-renders.

export const worldClock = {
  timeOfDay: 0.32, // 0..1, 0 = midnight
  elapsed: 0,
  delta: 0,
};

export function tickWorldClock(delta: number, lockedToDay: boolean): void {
  worldClock.delta = delta;
  worldClock.elapsed += delta;
  if (!lockedToDay) {
    worldClock.timeOfDay = (worldClock.timeOfDay + delta / 480) % 1; // 8 min cycle
  }
}
