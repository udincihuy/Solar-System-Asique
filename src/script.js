import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';
import sunTexture from '/images/sun.jpg';
import mercuryTexture from '/images/mercurymap.jpg';
import mercuryBump from '/images/mercurybump.jpg';
import venusTexture from '/images/venusmap.jpg';
import venusBump from '/images/venusmap.jpg';
import venusAtmosphere from '/images/venus_atmosphere.jpg';
import earthTexture from '/images/earth_daymap.jpg';
import earthNightTexture from '/images/earth_nightmap.jpg';
import earthAtmosphere from '/images/earth_atmosphere.jpg';
import earthMoonTexture from '/images/moonmap.jpg';
import earthMoonBump from '/images/moonbump.jpg';
import marsTexture from '/images/marsmap.jpg';
import marsBump from '/images/marsbump.jpg';
import jupiterTexture from '/images/jupiter.jpg';
import ioTexture from '/images/jupiterIo.jpg';
import europaTexture from '/images/jupiterEuropa.jpg';
import ganymedeTexture from '/images/jupiterGanymede.jpg';
import callistoTexture from '/images/jupiterCallisto.jpg';
import saturnTexture from '/images/saturnmap.jpg';
import satRingTexture from '/images/saturn_ring.png';
import uranusTexture from '/images/uranus.jpg';
import uraRingTexture from '/images/uranus_ring.png';
import neptuneTexture from '/images/neptune.jpg';
import plutoTexture from '/images/plutomap.jpg';

// ******  SETUP  ******
console.log("Create the scene");
const scene = new THREE.Scene();

console.log("Create a perspective projection camera");
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set(-175, 115, 5);

console.log("Create the renderer");
const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

console.log("Create an orbit control");
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.75;
controls.screenSpacePanning = false;

console.log("Set up texture loader");
const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();

// ******  POSTPROCESSING setup ******
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// ******  OUTLINE PASS  ******
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x190a05);
composer.addPass(outlinePass);

// ******  BLOOM PASS  ******
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
bloomPass.threshold = 1;
bloomPass.radius = 0.9;
composer.addPass(bloomPass);

// ****** AMBIENT LIGHT ******
console.log("Add the ambient light");
var lightAmbient = new THREE.AmbientLight(0x222222, 6); 
scene.add(lightAmbient);

// ******  Star background  ******
scene.background = cubeTextureLoader.load([

  bgTexture3,
  bgTexture1,
  bgTexture2,
  bgTexture2,
  bgTexture4,
  bgTexture2
]);

// ******  CONTROLS  ******
const gui = new dat.GUI({ autoPlace: false });
const customContainer = document.getElementById('gui-container');
customContainer.appendChild(gui.domElement);

// ****** SETTINGS FOR INTERACTIVE CONTROLS  ******
const settings = {
  accelerationOrbit: 1,
  acceleration: 1,
  sunIntensity: 1.9
};

gui.add(settings, 'accelerationOrbit', 0, 10).onChange(value => {
});
gui.add(settings, 'acceleration', 0, 10).onChange(value => {
});
gui.add(settings, 'sunIntensity', 1, 10).onChange(value => {
  sunMat.emissiveIntensity = value;
});

// mouse movement
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

// ******  SELECT PLANET  ******
let selectedPlanet = null;
let offset;

function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(raycastTargets);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const sel = identifyPlanet(clickedObject);
    if (sel) {
      // trigger native browser TTS and bubble for the clicked planet
      try{
        // attempt to get world position for bubble placement
        let worldPos = null;
        if (sel.planet && sel.planet.getWorldPosition){ worldPos = new THREE.Vector3(); sel.planet.getWorldPosition(worldPos); }
        const desc = INDONESIAN_DESCRIPTIONS[sel.name] || (planetData[sel.name] && planetData[sel.name].info) || sel.name;
        showBubble(sel.name, desc, worldPos);
        speakPlanetInfo(sel.name);
        markVisited(sel.name);
        setTimeout(hideBubble, 6000);
      } catch(e) { console.warn('speakPlanetInfo error', e); }
    }
  }
}

function identifyPlanet(clickedObject) {
  // Logic to identify which planet was clicked based on the clicked object, different offset for camera distance
        // Sun
        if (clickedObject === sun) {
          offset = 120;
          return { name: 'Sun', planet: sun };
        }
        // Asteroids (many), check if the clicked object is in asteroids array
        if (asteroids.includes(clickedObject)){
          offset = 6;
          return { name: 'Asteroid', planet: clickedObject };
        }
        if (clickedObject.material === mercury.planet.material) {
          offset = 10;
          return mercury;
        } else if (clickedObject.material === venus.Atmosphere.material) {
          offset = 25;
          return venus;
        } else if (clickedObject.material === earth.Atmosphere.material) {
          offset = 25;
          return earth;
        } else if (clickedObject.material === mars.planet.material) {
          offset = 15;
          return mars;
        } else if (clickedObject.material === jupiter.planet.material) {
          offset = 50;
          return jupiter;
        } else if (clickedObject.material === saturn.planet.material) {
          offset = 50;
          return saturn;
        } else if (clickedObject.material === uranus.planet.material) {
          offset = 25;
          return uranus;
        } else if (clickedObject.material === neptune.planet.material) {
          offset = 20;
          return neptune;
        } else if (clickedObject.material === pluto.planet.material) {
          offset = 10;
          return pluto;
        } 

  return null;
}

// Overlay helpers (used for showing text while the browser TTS speaks)
let currentPlanetSpoken = null;

function showOverlay(title, text){
  const ov = document.getElementById('voiceOverlay');
  if (!ov) return;
  const t = document.getElementById('voiceOverlayTitle');
  const p = document.getElementById('voiceOverlayText');
  if (t) t.innerText = title;
  if (p) p.innerText = text;
  ov.style.display = 'block';
}

function hideOverlay(){
  const ov = document.getElementById('voiceOverlay');
  if (!ov) return;
  ov.style.display = 'none';
}

// Keyboard movement and camera modes (no astronaut model)
let keys = { forward:false, back:false, left:false, right:false, up:false, down:false };
let moveSpeed = 0.6;
let lastSpokenPlanet = null;
let isFirstPerson = true;

window.addEventListener('keydown', function(e){
  const k = e.key.toLowerCase();
  if (k === 'w' || e.key === 'arrowup') keys.forward = true;
  if (k === 's' || e.key === 'arrowdown') keys.back = true;
  if (k === 'a' || e.key === 'arrowleft') keys.left = true;
  if (k === 'd' || e.key === 'arrowright') keys.right = true;
  if (k === ' ') keys.up = true; // space
  if (k === 'shift') keys.down = true;
  if (k === 'c') { isFirstPerson = !isFirstPerson; }
});
window.addEventListener('keyup', function(e){
  const k = e.key.toLowerCase();
  if (k === 'w' || e.key === 'arrowup') keys.forward = false;
  if (k === 's' || e.key === 'arrowdown') keys.back = false;
  if (k === 'a' || e.key === 'arrowleft') keys.left = false;
  if (k === 'd' || e.key === 'arrowright') keys.right = false;
  if (k === ' ') keys.up = false;
  if (k === 'shift') keys.down = false;
});

// Speak planet descriptions using the browser SpeechSynthesis API (English by default)
function speakPlanetInfo(planetName){
  if (!planetName) return;
  const pd = planetData[planetName];
  // Indonesian short descriptions (fallback to pd.info if missing)
  const idDesc = INDONESIAN_DESCRIPTIONS[planetName] || (pd && pd.info) || planetName;
  currentPlanetSpoken = planetName;
  try{
    const u = new SpeechSynthesisUtterance(idDesc);
    u.lang = 'id-ID';
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onstart = function(){ showOverlay(planetName, idDesc); };
    u.onend = function(){ hideOverlay(); currentPlanetSpoken = null; };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }catch(err){
    console.warn('TTS error', err);
  }
}

// Check camera proximity to planets and auto-speak when passing by (first-person only)
function checkCameraProximity(){
  if (!isFirstPerson) return;
  const pos = camera.position.clone();
  const planetsToCheck = [ {obj: sun, name: 'Sun'}, {obj: mercury.planet, name: 'Mercury'}, {obj: venus.planet, name: 'Venus'}, {obj: earth.planet, name: 'Earth'}, {obj: mars.planet, name: 'Mars'}, {obj: jupiter.planet, name: 'Jupiter'}, {obj: saturn.planet, name: 'Saturn'}, {obj: uranus.planet, name: 'Uranus'}, {obj: neptune.planet, name: 'Neptune'}, {obj: pluto.planet, name: 'Pluto'} ];
  for (let p of planetsToCheck){
    const planetPos = new THREE.Vector3();
    if (p.obj.getWorldPosition) p.obj.getWorldPosition(planetPos); else planetPos.copy(p.obj.position);
    const dist = pos.distanceTo(planetPos);
    const triggerDist = 15 + (p.obj.geometry && p.obj.geometry.parameters && p.obj.geometry.parameters.radius ? p.obj.geometry.parameters.radius : 5);
    if (dist < triggerDist){
      if (lastSpokenPlanet !== p.name){
        lastSpokenPlanet = p.name;
        try{
          // show bubble near the planet and speak in Indonesian
          const desc = INDONESIAN_DESCRIPTIONS[p.name] || (planetData[p.name] && planetData[p.name].info) || p.name;
          showBubble(p.name, desc, planetPos);
          speakPlanetInfo(p.name);
          markVisited(p.name);
          // hide bubble after a short period
          setTimeout(hideBubble, 6000);
        } catch(e){ console.warn('speakPlanetInfo error', e); }
      }
      return;
    }
  }
  lastSpokenPlanet = null;
}

// Indonesian descriptions for bubble and TTS
const INDONESIAN_DESCRIPTIONS = {
  'Sun': 'Ini Matahari. Bintang panas pusat tata surya kita.',
  'Asteroid': 'Ini asteroid. Potongan batu atau logam yang mengorbit Matahari.',
  'Mercury': 'Ini Merkurius. Planet kecil yang sangat panas karena dekat dengan Matahari.',
  'Venus': 'Ini Venus. Planet dengan awan tebal dan sangat panas.',
  'Earth': 'Ini Bumi. Tempat tinggal kita yang berwarna biru.',
  'Mars': 'Ini Mars. Planet merah yang penuh debu.',
  'Jupiter': 'Ini Jupiter. Planet terbesar dengan bintik merah besar.',
  'Saturn': 'Ini Saturnus. Dikenal karena cincinnya yang indah.',
  'Uranus': 'Ini Uranus. Planet biru yang berputar miring.',
  'Neptune': 'Ini Neptunus. Planet biru yang sangat jauh dan dingin.',
  'Pluto': 'Ini Pluto. Planet kerdil yang jauh dari Matahari.'
};

// Bubble chat UI
function showBubble(title, text, worldPos){
  const bubble = document.getElementById('bubbleChat');
  const t = document.getElementById('bubbleTitle');
  const p = document.getElementById('bubbleText');
  if (!bubble || !t || !p) return;
  t.innerText = title;
  p.innerText = text;
  // position near worldPos if provided
  if (worldPos && camera){
    const vector = worldPos.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = ( -vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.transform = 'translate(-50%,-120%)';
  } else {
    bubble.style.left = '50%';
    bubble.style.bottom = '6%';
    bubble.style.transform = 'translateX(-50%)';
  }
  bubble.style.display = 'block';
}

function hideBubble(){
  const bubble = document.getElementById('bubbleChat');
  if (!bubble) return;
  bubble.style.display = 'none';
}

// Visited tracking and quiz trigger
const visitedPlanets = new Set();
const QUIZ_TARGETS = ['Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
let movementEnabled = true;

function markVisited(name){
  if (!QUIZ_TARGETS.includes(name)) return;
  if (!visitedPlanets.has(name)){
    visitedPlanets.add(name);
  }
  // when all visited, start quiz
  if (visitedPlanets.size === QUIZ_TARGETS.length){
    setTimeout(startQuiz, 800);
  }
}

// HUD update for visits
function updateHUD(){
  const el = document.getElementById('visitCount');
  if (!el) return;
  const total = QUIZ_TARGETS.length;
  const done = visitedPlanets.size;
  el.innerText = `Kunjungan: ${done}/${total}`;
}

// ensure HUD updates when marking visited
const _oldMarkVisited = markVisited;
markVisited = function(name){
  _oldMarkVisited(name);
  updateHUD();
}

// Quiz implementation (Indonesian)
const quizQuestions = [
  {q: 'Planet apa yang dijuluki Planet Merah?', options: ['Bumi','Mars','Jupiter'], answer: 'Mars'},
  {q: 'Di mana tempat tinggal manusia?', options: ['Matahari','Saturnus','Bumi'], answer: 'Bumi'},
  {q: 'Pusat tata surya kita adalah?', options: ['Matahari','Bulan','Bintang'], answer: 'Matahari'}
];
let currentQuizIndex = 0;

function startQuiz(){
  movementEnabled = false;
  const modal = document.getElementById('quizModal');
  if (!modal) return;
  modal.style.display = 'flex';
  currentQuizIndex = 0;
  showQuizQuestion(currentQuizIndex);
}

function showQuizQuestion(i){
  const q = quizQuestions[i];
  const title = document.getElementById('quizTitle');
  const questionEl = document.getElementById('quizQuestion');
  const optionsEl = document.getElementById('quizOptions');
  if (!questionEl || !optionsEl) return;
  title.innerText = `Pertanyaan ${i+1} dari ${quizQuestions.length}`;
  questionEl.innerText = q.q;
  optionsEl.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerText = opt;
    btn.addEventListener('click', function(){ handleQuizAnswer(opt); });
    optionsEl.appendChild(btn);
  });
  // also speak the question in Indonesian
  try{ const u = new SpeechSynthesisUtterance(q.q); u.lang='id-ID'; u.rate=1.0; window.speechSynthesis.speak(u);}catch(e){}
}

function handleQuizAnswer(selected){
  const q = quizQuestions[currentQuizIndex];
  if (selected === q.answer){
    playSound('ding');
    spawnConfetti(3000);
    currentQuizIndex++;
    if (currentQuizIndex < quizQuestions.length){
      setTimeout(()=> showQuizQuestion(currentQuizIndex), 900);
    } else {
      finishQuiz();
    }
  } else {
    playSound('buzz');
    // let user try again (optionally speak feedback)
    try{ const u = new SpeechSynthesisUtterance('Salah, coba lagi.'); u.lang='id-ID'; window.speechSynthesis.speak(u);}catch(e){}
  }
}

function finishQuiz(){
  const modal = document.getElementById('quizModal');
  if (modal) modal.style.display = 'none';
  movementEnabled = true;
  // congratulate
  try{ const u = new SpeechSynthesisUtterance('Selamat! Anda telah menyelesaikan kuis.'); u.lang='id-ID'; window.speechSynthesis.speak(u);}catch(e){}
}

// Play simple tones using WebAudio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type){
  try{
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if (type === 'ding'){
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.value = 0.001;
      g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
      o.start();
      setTimeout(()=>{ g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15); o.stop(audioCtx.currentTime + 0.2); }, 150);
    } else {
      // buzz
      o.type = 'square'; o.frequency.value = 220;
      g.gain.value = 0.08;
      o.start();
      setTimeout(()=>{ g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05); o.stop(audioCtx.currentTime + 0.08); }, 300);
    }
  }catch(e){ console.warn('Sound play failed', e); }
}

// Confetti / falling stars (DOM-based)
let confettiTimeout = null;
function spawnConfetti(durationMs){
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  const start = Date.now();
  const created = [];
  function makeStar(){
    const s = document.createElement('div');
    s.className = 'star';
    const left = Math.random()*100;
    s.style.left = left + '%';
    s.style.top = '-10px';
    s.style.opacity = (0.7 + Math.random()*0.3).toString();
    s.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
    container.appendChild(s);
    // animate to bottom
    const fall = 2000 + Math.random()*1000;
    s.style.transition = `top ${fall}ms linear, transform ${fall}ms linear, opacity ${fall}ms linear`;
    requestAnimationFrame(()=>{ s.style.top = (80 + Math.random()*30) + '%'; s.style.transform = `translateY(0) rotate(${Math.random()*720}deg)`; s.style.opacity = '0.9'; });
    created.push(s);
  }
  const interval = setInterval(()=>{ makeStar(); }, 80);
  confettiTimeout = setTimeout(()=>{
    clearInterval(interval);
    // remove created after a while
    setTimeout(()=>{ created.forEach(el=>el.remove()); }, 1500);
  }, durationMs);
}

// Wire quiz close button (with DOMContentLoaded fallback)
function bindQuizClose(){
  const quizClose = document.getElementById('quizClose');
  if (quizClose) quizClose.addEventListener('click', function(){ const m=document.getElementById('quizModal'); if(m) m.style.display='none'; movementEnabled=true; });
}
bindQuizClose();
window.addEventListener('DOMContentLoaded', bindQuizClose);

// Startup overlay handler: plays an Indonesian welcome TTS and enables interactions
function startExploring(){
  const startOv = document.getElementById('startOverlay');
  if (startOv) startOv.style.display = 'none';
  const welcomeText = 'Selamat datang! Mari kita mulai menjelajahi tata surya. Klik pada planet untuk mendengar deskripsinya.';
  try{
    // resume audio context on user gesture so oscillator sounds can play
    try{ if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){}
    const u = new SpeechSynthesisUtterance(welcomeText);
    u.lang = 'id-ID';
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onstart = function(){ showOverlay('Selamat Datang', welcomeText); };
    u.onend = function(){ hideOverlay(); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }catch(err){ console.warn('TTS welcome error', err); }
}

// wire start button if present
const startBtn = document.getElementById('startExploringBtn');
if (startBtn) startBtn.addEventListener('click', startExploring);
// If the script ran before the DOM overlay was added, bind on DOMContentLoaded as fallback
window.addEventListener('DOMContentLoaded', function(){
  const el = document.getElementById('startExploringBtn');
  if (el) el.addEventListener('click', startExploring);
  // initialize HUD when DOM is ready
  updateHUD();
});

// -------------------------------------------------------------------------------
// ******  SUN  ******
let sunMat;

const sunSize = 697/40; // 40 times smaller scale than earth
const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: loadTexture.load(sunTexture),
  emissiveIntensity: settings.sunIntensity
});
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);

//point light in the sun
const pointLight = new THREE.PointLight(0xFDFFD3 , 1200, 400, 1.4);
scene.add(pointLight);


// ******  PLANET CREATION FUNCTION  ******
function createPlanet(planetName, size, position, tilt, texture, bump, ring, atmosphere, moons){

  let material;
  if (texture instanceof THREE.Material){
    material = texture;
  } 
  else if(bump){
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture),
    bumpMap: loadTexture.load(bump),
    bumpScale: 0.7
    });
  }
  else {
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture)
    });
  } 

  const name = planetName;
  const geometry = new THREE.SphereGeometry(size, 32, 20);
  const planet = new THREE.Mesh(geometry, material);
  const planet3d = new THREE.Object3D;
  const planetSystem = new THREE.Group();
  planetSystem.add(planet);
  let Atmosphere;
  let Ring;
  planet.position.x = position;
  planet.rotation.z = tilt * Math.PI / 180;

  // add orbit path
  const orbitPath = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    position, position, // xRadius, yRadius
    0, 2 * Math.PI,   // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
);

  const pathPoints = orbitPath.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.03 });
  const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  planetSystem.add(orbit);

  //add ring
  if(ring)
  {
    const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius,30);
    const RingMat = new THREE.MeshStandardMaterial({
      map: loadTexture.load(ring.texture),
      side: THREE.DoubleSide
    });
    Ring = new THREE.Mesh(RingGeo, RingMat);
    planetSystem.add(Ring);
    Ring.position.x = position;
    Ring.rotation.x = -0.5 *Math.PI;
    Ring.rotation.y = -tilt * Math.PI / 180;
  }
  
  //add atmosphere
  if(atmosphere){
    const atmosphereGeom = new THREE.SphereGeometry(size+0.1, 32, 20);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      map:loadTexture.load(atmosphere),
      transparent: true,
      opacity: 0.4,
      depthTest: true,
      depthWrite: false
    })
    Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial)
    
    Atmosphere.rotation.z = 0.41;
    planet.add(Atmosphere);
  }

  //add moons
  if(moons){
    moons.forEach(moon => {
      let moonMaterial;
      
      if(moon.bump){
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture),
          bumpMap: loadTexture.load(moon.bump),
          bumpScale: 0.5
        });
      } else{
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture)
        });
      }
      const moonGeometry = new THREE.SphereGeometry(moon.size, 32, 20);
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      const moonOrbitDistance = size * 1.5;
      moonMesh.position.set(moonOrbitDistance, 0, 0);
      planetSystem.add(moonMesh);
      moon.mesh = moonMesh;
    });
  }
  //add planet system to planet3d object and to the scene
  planet3d.add(planetSystem);
  scene.add(planet3d);
  return {name, planet, planet3d, Atmosphere, moons, planetSystem, Ring};
}


// ******  LOADING OBJECTS METHOD  ******
function loadObject(path, position, scale, callback) {
  const loader = new GLTFLoader();

  loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(position, 0, 0);
      obj.scale.set(scale, scale, scale);
      scene.add(obj);
      if (callback) {
        callback(obj);
      }
  }, undefined, function (error) {
      console.error('An error happened', error);
  });
}

// ******  ASTEROIDS  ******
const asteroids = [];
function loadAsteroids(path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
  const loader = new GLTFLoader();
  loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
          if (child.isMesh) {
              for (let i = 0; i < numberOfAsteroids / 12; i++) { // Divide by 12 because there are 12 asteroids in the pack
                  const asteroid = child.clone();
                  const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
                  const angle = Math.random() * Math.PI * 2;
                  const x = orbitRadius * Math.cos(angle);
                  const y = 0;
                  const z = orbitRadius * Math.sin(angle);
                  child.receiveShadow = true;
                  asteroid.position.set(x, y, z);
                  asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
                  scene.add(asteroid);
          asteroids.push(asteroid);
          // allow clicking asteroids to show info
          try { raycastTargets.push(asteroid); } catch(e) { /* raycastTargets may not be defined yet during load, it's fine */ }
              }
          }
      });
  }, undefined, function (error) {
      console.error('An error happened', error);
  });
}


// Earth day/night effect shader material
const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { type: "t", value: loadTexture.load(earthTexture) },
    nightTexture: { type: "t", value: loadTexture.load(earthNightTexture) },
    sunPosition: { type: "v3", value: sun.position }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    uniform vec3 sunPosition;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vSunDirection = normalize(sunPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    void main() {
      float intensity = max(dot(vNormal, vSunDirection), 0.0);
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv)* 0.2;
      gl_FragColor = mix(nightColor, dayColor, intensity);
    }
  `
});


// ******  MOONS  ******
// Earth
const earthMoon = [{
  size: 1.6,
  texture: earthMoonTexture,
  bump: earthMoonBump,
  orbitSpeed: 0.001 * settings.accelerationOrbit,
  orbitRadius: 10
}]

// Mars' moons with path to 3D models (phobos & deimos)
const marsMoons = [
  {
    modelPath: '/images/mars/phobos.glb',
    scale: 0.1,
    orbitRadius: 5,
    orbitSpeed: 0.002 * settings.accelerationOrbit,
    position: 100,
    mesh: null
  },
  {
    modelPath: '/images/mars/deimos.glb',
    scale: 0.1,
    orbitRadius: 9,
    orbitSpeed: 0.0005 * settings.accelerationOrbit,
    position: 120,
    mesh: null
  }
];

// Jupiter
const jupiterMoons = [
  {
    size: 1.6,
    texture: ioTexture,
    orbitRadius: 20,
    orbitSpeed: 0.0005 * settings.accelerationOrbit
  },
  {
    size: 1.4,
    texture: europaTexture,
    orbitRadius: 24,
    orbitSpeed: 0.00025 * settings.accelerationOrbit
  },
  {
    size: 2,
    texture: ganymedeTexture,
    orbitRadius: 28,
    orbitSpeed: 0.000125 * settings.accelerationOrbit
  },
  {
    size: 1.7,
    texture: callistoTexture,
    orbitRadius: 32,
    orbitSpeed: 0.00006 * settings.accelerationOrbit
  }
];

// ******  PLANET CREATIONS  ******
const mercury = new createPlanet('Mercury', 2.4, 40, 0, mercuryTexture, mercuryBump);
const venus = new createPlanet('Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
const earth = new createPlanet('Earth', 6.4, 90, 23, earthMaterial, null, null, earthAtmosphere, earthMoon);
const mars = new createPlanet('Mars', 3.4, 115, 25, marsTexture, marsBump)
// Load Mars moons
marsMoons.forEach(moon => {
  loadObject(moon.modelPath, moon.position, moon.scale, function(loadedModel) {
    moon.mesh = loadedModel;
    mars.planetSystem.add(moon.mesh);
    moon.mesh.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  });
});

const jupiter = new createPlanet('Jupiter', 69/4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
const saturn = new createPlanet('Saturn', 58/4, 270, 26, saturnTexture, null, {
  innerRadius: 18, 
  outerRadius: 29, 
  texture: satRingTexture
});
const uranus = new createPlanet('Uranus', 25/4, 320, 82, uranusTexture, null, {
  innerRadius: 6, 
  outerRadius: 8, 
  texture: uraRingTexture
});
const neptune = new createPlanet('Neptune', 24/4, 340, 28, neptuneTexture);
const pluto = new createPlanet('Pluto', 1, 350, 57, plutoTexture)

  // ******  PLANETS DATA  ******
    const planetData = {
    'Sun': {
      radius: '696,340 km',
      tilt: '0°',
      rotation: 'about 25 days (equator)',
      orbit: '-',
      distance: '0 km (center of the solar system)',
      moons: '0 (star)',
      info: 'The Sun is a huge ball of hot gas that gives us light and heat.',
      narratives: [
        'The Sun is a huge ball of fire that gives light and warmth to the planets. Without the Sun there would be no day or plants.',
        'Think of the Sun as a giant lamp in the sky that keeps the planets warm and bright.'
      ]
    },
    'Asteroid': {
      radius: 'various',
      tilt: '-',
      rotation: 'various',
      orbit: 'orbiting the Sun in belts or paths',
      distance: 'mostly between Mars and Jupiter',
      moons: '0',
      info: 'Asteroids are chunks of rock and ice that orbit the Sun.',
      narratives: [
        'Asteroids are like space rocks that float around the Sun. Many live in the asteroid belt between Mars and Jupiter.',
        'Some asteroids are small like pebbles, others are big like mountains.'
      ]
    },
    'Mercury': {
      radius: '2,439.7 km',
      tilt: '0.034°',
      rotation: '58.6 Earth days',
      orbit: '88 Earth days',
      distance: '57.9 million km',
      moons: '0',
      info: 'Mercury is small and very hot because it is so close to the Sun.',
      narratives: [
        'Mercury is the smallest planet and orbits very close to the Sun, so it gets very hot.',
        'Mercury moves quickly around the Sun but spins slowly on its axis.'
      ]
    },
    'Venus': {
      radius: '6,051.8 km',
      tilt: '177.4°',
      rotation: '243 Earth days',
      orbit: '225 Earth days',
      distance: '108.2 million km',
      moons: '0',
      info: 'Venus has thick clouds and is very hot.',
      narratives: [
        'Venus is wrapped in thick clouds and is very hot, like a giant greenhouse.',
        'If you visited Venus you would feel much hotter than on Earth because of its thick atmosphere.'
      ]
    },
    'Earth': {
      radius: '6,371 km',
      tilt: '23.5°',
      rotation: '24 hours',
      orbit: '365 days',
      distance: '150 million km',
      moons: '1 (Moon)',
      info: 'Earth is our home, full of water and life.',
      narratives: [
        'Earth is the planet we live on. It has oceans, plants, animals and people.',
        'Earth is just the right distance from the Sun so life can grow here.'
      ]
    },
    'Mars': {
      radius: '3,389.5 km',
      tilt: '25.19°',
      rotation: '1.03 Earth days',
      orbit: '687 Earth days',
      distance: '227.9 million km',
      moons: '2 (Phobos and Deimos)',
      info: 'Mars is called the Red Planet because of its rusty color.',
      narratives: [
        'Mars looks red because its soil has iron which is like rust.',
        'Scientists explore Mars because one day people might visit there.'
      ]
    },
    'Jupiter': {
      radius: '69,911 km',
      tilt: '3.13°',
      rotation: '9.9 hours',
      orbit: '12 Earth years',
      distance: '778.5 million km',
      moons: '95+ (Ganymede, Callisto, Europa, Io are the largest)',
      info: 'Jupiter is the largest planet and has a big storm called the Great Red Spot.',
      narratives: [
        'Jupiter is a giant planet much bigger than Earth and has many moons.',
        'A huge storm on Jupiter is called the Great Red Spot and it has been blowing for a long time.'
      ]
    },
    'Saturn': {
      radius: '58,232 km',
      tilt: '26.73°',
      rotation: '10.7 hours',
      orbit: '29.5 Earth years',
      distance: '1.4 billion km',
      moons: '146+',
      info: 'Saturn is famous for its beautiful rings.',
      narratives: [
        'Saturn has wide rings made of ice and rock that look like a giant hula-hoop.',
        'The rings make Saturn one of the most beautiful planets to look at.'
      ]
    },
    'Uranus': {
      radius: '25,362 km',
      tilt: '97.77°',
      rotation: '17.2 hours',
      orbit: '84 Earth years',
      distance: '2.9 billion km',
      moons: '27+',
      info: 'Uranus rotates on its side and is pale blue.',
      narratives: [
        'Uranus spins on its side, as if it were rolling around the Sun.',
        'Uranus looks blue because of gases in its atmosphere.'
      ]
    },
    'Neptune': {
      radius: '24,622 km',
      tilt: '28.32°',
      rotation: '16.1 hours',
      orbit: '165 Earth years',
      distance: '4.5 billion km',
      moons: '14+',
      info: 'Neptune is a deep blue and very cold planet with strong winds.',
      narratives: [
        'Neptune is very far from the Sun and is deep blue in color.',
        'Winds on Neptune are some of the strongest in the solar system.'
      ]
    },
    'Pluto': {
      radius: '1,188.3 km',
      tilt: '122.53°',
      rotation: '6.4 Earth days',
      orbit: '248 Earth years',
      distance: '5.9 billion km',
      moons: '5 (Charon, Styx, Nix, Kerberos, Hydra)',
      info: 'Pluto is a small, distant dwarf planet.',
      narratives: [
        'Pluto is small and far away from the Sun, so it is very cold and dark.',
        'Once considered a planet, Pluto is now called a dwarf planet because it is small.'
      ]
    }
};


// Array of planets and atmospheres for raycasting (tambahkan Matahari juga)
const raycastTargets = [
  sun, mercury.planet, venus.planet, venus.Atmosphere, earth.planet, earth.Atmosphere,
  mars.planet, jupiter.planet, saturn.planet, uranus.planet, neptune.planet, pluto.planet
];

// ******  SHADOWS  ******
renderer.shadowMap.enabled = true;
pointLight.castShadow = true;

//properties for the point light
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 20;

//casting and receiving shadows
earth.planet.castShadow = true;
earth.planet.receiveShadow = true;
earth.Atmosphere.castShadow = true;
earth.Atmosphere.receiveShadow = true;
earth.moons.forEach(moon => {
moon.mesh.castShadow = true;
moon.mesh.receiveShadow = true;
});
mercury.planet.castShadow = true;
mercury.planet.receiveShadow = true;
venus.planet.castShadow = true;
venus.planet.receiveShadow = true;
venus.Atmosphere.receiveShadow = true;
mars.planet.castShadow = true;
mars.planet.receiveShadow = true;
jupiter.planet.castShadow = true;
jupiter.planet.receiveShadow = true;
jupiter.moons.forEach(moon => {
  moon.mesh.castShadow = true;
  moon.mesh.receiveShadow = true;
  });
saturn.planet.castShadow = true;
saturn.planet.receiveShadow = true;
saturn.Ring.receiveShadow = true;
uranus.planet.receiveShadow = true;
neptune.planet.receiveShadow = true;
pluto.planet.receiveShadow = true;




function animate(){

  //rotating planets around the sun and itself
  sun.rotateY(0.001 * settings.acceleration);
  mercury.planet.rotateY(0.001 * settings.acceleration);
  mercury.planet3d.rotateY(0.004 * settings.accelerationOrbit);
  venus.planet.rotateY(0.0005 * settings.acceleration)
  venus.Atmosphere.rotateY(0.0005 * settings.acceleration);
  venus.planet3d.rotateY(0.0006 * settings.accelerationOrbit);
  earth.planet.rotateY(0.005 * settings.acceleration);
  earth.Atmosphere.rotateY(0.001 * settings.acceleration);
  earth.planet3d.rotateY(0.001 * settings.accelerationOrbit);
  mars.planet.rotateY(0.01 * settings.acceleration);
  mars.planet3d.rotateY(0.0007 * settings.accelerationOrbit);
  jupiter.planet.rotateY(0.005 * settings.acceleration);
  jupiter.planet3d.rotateY(0.0003 * settings.accelerationOrbit);
  saturn.planet.rotateY(0.01 * settings.acceleration);
  saturn.planet3d.rotateY(0.0002 * settings.accelerationOrbit);
  uranus.planet.rotateY(0.005 * settings.acceleration);
  uranus.planet3d.rotateY(0.0001 * settings.accelerationOrbit);
  neptune.planet.rotateY(0.005 * settings.acceleration);
  neptune.planet3d.rotateY(0.00008 * settings.accelerationOrbit);
  pluto.planet.rotateY(0.001 * settings.acceleration)
  pluto.planet3d.rotateY(0.00006 * settings.accelerationOrbit)

// Animate Earth's moon
if (earth.moons) {
  earth.moons.forEach(moon => {
    const time = performance.now();
    const tiltAngle = 5 * Math.PI / 180;

    const moonX = earth.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.sin(tiltAngle);
    const moonZ = earth.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.cos(tiltAngle);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}
// Animate Mars' moons
if (marsMoons){
marsMoons.forEach(moon => {
  if (moon.mesh) {
    const time = performance.now();

    const moonX = mars.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = mars.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.001);
  }
});
}

// Animate Jupiter's moons
if (jupiter.moons) {
  jupiter.moons.forEach(moon => {
    const time = performance.now();
    const moonX = jupiter.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = jupiter.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}

// Rotate asteroids
asteroids.forEach(asteroid => {
  asteroid.rotation.y += 0.0001;
  asteroid.position.x = asteroid.position.x * Math.cos(0.0001 * settings.accelerationOrbit) + asteroid.position.z * Math.sin(0.0001 * settings.accelerationOrbit);
  asteroid.position.z = asteroid.position.z * Math.cos(0.0001 * settings.accelerationOrbit) - asteroid.position.x * Math.sin(0.0001 * settings.accelerationOrbit);
});
// Camera movement (first-person free flight) and top-down mode
{
  const now = performance.now();
  const dt = Math.max(0.001, (now - (window.__lastFrameTime || now)) / 1000);
  window.__lastFrameTime = now;

  if (isFirstPerson) {
    // move relative to camera forward to feel intuitive
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    if (camDir.lengthSq() === 0) camDir.set(0,0,-1);
    camDir.normalize();
    const forward = camDir.clone();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();
    const moveVec = new THREE.Vector3();
    if (keys.forward) moveVec.add(forward);
    if (keys.back) moveVec.sub(forward);
    if (keys.left) moveVec.sub(right);
    if (keys.right) moveVec.add(right);
    if (keys.up) moveVec.y += 1;
    if (keys.down) moveVec.y -= 1;
    if (movementEnabled && moveVec.lengthSq() > 0){
      moveVec.normalize().multiplyScalar(moveSpeed * (dt * 60));
      camera.position.add(moveVec);
    }
    // proximity check for TTS
    if (movementEnabled) checkCameraProximity();
  } else {
    // Top-down / God view: smoothly move camera to an overhead position
    const desiredPos = new THREE.Vector3(0, 400, 0.1);
    camera.position.lerp(desiredPos, 0.05);
    camera.lookAt(new THREE.Vector3(0,0,0));
  }
}

// ****** OUTLINES ON PLANETS ******
raycaster.setFromCamera(mouse, camera);

// Check for intersections
var intersects = raycaster.intersectObjects(raycastTargets);

// Reset all outlines
outlinePass.selectedObjects = [];

if (intersects.length > 0) {
  const intersectedObject = intersects[0].object;

  // If the intersected object is an atmosphere, find the corresponding planet
  if (intersectedObject === earth.Atmosphere) {
    outlinePass.selectedObjects = [earth.planet];
  } else if (intersectedObject === venus.Atmosphere) {
    outlinePass.selectedObjects = [venus.planet];
  } else {
    // For other planets, outline the intersected object itself
    outlinePass.selectedObjects = [intersectedObject];
  }
}
// Camera position is managed by first-person / top-down logic in the animate loop

controls.update();
  requestAnimationFrame(animate);
  composer.render();
}
loadAsteroids('/asteroids/asteroidPack.glb', 1000, 130, 160);
loadAsteroids('/asteroids/asteroidPack.glb', 3000, 352, 370);
animate();

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onDocumentMouseDown, false);
window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  composer.setSize(window.innerWidth,window.innerHeight);
});
