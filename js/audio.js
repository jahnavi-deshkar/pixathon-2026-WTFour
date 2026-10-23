(function (root) {
  'use strict';
  var context = null, unlocked = false, muted = false, tracks = {}, ambience = null, fadeId = 0;
  ['click', 'slide', 'solve', 'bgm'].forEach(function (name) {
    var audio = new Audio('assets/audio/' + name + '.mp3');
    var track = { audio: audio, ready: false, failed: false };
    audio.preload = 'none';
    audio.addEventListener('canplaythrough', function () {
      track.ready = true;
      if (name === 'bgm' && unlocked && !muted) startMusic();
    });
    audio.addEventListener('error', function () {
      track.failed = true; track.ready = false;
      if (name === 'bgm' && unlocked && !muted) startAmbience();
    });
    if (name === 'bgm') { audio.loop = true; audio.volume = 0; }
    tracks[name] = track;
  });

  function tone(frequency, duration, volume, type, delay, endFrequency) {
    if (!context || muted || !unlocked) return;
    var start = context.currentTime + (delay || 0);
    var oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(Math.max(volume, 0.0001), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(start); oscillator.stop(start + duration + 0.02);
    oscillator.onended = function () { oscillator.disconnect(); gain.disconnect(); };
  }

  function synth(name) {
    if (name === 'bump') tone(100, 0.12, 0.035, 'triangle', 0, 45);
    if (name === 'click') tone(700, 0.065, 0.035, 'sine', 0, 420);
    if (name === 'slide') {
      tone(230, 0.11, 0.045, 'triangle', 0, 510);
      tone(920, 0.06, 0.016, 'sine', 0.04);
    }
    if (name === 'solve') [523.25, 659.25, 783.99, 1046.5].forEach(function (frequency, index) {
      tone(frequency, 0.45, 0.055, 'sine', index * 0.09);
    });
  }

  function play(name) {
    if (!unlocked || muted) return;
    var track = tracks[name];
    if (!track || !track.ready || track.failed) { synth(name); return; }
    var voice = track.audio.cloneNode();
    voice.volume = name === 'solve' ? 0.4 : 0.28;
    voice.addEventListener('error', function () { track.failed = true; synth(name); }, { once: true });
    var promise = voice.play();
    if (promise) promise.catch(function () { synth(name); });
  }

  function startAmbience() {
    if (!context || !unlocked || muted || ambience) return;
    var gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.008, context.currentTime + 1.2);
    gain.connect(context.destination);
    var oscillators = [65.406, 98].map(function (frequency) {
      var oscillator = context.createOscillator();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      oscillator.connect(gain); oscillator.start(); return oscillator;
    });
    ambience = { gain: gain, oscillators: oscillators };
  }

  function stopAmbience() {
    if (!ambience || !context) return;
    var previous = ambience; ambience = null;
    previous.gain.gain.cancelScheduledValues(context.currentTime);
    previous.gain.gain.setValueAtTime(Math.max(previous.gain.gain.value, 0.0001), context.currentTime);
    previous.gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
    previous.oscillators.forEach(function (oscillator) { oscillator.stop(context.currentTime + 0.26); });
    previous.oscillators[0].onended = function () {
      previous.oscillators.forEach(function (oscillator) { oscillator.disconnect(); });
      previous.gain.disconnect();
    };
  }

  function fadeMusic(target) {
    cancelAnimationFrame(fadeId);
    var audio = tracks.bgm.audio, from = audio.volume, start = performance.now();
    function tick(time) {
      var progress = Math.min(1, (time - start) / 700);
      audio.volume = from + (target - from) * progress;
      if (progress < 1) fadeId = requestAnimationFrame(tick);
      else if (!target) audio.pause();
    }
    fadeId = requestAnimationFrame(tick);
  }

  function startMusic() {
    if (!unlocked || muted) return;
    var track = tracks.bgm;
    if (track.ready && !track.failed) {
      var promise = track.audio.play();
      if (promise) promise.then(function () { stopAmbience(); fadeMusic(0.16); }).catch(startAmbience);
    } else startAmbience();
  }

  function unlock() {
    if (!unlocked) {
      unlocked = true;
      try {
        var AudioContext = root.AudioContext || root.webkitAudioContext;
        if (AudioContext) context = new AudioContext();
      } catch (error) { context = null; }
      Object.keys(tracks).forEach(function (name) { tracks[name].audio.preload = 'auto'; tracks[name].audio.load(); });
    }
    if (context && context.state === 'suspended') context.resume().catch(function () {});
    startMusic();
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (muted) { fadeMusic(0); stopAmbience(); }
    else if (unlocked) {
      if (context && context.state === 'suspended') context.resume().catch(function () {});
      startMusic();
    }
  }

  function react(events) {
    if (events.indexOf('bump') >= 0) play('bump');
    else if (events.indexOf('win') >= 0) play('solve');
    else if (events.indexOf('rotate') >= 0) play('slide');
    else if (events.indexOf('phase') >= 0 || events.indexOf('toggle') >= 0) play('click');
  }
  root.GameAudio = { unlock: unlock, setMuted: setMuted, react: react };
}(window));
