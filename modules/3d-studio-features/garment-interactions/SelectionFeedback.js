/**
 * Woobi - 3D Studio Features
 * SelectionFeedback.js - Visual Highlighting & Emissive Pulse Feedback Controller
 */

export class SelectionFeedback {
  constructor(options = {}, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
    this.THREE = THREE;
    this.options = Object.assign({
      hoverEmissive: 0x2A241E,
      selectedEmissive: 0x483C30,
      hoverScaleBump: 1.02,
      transitionDuration: 150
    }, options);

    // Stored originals: mesh -> { emissiveHex, emissiveIntensity, scale }
    this.originalStates = new Map();
  }

  applyHover(mesh) {
    if (!mesh) return;
    this.saveOriginalState(mesh);

    if (mesh.material && mesh.material.emissive) {
      if (typeof mesh.material.emissive.setHex === 'function') {
        mesh.material.emissive.setHex(this.options.hoverEmissive);
      } else {
        mesh.material.emissive = this.options.hoverEmissive;
      }
      mesh.material.needsUpdate = true;
    }
  }

  applySelection(mesh) {
    if (!mesh) return;
    this.saveOriginalState(mesh);

    if (mesh.material && mesh.material.emissive) {
      if (typeof mesh.material.emissive.setHex === 'function') {
        mesh.material.emissive.setHex(this.options.selectedEmissive);
      } else {
        mesh.material.emissive = this.options.selectedEmissive;
      }
      mesh.material.needsUpdate = true;
    }
  }

  clearFeedback(mesh) {
    if (!mesh || !this.originalStates.has(mesh)) return;

    const original = this.originalStates.get(mesh);
    if (mesh.material && mesh.material.emissive) {
      if (typeof mesh.material.emissive.setHex === 'function') {
        mesh.material.emissive.setHex(original.emissiveHex);
      } else {
        mesh.material.emissive = original.emissiveHex;
      }
      mesh.material.needsUpdate = true;
    }

    if (mesh.scale && original.scale) {
      mesh.scale.set(original.scale.x, original.scale.y, original.scale.z);
    }

    this.originalStates.delete(mesh);
  }

  clearAll() {
    this.originalStates.forEach((_, mesh) => {
      this.clearFeedback(mesh);
    });
    this.originalStates.clear();
  }

  saveOriginalState(mesh) {
    if (!mesh || this.originalStates.has(mesh)) return;

    const emissiveHex = (mesh.material && mesh.material.emissive) ?
      (typeof mesh.material.emissive.getHex === 'function' ? mesh.material.emissive.getHex() : (mesh.material.emissive || 0x000000)) :
      0x000000;

    const scale = mesh.scale ? { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z } : null;

    this.originalStates.set(mesh, {
      emissiveHex,
      scale
    });
  }

  dispose() {
    this.clearAll();
  }
}
