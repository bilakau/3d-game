// ====================================
// src/systems/MobileControls.js
// Nipple.js joystick + right-swipe camera
// ====================================

export class MobileControls {
  constructor(input) {
    this.input = input;
    this.joystickManager = null;
    this._rightStartX = 0;
    this._rightStartY = 0;
    this._isRightTouch = false;
    this._setupMobileZones();
  }

  _isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  show() {
    if (!this._isMobile()) return;

    const leftZone = document.getElementById('mobile-left');
    leftZone.style.pointerEvents = 'auto';

    // Create nipple joystick (left half)
    this.joystickManager = nipplejs.create({
      zone: leftZone,
      mode: 'dynamic',
      restOpacity: 0.7,
      color: 'rgba(240,165,0,0.8)',
      size: 100,
    });

    this.joystickManager.on('move', (evt, data) => {
      if (data && data.vector) {
        this.input.joystick.x =  data.vector.x;
        this.input.joystick.y = -data.vector.y; // flip Y
      }
    });

    this.joystickManager.on('end', () => {
      this.input.joystick.x = 0;
      this.input.joystick.y = 0;
    });
  }

  _setupMobileZones() {
    const rightZone = document.getElementById('mobile-right');
    let lastX = 0, lastY = 0;
    let activeTouch = null;

    rightZone.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (activeTouch === null) {
          activeTouch = t.identifier;
          lastX = t.clientX;
          lastY = t.clientY;
        }
      }
    }, { passive: false });

    rightZone.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) {
          const dx = t.clientX - lastX;
          const dy = t.clientY - lastY;
          this.input.mouseDelta.x += dx * 1.5;
          this.input.mouseDelta.y += dy * 1.5;
          lastX = t.clientX;
          lastY = t.clientY;
        }
      }
    }, { passive: false });

    rightZone.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) activeTouch = null;
      }
    });
  }
}
