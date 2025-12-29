// audio.js
export let audioEnabled = false;
export let fireworkBuffer = null;
export let fireworkBuffer2 = null;

let audioCtx = null;

// 音声ロードを Promise 化（ロード完了まで待てる）
export const audioReady = (async () => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const load = async (url) => {
    const res = await fetch(url);
    const data = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(data);
  };

  fireworkBuffer2 = await load('./sounds/firework2.mp3');
  fireworkBuffer = await load('./sounds/firework.mp3');

  return true;
})();

export function initAudio() {
  document.getElementById("enableSound").addEventListener("click", () => {
    audioCtx.resume().then(() => {
      audioEnabled = true;
      document.getElementById("enableSound").style.display = "none";
    });
  });
}

export function playSound(buffer) {
  if (!audioEnabled || !buffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}