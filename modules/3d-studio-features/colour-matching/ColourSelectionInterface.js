/**
 * Woobi - 3D Studio Features
 * ColourSelectionInterface.js - Interactive Colour Picker, Live Harmony Scoring & Alternatives UI
 */

import { SmartColourMatcher } from './SmartColourMatcher.js';
import {
  SHIRT_COLOUR_SWATCHES,
  PANTS_COLOUR_SWATCHES,
  SHOES_COLOUR_SWATCHES,
  FASHION_COLOURS
} from './ColourPresets.js';
import {
  COLOUR_MATCHING_EVENTS,
  OUTFIT_SLOTS,
  RATING_TIERS
} from './ColourMatchingContract.js';

export class ColourSelectionInterface {
  constructor(options = {}) {
    this.options = Object.assign({
      initialShirt: 'Crisp White',
      initialPants: 'Midnight Navy',
      initialShoes: 'Espresso Brown',
      onAnalysisChange: null,
      onColourChange: null,
      matcherOptions: {}
    }, options);

    this.matcher = new SmartColourMatcher(this.options.matcherOptions);
    this.selection = {
      shirt: this.options.initialShirt,
      pants: this.options.initialPants,
      shoes: this.options.initialShoes
    };

    this.latestAnalysis = null;
    this.listeners = new Map();
    this.rootElement = null;

    // Run initial analysis
    this.updateAnalysis();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return;
    const filtered = this.listeners.get(event).filter(h => h !== handler);
    this.listeners.set(event, filtered);
  }

  emit(event, data) {
    const list = this.listeners.get(event) || [];
    for (const h of list) {
      try {
        h(data);
      } catch (err) {
        console.error(`ColourSelectionInterface event error (${event}):`, err);
      }
    }
  }

  setColour(slot, colour) {
    if (![OUTFIT_SLOTS.SHIRT, OUTFIT_SLOTS.PANTS, OUTFIT_SLOTS.SHOES].includes(slot)) {
      throw new Error(`Invalid slot: ${slot}. Must be shirt, pants, or shoes.`);
    }

    this.selection[slot] = colour;
    this.updateAnalysis();

    this.emit(COLOUR_MATCHING_EVENTS.CHANGE, {
      slot,
      colour,
      selection: { ...this.selection }
    });

    if (typeof this.options.onColourChange === 'function') {
      this.options.onColourChange(slot, colour, this.selection);
    }

    if (this.rootElement) {
      this.refreshDOM();
    }
  }

  // US English alias
  setColor(slot, color) {
    return this.setColour(slot, color);
  }

  getSelection() {
    return { ...this.selection };
  }

  getAnalysis() {
    return this.latestAnalysis;
  }

  updateAnalysis() {
    this.latestAnalysis = this.matcher.analyzeOutfit(this.selection);

    this.emit(COLOUR_MATCHING_EVENTS.ANALYSIS, this.latestAnalysis);

    if (typeof this.options.onAnalysisChange === 'function') {
      this.options.onAnalysisChange(this.latestAnalysis);
    }

    return this.latestAnalysis;
  }

  applyAlternative(slot, colour) {
    this.setColour(slot, colour);
    this.emit(COLOUR_MATCHING_EVENTS.ALTERNATIVE_APPLIED, { slot, colour });
  }

  reset() {
    this.selection = {
      shirt: this.options.initialShirt,
      pants: this.options.initialPants,
      shoes: this.options.initialShoes
    };
    this.updateAnalysis();
    this.emit(COLOUR_MATCHING_EVENTS.RESET, { ...this.selection });
    if (this.rootElement) {
      this.refreshDOM();
    }
  }

  randomize() {
    const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
    const shirt = randomItem(SHIRT_COLOUR_SWATCHES).name;
    const pants = randomItem(PANTS_COLOUR_SWATCHES).name;
    const shoes = randomItem(SHOES_COLOUR_SWATCHES).name;

    this.selection = { shirt, pants, shoes };
    this.updateAnalysis();
    if (this.rootElement) {
      this.refreshDOM();
    }
  }

  /**
   * Renders the complete interactive UI widget into DOM
   */
  render() {
    if (typeof document === 'undefined') {
      // In headless / node environments, return lightweight descriptor
      return {
        type: 'headless-colour-interface',
        selection: { ...this.selection },
        analysis: this.latestAnalysis
      };
    }

    const container = document.createElement('div');
    container.className = 'woobi-colour-matcher-container';
    container.id = 'woobiColourMatcher';

    container.innerHTML = this._generateHTML();
    this.rootElement = container;
    this._attachEventListeners(container);

    return container;
  }

  mount(target) {
    if (typeof document === 'undefined') return;
    const parent = typeof target === 'string' ? document.querySelector(target) : target;
    if (!parent) return;

    const el = this.render();
    parent.innerHTML = '';
    parent.appendChild(el);
    return el;
  }

  unmount() {
    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
    }
    this.rootElement = null;
  }

  refreshDOM() {
    if (!this.rootElement || typeof document === 'undefined') return;

    // Update swatches and inputs
    const slots = [
      { id: 'shirt', swatch: this.rootElement.querySelector('#swatchPreviewShirt'), text: this.rootElement.querySelector('#inputShirtText'), picker: this.rootElement.querySelector('#pickerShirt') },
      { id: 'pants', swatch: this.rootElement.querySelector('#swatchPreviewPants'), text: this.rootElement.querySelector('#inputPantsText'), picker: this.rootElement.querySelector('#pickerPants') },
      { id: 'shoes', swatch: this.rootElement.querySelector('#swatchPreviewShoes'), text: this.rootElement.querySelector('#inputShoesText'), picker: this.rootElement.querySelector('#pickerShoes') }
    ];

    const { palette } = this.latestAnalysis;

    slots.forEach(s => {
      const col = palette[s.id];
      if (s.swatch) {
        s.swatch.style.backgroundColor = col.hex;
        s.swatch.title = `${col.name} (${col.hex})`;
      }
      if (s.text && document.activeElement !== s.text) {
        s.text.value = col.name;
      }
      if (s.picker) {
        s.picker.value = col.hex;
      }
    });

    // Update Score Badge & Rating
    const scoreVal = this.rootElement.querySelector('#scoreValue');
    const ratingBadge = this.rootElement.querySelector('#ratingBadge');
    const harmonyTag = this.rootElement.querySelector('#harmonyTag');
    const headline = this.rootElement.querySelector('#verdictHeadline');
    const explanationBody = this.rootElement.querySelector('#explanationBody');
    const alternativesContainer = this.rootElement.querySelector('#alternativesList');

    if (scoreVal) scoreVal.textContent = `${this.latestAnalysis.score}%`;
    if (ratingBadge) {
      ratingBadge.textContent = this.latestAnalysis.rating;
      ratingBadge.style.backgroundColor = this.latestAnalysis.badgeColor;
      ratingBadge.className = `rating-pill badge-${this.latestAnalysis.ratingId}`;
    }
    if (harmonyTag) {
      harmonyTag.textContent = this.latestAnalysis.harmonyType.replace(/_/g, ' ').toUpperCase();
    }
    if (headline) {
      headline.textContent = this.latestAnalysis.verdict;
    }
    if (explanationBody) {
      explanationBody.innerHTML = this.latestAnalysis.explanation.replace(/\n\n/g, '<br><br>');
    }

    if (alternativesContainer) {
      alternativesContainer.innerHTML = this._generateAlternativesHTML();
      this._attachAlternativeEvents(alternativesContainer);
    }
  }

  _generateHTML() {
    const analysis = this.latestAnalysis;
    const { palette } = analysis;

    return `
      <div class="aura-colour-matcher">
        <!-- Header -->
        <div class="acm-header">
          <div class="acm-title-group">
            <span class="acm-badge">AURA WARDROBE</span>
            <h2 class="acm-heading">Smart Outfit Colour Matcher</h2>
            <p class="acm-subheading">Analyze your shirt, pants, and shoe combinations using professional color theory.</p>
          </div>
          <div class="acm-actions">
            <button class="acm-btn-secondary" id="btnRandomize" title="Generate random stylish combination">🎲 Randomize</button>
            <button class="acm-btn-secondary" id="btnReset" title="Reset to defaults">🔄 Reset</button>
          </div>
        </div>

        <!-- Garment Color Selectors (Shirt, Pants, Shoes) -->
        <div class="acm-selectors-grid">
          ${this._generateSlotCard('shirt', 'Shirt / Top', '👔', palette.shirt, SHIRT_COLOUR_SWATCHES)}
          ${this._generateSlotCard('pants', 'Pants / Bottom', '👖', palette.pants, PANTS_COLOUR_SWATCHES)}
          ${this._generateSlotCard('shoes', 'Shoes / Footwear', '👞', palette.shoes, SHOES_COLOUR_SWATCHES)}
        </div>

        <!-- Live Results & Feedback Card -->
        <div class="acm-results-card">
          <div class="acm-score-panel">
            <div class="acm-dial">
              <span class="acm-dial-num" id="scoreValue">${analysis.score}%</span>
              <span class="acm-dial-label">MATCH SCORE</span>
            </div>
            <div class="acm-tier-panel">
              <div class="acm-badge-row">
                <span class="rating-pill badge-${analysis.ratingId}" id="ratingBadge" style="background-color: ${analysis.badgeColor};">
                  ${analysis.rating}
                </span>
                <span class="acm-harmony-pill" id="harmonyTag">
                  ${analysis.harmonyType.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <h3 class="acm-verdict" id="verdictHeadline">${analysis.verdict}</h3>
            </div>
          </div>

          <!-- Color Theory Breakdown & Explanation -->
          <div class="acm-explanation-panel">
            <h4 class="acm-section-title">Color Harmony & Styling Analysis</h4>
            <div class="acm-explanation-body" id="explanationBody">
              ${analysis.explanation.replace(/\n\n/g, '<br><br>')}
            </div>
          </div>

          <!-- Alternative Suggestions -->
          <div class="acm-alternatives-panel">
            <h4 class="acm-section-title">✨ Recommended Alternatives & Upgrades</h4>
            <div class="acm-alternatives-list" id="alternativesList">
              ${this._generateAlternativesHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _generateSlotCard(slotId, title, icon, colorRecord, swatches) {
    const swatchesHTML = swatches.map(sw => `
      <button 
        type="button"
        class="acm-swatch-chip ${sw.hex.toLowerCase() === colorRecord.hex.toLowerCase() ? 'active' : ''}" 
        data-slot="${slotId}" 
        data-color="${sw.name}"
        data-hex="${sw.hex}"
        style="background-color: ${sw.hex};" 
        title="${sw.name} (${sw.hex})">
      </button>
    `).join('');

    return `
      <div class="acm-slot-card" data-slot="${slotId}">
        <div class="acm-slot-header">
          <span class="acm-slot-icon">${icon}</span>
          <span class="acm-slot-label">${title}</span>
        </div>

        <!-- Active Preview Indicator -->
        <div class="acm-preview-box">
          <div class="acm-swatch-circle" id="swatchPreview${this._capitalize(slotId)}" style="background-color: ${colorRecord.hex};"></div>
          <div class="acm-preview-details">
            <span class="acm-selected-name">${colorRecord.name}</span>
            <span class="acm-selected-hex">${colorRecord.hex}</span>
          </div>
        </div>

        <!-- Popular Swatches Palette -->
        <div class="acm-swatches-grid">
          ${swatchesHTML}
        </div>

        <!-- Custom Input Row -->
        <div class="acm-input-row">
          <input 
            type="color" 
            class="acm-color-picker" 
            id="picker${this._capitalize(slotId)}" 
            value="${colorRecord.hex}" 
            title="Choose custom shade from color wheel">
          <input 
            type="text" 
            class="acm-text-input" 
            id="input${this._capitalize(slotId)}Text" 
            value="${colorRecord.name}" 
            placeholder="Color name or #Hex">
        </div>
      </div>
    `;
  }

  _generateAlternativesHTML() {
    const alt = this.latestAnalysis.alternatives;
    const chips = [];

    // Shirt alternatives
    alt.shirtAlternatives.forEach(a => {
      chips.push(`
        <button type="button" class="acm-alt-chip" data-slot="shirt" data-color="${a.name}" data-hex="${a.hex}">
          <span class="acm-alt-dot" style="background-color: ${a.hex};"></span>
          <span>Shirt: <strong>${a.name}</strong> (${a.projectedScore}%)</span>
        </button>
      `);
    });

    // Pants alternatives
    alt.pantsAlternatives.forEach(a => {
      chips.push(`
        <button type="button" class="acm-alt-chip" data-slot="pants" data-color="${a.name}" data-hex="${a.hex}">
          <span class="acm-alt-dot" style="background-color: ${a.hex};"></span>
          <span>Pants: <strong>${a.name}</strong> (${a.projectedScore}%)</span>
        </button>
      `);
    });

    // Shoes alternatives
    alt.shoesAlternatives.forEach(a => {
      chips.push(`
        <button type="button" class="acm-alt-chip" data-slot="shoes" data-color="${a.name}" data-hex="${a.hex}">
          <span class="acm-alt-dot" style="background-color: ${a.hex};"></span>
          <span>Shoes: <strong>${a.name}</strong> (${a.projectedScore}%)</span>
        </button>
      `);
    });

    if (chips.length === 0) {
      return `<p class="acm-empty-alt">🎉 Current ensemble is already optimized with high color synergy!</p>`;
    }

    return chips.join('');
  }

  _attachEventListeners(container) {
    // Swatch clicks
    container.addEventListener('click', e => {
      const swatch = e.target.closest('.acm-swatch-chip');
      if (swatch) {
        const slot = swatch.dataset.slot;
        const color = swatch.dataset.color || swatch.dataset.hex;
        this.setColour(slot, color);
        return;
      }

      const altBtn = e.target.closest('.acm-alt-chip');
      if (altBtn) {
        const slot = altBtn.dataset.slot;
        const color = altBtn.dataset.color || altBtn.dataset.hex;
        this.applyAlternative(slot, color);
        return;
      }

      if (e.target.id === 'btnRandomize') {
        this.randomize();
        return;
      }

      if (e.target.id === 'btnReset') {
        this.reset();
        return;
      }
    });

    // Native color picker changes
    ['Shirt', 'Pants', 'Shoes'].forEach(s => {
      const slot = s.toLowerCase();
      const picker = container.querySelector(`#picker${s}`);
      const textInput = container.querySelector(`#input${s}Text`);

      if (picker) {
        picker.addEventListener('input', e => {
          this.setColour(slot, e.target.value);
        });
      }

      if (textInput) {
        textInput.addEventListener('change', e => {
          if (e.target.value.trim()) {
            this.setColour(slot, e.target.value.trim());
          }
        });
        textInput.addEventListener('keydown', e => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            this.setColour(slot, e.target.value.trim());
          }
        });
      }
    });
  }

  _attachAlternativeEvents(container) {
    // Already handled via delegated click listener on container
  }

  _capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export function createColourSelectionInterface(options = {}) {
  return new ColourSelectionInterface(options);
}

