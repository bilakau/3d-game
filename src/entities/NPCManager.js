// ====================================
// src/entities/NPCManager.js
// NPC State Machine: Idle / Walk / Chat
// ====================================

import * as THREE from 'three';

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
      'Hati-hati di malam hari, kabut bisa datang kapan saja...',
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

    // Body
    const skinMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.85 });
    const hatMat  = new THREE.MeshStandardMaterial({ color: def.hatColor, roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.9 });

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), skinMat);
    head.position.y = 1.78;
    head.castShadow = true;
    group.add(head);

    // Hat
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.3, 8), hatMat);
    hat.position.y = 2.08;
    hat.castShadow = true;
    group.add(hat);

    // Hat brim
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 12), hatMat);
    brim.position.y = 1.96;
    group.add(brim);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), darkMat);
    torso.position.y = 1.22;
    torso.castShadow = true;
    group.add(torso);

    // Arms
    const armMat = darkMat;
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), armMat);
    leftArm.position.set(-0.32, 1.2, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.position.set(0.32, 1.2, 0);
    group.add(rightArm);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.9 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), legMat);
    leftLeg.position.set(-0.14, 0.545, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.14, 0.545, 0);
    group.add(rightLeg);

    // Eyes (tiny dark spheres)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), eyeMat);
    const eyeL = eye.clone(); eyeL.position.set(-0.1, 1.82, 0.23);
    const eyeR = eye.clone(); eyeR.position.set(0.1, 1.82, 0.23);
    group.add(eyeL, eyeR);

    // Floating name tag
    group.userData.isMesh = false; // Don't raycast against group

    const npc = {
      group,
      def,
      state: 'idle',
      idleTimer: 2 + Math.random() * 3,
      walkTarget: def.position.clone(),
      dialogCooldown: 0,
      leftLeg, rightLeg, leftArm, rightArm,
      legPhase: Math.random() * Math.PI * 2,
    };

    return npc;
  }

  setScene(scene) {
    this._scene = scene;
  }

  update(dt, playerPos) {
    for (const npc of this.npcs) {
      npc.dialogCooldown = Math.max(0, npc.dialogCooldown - dt);

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
        npc.leftArm.rotation.z  = Math.sin(Date.now() * 0.001) * 0.05;
        npc.rightArm.rotation.z = -Math.sin(Date.now() * 0.001) * 0.05;
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
          // Face direction
          const angle = Math.atan2(dir.x, dir.z);
          npc.group.rotation.y = angle;

          // Leg/arm swing
          npc.legPhase += dt * 6;
          const swing = Math.sin(npc.legPhase) * 0.6;
          npc.leftLeg.rotation.x  =  swing;
          npc.rightLeg.rotation.x = -swing;
          npc.leftArm.rotation.x  = -swing * 0.5;
          npc.rightArm.rotation.x =  swing * 0.5;
        }
      }

      // Always face player slightly when close
      const d = npc.group.position.distanceTo(playerPos);
      if (d < DIALOG_RANGE + 1) {
        const toPlayer = playerPos.clone().sub(npc.group.position);
        toPlayer.y = 0;
        if (toPlayer.length() > 0.1) {
          const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
          npc.group.rotation.y += (targetAngle - npc.group.rotation.y) * 0.06;
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
