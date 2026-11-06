/**
 * Woobi - 3D Studio Features
 * GarmentInteractions.js - Raycasting & Pointer Interactions for 3D Garments
 */

import { INTERACTION_EVENTS, INTERACTION_STATES } from './InteractionsContract.js';
import { SelectionFeedback } from './SelectionFeedback.js';

export class GarmentInteractions {
  constructor(camera = null, domElement = null, options = {}, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
    this.camera = camera;
    this.domElement = domElement;
    this.THREE = THREE;
    this.options = Object.assign({
      enableHover: true,
      enableClickSelection: true,
      hoverEmissive: 0x2A241E,
      selectedEmissive: 0x483C30
    }, options);

    // Feedback engine
    this.feedback = new SelectionFeedback({
      hoverEmissive: this.options.hoverEmissive,
      selectedEmissive: this.options.selectedEmissive
    }, this.THREE);

    // Interactive target registry: mesh -> { garmentId, category, name, ... }
    this.interactiveTargets = new Map();

    // Raycaster state
    this.raycaster = (this.THREE && this.THREE.Raycaster) ? new this.THREE.Raycaster() : null;
    this.pointer = (this.THREE && this.THREE.Vector2) ? new this.THREE.Vector2() : { x: 0, y: 0 };

    this.currentHoveredMesh = null;
    this.selectedGarment = null; // { garmentId, category, mesh }

    // Event listeners
    this.listeners = new Map();

    // Bound DOM handlers
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerDown = this.handlePointerDown.bind(this);

    if (this.domElement && typeof this.domElement.addEventListener === 'function') {
      this.attachEventListeners();
    }
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setDomElement(domElement) {
    this.detachEventListeners();
    this.domElement = domElement;
    this.attachEventListeners();
  }

  attachEventListeners() {
    if (!this.domElement || typeof this.domElement.addEventListener !== 'function') return;
    this.domElement.addEventListener('pointermove', this.boundPointerMove, { passive: true });
    this.domElement.addEventListener('pointerdown', this.boundPointerDown, { passive: true });
  }

  detachEventListeners() {
    if (!this.domElement) return;
    if (typeof this.domElement.removeEventListener === 'function') {
      this.domElement.removeEventListener('pointermove', this.boundPointerMove);
      this.domElement.removeEventListener('pointerdown', this.boundPointerDown);
    }
  }

  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`GarmentInteractions error [${event}]:`, e);
        }
      });
    }
  }

  registerInteractiveMesh(mesh, metadata = {}) {
    if (!mesh) return;
    this.interactiveTargets.set(mesh, Object.assign({
      garmentId: metadata.garmentId || mesh.name || 'unknown',
      category: metadata.category || 'general'
    }, metadata));
  }

  unregisterInteractiveMesh(mesh) {
    if (!mesh) return;
    this.feedback.clearFeedback(mesh);
    this.interactiveTargets.delete(mesh);
  }

  getRegisteredMeshes() {
    return Array.from(this.interactiveTargets.keys());
  }

  updatePointerCoordinates(clientX, clientY) {
    if (!this.domElement) return;
    const rect = this.domElement.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    this.pointer.x = (x / rect.width) * 2 - 1;
    this.pointer.y = -(y / rect.height) * 2 + 1;
  }

  raycast(clientX, clientY) {
    if (!this.camera || !this.raycaster) return [];

    this.updatePointerCoordinates(clientX, clientY);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes = this.getRegisteredMeshes();
    if (meshes.length === 0) return [];

    return this.raycaster.intersectObjects(meshes, true);
  }

  handlePointerMove(event) {
    if (!this.options.enableHover) return;

    const hits = this.raycast(event.clientX, event.clientY);

    if (hits.length > 0) {
      let hitMesh = hits[0].object;
      // Resolve up to nearest registered interactive parent if hit submesh
      while (hitMesh && !this.interactiveTargets.has(hitMesh) && hitMesh.parent) {
        hitMesh = hitMesh.parent;
      }

      if (hitMesh && this.interactiveTargets.has(hitMesh)) {
        if (this.currentHoveredMesh !== hitMesh) {
          if (this.currentHoveredMesh) {
            this.handleUnhover(this.currentHoveredMesh);
          }
          this.handleHover(hitMesh);
        }
        return;
      }
    }

    if (this.currentHoveredMesh) {
      this.handleUnhover(this.currentHoveredMesh);
    }
  }

  handleHover(mesh) {
    this.currentHoveredMesh = mesh;
    const meta = this.interactiveTargets.get(mesh);

    // Apply visual feedback if not currently selected
    if (!this.selectedGarment || this.selectedGarment.mesh !== mesh) {
      this.feedback.applyHover(mesh);
    }

    this.emit(INTERACTION_EVENTS.HOVER, {
      mesh,
      ...meta,
      state: INTERACTION_STATES.HOVERED
    });
  }

  handleUnhover(mesh) {
    const meta = this.interactiveTargets.get(mesh);

    if (!this.selectedGarment || this.selectedGarment.mesh !== mesh) {
      this.feedback.clearFeedback(mesh);
    }

    this.currentHoveredMesh = null;
    this.emit(INTERACTION_EVENTS.UNHOVER, {
      mesh,
      ...meta,
      state: INTERACTION_STATES.IDLE
    });
  }

  handlePointerDown(event) {
    if (!this.options.enableClickSelection) return;

    this.emit(INTERACTION_EVENTS.POINTER_DOWN, { x: event.clientX, y: event.clientY });

    const hits = this.raycast(event.clientX, event.clientY);
    if (hits.length > 0) {
      let hitMesh = hits[0].object;
      while (hitMesh && !this.interactiveTargets.has(hitMesh) && hitMesh.parent) {
        hitMesh = hitMesh.parent;
      }

      if (hitMesh && this.interactiveTargets.has(hitMesh)) {
        const meta = this.interactiveTargets.get(hitMesh);
        this.selectGarment(meta.garmentId, hitMesh);
        return;
      }
    }
  }

  selectGarment(garmentId, explicitMesh = null) {
    let targetMesh = explicitMesh;

    if (!targetMesh) {
      for (const [mesh, meta] of this.interactiveTargets.entries()) {
        if (meta.garmentId === garmentId) {
          targetMesh = mesh;
          break;
        }
      }
    }

    // Deselect prior selection
    if (this.selectedGarment && this.selectedGarment.mesh !== targetMesh) {
      this.deselectGarment();
    }

    const meta = targetMesh ? (this.interactiveTargets.get(targetMesh) || {}) : { garmentId };

    if (targetMesh) {
      this.feedback.applySelection(targetMesh);
    }

    this.selectedGarment = {
      garmentId,
      category: meta.category || null,
      mesh: targetMesh
    };

    this.emit(INTERACTION_EVENTS.SELECT, {
      garmentId,
      category: meta.category,
      mesh: targetMesh,
      state: INTERACTION_STATES.SELECTED
    });

    return { success: true, ...this.selectedGarment };
  }

  deselectGarment() {
    if (!this.selectedGarment) return;

    const prev = this.selectedGarment;
    if (prev.mesh) {
      this.feedback.clearFeedback(prev.mesh);
    }

    this.selectedGarment = null;

    this.emit(INTERACTION_EVENTS.DESELECT, {
      garmentId: prev.garmentId,
      category: prev.category,
      mesh: prev.mesh,
      state: INTERACTION_STATES.IDLE
    });
  }

  clearSelection() {
    this.deselectGarment();
    this.feedback.clearAll();
  }

  getSelectedGarment() {
    return this.selectedGarment ? { ...this.selectedGarment } : null;
  }

  dispose() {
    this.detachEventListeners();
    this.clearSelection();
    this.feedback.dispose();
    this.interactiveTargets.clear();
    this.listeners.clear();
    this.camera = null;
    this.domElement = null;
    this.raycaster = null;
  }
}

export function createGarmentInteractions(options = {}, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
  return new GarmentInteractions(options.camera, options.domElement, options, THREE);
}
