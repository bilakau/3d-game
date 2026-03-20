// ====================================
// src/systems/DialogSystem.js
// NPC Dialog box manager
// ====================================

export class DialogSystem {
  constructor() {
    this._box     = document.getElementById('dialog-box');
    this._avatar  = document.getElementById('dialog-avatar');
    this._name    = document.getElementById('dialog-name');
    this._text    = document.getElementById('dialog-text');
    this._closeBtn= document.getElementById('dialog-close');

    this._lines   = [];
    this._lineIdx = 0;
    this._isOpen  = false;
    this._typeTimer = null;

    this._closeBtn.addEventListener('click', () => this._advance());

    // Allow E key or tap to advance
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyE' && this._isOpen) this._advance();
    });
  }

  show(name, emoji, lines) {
    if (this._isOpen) return;
    this._lines   = lines;
    this._lineIdx = 0;
    this._name.textContent   = name;
    this._avatar.textContent = emoji;
    this._box.classList.remove('hidden');
    this._isOpen = true;
    this._displayLine(0);
  }

  _displayLine(idx) {
    const line = this._lines[idx] || '';
    this._text.textContent = '';
    let i = 0;

    // Typewriter effect
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      this._text.textContent += line[i] || '';
      i++;
      if (i >= line.length) clearInterval(this._typeTimer);
    }, 28);

    // Update button
    const isLast = idx >= this._lines.length - 1;
    this._closeBtn.textContent = isLast ? 'Close ✕' : 'Continue ▶';
  }

  _advance() {
    clearInterval(this._typeTimer);

    // If still typing, just finish the line
    const line = this._lines[this._lineIdx] || '';
    if (this._text.textContent.length < line.length) {
      this._text.textContent = line;
      return;
    }

    this._lineIdx++;
    if (this._lineIdx >= this._lines.length) {
      this._close();
    } else {
      this._displayLine(this._lineIdx);
    }
  }

  _close() {
    this._box.classList.add('hidden');
    this._isOpen = false;
    clearInterval(this._typeTimer);
  }

  get isOpen() { return this._isOpen; }
}
