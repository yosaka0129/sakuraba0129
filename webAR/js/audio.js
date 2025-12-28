// audio.js
export let audioEnabled = false;
export let fireworkBuffer = null;
export let fireworkBuffer2 = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function initAudio() {
  document.getElementById("enableSound").addEventListener("click", () => {
    audioCtx.resume().then(() => {
      audioEnabled = true;
      document.getElementById("enableSound").style.display = "none";
    });
  });

  fetch('./sounds/firework2.mp3')
    .then(res => res.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => { fireworkBuffer2 = buffer; });

  fetch('./sounds/firework.mp3')
    .then(res => res.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => { fireworkBuffer = buffer; });
}

export function playSound(buffer) {
  if (!audioEnabled || !buffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}