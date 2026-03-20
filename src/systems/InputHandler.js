// ====================================
// src/systems/InputHandler.js
// Keyboard, mouse and pointer lock
// ====================================

export class InputHandler {
  constructor() {
    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.isPointerLocked = false;

    // Joystick axis (populated by MobileControls)
    this.joystick = { x: 0, y: 0 };

    this._bindKeyboard();
    this._bindPointerLock();
    this._bindMouse();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  _bindPointerLock() {
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }

  _bindMouse() {
    document.addEventListener('mousemove', e => {
      if (this.isPointerLocked) {
        this.mouseDelta.x += e.movementX;
        this.mouseDelta.y += e.movementY;
      }
    });
  }

  consumeMouseDelta() {
    const d = { ...this.mouseDelta };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return d;
  }

  isPressed(code) { return !!this.keys[code]; }

  isInteractPressed() {
    return this.keys['KeyE'] || this.keys['Enter'];
  }

  resetInteract() {
    this.keys['KeyE'] = false;
    this.keys['Enter'] = false;
  }
}
