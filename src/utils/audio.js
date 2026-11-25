let ctx = null;
const lastPlayedAt = new Map();

const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
};

const canPlay = (name, cooldownMs) => {
  const now = Date.now();
  if (now - (lastPlayedAt.get(name) || 0) < cooldownMs) return false;
  lastPlayedAt.set(name, now);
  return true;
};

export const playClickSound = () => {
  if (!canPlay('click', 60)) return;
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);

    osc.start();
    osc.stop(c.currentTime + 0.04);
  } catch { /* fallback silently */ }
};

export const playNotificationChime = () => {
  if (!canPlay('chime', 300)) return;
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, c.currentTime);
    osc.frequency.setValueAtTime(659.25, c.currentTime + 0.06);

    gain.gain.setValueAtTime(0.06, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);

    osc.start();
    osc.stop(c.currentTime + 0.2);
  } catch { /* fallback silently */ }
};

export const playGallowsExecutionSound = () => {
  if (!canPlay('gallows', 500)) return;
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();

    // Low frequency drop boom
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, c.currentTime);
    osc.frequency.linearRampToValueAtTime(30, c.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);

    osc.start();
    osc.stop(c.currentTime + 0.8);

    // Add a second noisy friction/creak wave
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.connect(gain2);
    gain2.connect(c.destination);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(60, c.currentTime);
    osc2.frequency.linearRampToValueAtTime(40, c.currentTime + 0.4);
    gain2.gain.setValueAtTime(0.02, c.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    osc2.start();
    osc2.stop(c.currentTime + 0.4);
  } catch { /* fallback silently */ }
};

export const playExplosionSound = () => {
  if (!canPlay('explosion', 500)) return;
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();

    // Noise buffer generation for explosion crackle
    const bufferSize = c.sampleRate * 1.5;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = c.createBufferSource();
    noise.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(10, c.currentTime + 1.2);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    noise.start();
    noise.stop(c.currentTime + 1.5);
  } catch { /* fallback silently */ }
};

export const playLoversChimeSound = () => {
  if (!canPlay('lovers', 500)) return;
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();

    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, idx) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, c.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.08, c.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.12 + 1.2);

      osc.start(c.currentTime + idx * 0.12);
      osc.stop(c.currentTime + idx * 0.12 + 1.2);
    });
  } catch { /* fallback silently */ }
};

export const playPoisonSound = () => {
  if (!canPlay('poison', 400)) return;
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.55);

    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55);

    osc.start();
    osc.stop(c.currentTime + 0.55);
  } catch { /* fallback silently */ }
};
