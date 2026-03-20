// ====================================
// src/scenes/InteriorScene.js
// 3 unique house interiors with furniture
// ====================================

import * as THREE from 'three';

const INTERIORS = {
  1: {
    name: '🏡 Cozy Cottage - Living Room',
    spawn: new THREE.Vector3(0, 1.7, 3),
    build: buildLivingRoom,
  },
  2: {
    name: '🏠 Modern Chalet - Kitchen',
    spawn: new THREE.Vector3(0, 1.7, 3),
    build: buildKitchen,
  },
  3: {
    name: "🏪 Merchant's Workshop",
    spawn: new THREE.Vector3(0, 1.7, 4),
    build: buildWorkshop,
  },
};

export class InteriorScene {
  constructor(engine) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.scene.userData.isInterior = true;
    this._currentId = null;
    this._disposables = [];
  }

  load(houseId) {
    this.unload();
    this._currentId = houseId;
    const def = INTERIORS[houseId];
    if (!def) return;

    // Environment
    this.scene.background = new THREE.Color(0x1a0e08);
    this.scene.fog = null;

    // Lighting
    const ambient = new THREE.AmbientLight(0xfff0d0, 0.4);
    this.scene.add(ambient);
    this._disposables.push(ambient);

    // Warm ceiling light
    const ceiling = new THREE.PointLight(0xFFDE8A, 1.2, 18);
    ceiling.position.set(0, 4, 0);
    ceiling.castShadow = true;
    ceiling.shadow.mapSize.set(512, 512);
    this.scene.add(ceiling);
    this._disposables.push(ceiling);

    // Build room geometry
    def.build(this.scene, this._disposables);

    // Add exit door
    this._addExitDoor(this.scene);
  }

  unload() {
    // Dispose all objects
    for (const obj of this._disposables) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      this.scene.remove(obj);
    }
    this._disposables = [];
    this.scene.clear();
    this._currentId = null;
  }

  _addExitDoor(scene) {
    const pivotGroup = new THREE.Group();
    pivotGroup.position.set(-0.5, 0, 3.9);
    scene.add(pivotGroup);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x6B3A2A, roughness: 0.7 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 0.1), doorMat);
    door.position.set(0.5, 1.1, 0);
    door.userData.isExitDoor = true;
    door.userData.pivot = pivotGroup;
    pivotGroup.add(door);

    const knobMat = new THREE.MeshStandardMaterial({ color: 0xddaa44, metalness: 0.8, roughness: 0.2 });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), knobMat);
    knob.position.set(0.15, 1.1, 0.08);
    door.add(knob);
  }

  getName(id) { return INTERIORS[id]?.name ?? 'Interior'; }
  getSpawnPoint() { return INTERIORS[this._currentId]?.spawn.clone() ?? new THREE.Vector3(0, 1.7, 3); }
  getDoors() {
    const exits = [];
    this.scene.traverse(obj => {
      if (obj.userData && obj.userData.isExitDoor) exits.push(obj);
    });
    return exits;
  }
}

// ========== Room Helper ==========
function makeRoom(scene, disposables, w, h, d, wallColor, floorColor) {
  const floorMat = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.9 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: wallColor,  roughness: 0.85 });
  const ceilMat  = new THREE.MeshStandardMaterial({ color: 0xf5ead0, roughness: 0.9 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData.isFloor = true;
  scene.add(floor);
  disposables.push(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = h;
  scene.add(ceil);
  disposables.push(ceil);

  const wallBack  = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
  wallBack.rotation.y = Math.PI;
  wallBack.position.set(0, h / 2, -d / 2);
  wallBack.userData.isWall = true;
  scene.add(wallBack);
  disposables.push(wallBack);

  const wallFront = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
  wallFront.position.set(0, h / 2, d / 2);
  wallFront.userData.isWall = true;
  scene.add(wallFront);
  disposables.push(wallFront);

  const wallLeft  = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
  wallLeft.rotation.y = Math.PI / 2;
  wallLeft.position.set(-w / 2, h / 2, 0);
  wallLeft.userData.isWall = true;
  scene.add(wallLeft);
  disposables.push(wallLeft);

  const wallRight = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
  wallRight.rotation.y = -Math.PI / 2;
  wallRight.position.set(w / 2, h / 2, 0);
  wallRight.userData.isWall = true;
  scene.add(wallRight);
  disposables.push(wallRight);
}

function addMesh(scene, disposables, geo, mat, px, py, pz, ry = 0, castShadow = true) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(px, py, pz);
  mesh.rotation.y = ry;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  disposables.push(mesh);
  return mesh;
}

// ========== INTERIOR 1: Living Room ==========
function buildLivingRoom(scene, disposables) {
  makeRoom(scene, disposables, 8, 3.5, 8, 0xfce0b8, 0xA0784C);

  const wood = new THREE.MeshStandardMaterial({ color: 0x7B4F2E, roughness: 0.8 });
  const fab  = new THREE.MeshStandardMaterial({ color: 0x8B5E8E, roughness: 0.9 });
  const fab2 = new THREE.MeshStandardMaterial({ color: 0xC05040, roughness: 0.9 });

  // Sofa base
  addMesh(scene, disposables, new THREE.BoxGeometry(2.8, 0.4, 0.95), fab, -1, 0.4, -2);
  // Sofa back
  addMesh(scene, disposables, new THREE.BoxGeometry(2.8, 0.75, 0.25), fab, -1, 0.8, -2.4);
  // Sofa armrests
  addMesh(scene, disposables, new THREE.BoxGeometry(0.25, 0.65, 0.95), fab2, -2.28, 0.6, -2);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.25, 0.65, 0.95), fab2, 0.28, 0.6, -2);

  // Coffee table
  addMesh(scene, disposables, new THREE.BoxGeometry(1.4, 0.05, 0.7), wood, -1, 0.7, -0.8);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.05, 0.65, 0.05), wood, -1.55, 0.35, -1.1);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.05, 0.65, 0.05), wood, -0.45, 0.35, -1.1);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.05, 0.65, 0.05), wood, -1.55, 0.35, -0.5);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.05, 0.65, 0.05), wood, -0.45, 0.35, -0.5);

  // Bookshelf
  addMesh(scene, disposables, new THREE.BoxGeometry(1.8, 2.2, 0.35), wood, 2.5, 1.1, -3.5);
  const bookColors = [0xcc2222, 0x2244cc, 0x229944, 0xccaa22, 0x882288];
  for (let i = 0; i < 8; i++) {
    const bMat = new THREE.MeshStandardMaterial({ color: bookColors[i % bookColors.length] });
    addMesh(scene, disposables, new THREE.BoxGeometry(0.15, 0.55, 0.28), bMat, 2.5 + (i - 3.5) * 0.19, 1.8, -3.32);
  }
  for (let i = 0; i < 6; i++) {
    const bMat = new THREE.MeshStandardMaterial({ color: bookColors[(i+2) % bookColors.length] });
    addMesh(scene, disposables, new THREE.BoxGeometry(0.15, 0.45, 0.28), bMat, 2.5 + (i - 2.5) * 0.24, 1.05, -3.32);
  }

  // Fireplace
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x999080, roughness: 1 });
  addMesh(scene, disposables, new THREE.BoxGeometry(2.2, 0.1, 0.5), stoneMat, -2.5, 2.1, -3.5);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.2, 1.8, 0.5), stoneMat, -3.5, 1.0, -3.5);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.2, 1.8, 0.5), stoneMat, -1.5, 1.0, -3.5);
  // Fire glow
  const fireMat = new THREE.MeshStandardMaterial({
    color: 0xFF4400,
    emissive: 0xFF4400,
    emissiveIntensity: 2,
  });
  addMesh(scene, disposables, new THREE.SphereGeometry(0.3, 8, 8), fireMat, -2.5, 0.4, -3.5);
  const fireLight = new THREE.PointLight(0xFF6622, 1.5, 5);
  fireLight.position.set(-2.5, 0.7, -3.5);
  scene.add(fireLight);
  disposables.push(fireLight);

  // Rug
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xAA3322, roughness: 1 });
  addMesh(scene, disposables, new THREE.PlaneGeometry(2.5, 2.5), rugMat, -1, 0.01, -1.5, 0, false);

  // Lamp
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xFFCC88, emissive: 0xFF9933, emissiveIntensity: 0.8 });
  addMesh(scene, disposables, new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), new THREE.MeshStandardMaterial({ color: 0x555533 }), 2.5, 0.65, 0.5);
  addMesh(scene, disposables, new THREE.ConeGeometry(0.3, 0.4, 8), lampMat, 2.5, 1.5, 0.5);
  const lampLight = new THREE.PointLight(0xFFDD99, 0.8, 5);
  lampLight.position.set(2.5, 1.4, 0.5);
  scene.add(lampLight);
  disposables.push(lampLight);

  // Window (emissive daylight)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xAADDFF,
    emissive: 0x88BBFF,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.7,
  });
  addMesh(scene, disposables, new THREE.PlaneGeometry(1.4, 1.2), glassMat, 0, 2.2, -3.99, 0, false);

  // NPC chair
  addMesh(scene, disposables, new THREE.BoxGeometry(0.7, 0.08, 0.7), wood, 2.2, 0.42, -1.2);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.7, 0.7, 0.08), wood, 2.2, 0.8, -1.55);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.42, 0.06), wood, 2.55, 0.21, -0.9);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.42, 0.06), wood, 1.85, 0.21, -0.9);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.42, 0.06), wood, 2.55, 0.21, -1.5);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.42, 0.06), wood, 1.85, 0.21, -1.5);
}

// ========== INTERIOR 2: Kitchen ==========
function buildKitchen(scene, disposables) {
  makeRoom(scene, disposables, 9, 3.5, 8, 0xeef0f5, 0x9E9080);

  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0xF5F0E8, roughness: 0.7 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.4 });
  const woodMat    = new THREE.MeshStandardMaterial({ color: 0xBB7733, roughness: 0.8 });
  const blackMat   = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.5 });

  // Kitchen counter L-shape
  // Back counter
  addMesh(scene, disposables, new THREE.BoxGeometry(7, 0.9, 0.6), cabinetMat, 0, 0.45, -3.7);
  addMesh(scene, disposables, new THREE.BoxGeometry(7, 0.05, 0.65), counterMat, 0, 0.925, -3.7);
  // Left counter
  addMesh(scene, disposables, new THREE.BoxGeometry(0.6, 0.9, 4.5), cabinetMat, -4.4, 0.45, -1.5);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.65, 0.05, 4.5), counterMat, -4.4, 0.925, -1.5);

  // Upper cabinets
  addMesh(scene, disposables, new THREE.BoxGeometry(7, 0.9, 0.4), cabinetMat, 0, 2.5, -3.8);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.4, 0.9, 3), cabinetMat, -4.5, 2.5, -1.8);

  // Stove
  addMesh(scene, disposables, new THREE.BoxGeometry(0.8, 0.05, 0.6), blackMat, 1.5, 0.93, -3.69);
  const burnerMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  addMesh(scene, disposables, new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), burnerMat, 1.3, 0.96, -3.5);
  addMesh(scene, disposables, new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), burnerMat, 1.7, 0.96, -3.88);

  // Sink
  const sinkMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.6, roughness: 0.3 });
  addMesh(scene, disposables, new THREE.BoxGeometry(0.6, 0.08, 0.5), sinkMat, -1.5, 0.93, -3.69);

  // Fridge
  const fridgeMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.5 });
  addMesh(scene, disposables, new THREE.BoxGeometry(0.75, 1.9, 0.65), fridgeMat, 3.5, 0.95, -3.7);

  // Dining table
  addMesh(scene, disposables, new THREE.BoxGeometry(1.6, 0.06, 0.9), woodMat, 1, 0.78, 1.5);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.78, 0.06), woodMat, 0.28, 0.39, 1.08);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.78, 0.06), woodMat, 1.72, 0.39, 1.08);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.78, 0.06), woodMat, 0.28, 0.39, 1.92);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.06, 0.78, 0.06), woodMat, 1.72, 0.39, 1.92);

  // Chairs
  for (const [x, z, ry] of [[0.1, 1.5, 0],[1.9, 1.5, Math.PI],[1, 0.5, Math.PI/2],[1, 2.5, -Math.PI/2]]) {
    addMesh(scene, disposables, new THREE.BoxGeometry(0.55, 0.06, 0.5), woodMat, x, 0.46, z, ry);
    addMesh(scene, disposables, new THREE.BoxGeometry(0.55, 0.6, 0.06), woodMat, x, 0.77, z - (ry === 0 ? 0.22 : ry === Math.PI ? -0.22 : 0), ry);
  }

  // Hanging pots (decorative)
  const potMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
  for (const [x] of [[-0.5], [0.5], [1.5]]) {
    addMesh(scene, disposables, new THREE.SphereGeometry(0.12, 8, 8), potMat, x, 2.8, -3.5);
  }

  // Window above sink
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xCCEEFF, emissive: 0x88BBFF, emissiveIntensity: 0.6, transparent: true, opacity: 0.65,
  });
  addMesh(scene, disposables, new THREE.PlaneGeometry(1.0, 0.9), glassMat, -1.5, 2.0, -3.99, 0, false);

  // Overhead light strip
  const stripMat = new THREE.MeshStandardMaterial({ color: 0xFFFFCC, emissive: 0xFFFF99, emissiveIntensity: 1.0 });
  addMesh(scene, disposables, new THREE.BoxGeometry(7, 0.05, 0.12), stripMat, 0, 3.4, -3.5);
}

// ========== INTERIOR 3: Workshop ==========
function buildWorkshop(scene, disposables) {
  makeRoom(scene, disposables, 10, 4, 9, 0xc8a870, 0x6B4A2C);

  const darkWood  = new THREE.MeshStandardMaterial({ color: 0x4A2810, roughness: 0.95 });
  const lightWood = new THREE.MeshStandardMaterial({ color: 0xC8824A, roughness: 0.8 });
  const metalMat  = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.4 });

  // Workbench
  addMesh(scene, disposables, new THREE.BoxGeometry(3.5, 0.12, 1.0), lightWood, -2, 0.9, -4.0);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.12, 0.9, 1.0), darkWood, -3.65, 0.45, -4.0);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.12, 0.9, 1.0), darkWood, -0.38, 0.45, -4.0);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.12, 0.9, 1.0), darkWood, -2, 0.45, -4.0);

  // Tools on bench (hammers, saws - simplified)
  const toolMat = new THREE.MeshStandardMaterial({ color: 0x887766 });
  addMesh(scene, disposables, new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), toolMat, -3, 0.97, -3.8, 0.3);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.08, 0.08, 0.5), metalMat, -2.5, 0.97, -3.75, 0.2);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.4, 0.04, 0.08), metalMat, -1.5, 0.97, -3.7);

  // Shelving unit
  for (let shelf = 0; shelf < 4; shelf++) {
    addMesh(scene, disposables, new THREE.BoxGeometry(4, 0.06, 0.4), darkWood, 2.5, 0.6 + shelf * 0.8, -4.0);
  }
  // Items on shelves
  const itemColors = [0xcc4422, 0x4444aa, 0x44aa44, 0xaaaa44];
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < 5; i++) {
      const cMat = new THREE.MeshStandardMaterial({ color: itemColors[(s+i)%4] });
      const h = 0.15 + Math.random() * 0.2;
      addMesh(scene, disposables, new THREE.BoxGeometry(0.16, h, 0.16), cMat, 1.0 + i * 0.7, 0.64 + s * 0.8 + h/2, -3.82);
    }
  }

  // Barrel
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.95 });
  for (const [x, z] of [[-3.5, 1.5], [-4.5, 2.5]]) {
    addMesh(scene, disposables, new THREE.CylinderGeometry(0.35, 0.3, 0.9, 12), barrelMat, x, 0.45, z);
    const hoopMat = new THREE.MeshStandardMaterial({ color: 0x555533, metalness: 0.5 });
    addMesh(scene, disposables, new THREE.TorusGeometry(0.35, 0.025, 6, 16), hoopMat, x, 0.65, z, 0);
  }

  // Hanging lantern
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xFFCC44, emissive: 0xFF9900, emissiveIntensity: 1.2 });
  addMesh(scene, disposables, new THREE.BoxGeometry(0.18, 0.25, 0.18), lanternMat, 0, 3.3, 0);
  const lanternLight = new THREE.PointLight(0xFF9922, 1.5, 12);
  lanternLight.position.set(0, 3.1, 0);
  scene.add(lanternLight);
  disposables.push(lanternLight);

  // Anvil
  addMesh(scene, disposables, new THREE.BoxGeometry(0.5, 0.15, 0.25), metalMat, 3, 0.96, 3);
  addMesh(scene, disposables, new THREE.BoxGeometry(0.35, 0.4, 0.25), metalMat, 3, 0.65, 3);

  // NPC stool
  addMesh(scene, disposables, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), lightWood, -2, 0.47, 0);
  addMesh(scene, disposables, new THREE.CylinderGeometry(0.03, 0.03, 0.47, 8), darkWood, -2, 0.235, 0);
}
