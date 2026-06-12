// sounds.js — Web Audio sound effects (no external files needed)

const Sound = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  /** Play a single oscillator tone */
  function tone(freq, dur, type = "sine", vol = 0.1) {
    try {
      const c = getCtx();
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch (_) { /* audio blocked — silently skip */ }
  }

  /** Play a sequence of notes with delays */
  function melody(notes, interval) {
    notes.forEach(([freq, dur, type, vol], i) =>
      setTimeout(() => tone(freq, dur, type, vol), i * interval)
    );
  }

  return {
    card()  { tone(900,  0.07, "square",   0.05); },
    chip()  { tone(1200, 0.06, "square",   0.04); },
    push()  { tone(440,  0.22, "sine",     0.06); },

    win()   { melody([[523,0.18],[659,0.18],[784,0.18],[1047,0.22]], 90); },
    lose()  { melody([[300,0.28,"sawtooth",0.08],[220,0.32,"sawtooth",0.07]], 160); },
    bj()    { melody([[523,0.18],[659,0.18],[784,0.18],[1047,0.2],[1319,0.25]], 80); },
  };
})();
