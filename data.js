/* ================== BGM (procedural chiptune) ================== */
let bgmOn = false, bgmTimer = null, bpm = 140;
const bgmGain = AC.createGain(); bgmGain.gain.value = 0.3; bgmGain.connect(AC.destination);

// 簡易パターン（キー=Cマイナー感）。16分×16＝1小節
const bass = [0, , 0, , 0, , 0, , -5, , -5, , -5, , -5, ,  // C, G
              -3, , -3, , -3, , -3, , -7, , -7, , -7, , -7]; // D#, A#
const lead = [ 0,  3,  7, 10,  7, 10, 12, 10,  0,  3,  7, 10, 12, 10,  7,  3];
const drum = [1, , , , 1, , , , 1, , , , 1, , , ,  1, ,1, , 1, , , , 1, ,1, , 1, , , ]; // キック＋クリック

function note(freq=440, dur=0.18, type='square', vol=0.15){
  const t0 = AC.currentTime;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = 0.0001;
  o.connect(g).connect(bgmGain);
  o.start(t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.stop(t0 + dur + 0.02);
}
function click(vol=0.1){
  const t0 = AC.currentTime;
  const n = AC.createBuffer(1, 2205, AC.sampleRate);
  const d = n.getChannelData(0);
  for (let i=0;i<d.length;i++){ d[i] = (Math.random()*2-1) * Math.exp(-i/200); }
  const s = AC.createBufferSource(); const g = AC.createGain();
  s.buffer = n; g.gain.value = vol; s.connect(g).connect(bgmGain);
  s.start(t0);
}

function midi(n){ return 440 * Math.pow(2, (n-69)/12); } // A4=440
const keyBase = 60; // C4
let stepIdx = 0;

function bgmTick(){
  // 16分音符間隔
  const intervalMs = (60_000 / bpm) / 4;

  // Bass
  const b = bass[stepIdx % bass.length];
  if (b !== undefined){
    note(midi(keyBase + b - 12), 0.19, 'square', 0.10);
  }
  // Lead
  const l = lead[stepIdx % lead.length];
  if (l !== undefined){
    note(midi(keyBase + l), 0.15, 'triangle', 0.08);
  }
  // Drum
  if (drum[stepIdx % drum.length]) click(0.10);

  stepIdx++;
  bgmTimer = setTimeout(bgmTick, intervalMs);
}

function startBGM(){
  if (bgmOn) return;
  if (AC.state === 'suspended') AC.resume();
  bgmOn = true;
  bgmTick();
  document.getElementById('bgmToggle').textContent = 'BGM ⏸';
}
function stopBGM(){
  if (!bgmOn) return;
  bgmOn = false;
  clearTimeout(bgmTimer); bgmTimer=null;
  document.getElementById('bgmToggle').textContent = 'BGM ♪';
}
document.getElementById('bgmToggle').addEventListener('click', ()=>{
  (bgmOn?stopBGM:startBGM)();
});
document.getElementById('bgmVol').addEventListener('input', (e)=>{
  bgmGain.gain.value = +e.target.value;
});

// ゲームの操作が行われたらAudioContextを起こしつつ、初回だけBGM自動開始したい時は↓を有効化
// let firstInteract = false;
// ['keydown','pointerdown','touchstart'].forEach(ev=>{
//   window.addEventListener(ev, ()=>{
//     if (!firstInteract){ firstInteract = true; startBGM(); }
//   }, {once:true, passive:true});
// });