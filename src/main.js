// ====================================
// src/main.js — Village Adventure 3D
// Entry point: loads world, starts loop
// ====================================

import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { InputHandler } from './systems/InputHandler.js';
import { Player } from './entities/Player.js';
import { VillageScene } from './scenes/VillageScene.js';
import { InteriorScene } from './scenes/InteriorScene.js';
import { NPCManager } from './entities/NPCManager.js';
import { DialogSystem } from './systems/DialogSystem.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { MobileControls } from './systems/MobileControls.js';

// ---- DOM References ----
const loadingScreen = document.getElementById('loading-screen');
const loadingBar    = document.getElementById('loading-bar');
const loadingText   = document.getElementById('loading-text');
const startScreen   = document.getElementById('start-screen');
const playBtn       = document.getElementById('play-btn');
const hud           = document.getElementById('hud');

// Fade overlay
const fadeOverlay = document.createElement('div');
fadeOverlay.id = 'fade-overlay';
document.body.appendChild(fadeOverlay);

// Compass
const compass = document.createElement('div');
compass.textContent = '🧭';
compass.style.cssText = 'position:fixed;top:20px;right:20px;z-index:110;font-size:1.8rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.8));transition:transform .1s;display:none;';
document.body.appendChild(compass);

// ---- State ----
let engine, input, player, villageScene, interiorScene, npcManager;
let dialogSystem, interactionSystem, mobileControls;
let currentScene = 'village';
let isRunning = false;

const loadSteps = [
  'Generating terrain...',
  'Building houses...',
  'Planting trees...',
  'Spawning NPCs...',
  'Loading interiors...',
  'Warming up engine...',
];

async function fakeLoad() {
  for (let i = 0; i < loadSteps.length; i++) {
    loadingText.textContent = loadSteps[i];
    loadingBar.style.width = ((i + 1) / loadSteps.length * 85) + '%';
    await sleep(280 + Math.random() * 180);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- Boot ----
async function boot() {
  engine = new Engine(document.getElementById('game-canvas'));

  input          = new InputHandler();
  dialogSystem   = new DialogSystem();
  mobileControls = new MobileControls(input);
  villageScene   = new VillageScene(engine);
  interiorScene  = new InteriorScene(engine);

  await fakeLoad();
  villageScene.build();

  npcManager         = new NPCManager(villageScene.scene);
  window._npcManager = npcManager;

  // Create player and attach to village scene immediately
  player = new Player(engine, input, null, mobileControls);
  player.attachToScene(villageScene.scene, new THREE.Vector3(0, 1.7, 8));

  interactionSystem = new InteractionSystem(engine, input, dialogSystem, onInteract);
  interactionSystem.setScene(villageScene.scene);

  loadingBar.style.width = '100%';
  loadingText.textContent = 'Ready!';
  await sleep(350);

  loadingScreen.style.opacity = '0';
  loadingScreen.style.transition = 'opacity 0.5s';
  await sleep(500);
  loadingScreen.style.display = 'none';
  startScreen.classList.remove('hidden');
}

// ---- Play ----
playBtn.addEventListener('click', async () => {
  startScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  compass.style.display = 'block';
  mobileControls.show();
  document.getElementById('location-label').textContent = '🏕️ Village';

  if (!isMobile()) {
    engine.renderer.domElement.requestPointerLock();
  }

  isRunning = true;
  startGameLoop();
});

// ---- Interactions ----
async function onInteract(type, data) {
  if (dialogSystem.isOpen) return;
  if (type === 'door')   await enterHouse(data.houseId);
  else if (type === 'exit') await exitHouse();
  else if (type === 'npc')  dialogSystem.show(data.name, data.emoji, data.dialogLines);
}

async function enterHouse(houseId) {
  await fadeOut();
  currentScene = `interior_${houseId}`;
  interiorScene.load(houseId);
  player.attachToScene(interiorScene.scene, interiorScene.getSpawnPoint());
  window._npcManager = null;
  interactionSystem.setScene(interiorScene.scene);
  document.getElementById('location-label').textContent = interiorScene.getName(houseId);
  await fadeIn();
}

async function exitHouse() {
  await fadeOut();
  currentScene = 'village';
  interiorScene.unload();
  const spawnPos = player.lastOutdoorPosition.clone();
  spawnPos.z += 1.5; // step out
  player.attachToScene(villageScene.scene, spawnPos);
  window._npcManager = npcManager;
  interactionSystem.setScene(villageScene.scene);
  document.getElementById('location-label').textContent = '🏕️ Village';
  await fadeIn();
}

async function fadeOut() {
  fadeOverlay.style.pointerEvents = 'all';
  fadeOverlay.style.opacity = '1';
  await sleep(420);
}
async function fadeIn() {
  fadeOverlay.style.opacity = '0';
  await sleep(420);
  fadeOverlay.style.pointerEvents = 'none';
}

// ---- Game Loop ----
let lastTime = 0;
function startGameLoop() {
  function loop(time) {
    if (!isRunning) return;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    const activeScene = currentScene === 'village'
      ? villageScene.scene
      : interiorScene.scene;

    if (window._npcManager) {
      window._npcManager.update(dt, player.getPosition());
    }

    player.update(dt, activeScene);
    interactionSystem.update(player, currentScene === 'village' ? villageScene : interiorScene);

    compass.style.transform = `rotate(${-player.yaw * 180 / Math.PI}deg)`;

    engine.renderer.render(activeScene, player.camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
}

boot().catch(err => {
  console.error('Boot failed:', err);
  document.getElementById('loading-text').textContent = 'Error: ' + err.message;
});
