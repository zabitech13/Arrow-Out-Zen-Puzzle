import { HapticIntensity } from '../types/game';

export function triggerHaptic(intensity: HapticIntensity, type: 'tap' | 'invalid' | 'unlock' | 'victory') {
  if (intensity === 'off' || !('vibrate' in navigator)) return;

  const multiplier = intensity === 'light' ? 0.6 : intensity === 'medium' ? 1.0 : 1.4;

  try {
    switch (type) {
      case 'tap':
        navigator.vibrate(Math.round(15 * multiplier));
        break;
      case 'invalid':
        navigator.vibrate([Math.round(15 * multiplier), 30, Math.round(15 * multiplier)]);
        break;
      case 'unlock':
        navigator.vibrate([Math.round(20 * multiplier), 40, Math.round(30 * multiplier)]);
        break;
      case 'victory':
        navigator.vibrate([Math.round(30 * multiplier), 50, Math.round(45 * multiplier)]);
        break;
    }
  } catch {
    // Vibration blocked or unsupported
  }
}
