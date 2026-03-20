// ====================================
// src/systems/InteractionSystem.js
// Raycaster, prompt UI, door animation
// ====================================

import * as THREE from 'three';

const INTERACT_RANGE = 3.5;

export class InteractionSystem {
  constructor(engine, input, dialogSystem, onInteract) {
    this.engine = engine;
    this.input  = input;
    this.dialog = dialogSystem;
    this.onInteract = onInteract;

    this._raycaster = new THREE.Raycaster();
    this._raycaster.far = INTERACT_RANGE;

    this._promptEl   = document.getElementById('interaction-prompt');
    this._promptText = document.getElementById('prompt-text');
    this._mobileBtn  = document.getElementById('mobile-interact');

    this._currentTarget = null;
    this._cooldown = 0;
    this._doorStates = new Map(); // mesh uuid -> isOpen

    this._scene = null;

    // Mobile interact button
    this._mobileBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      this._triggerInteract();
    });
  }

  setScene(scene) {
    this._scene = scene;
  }

  update(player, activeSceneObj) {
    if (this._cooldown > 0) {
      this._cooldown -= 1/60;
    }

    const scene = activeSceneObj?.scene;
    if (!scene) return;

    // Cast ray from camera center
    const cam = player.camera;
    this._raycaster.setFromCamera(new THREE.Vector2(0, 0), cam);

    // Collect interactables
    const targets = [];
    scene.traverse(obj => {
      if (obj.isMesh && (obj.userData.isDoor || obj.userData.isExitDoor)) {
        targets.push(obj);
      }
    });

    const hits = this._raycaster.intersectObjects(targets, false);

    if (hits.length > 0) {
      const hit = hits[0];
      this._currentTarget = hit.object;

      const isDoor     = hit.object.userData.isDoor;
      const isExitDoor = hit.object.userData.isExitDoor;
      const isOpen     = this._doorStates.get(hit.object.uuid) || false;

      let label;
      if (isExitDoor)     label = '[E] Keluar 🚪';
      else if (isOpen)    label = '[E] Tutup Pintu';
      else                label = '[E] Masuk ke Rumah 🏡';

      this._showPrompt(label);

      // Check keypress (desktop)
      if (this.input.isInteractPressed() && this._cooldown <= 0) {
        this.input.resetInteract();
        this._triggerInteract();
      }
    } else {
      // Check NPC proximity
      const npcRange = 3.0;
      const playerPos = player.getPosition();
      let nearNPC = null;

      if (activeSceneObj?.npcManager) {
        nearNPC = activeSceneObj.npcManager.getNearbyNPC(playerPos, npcRange);
      } else if (window._npcManager) {
        nearNPC = window._npcManager.getNearbyNPC(playerPos, npcRange);
      }

      if (nearNPC) {
        this._currentTarget = { type: 'npc', data: nearNPC };
        this._showPrompt(`[E] Bicara dengan ${nearNPC.name}`);
        if (this.input.isInteractPressed() && this._cooldown <= 0) {
          this.input.resetInteract();
          this._triggerInteract();
        }
      } else {
        this._currentTarget = null;
        this._hidePrompt();
      }
    }
  }

  _triggerInteract() {
    if (!this._currentTarget || this._cooldown > 0) return;
    this._cooldown = 0.5;

    const target = this._currentTarget;

    if (target.type === 'npc') {
      this.onInteract('npc', target.data);
      return;
    }

    const mesh = target;

    if (mesh.userData.isExitDoor) {
      this.onInteract('exit', {});
      return;
    }

    if (mesh.userData.isDoor) {
      const isOpen = this._doorStates.get(mesh.uuid) || false;
      this._animateDoor(mesh, !isOpen);
      this._doorStates.set(mesh.uuid, !isOpen);

      if (!isOpen) {
        // After door open animation, offer to enter
        setTimeout(() => {
          this.onInteract('door', { houseId: mesh.userData.houseId });
        }, 600);
      }
    }
  }

  _animateDoor(doorMesh, open) {
    const pivot = doorMesh.userData.pivot;
    if (!pivot) return;

    const targetAngle = open ? -Math.PI * 0.75 : 0;

    gsap.to(pivot.rotation, {
      y: targetAngle,
      duration: 0.55,
      ease: 'power2.out',
    });
  }

  _showPrompt(text) {
    this._promptEl.classList.remove('hidden');
    this._promptText.textContent = text;
    this._mobileBtn.classList.remove('hidden');
  }

  _hidePrompt() {
    this._promptEl.classList.add('hidden');
    this._mobileBtn.classList.add('hidden');
  }
}
