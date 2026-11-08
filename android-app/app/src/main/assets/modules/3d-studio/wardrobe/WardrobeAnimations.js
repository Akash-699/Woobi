/**
 * Woobi 3D Studio - Wardrobe Animations
 * Controls smooth door opening, closing, easing, and state tracking.
 */

export class WardrobeAnimations {
  constructor(options = {}) {
    this.maxDoorAngle = options.maxDoorAngle || (Math.PI * 0.58); // ~105 degrees open
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.state = 'closed'; // 'closed' | 'opening' | 'open' | 'closing'
    this.speed = options.speed || 0.08;
    this.doors = [];
  }

  registerDoor(doorMesh, side = 'left') {
    this.doors.push({ mesh: doorMesh, side });
  }

  open() {
    this.targetAngle = this.maxDoorAngle;
    this.state = 'opening';
  }

  close() {
    this.targetAngle = 0;
    this.state = 'closing';
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  isOpen() {
    return this.targetAngle > 0;
  }

  getState() {
    return {
      state: this.state,
      isOpen: this.isOpen(),
      currentAngle: this.currentAngle,
      targetAngle: this.targetAngle
    };
  }

  update() {
    if (this.currentAngle === this.targetAngle) return false;

    const diff = this.targetAngle - this.currentAngle;
    if (Math.abs(diff) < 0.005) {
      this.currentAngle = this.targetAngle;
      this.state = this.currentAngle === 0 ? 'closed' : 'open';
    } else {
      this.currentAngle += diff * this.speed;
    }

    this.doors.forEach(({ mesh, side }) => {
      if (mesh && mesh.rotation) {
        mesh.rotation.y = side === 'left' ? -this.currentAngle : this.currentAngle;
      }
    });

    return true;
  }
}

export default WardrobeAnimations;
