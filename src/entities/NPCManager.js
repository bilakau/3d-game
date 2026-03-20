// ====================================
// src/entities/NPCManager.js
// NPC State Machine: Idle / Walk / Chat
// ====================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const NPC_DEFS = [
  {
    name: 'Elder Arion',
    emoji: '👴',
    color: 0x886644,
    hatColor: 0x334466,
    position: new THREE.Vector3(-5, 0, 4),
    zone: new THREE.Vector3(-5, 0, 4),
    dialogLines: [
      'Selamat datang, pengembara! Desa ini sudah berdiri ratusan tahun.',
      'Tiga rumah di desa ini menyimpan cerita masing-masing. Jelajahi semuanya!',
    ]
  },
  {
    name: 'Eishia Stilza',
    emoji: '⚔️',
    isCustomModel: true,
    modelUrl: './src/assets/models/eishia_stilza_-_gachiakuta__3d_character_model.glb',
    position: new THREE.Vector3(0, 0, 8),
    zone: new THREE.Vector3(0, 0, 8),
    dialogLines: [
      'Hm? Apa yang kau lihat? Aku sedang mencari jalan pulang ke tempat asalku.',
      'Desa ini sangat damai. Aku harap tidak ada bahaya di sini.',
    ]
  },
  {
    name: 'Mia the Baker',
    emoji: '👩',
    color: 0xffddaa,
    hatColor: 0xff8866,
    position: new THREE.Vector3(5, 0, 2),
    zone: new THREE.Vector3(5, 0, 2),
    dialogLines: [
      'Hai! Aku Mia, pembuat roti terbaik di desa ini! 🍞',
      'Kulihat kamu baru saja tiba? Coba masuk ke rumah-rumah di sini!',
      'Setiap rumah punya cerita dan kenangan yang berbeda.',
    ]
  },
  {
    name: 'Bruno the Guard',
    emoji: '💂',
    color: 0x6688aa,
    hatColor: 0x224466,
    position: new THREE.Vector3(0, 0, -3),
    zone: new THREE.Vector3(0, 0, -3),
    dialogLines: [
      'Berhenti! Eh, maaf—saya pikir kamu orang asing. 😅',
      'Silakan jelajahi desa, tapi jangan merusak apa pun.',
      'Sumur di pojok barat daya bisa menyegarkan semangat petualanganmu!',
    ]
  },
  {
    name: 'Lila the Child',
    emoji: '👧',
    color: 0xffaacc,
    hatColor: 0xff66aa,
    position: new THREE.Vector3(-3, 0, 10),
    zone: new THREE.Vector3(-3, 0, 10),
    dialogLines: [
      'Hiii! Kamu mau bermain? Aku sedang mencari kucing-ku yang hilang! 🐱',
      'Rumah nenek di ujung jalan punya banyak buku cerita lho!',
      'Kamu punya permen? Aku suka permen! 🍭',
    ]
  },
];

const DIALOG_RANGE = 3.0;
const WALK_RANGE   = 4.0;
const WALK_SPEED   = 1.0;

export class NPCManager {
  constructor(scene) {
    this.npcs = [];
    this._scene = scene;
    this._buildNPCs(scene);
  }

  _buildNPCs(scene) {
    NPC_DEFS.forEach(def => {
      const npc = this._createNPC(def);
      this.npcs.push(npc);
      scene.add(npc.group);
    });
  }

  _createNPC(def) {
    const group = new THREE.Group();
    group.position.copy(def.position);
    group.userData.isMesh = false; // Don't raycast against group

    const npc = {
      group,
      def,
      state: 'idle',
      idleTimer: 2 + Math.random() * 3,
      walkTarget: def.position.clone(),
      dialogCooldown: 0,
      legPhase: Math.random() * Math.PI * 2,
    };

    // If custom model provided, load via GLTF
    if (def.isCustomModel && def.modelUrl) {
      const loader = new GLTFLoader();
      loader.load(def.modelUrl, (gltf) => {
        const model = gltf.scene;
        
        // Auto scale to ~1.8 units tall
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        if (size.y > 0.001) {
          const scale = 1.8 / size.y;
          model.scale.setScalar(scale);
          model.position.y = -box.min.y * scale; 
        }

        // Enable shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Play first animation if present
        if (gltf.animations && gltf.animations.length > 0) {
          npc.mixer = new THREE.AnimationMixer(model);
          npc.action = npc.mixer.clipAction(gltf.animations[0]);
          npc.action.play();
        }

        // Fix default rotation if character faces wrong way
        // (usually GLTF characters face +Z, but engine assumes they face +Z too)
        
        group.add(model);
      }, undefined, (err) => {
        console.error('Error loading NPC model:', err);
      });
      
      return npc;
    }

    // Default Blocky Body
    const skinMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.85 });
    const hatMat  = new THREE.MeshStandardMaterial({ color: def.hatColor, roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.9 });

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), skinMat);
    head.position.y = 1.78;
    head.castShadow = true;
    group.add(head);

    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.3, 8), hatMat);
    hat.position.y = 2.08;
    hat.castShadow = true;
    group.add(hat);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), hatMat);
    brim.position.y = 1.96;
    group.add(brim);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), darkMat);
    torso.position.y = 1.22;
    torso.castShadow = true;
    group.add(torso);

    const armMat = darkMat;
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), armMat);
    leftArm.position.set(-0.32, 1.2, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.position.set(0.32, 1.2, 0);
    group.add(rightArm);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.9 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), legMat);
    leftLeg.position.set(-0.14, 0.545, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.14, 0.545, 0);
    group.add(rightLeg);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), eyeMat);
    const eyeL = eye.clone(); eyeL.position.set(-0.1, 1.82, 0.23);
    const eyeR = eye.clone(); eyeR.position.set(0.1, 1.82, 0.23);
    group.add(eyeL, eyeR);

    npc.leftLeg = leftLeg;
    npc.rightLeg = rightLeg;
    npc.leftArm = leftArm;
    npc.rightArm = rightArm;

    return npc;
  }


  setScene(scene) {
    this._scene = scene;
  }

  update(dt, playerPos) {
    for (const npc of this.npcs) {
      npc.dialogCooldown = Math.max(0, npc.dialogCooldown - dt);

      // Update custom animations if present
      if (npc.mixer) {
        npc.mixer.update(dt);
      }

      if (npc.state === 'idle') {
        npc.idleTimer -= dt;
        if (npc.idleTimer <= 0) {
          // Random walk
          const angle = Math.random() * Math.PI * 2;
          const dist  = Math.random() * WALK_RANGE;
          npc.walkTarget.set(
            npc.def.zone.x + Math.cos(angle) * dist,
            0,
            npc.def.zone.z + Math.sin(angle) * dist
          );
          npc.state = 'walk';
        }
        // Idle arm sway
        if (npc.leftArm) npc.leftArm.rotation.z  = Math.sin(Date.now() * 0.001) * 0.05;
        if (npc.rightArm) npc.rightArm.rotation.z = -Math.sin(Date.now() * 0.001) * 0.05;
      }

      if (npc.state === 'walk') {
        const dir = npc.walkTarget.clone().sub(npc.group.position);
        dir.y = 0;
        const dist = dir.length();

        if (dist < 0.15) {
          npc.state = 'idle';
          npc.idleTimer = 2 + Math.random() * 4;
        } else {
          dir.normalize();
          npc.group.position.addScaledVector(dir, WALK_SPEED * dt);
          // Smooth face direction (avoid snap rotation)
          const angle = Math.atan2(dir.x, dir.z);
          let walkDiff = angle - npc.group.rotation.y;
          walkDiff = Math.atan2(Math.sin(walkDiff), Math.cos(walkDiff));
          npc.group.rotation.y += walkDiff * 0.15;

          // Leg/arm swing
          npc.legPhase += dt * 6;
          const swing = Math.sin(npc.legPhase) * 0.6;
          if (npc.leftLeg) npc.leftLeg.rotation.x  =  swing;
          if (npc.rightLeg) npc.rightLeg.rotation.x = -swing;
          if (npc.leftArm) npc.leftArm.rotation.x  = -swing * 0.5;
          if (npc.rightArm) npc.rightArm.rotation.x =  swing * 0.5;
        }
      }

      // Always face player slightly when close
      const d = npc.group.position.distanceTo(playerPos);
      if (d < DIALOG_RANGE + 1) {
        const toPlayer = playerPos.clone().sub(npc.group.position);
        toPlayer.y = 0;
        if (toPlayer.length() > 0.1) {
          const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
          // Normalize to shortest path [-π, π] to prevent spinning
          let diff = targetAngle - npc.group.rotation.y;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          npc.group.rotation.y += diff * 0.08;
        }
        npc.state = 'idle';

      }

      // Keep at ground level
      npc.group.position.y = 0;
    }
  }

  getNearbyNPC(playerPos, range = DIALOG_RANGE) {
    for (const npc of this.npcs) {
      if (npc.group.position.distanceTo(playerPos) <= range) {
        return npc.def;
      }
    }
    return null;
  }

  getMeshes() {
    return this.npcs.map(n => n.group);
  }
}
