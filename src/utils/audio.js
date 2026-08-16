let ctx = null;

const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
};

export const playClickSound = () => {
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
  } catch (e) { /* fallback silently */ }
};

export const playNotificationChime = () => {
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
  } catch (e) { /* fallback silently */ }
};

export const playGallowsExecutionSound = () => {
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
  } catch (e) { /* fallback silently */ }
};
