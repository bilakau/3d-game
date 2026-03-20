// ====================================
// src/scenes/VillageScene.js
// Builds the entire outdoor village world
// ====================================

import * as THREE from 'three';

export class VillageScene {
  constructor(engine) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.scene.userData.isVillage = true;
    this.doors = [];
    this.exitDoors = [];
  }

  build() {
    const scene = this.scene;

    // --- SKY & FOG ---
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0xC4DFF5, 0.018);

    // --- LIGHTING ---
    const ambient = new THREE.AmbientLight(0xfff8e7, 0.6);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x668833, 0.5);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff5d0, 1.4);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    // Add sun disc in sky
    const sunGeo = new THREE.SphereGeometry(3, 12, 12);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFF5AA });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(120, 200, -100);
    scene.add(sunMesh);

    // --- GROUND ---
    this._buildGround(scene);

    // --- ROAD ---
    this._buildRoad(scene);

    // --- HOUSES ---
    this._buildHouse1(scene, new THREE.Vector3(-12, 0, -8));
    this._buildHouse2(scene, new THREE.Vector3(12, 0, -8));
    this._buildHouse3(scene, new THREE.Vector3(0, 0, -25));

    // --- TREES ---
    this._buildInstancedTrees(scene);

    // --- PROPS (fence, rocks, lamp posts) ---
    this._buildFences(scene);
    this._buildRocks(scene);
    this._buildLampPosts(scene);
    this._buildWell(scene);

    // --- CLOUDS ---
    this._buildClouds(scene);

    // --- BOUNDARY WALLS (invisible) ---
    this._buildBoundaryWalls(scene);
  }

  _buildGround(scene) {
    // Main grass ground
    const geo = new THREE.PlaneGeometry(200, 200, 20, 20);

    // Slightly vary vertices for natural feel
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getX(i)) > 5 || Math.abs(pos.getZ(i)) > 5) {
        pos.setY(i, (Math.random() - 0.5) * 0.3);
      }
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a7c3f,
      roughness: 0.95,
      metalness: 0,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.isFloor = true;
    scene.add(ground);
  }

  _buildRoad(scene) {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x888070, roughness: 1 });

    // Main road (Z axis)
    const road1 = new THREE.Mesh(new THREE.PlaneGeometry(5, 60), roadMat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.01;
    road1.receiveShadow = true;
    scene.add(road1);

    // Cross road (X axis)
    const road2 = new THREE.Mesh(new THREE.PlaneGeometry(40, 5), roadMat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.01;
    road2.position.z = -5;
    road2.receiveShadow = true;
    scene.add(road2);

    // Road lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let z = -25; z <= 25; z += 4) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.02, z);
      scene.add(line);
    }
  }

  // ====== HOUSE 1: Cozy Cottage ======
  _buildHouse1(scene, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Foundation
    const foundMat = new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.9 });
    const found = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 7), foundMat);
    found.position.y = 0.15;
    found.castShadow = true;
    found.receiveShadow = true;
    group.add(found);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xeedfcc, roughness: 0.85 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 7), wallMat);
    wall.position.y = 2.05;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData.isWall = true;
    group.add(wall);

    // Roof (red-brown)
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B2500, roughness: 0.8 });
    const roofGeo = new THREE.ConeGeometry(5.8, 2.5, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 5.05;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Chimney
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0xaa5533, roughness: 0.95 });
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2, 0.7), chimneyMat);
    chimney.position.set(2, 5.5, -1);
    chimney.castShadow = true;
    group.add(chimney);

    // Windows (2)
    this._addWindow(group, new THREE.Vector3(-2.5, 2.3, 3.51));
    this._addWindow(group, new THREE.Vector3(2.5, 2.3, 3.51));

    // Door with frame
    const door = this._buildInteractiveDoor(group, new THREE.Vector3(0, 0, 3.51), 0, 1);

    // Path to door
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xa09070, roughness: 1 });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, 5.5);
    group.add(path);

    // Flower box
    this._addFlowerBox(group, new THREE.Vector3(-3.2, 0.9, 3.2));

    group.position.y = 0;
    scene.add(group);
    this.doors.push(door);
  }

  // ====== HOUSE 2: Modern Chalet ======
  _buildHouse2(scene, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Foundation
    const foundMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const found = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 7), foundMat);
    found.position.y = 0.2;
    found.receiveShadow = true;
    group.add(found);

    // Main walls (light grey)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c8, roughness: 0.8 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(9, 4, 7), wallMat);
    wall.position.y = 2.4;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData.isWall = true;
    group.add(wall);

    // Flat roof with overhang
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.7 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.25, 8.5), roofMat);
    roof.position.y = 4.5;
    roof.castShadow = true;
    group.add(roof);

    // Triangular attic gable
    const gGeo = new THREE.CylinderGeometry(0, 4.7, 2, 4);
    const gMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.75 });
    const gable = new THREE.Mesh(gGeo, gMat);
    gable.position.y = 5.6;
    gable.rotation.y = Math.PI / 4;
    gable.castShadow = true;
    group.add(gable);

    // Big window
    this._addWindow(group, new THREE.Vector3(-2, 2.3, 3.51), 2.2, 1.6);
    this._addWindow(group, new THREE.Vector3(2.5, 2.3, 3.51));

    // Door
    const door = this._buildInteractiveDoor(group, new THREE.Vector3(-0.8, 0, 3.51), 0, 2);

    // Porch columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    for (const cx of [-1.8, 0.2]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), colMat);
      col.position.set(cx, 1.1, 4.2);
      group.add(col);
    }

    group.position.y = 0;
    scene.add(group);
    this.doors.push(door);
  }

  // ====== HOUSE 3: Old Merchant House ======
  _buildHouse3(scene, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base
    const foundMat = new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 1 });
    const found = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 8), foundMat);
    found.position.y = 0.2;
    found.receiveShadow = true;
    group.add(found);

    // Two-story walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xc8a873, roughness: 0.9 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 5.5, 8), wallMat);
    wall.position.y = 3.15;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData.isWall = true;
    group.add(wall);

    // Dark timber frame strips (decorative)
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x442208, roughness: 1 });
    for (const x of [-4, -1.3, 1.3, 4]) {
      const timber = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.5, 8.1), timberMat);
      timber.position.set(x, 3.15, 0);
      group.add(timber);
    }

    // Roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.85 });
    const roofGeo = new THREE.ConeGeometry(7, 3, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 8.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Sign
    this._addSign(group, new THREE.Vector3(0, 3.5, 4.05), "🏪 Merchant");

    // Windows (ground and upper floor)
    this._addWindow(group, new THREE.Vector3(-3, 2.2, 4.05));
    this._addWindow(group, new THREE.Vector3(3, 2.2, 4.05));
    this._addWindow(group, new THREE.Vector3(-3, 4.5, 4.05));
    this._addWindow(group, new THREE.Vector3(3, 4.5, 4.05));
    this._addWindow(group, new THREE.Vector3(0, 4.5, 4.05));

    // Door
    const door = this._buildInteractiveDoor(group, new THREE.Vector3(0, 0, 4.05), 0, 3);

    group.position.y = 0;
    scene.add(group);
    this.doors.push(door);
  }

  // ====== SHARED BUILDERS ======
  _addWindow(group, position, w = 1.2, h = 1.0) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5c3d11, roughness: 0.9 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6,
    });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.08), frameMat);
    frame.position.copy(position);
    group.add(frame);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), glassMat);
    glass.position.copy(position);
    glass.position.z += 0.02;
    group.add(glass);

    // Cross divider
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.05, 0.1), frameMat);
    bar.position.copy(position);
    bar.position.z += 0.03;
    group.add(bar);

    const bar2 = bar.clone();
    bar2.rotation.z = Math.PI / 2;
    bar2.scale.x = h / w;
    bar2.position.copy(position);
    bar2.position.z += 0.03;
    group.add(bar2);
  }

  _buildInteractiveDoor(group, position, rotY, houseId) {
    const doorPivot = new THREE.Group();
    doorPivot.position.copy(position);
    doorPivot.position.x -= 0.5; // pivot at hinge
    doorPivot.rotation.y = rotY;
    group.add(doorPivot);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x6B3A2A, roughness: 0.7 });
    const doorGeo = new THREE.BoxGeometry(1.0, 2.2, 0.1);
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0.5, 1.1, 0);
    doorMesh.castShadow = true;
    doorMesh.userData.isDoor = true;
    doorMesh.userData.houseId = houseId;
    doorMesh.userData.pivot = doorPivot;
    doorPivot.add(doorMesh);

    // Door knob
    const knobMat = new THREE.MeshStandardMaterial({ color: 0xddaa44, metalness: 0.8, roughness: 0.2 });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), knobMat);
    knob.position.set(0.85, 1.1, 0.08);
    doorMesh.add(knob);

    // Door frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a2010, roughness: 0.9 });
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.12), frameMat);
    topFrame.position.set(position.x, position.y + 2.25, position.z);
    group.add(topFrame);
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.12), frameMat);
    leftF.position.set(position.x - 0.05, position.y + 1.2, position.z);
    group.add(leftF);
    const rightF = leftF.clone();
    rightF.position.set(position.x + 1.05, position.y + 1.2, position.z);
    group.add(rightF);

    // Steps
    const stepMat = new THREE.MeshStandardMaterial({ color: 0xaaa090, roughness: 1 });
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.5), stepMat);
    step.position.set(position.x + 0.5, 0.06, position.z + 0.3);
    group.add(step);

    return { doorMesh, doorPivot, houseId, isOpen: false };
  }

  _addFlowerBox(group, position) {
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.35), boxMat);
    box.position.copy(position);
    group.add(box);

    const colors = [0xff4488, 0xff6622, 0xff2255, 0xffee22];
    for (let i = 0; i < 5; i++) {
      const flowerMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), flowerMat);
      flower.position.copy(position);
      flower.position.x += (i - 2) * 0.22;
      flower.position.y += 0.25;
      group.add(flower);
    }
  }

  _addSign(group, position, text) {
    const signMat = new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.9 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.7, 0.12), signMat);
    sign.position.copy(position);
    group.add(sign);
  }

  // ====== INSTANCED TREES ======
  _buildInstancedTrees(scene) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d6a2d });

    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.0, 7);
    const leavesGeo = new THREE.ConeGeometry(1.4, 3, 7);

    const positions = [
      // Around road edges
      [-6, 0, 0], [6, 0, 0],
      [-6, 0, 6], [6, 0, 6],
      [-6, 0, -15], [6, 0, -15],
      [-6, 0, 12], [6, 0, 12],
      // Forest patches
      [-15, 0, -5], [-18, 0, -10], [-15, 0, -15], [-20, 0, -18],
      [-14, 0, 5], [-18, 0, 8], [-20, 0, 3],
      [15, 0, -5], [18, 0, -10], [16, 0, -18], [20, 0, -20],
      [14, 0, 5], [18, 0, 8], [20, 0, 3], [22, 0, -5],
      [-12, 0, 20], [-6, 0, 22], [0, 0, 25], [6, 0, 23], [12, 0, 21],
      [25, 0, 10], [28, 0, 0], [25, 0, -5],
      [-25, 0, 10], [-28, 0, 0], [-25, 0, -5],
    ];

    // Use instanced meshes for performance
    const count = positions.length;
    const trunkIM = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    const leavesIM = new THREE.InstancedMesh(leavesGeo, leavesMat, count);
    trunkIM.castShadow = true;
    leavesIM.castShadow = true;
    trunkIM.receiveShadow = true;

    const dummy = new THREE.Object3D();
    positions.forEach(([x, y, z], i) => {
      const scale = 0.7 + Math.random() * 0.7;
      dummy.position.set(x, y + 1.0, z);
      dummy.scale.setScalar(scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      trunkIM.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, y + 3.5 * scale, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      leavesIM.setMatrixAt(i, dummy.matrix);
    });

    scene.add(trunkIM);
    scene.add(leavesIM);
  }

  _buildFences(scene) {
    const postMat = new THREE.MeshStandardMaterial({ color: 0xC4A35A, roughness: 0.95 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xD4B36A, roughness: 0.95 });

    const fenceSegment = (x, z, rotY) => {
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), postMat);
      post.position.y = 0.5;
      g.add(post);
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.05), railMat);
      rail1.position.set(0.5, 0.8, 0);
      g.add(rail1);
      const rail2 = rail1.clone();
      rail2.position.y = 0.4;
      g.add(rail2);
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      scene.add(g);
    };

    // Left side fencing
    for (let z = -20; z <= 15; z += 1) fenceSegment(-8, z, 0);
    // Right side fencing
    for (let z = -20; z <= 15; z += 1) fenceSegment(8, z, 0);
  }

  _buildRocks(scene) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.95 });
    const rockPositions = [
      [-9, 0, 3], [-9, 0, -4], [9, 0, 2], [9, 0, -7],
      [-11, 0, 10], [11, 0, 10], [-6, 0, 18], [6, 0, 19],
    ];
    rockPositions.forEach(([x, y, z]) => {
      const scale = 0.2 + Math.random() * 0.35;
      const geo = new THREE.DodecahedronGeometry(scale, 0);
      const mesh = new THREE.Mesh(geo, rockMat);
      mesh.position.set(x, scale * 0.5, z);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.castShadow = true;
      scene.add(mesh);
    });
  }

  _buildLampPosts(scene) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xFFE8AA,
      emissive: 0xFFCC44,
      emissiveIntensity: 1.5,
    });
    const positions = [[-4, 0, -1], [4, 0, -1], [-4, 0, -10], [4, 0, -10]];

    positions.forEach(([x, y, z]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3.5, 8), poleMat);
      pole.position.set(x, 1.75, z);
      pole.castShadow = true;
      scene.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), poleMat);
      arm.position.set(x + 0.3, 3.5, z);
      scene.add(arm);

      const lampGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const lamp = new THREE.Mesh(lampGeo, lightMat);
      lamp.position.set(x + 0.6, 3.4, z);
      scene.add(lamp);

      const pointLight = new THREE.PointLight(0xFFE066, 0.8, 8);
      pointLight.position.set(x + 0.6, 3.4, z);
      scene.add(pointLight);
    });
  }

  _buildWell(scene) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x888878, roughness: 1 });
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x7B4F2E, roughness: 0.9 });

    // Base ring
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.9, 12, 1, true), stoneMat);
    ring.position.set(-5, 0.45, 8);
    ring.castShadow = true;
    scene.add(ring);

    // Top rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 8, 16), stoneMat);
    rim.position.set(-5, 0.9, 8);
    rim.rotation.x = Math.PI / 2;
    scene.add(rim);

    // Posts
    for (const xOff of [-0.8, 0.8]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), woodMat);
      post.position.set(-5 + xOff, 1.7, 8);
      post.castShadow = true;
      scene.add(post);
    }
    // Crossbeam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.12), woodMat);
    beam.position.set(-5, 2.45, 8);
    scene.add(beam);
  }

  _buildClouds(scene) {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      roughness: 1,
    });

    const cloudPositions = [
      [30, 60, -50], [-40, 55, -60], [10, 65, -70], [-20, 58, -40], [50, 62, -30],
    ];

    cloudPositions.forEach(([x, y, z]) => {
      const g = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < puffs; i++) {
        const r = 3 + Math.random() * 4;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 6
        );
        g.add(puff);
      }
      g.position.set(x, y, z);
      scene.add(g);
    });
  }

  _buildBoundaryWalls(scene) {
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    const walls = [
      { pos: [0, 5, 35], size: [80, 10, 0.5] },
      { pos: [0, 5, -45], size: [80, 10, 0.5] },
      { pos: [35, 5, 0], size: [0.5, 10, 80] },
      { pos: [-35, 5, 0], size: [0.5, 10, 80] },
    ];
    walls.forEach(({ pos, size }) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
      m.position.set(...pos);
      m.userData.isWall = true;
      scene.add(m);
    });
  }

  getDoors() { return this.doors; }
}
