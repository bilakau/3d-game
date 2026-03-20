// ====================================
// src/entities/Player.js
// FPS Player: camera, hands, movement
// ====================================

import * as THREE from 'three';

const SENSITIVITY = 0.0018;
const WALK_SPEED  = 5.0;
const GRAVITY     = -18;
const JUMP_VEL    = 7;

export class Player {
  constructor(engine, input, scene, mobileControls) {
    this.engine = engine;
    this.input  = input;
    this.mobile = mobileControls;

    this.yaw   = 0;
    this.pitch = 0;
    this.velY  = 0;
    this.onGround = true;
    this.lastOutdoorPosition = new THREE.Vector3(0, 1.7, 8);

    this._scene = scene;

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.05,
      300
    );
    this.camera.position.set(0, 1.7, 8);

    // Hands group
    this._buildHands();

    // Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    // Keyboard E key
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyE') this.input.keys['KeyE'] = true;
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'KeyE') this.input.keys['KeyE'] = false;
    });

    // Mobile interact button
    const mobileInteract = document.getElementById('mobile-interact');
    mobileInteract.addEventListener('touchstart', () => {
      this.input.keys['KeyE'] = true;
    });
    mobileInteract.addEventListener('touchend', () => {
      this.input.keys['KeyE'] = false;
    });
  }

  _buildHands() {
    this.handsGroup = new THREE.Group();
    this.camera.add(this.handsGroup);

    // Skin color material
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xDDA882,
      roughness: 0.8,
      metalness: 0.0,
    });
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x334466,
      roughness: 0.9,
    });

    // Right hand
    const rightHand = new THREE.Group();

    // Sleeve (forearm)
    const sleeveGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.25, 8);
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.rotation.x = -0.3;
    sleeve.position.set(0, 0, 0);
    rightHand.add(sleeve);

    // Palm
    const palmGeo = new THREE.BoxGeometry(0.1, 0.06, 0.12);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, -0.12, 0.04);
    rightHand.add(palm);

    // Thumb
    const thumbGeo = new THREE.BoxGeometry(0.03, 0.06, 0.03);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(-0.06, -0.1, 0.03);
    thumb.rotation.z = 0.5;
    rightHand.add(thumb);

    // Fingers (simplified block)
    const finGeo = new THREE.BoxGeometry(0.08, 0.04, 0.03);
    const fin = new THREE.Mesh(finGeo, skinMat);
    fin.position.set(0, -0.14, 0.1);
    fin.rotation.x = 0.3;
    rightHand.add(fin);

    rightHand.position.set(0.28, -0.3, -0.4);
    rightHand.rotation.set(0.2, -0.1, 0.05);
    this.handsGroup.add(rightHand);
    this.rightHand = rightHand;

    // Left hand (mirrored, slightly back)
    const leftHand = rightHand.clone();
    leftHand.position.set(-0.28, -0.3, -0.45);
    leftHand.rotation.set(0.2, 0.1, -0.05);
    leftHand.scale.x = -1;
    this.handsGroup.add(leftHand);
    this.leftHand = leftHand;

    this._bobTime = 0;
    this._baseRY = rightHand.position.y;
    this._baseLY = leftHand.position.y;
  }

  attachToScene(newScene, spawnPoint) {
    // Remove camera from old scene
    if (this._scene) {
      this._scene.remove(this.camera);
    }
    this._scene = newScene;
    this.camera.position.copy(spawnPoint);
    newScene.add(this.camera);
  }

  getPosition() { return this.camera.position; }

  update(dt, scene) {
    // -- Mouse / touch look --
    const delta = this.input.consumeMouseDelta();
    this.yaw   -= delta.x * SENSITIVITY;
    this.pitch -= delta.y * SENSITIVITY;
    this.pitch  = Math.max(-1.3, Math.min(1.3, this.pitch));

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // -- Movement direction --
    const forward = new THREE.Vector3();
    const right   = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    let moveX = 0, moveZ = 0;

    // PC keys
    if (this.input.isPressed('KeyW') || this.input.isPressed('ArrowUp'))    moveZ -= 1;
    if (this.input.isPressed('KeyS') || this.input.isPressed('ArrowDown'))  moveZ += 1;
    if (this.input.isPressed('KeyA') || this.input.isPressed('ArrowLeft'))  moveX -= 1;
    if (this.input.isPressed('KeyD') || this.input.isPressed('ArrowRight')) moveX += 1;

    // Mobile joystick
    moveX += this.input.joystick.x;
    moveZ -= this.input.joystick.y;

    // Clamp diagonal
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 1) { moveX /= len; moveZ /= len; }

    const moving = len > 0.05;

    const velocity = new THREE.Vector3();
    velocity.addScaledVector(forward, -moveZ * WALK_SPEED);
    velocity.addScaledVector(right,    moveX * WALK_SPEED);

    const newPos = this.camera.position.clone();
    newPos.add(velocity.multiplyScalar(dt));

    // Simple ground collision
    if (this.onGround && (this.input.isPressed('Space') || this.input.isPressed('KeyQ'))) {
      this.velY = JUMP_VEL;
      this.onGround = false;
    }

    this.velY += GRAVITY * dt;
    newPos.y += this.velY * dt;

    const floorY = this._getFloorY(scene, newPos);
    if (newPos.y < floorY + 1.7) {
      newPos.y = floorY + 1.7;
      this.velY = 0;
      this.onGround = true;
    }

    // Wall collision (simple AABB vs walls flagged in scene)
    this._resolveWallCollision(newPos, scene);

    this.camera.position.copy(newPos);

    // Save outdoor pos
    if (this._scene && this._scene.userData && this._scene.userData.isVillage) {
      this.lastOutdoorPosition.copy(newPos);
    }

    // -- Hand bob animation --
    if (moving) {
      this._bobTime += dt * 7;
    } else {
      this._bobTime += dt * 0.5;
    }
    const bob = moving ? Math.sin(this._bobTime) * 0.015 : Math.sin(this._bobTime) * 0.003;
    const sway = moving ? Math.cos(this._bobTime * 0.5) * 0.008 : 0;

    if (this.rightHand) {
      this.rightHand.position.y = this._baseRY + bob;
      this.rightHand.position.x = 0.28 + sway;
    }
    if (this.leftHand) {
      this.leftHand.position.y = this._baseLY - bob;
      this.leftHand.position.x = -0.28 - sway;
    }
  }

  _getFloorY(scene, pos) {
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(pos.x, pos.y + 5, pos.z),
      new THREE.Vector3(0, -1, 0),
      0,
      30
    );
    const floors = [];
    scene.traverse(obj => {
      if (obj.userData && obj.userData.isFloor) floors.push(obj);
    });
    const hits = raycaster.intersectObjects(floors, false);
    if (hits.length > 0) return hits[0].point.y;
    return 0;
  }

  _resolveWallCollision(pos, scene) {
    const walls = [];
    scene.traverse(obj => {
      if (obj.userData && obj.userData.isWall && obj.geometry) walls.push(obj);
    });
    const radius = 0.4;
    for (const wall of walls) {
      if (!wall.geometry.boundingBox) wall.geometry.computeBoundingBox();
      const box = wall.geometry.boundingBox.clone().applyMatrix4(wall.matrixWorld);
      box.expandByScalar(radius);
      if (box.containsPoint(pos)) {
        const center = new THREE.Vector3();
        box.getCenter(center);
        const diff = pos.clone().sub(center);
        diff.y = 0;
        const size = new THREE.Vector3();
        box.getSize(size);
        const ox = size.x / 2 - Math.abs(diff.x);
        const oz = size.z / 2 - Math.abs(diff.z);
        if (ox < oz) {
          pos.x += diff.x > 0 ? ox : -ox;
        } else {
          pos.z += diff.z > 0 ? oz : -oz;
        }
      }
    }
  }
}
