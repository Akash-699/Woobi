/**
 * Woobi - 3D Studio Camera Module
 * CameraInteractions.js - Mouse, Touch, Pinch-to-Zoom & Pointer Event Management
 */

export class CameraInteractions {
  constructor(options = {}) {
    this.canvas = null;
    this.targetWindow = null;

    // Callbacks
    this.onRotate = options.onRotate || null; // (deltaRotationY) => {}
    this.onZoom = options.onZoom || null;     // (deltaZoomFactor) => {}
    this.onClick = options.onClick || null;   // (clientX, clientY) => {}
    this.onResize = options.onResize || null; // () => {}

    // Pointer / Drag State
    this.isPointerDown = false;
    this.hasDragged = false;
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.pinchStartDist = 0;

    // Bound Event Listeners for clean teardown
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);
    this._onWheel = this._handleWheel.bind(this);
    this._onWindowResize = this._handleResize.bind(this);

    this.isAttached = false;
  }

  attach(canvas, targetWindow = (typeof window !== 'undefined' ? window : null)) {
    if (this.isAttached) {
      this.detach();
    }

    this.canvas = canvas;
    this.targetWindow = targetWindow;

    if (this.canvas) {
      this.canvas.addEventListener('mousedown', this._onMouseDown);
      this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
      this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    }

    if (this.targetWindow) {
      this.targetWindow.addEventListener('mousemove', this._onMouseMove);
      this.targetWindow.addEventListener('mouseup', this._onMouseUp);
      this.targetWindow.addEventListener('touchmove', this._onTouchMove, { passive: true });
      this.targetWindow.addEventListener('touchend', this._onTouchEnd);
      this.targetWindow.addEventListener('resize', this._onWindowResize);
    }

    this.isAttached = true;
  }

  detach() {
    if (!this.isAttached) return;

    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this._onMouseDown);
      this.canvas.removeEventListener('touchstart', this._onTouchStart);
      this.canvas.removeEventListener('wheel', this._onWheel);
    }

    if (this.targetWindow) {
      this.targetWindow.removeEventListener('mousemove', this._onMouseMove);
      this.targetWindow.removeEventListener('mouseup', this._onMouseUp);
      this.targetWindow.removeEventListener('touchmove', this._onTouchMove);
      this.targetWindow.removeEventListener('touchend', this._onTouchEnd);
      this.targetWindow.removeEventListener('resize', this._onWindowResize);
    }

    this.isPointerDown = false;
    this.hasDragged = false;
    this.isAttached = false;
    this.canvas = null;
    this.targetWindow = null;
  }

  _handleMouseDown(e) {
    this.isPointerDown = true;
    this.hasDragged = false;
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  }

  _handleMouseMove(e) {
    if (!this.isPointerDown) return;
    const deltaX = e.clientX - this.lastPointerX;
    const deltaY = e.clientY - this.lastPointerY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.hasDragged = true;
    }

    if (typeof this.onRotate === 'function') {
      this.onRotate(deltaX * 0.008);
    }

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  }

  _handleMouseUp(e) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    if (!this.hasDragged && typeof this.onClick === 'function') {
      this.onClick(e.clientX, e.clientY);
    }
  }

  _handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.isPointerDown = true;
      this.hasDragged = false;
      this.pointerStartX = e.touches[0].clientX;
      this.pointerStartY = e.touches[0].clientY;
      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.pinchStartDist = Math.hypot(dx, dy);
    }
  }

  _handleTouchMove(e) {
    if (e.touches.length === 1 && this.isPointerDown) {
      const deltaX = e.touches[0].clientX - this.lastPointerX;
      const deltaY = e.touches[0].clientY - this.lastPointerY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        this.hasDragged = true;
      }

      if (typeof this.onRotate === 'function') {
        this.onRotate(deltaX * 0.009);
      }

      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const diff = dist - this.pinchStartDist;

      if (typeof this.onZoom === 'function') {
        this.onZoom(-diff * 0.002);
      }
      this.pinchStartDist = dist;
    }
  }

  _handleTouchEnd(e) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    if (!this.hasDragged && e.changedTouches && e.changedTouches.length > 0) {
      if (typeof this.onClick === 'function') {
        this.onClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }
  }

  _handleWheel(e) {
    if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const zoomDelta = e.deltaY * 0.001;
    if (typeof this.onZoom === 'function') {
      this.onZoom(zoomDelta);
    }
  }

  _handleResize() {
    if (typeof this.onResize === 'function') {
      this.onResize();
    }
  }

  dispose() {
    this.detach();
    this.onRotate = null;
    this.onZoom = null;
    this.onClick = null;
    this.onResize = null;
  }
}
