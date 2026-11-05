/**
 * Woobi — 3D Virtual Fashion Studio & Monorepo Application by Troyz Solutions
 * Full Production System with:
 * - 01 Setup & First Outfit: Welcome, Style preferences, Add your wardrobe, Review item
 * - 02 Daily Outfit Studio: Today, Outfit details, Swap an item, Outfit ready
 * - 03 Style Studio: "Need an outfit?" AI Wardrobe Stylist & "Make your own outfit" Custom Builder
 * - 04 Wardrobe Intelligence: Condition (Clean / In Laundry) & Fit (Tight / Perfect / Loose) Tracking
 * - 05 Wardrobe & History: Your wardrobe, Saved looks, Wear history, Profile
 * - 06 Auth, Premium & Settings: Sign in, Premium, Reminders, Account & privacy
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DATA MODELS & INITIAL STATE
  // =========================================================================
  const LOOKS_DATA = [
    {
      id: 'look_1',
      title: 'Easy everyday',
      caption: 'A relaxed look for your college day.',
      modelPhoto: 'assets/model_tryon_navy.jpg',
      top: { name: 'Navy shirt', photo: 'assets/navy_shirt.jpg', condition: 'clean', fit: 'perfect' },
      bottom: { name: 'Beige trousers', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg', condition: 'clean', fit: 'perfect' },
      accessory: { name: 'Leather watch', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' }
    },
    {
      id: 'look_2',
      title: 'Office ready',
      caption: 'Crisp tailored tones suited for AC workdays.',
      modelPhoto: 'assets/model_tryon_linen.jpg',
      top: { name: 'White linen shirt', photo: 'assets/white_linen_shirt.jpg', condition: 'clean', fit: 'loose' },
      bottom: { name: 'Beige trousers', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg', condition: 'clean', fit: 'perfect' },
      accessory: { name: 'Leather watch', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' }
    },
    {
      id: 'look_3',
      title: 'Weekend casual',
      caption: 'Lightweight breathable cotton for warm afternoons.',
      modelPhoto: 'assets/model_tryon_kurta.jpg',
      top: { name: 'Olive kurta', photo: 'assets/olive_kurta.jpg', condition: 'clean', fit: 'perfect' },
      bottom: { name: 'Cream palazzo', photo: 'assets/cream_palazzo.jpg', condition: 'clean', fit: 'loose' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg', condition: 'clean', fit: 'perfect' },
      accessory: { name: 'Leather watch', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' }
    }
  ];

  // Complete user wardrobe collection with laundry & fit telemetry
  const WARDROBE_ITEMS = [
    { id: 'item_1', name: 'Navy shirt', category: 'Tops', photo: 'assets/navy_shirt.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_2', name: 'Beige chinos', category: 'Bottoms', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_3', name: 'Cream kurta', category: 'Tops', photo: 'assets/olive_kurta.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_4', name: 'White sneakers', category: 'Shoes', photo: 'assets/white_sneakers.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_5', name: 'Maroon top', category: 'Tops', photo: 'assets/maroon_top.jpg', condition: 'clean', fit: 'tight' },
    { id: 'item_6', name: 'Dark skirt', category: 'Bottoms', photo: 'assets/dark_skirt.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_7', name: 'White linen shirt', category: 'Tops', photo: 'assets/white_linen_shirt.jpg', condition: 'clean', fit: 'loose' },
    { id: 'item_8', name: 'Dark denim', category: 'Bottoms', photo: 'assets/dark_denim.jpg', condition: 'dirty', fit: 'perfect' },
    { id: 'item_9', name: 'Tan loafers', category: 'Shoes', photo: 'assets/tan_loafers.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_10', name: 'Leather watch', category: 'Accessories', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_11', name: 'Black trainers', category: 'Shoes', photo: 'assets/black_trainers.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_12', name: 'Brown sandals', category: 'Shoes', photo: 'assets/brown_sandals.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_13', name: 'Cream palazzo', category: 'Bottoms', photo: 'assets/cream_palazzo.jpg', condition: 'clean', fit: 'loose' },
    { id: 'item_14', name: 'Indigo kurti', category: 'Tops', photo: 'assets/indigo_kurti.jpg', condition: 'dirty', fit: 'perfect' },
    { id: 'item_15', name: 'Terracotta tee', category: 'Tops', photo: 'assets/terracotta_tee.jpg', condition: 'dirty', fit: 'tight' },
    { id: 'item_16', name: 'Tailored blazer', category: 'Tops', photo: 'assets/smart_blazer.jpg', condition: 'clean', fit: 'tight' },
    { id: 'item_17', name: 'Tailored taupe trousers', category: 'Bottoms', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
    { id: 'item_18', name: 'Minimalist court sneakers', category: 'Shoes', photo: 'assets/white_sneakers.jpg', condition: 'clean', fit: 'perfect' }
  ];

  // Pre-calculated AI Stylist Curations for "Need an outfit?" alternative cycling
  const STYLIST_OPTIONS = [
    {
      id: 'opt_1',
      title: 'Easy Everyday Contrast',
      caption: 'Breathable navy cotton paired with beige chinos for Chennai 29°C.',
      modelPhoto: 'assets/model_tryon_navy.jpg',
      flatLayPhoto: 'assets/minimal_style.jpg',
      top: { name: 'Navy shirt', photo: 'assets/navy_shirt.jpg' },
      bottom: { name: 'Beige chinos', photo: 'assets/beige_chinos.jpg' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' },
      rationale: 'Lightweight cotton prevents heat retention in Chennai humidity. High-contrast navy and beige create a timeless smart-casual balance. We avoided your dark denim because it is marked in laundry.'
    },
    {
      id: 'opt_2',
      title: 'Crisp Linen Tailored',
      caption: 'Clean monochrome tones ideal for indoor AC and meetings.',
      modelPhoto: 'assets/model_tryon_linen.jpg',
      flatLayPhoto: 'assets/office_ready.jpg',
      top: { name: 'White linen shirt', photo: 'assets/white_linen_shirt.jpg' },
      bottom: { name: 'Beige chinos', photo: 'assets/beige_chinos.jpg' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg' },
      rationale: 'Relaxed linen airflow tailored with structured beige trousers. Tan loafers pull the earthy palette together. All 3 pieces are 100% clean and ready.'
    },
    {
      id: 'opt_3',
      title: 'Relaxed Urban Minimal',
      caption: 'Comfortable street style with lightweight ease.',
      modelPhoto: 'assets/model_tryon_maroon.jpg',
      flatLayPhoto: 'assets/style_casual.jpg',
      top: { name: 'Maroon top', photo: 'assets/maroon_top.jpg' },
      bottom: { name: 'Dark skirt', photo: 'assets/dark_skirt.jpg' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' },
      rationale: 'Deep maroon tone paired with dark pleated skirt. White sneakers add casual athletic contrast for walking comfortably around the city.'
    },
    {
      id: 'opt_4',
      title: 'Refined Modern Heritage',
      caption: 'Elevated silhouette suitable for evening outings and celebrations.',
      modelPhoto: 'assets/model_tryon_kurta.jpg',
      flatLayPhoto: 'assets/traditional_kurta.jpg',
      top: { name: 'Cream kurta', photo: 'assets/olive_kurta.jpg' },
      bottom: { name: 'Cream palazzo', photo: 'assets/cream_palazzo.jpg' },
      footwear: { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg' },
      rationale: 'Breathable ethnic silhouette with contemporary relaxed drape. Perfect for celebrations, dinners, and evening gatherings.'
    }
  ];

  const rawState = {
    currentScreen: 'welcome',
    todayCanvasMode: 'model', // 'model' or 'flat'
    stylistViewMode: 'model', // 'model' or 'flat'
    currentLookIndex: 0,
    currentStylistOptionIndex: 0,
    stylistForm: {
      occasion: 'College',
      vibe: 'Relaxed',
      weather: 'Chennai 29°C'
    },
    builderSelection: {
      top: WARDROBE_ITEMS.find(i => i.id === 'item_1'),
      bottom: WARDROBE_ITEMS.find(i => i.id === 'item_2'),
      shoe: WARDROBE_ITEMS.find(i => i.id === 'item_4'),
      accessory: WARDROBE_ITEMS.find(i => i.id === 'item_10')
    },
    builderCurrentTab: 'Tops',
    activeEditingItemId: null,
    modalCondition: 'clean',
    modalFit: 'perfect',
    wardrobeActiveCategory: 'All',
    activeSwapSlot: 'footwear',
    selectedSwapChoice: {
      name: 'Brown loafers',
      photo: 'assets/tan_loafers.jpg'
    },
    savedBookmarks: new Set(['look_1', 'look_2', 'look_3']),
    currentPlan: 'free',
    selectedPlanPreference: null,
    pendingUpgradePlan: 'pro',
    isPremium: false,
    wearHistoryCount: 6
  };

  const state = new Proxy(rawState, {
    set(target, prop, value) {
      target[prop] = value;
      if (typeof window !== 'undefined' && window.woobiStore) {
        window.woobiStore.setState({ [prop]: value });
      }
      return true;
    }
  });

  // =========================================================================
  // 2. SCREEN ROUTER & NAVIGATION
  // =========================================================================
  function goToScreen(screenId) {
    state.currentScreen = screenId;
    if (typeof window !== 'undefined' && window.navigationRouter) {
      window.navigationRouter.currentScreen = screenId;
    }

    // Update screen selector dropdown if present
    const select = document.getElementById('screenSelect');
    if (select && select.value !== screenId) {
      select.value = screenId;
    }

    // Hide all phone screens
    document.querySelectorAll('.phone-screen').forEach(el => el.classList.remove('active'));

    // Show target screen
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // Specific screen entry triggers
    if (screenId === 'wardrobe') {
      renderWardrobeGrid();
      updateWardrobeCounts();
    } else if (screenId === 'ai-stylist') {
      resetStylistQuestionnaire();
      updateStylistWardrobeStats();
    } else if (screenId === 'custom-builder') {
      renderBuilderGrid();
      updateBuilderTray();
    } else if (screenId === 'today' || screenId === 'virtual-studio') {
      initVirtualStudio();
    } else if (screenId === 'weekly-planning') {
      renderWeeklyCalendar();
    } else if (screenId === 'premium') {
      updateSubscriptionUI();
    }

    // Update Bottom Nav active tab indicator if applicable
    updateBottomNav(screenId);

    // Scroll phone screen container to top
    const container = document.getElementById('phoneScreenContainer');
    if (container) container.scrollTop = 0;
  }

  function updateBottomNav(screenId) {
    const navMapping = {
      'today': 'today',
      'outfit-details': 'today',
      'swap-item': 'today',
      'outfit-ready': 'today',
      'preparing-outfits': 'today',
      'ai-stylist': 'today',
      'custom-builder': 'today',
      'photo-access': 'today',
      'not-enough-items': 'today',
      'outfit-feedback': 'today',
      'weekly-planning': 'today',
      'virtual-studio': 'today',

      'wardrobe': 'wardrobe',
      'review-item': 'wardrobe',
      'add-wardrobe': 'wardrobe',
      'empty-wardrobe': 'wardrobe',
      'upload-failed': 'wardrobe',
      'crop-photo': 'wardrobe',
      'edit-item': 'wardrobe',

      'saved': 'saved',
      'offline-mode': 'saved',

      'style-hint': 'hint',

      'premium': 'pro',
      'subscription': 'pro',
      'manage-subscription': 'pro',

      'profile': 'profile',
      'wear-history': 'profile',
      'reminders': 'profile',
      'account-privacy': 'profile',
      'help-support': 'profile',
      'delete-account': 'profile',
      'new-password': 'profile'
    };

    const targetTab = navMapping[screenId] || 'today';
    document.querySelectorAll('.phone-bottom-nav .nav-tab').forEach(btn => {
      const text = btn.textContent.toLowerCase();
      let isMatch = false;
      if (targetTab === 'pro') {
        isMatch = text.includes('pro') || text.includes('premium');
      } else if (targetTab === 'hint') {
        isMatch = text.includes('hint') || text.includes('style');
      } else {
        isMatch = text.includes(targetTab);
      }
      btn.classList.toggle('active', isMatch);
    });

    // Also update Seren floating pill bar tabs if on today screen
    const serenHint = document.getElementById('serenTabHint');
    const serenPro = document.getElementById('serenTabPro') || document.getElementById('serenTabPremium');
    if (serenHint) serenHint.classList.toggle('active', targetTab === 'hint');
    if (serenPro) serenPro.classList.toggle('active', targetTab === 'pro');
  }

  // =========================================================================
  // 3. DAILY OUTFIT CAROUSEL & PREVIEW TOGGLE
  // =========================================================================
  function setTodayCanvasMode(mode) {
    state.todayCanvasMode = mode;
    const btnModel = document.getElementById('btnViewModel');
    const btnFlat = document.getElementById('btnViewFlat');
    const viewMod = document.getElementById('todayModelView');
    const viewQuad = document.getElementById('todayCollageQuad');

    if (mode === 'model') {
      if (btnModel) btnModel.classList.add('active');
      if (btnFlat) btnFlat.classList.remove('active');
      if (viewMod) viewMod.classList.remove('hidden');
      if (viewQuad) viewQuad.classList.add('hidden');
    } else {
      if (btnModel) btnModel.classList.remove('active');
      if (btnFlat) btnFlat.classList.add('active');
      if (viewMod) viewMod.classList.add('hidden');
      if (viewQuad) viewQuad.classList.remove('hidden');
    }
  }

  function cycleLook(direction) {
    state.currentLookIndex = (state.currentLookIndex + direction + LOOKS_DATA.length) % LOOKS_DATA.length;
    renderCurrentLook();
  }

  function renderCurrentLook() {
    const look = LOOKS_DATA[state.currentLookIndex];
    if (!look) return;

    // Today screen elements
    const todayLookName = document.getElementById('todayLookName');
    const lookIndexLabel = document.getElementById('lookIndexLabel');
    if (todayLookName) todayLookName.textContent = look.title;
    if (lookIndexLabel) lookIndexLabel.textContent = `Look ${state.currentLookIndex + 1} of ${LOOKS_DATA.length}`;

    // Model View
    const todayModelImg = document.getElementById('todayModelImg');
    if (todayModelImg) todayModelImg.src = look.modelPhoto;

    // Flat Quad View
    const qTop = document.getElementById('quadImgTop');
    const qBot = document.getElementById('quadImgBot');
    const qShoe = document.getElementById('quadImgShoe');
    const qAcc = document.getElementById('quadImgAcc');
    if (qTop) qTop.src = look.top.photo;
    if (qBot) qBot.src = look.bottom.photo;
    if (qShoe) qShoe.src = look.footwear.photo;
    if (qAcc) qAcc.src = look.accessory.photo;

    // Carousel dots
    const dots = document.querySelectorAll('#carouselDots .dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === state.currentLookIndex);
    });

    // Outfit details screen sync
    const detTitle = document.getElementById('detailsOutfitTitle');
    const detCaption = document.getElementById('detailsCaptionText');
    if (detTitle) detTitle.textContent = look.title;
    if (detCaption) detCaption.textContent = look.caption;

    const dTop = document.getElementById('detImgTop');
    const dBot = document.getElementById('detImgBot');
    const dShoe = document.getElementById('detImgShoe');
    const dAcc = document.getElementById('detImgAcc');
    if (dTop) dTop.src = look.top.photo;
    if (dBot) dBot.src = look.bottom.photo;
    if (dShoe) dShoe.src = look.footwear.photo;
    if (dAcc) dAcc.src = look.accessory.photo;

    const rowTop = document.getElementById('rowThumbTop');
    const rowNameTop = document.getElementById('rowNameTop');
    const rowBot = document.getElementById('rowThumbBot');
    const rowNameBot = document.getElementById('rowNameBot');
    const rowShoe = document.getElementById('rowThumbShoe');
    const rowNameShoe = document.getElementById('rowNameShoe');

    if (rowTop) rowTop.src = look.top.photo;
    if (rowNameTop) rowNameTop.textContent = look.top.name;
    if (rowBot) rowBot.src = look.bottom.photo;
    if (rowNameBot) rowNameBot.textContent = look.bottom.name;
    if (rowShoe) rowShoe.src = look.footwear.photo;
    if (rowNameShoe) rowNameShoe.textContent = look.footwear.name;

    // Outfit ready screen sync
    const rTop = document.getElementById('readyImgTop');
    const rBot = document.getElementById('readyImgBot');
    const rShoe = document.getElementById('readyImgShoe');
    const rAcc = document.getElementById('readyImgAcc');
    if (rTop) rTop.src = look.top.photo;
    if (rBot) rBot.src = look.bottom.photo;
    if (rShoe) rShoe.src = look.footwear.photo;
    if (rAcc) rAcc.src = look.accessory.photo;

    // Daily Drawer Recommendation Card Mount
    const mount = document.getElementById('todayOutfitCardMount');
    if (mount) {
      mount.innerHTML = `
        <div class="rec-outfit-preview-card">
          <div class="rec-card-top-row">
            <span class="rec-look-title">${look.title}</span>
            <span class="rec-look-tag">Look ${state.currentLookIndex + 1} of ${LOOKS_DATA.length}</span>
          </div>
          <p class="rec-look-caption">${look.caption}</p>
          <div class="outfit-board-card" style="margin-bottom: 12px;">
            <div class="quad-item top-left"><img src="${look.top.photo}" alt="${look.top.name}"></div>
            <div class="quad-item top-right"><img src="${look.bottom.photo}" alt="${look.bottom.name}"></div>
            <div class="quad-item bot-left"><img src="${look.footwear.photo}" alt="${look.footwear.name}"></div>
            <div class="quad-item bot-right"><img src="${look.accessory.photo}" alt="${look.accessory.name}"></div>
          </div>
          <div class="rec-card-actions">
            <button class="btn-camera-upload" onclick="app.triggerOutfitPhotoUpload()" title="Upload outfit photo to increase streak">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>Upload Today's Outfit (+1 🔥)</span>
            </button>
            <button class="btn-outline-white" onclick="app.goToScreen('outfit-details'); app.serenToggleDailyLooks(false);">
              View Look Details & Swap Pieces
            </button>
          </div>
        </div>
      `;
    }
  }

  function setTodayOccasion(occ, btn) {
    document.querySelectorAll('#todayOccasionGroup .pill-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (occ === 'Office') {
      state.currentLookIndex = 1;
    } else if (occ === 'Casual') {
      state.currentLookIndex = 2;
    } else {
      state.currentLookIndex = 0;
    }
    renderCurrentLook();
    showToast(`Styling looks for ${occ} in Chennai`);
  }

  // =========================================================================
  // 4. AI STYLIST FLOW ("NEED AN OUTFIT?" WITH ALTERNATIVE CYCLE)
  // =========================================================================
  function selectStylistOption(field, value, btn) {
    state.stylistForm[field] = value;
    const parent = btn.parentElement;
    if (parent) {
      parent.querySelectorAll('.pill-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }

  function updateStylistWardrobeStats() {
    const cleanItems = WARDROBE_ITEMS.filter(i => i.condition === 'clean');
    const dirtyItems = WARDROBE_ITEMS.filter(i => i.condition === 'dirty');

    const cleanEl = document.getElementById('stylistCleanCount');
    const dirtyEl = document.getElementById('stylistDirtyCount');
    if (cleanEl) cleanEl.textContent = cleanItems.length;
    if (dirtyEl) dirtyEl.textContent = dirtyItems.length;
  }

  function resetStylistQuestionnaire() {
    const qView = document.getElementById('stylistQuestionnaireView');
    const aView = document.getElementById('stylistAnalyzingView');
    const rView = document.getElementById('stylistResultView');

    if (qView) qView.classList.remove('hidden');
    if (aView) aView.classList.add('hidden');
    if (rView) rView.classList.add('hidden');
    state.currentStylistOptionIndex = 0;
  }

  function updateAIStep(stepNum, status) {
    const el = document.getElementById(`aiStep${stepNum}`);
    if (!el) return;
    el.classList.remove('pending', 'current', 'completed');
    el.classList.add(status);
    const bullet = el.querySelector('.step-bullet');
    if (bullet) {
      bullet.textContent = (status === 'completed') ? '✓' : stepNum;
    }
  }

  function setAIProgress(percent) {
    const bar = document.getElementById('aiProgressBar');
    if (bar) bar.style.width = `${percent}%`;
  }

  function synthesizeAIOutfit(isRegen = false) {
    const occasion = state.stylistForm.occasion || 'College';
    const vibe = state.stylistForm.vibe || 'Relaxed';
    const weather = state.stylistForm.weather || 'Chennai 29°C';

    const qView = document.getElementById('stylistQuestionnaireView');
    const aView = document.getElementById('stylistAnalyzingView');
    const rView = document.getElementById('stylistResultView');

    if (qView) qView.classList.add('hidden');
    if (rView) rView.classList.add('hidden');
    if (aView) aView.classList.remove('hidden');

    const occasionTag = document.getElementById('aiPromptOccasionTag');
    if (occasionTag) occasionTag.textContent = occasion;

    // Reset stages to Step 1 active
    setAIProgress(22);
    updateAIStep(1, 'current');
    updateAIStep(2, 'pending');
    updateAIStep(3, 'pending');
    updateAIStep(4, 'pending');

    // Filter clean wardrobe items
    const cleanTops = WARDROBE_ITEMS.filter(i => i.category === 'Tops' && i.condition === 'clean');
    const cleanBottoms = WARDROBE_ITEMS.filter(i => i.category === 'Bottoms' && i.condition === 'clean');
    const cleanShoes = WARDROBE_ITEMS.filter(i => i.category === 'Shoes' && i.condition === 'clean');

    // Select pieces tailored to occasion & vibe
    let top, bottom, footwear, localFallback, flatLay;

    if (occasion === 'Office' || vibe === 'Sharp') {
      top = cleanTops.find(i => i.name.includes('linen') || i.name.includes('blazer')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('chinos') || i.name.includes('trousers')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('loafers')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_linen.jpg';
      flatLay = 'assets/office_ready.jpg';
    } else if (occasion === 'Festive') {
      top = cleanTops.find(i => i.name.includes('kurta') || i.name.includes('kurti')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('palazzo') || i.name.includes('chinos')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('loafers') || i.name.includes('sandals')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_kurta.jpg';
      flatLay = 'assets/traditional_kurta.jpg';
    } else if (occasion === 'Date' || vibe === 'Minimal') {
      top = cleanTops.find(i => i.name.includes('Maroon') || i.name.includes('Navy')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('skirt') || i.name.includes('chinos')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('sneakers') || i.name.includes('loafers')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_maroon.jpg';
      flatLay = 'assets/style_casual.jpg';
    } else {
      // College or Casual
      top = cleanTops.find(i => i.name.includes('Navy') || i.name.includes('tee')) || cleanTops[0];
      bottom = cleanBottoms.find(i => i.name.includes('chinos') || i.name.includes('denim')) || cleanBottoms[0];
      footwear = cleanShoes.find(i => i.name.includes('sneakers') || i.name.includes('trainers')) || cleanShoes[0];
      localFallback = 'assets/model_tryon_navy.jpg';
      flatLay = 'assets/minimal_style.jpg';
    }

    // Dynamic Generative AI Prompt & unique seed
    const seed = Math.floor(Math.random() * 899999) + 100000;
    const aiPrompt = `Full-length head-to-toe editorial fashion photograph of an attractive Indian model standing in a modern architectural aesthetic setting for ${occasion}. Wearing ${top.name}, ${bottom.name}, and ${footwear.name} clearly visible on feet touching floor. Full body head down to shoes visible, natural soft editorial lighting, 8k resolution, elegant lookbook styling.`;
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=768&height=1024&nologo=true&seed=${seed}&model=flux`;

    // Preload image in background
    let finalModelUrl = aiImageUrl;
    const preloadImg = new Image();
    preloadImg.onload = () => {
      finalModelUrl = aiImageUrl;
    };
    preloadImg.onerror = () => {
      finalModelUrl = localFallback;
    };
    preloadImg.src = aiImageUrl;

    // Timeline Animation Stages
    setTimeout(() => {
      updateAIStep(1, 'completed');
      updateAIStep(2, 'current');
      setAIProgress(48);
    }, 600);

    setTimeout(() => {
      updateAIStep(2, 'completed');
      updateAIStep(3, 'current');
      setAIProgress(74);
    }, 1300);

    setTimeout(() => {
      updateAIStep(3, 'completed');
      updateAIStep(4, 'current');
      setAIProgress(94);
    }, 2000);

    setTimeout(() => {
      updateAIStep(4, 'completed');
      setAIProgress(100);

      // Create new AI Curation object
      const aiCuration = {
        id: `ai_gen_${Date.now()}`,
        isAIGenerated: true,
        title: `${vibe} ${occasion} Contrast`,
        caption: `Algorithmically styled for ${occasion} in ${weather}`,
        modelPhoto: finalModelUrl,
        flatLayPhoto: flatLay,
        top: { name: top.name, photo: top.photo },
        bottom: { name: bottom.name, photo: bottom.photo },
        footwear: { name: footwear.name, photo: footwear.photo },
        rationale: `Neural Stylist harmonized your clean ${top.name} with ${bottom.name} and ${footwear.name} for ${weather} humidity control. Color contrast optimized for a ${vibe.toLowerCase()} silhouette.`
      };

      // Set as the primary option
      STYLIST_OPTIONS[0] = aiCuration;
      state.currentStylistOptionIndex = 0;

      if (aView) aView.classList.add('hidden');
      if (rView) rView.classList.remove('hidden');

      renderStylistOption(0);
      showToast(isRegen ? '⚡ AI synthesized a fresh variation!' : '✨ AI synthesized your full-body look on model!');
    }, 2600);
  }

  function generateStylistOutfit() {
    synthesizeAIOutfit(false);
  }

  function regenerateAIOutfit() {
    synthesizeAIOutfit(true);
  }

  function cycleStylistOption() {
    // Advances to next look in circular fashion
    state.currentStylistOptionIndex = (state.currentStylistOptionIndex + 1) % STYLIST_OPTIONS.length;
    renderStylistOption(state.currentStylistOptionIndex);
    showToast(`Loaded Alternative Look ${state.currentStylistOptionIndex + 1} of ${STYLIST_OPTIONS.length}`);
  }

  function setStylistViewMode(mode) {
    state.stylistViewMode = mode;
    const btnM = document.getElementById('stylistBtnModel');
    const btnF = document.getElementById('stylistBtnFlat');
    if (btnM) btnM.classList.toggle('active', mode === 'model');
    if (btnF) btnF.classList.toggle('active', mode === 'flat');
    renderStylistOption(state.currentStylistOptionIndex);
  }

  function renderStylistOption(index) {
    const opt = STYLIST_OPTIONS[index];
    if (!opt) return;

    const titleEl = document.getElementById('stylistLookTitle');
    const capEl = document.getElementById('stylistLookCaption');
    const modelEl = document.getElementById('stylistResultModelImg');
    const tagEl = document.getElementById('stylistModelTagText');
    const aiBadge = document.getElementById('stylistAiBadge');

    if (titleEl) titleEl.textContent = opt.title;
    if (capEl) capEl.textContent = opt.caption;

    if (aiBadge) {
      if (opt.isAIGenerated) {
        aiBadge.style.display = 'inline-block';
        aiBadge.textContent = '🤖 Real-time AI Generated';
      } else {
        aiBadge.style.display = 'inline-block';
        aiBadge.textContent = '✨ Curated Classic';
      }
    }

    if (modelEl) {
      if (state.stylistViewMode === 'flat' && opt.flatLayPhoto) {
        modelEl.src = opt.flatLayPhoto;
        if (tagEl) tagEl.innerHTML = '<span>👔</span> Studio Flat-Lay';
      } else {
        modelEl.src = opt.modelPhoto;
        if (tagEl) tagEl.innerHTML = opt.isAIGenerated ? '<span>✨</span> AI Generated Look' : '<span>👤</span> Styled on model (Full Look)';
      }
    }

    const tTop = document.getElementById('stylistThumbTop');
    const nTop = document.getElementById('stylistNameTop');
    const tBot = document.getElementById('stylistThumbBot');
    const nBot = document.getElementById('stylistNameBot');
    const tShoe = document.getElementById('stylistThumbShoe');
    const nShoe = document.getElementById('stylistNameShoe');

    if (tTop) tTop.src = opt.top.photo;
    if (nTop) nTop.textContent = opt.top.name;
    if (tBot) tBot.src = opt.bottom.photo;
    if (nBot) nBot.textContent = opt.bottom.name;
    if (tShoe) tShoe.src = opt.footwear.photo;
    if (nShoe) nShoe.textContent = opt.footwear.name;

    const ratEl = document.getElementById('stylistRationaleText');
    if (ratEl) ratEl.textContent = opt.rationale;

    const hintEl = document.getElementById('stylistOptionHint');
    if (hintEl) hintEl.textContent = `Showing Option ${index + 1} of ${STYLIST_OPTIONS.length} · Tap to cycle alternatives`;
  }

  function confirmStylistOutfit() {
    const opt = STYLIST_OPTIONS[state.currentStylistOptionIndex];
    if (opt) {
      // Sync to Ready Screen
      const rTop = document.getElementById('readyImgTop');
      const rBot = document.getElementById('readyImgBot');
      const rShoe = document.getElementById('readyImgShoe');
      if (rTop) rTop.src = opt.top.photo;
      if (rBot) rBot.src = opt.bottom.photo;
      if (rShoe) rShoe.src = opt.footwear.photo;
    }
    showToast('✓ Outfit selected! Marked as planned for today.');
    goToScreen('outfit-ready');
  }

  // =========================================================================
  // 5. CUSTOM OUTFIT BUILDER ("MAKE YOUR OWN OUTFIT")
  // =========================================================================
  function setBuilderTab(tabName, btn) {
    state.builderCurrentTab = tabName;
    if (btn) {
      const parent = btn.parentElement;
      if (parent) {
        parent.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    }
    renderBuilderGrid();
  }

  function renderBuilderGrid() {
    const container = document.getElementById('builderItemsGrid');
    if (!container) return;

    const items = WARDROBE_ITEMS.filter(item => {
      if (state.builderCurrentTab === 'Tops') return item.category === 'Tops';
      if (state.builderCurrentTab === 'Bottoms') return item.category === 'Bottoms';
      if (state.builderCurrentTab === 'Shoes') return item.category === 'Shoes';
      if (state.builderCurrentTab === 'Accessories') return item.category === 'Accessories';
      return true;
    });

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      const isSelected = isItemSelectedInBuilder(item);
      const isDirty = item.condition === 'dirty';

      card.className = `builder-item-card ${isSelected ? 'selected' : ''} ${isDirty ? 'dirty' : ''}`;
      card.onclick = () => selectBuilderItem(item);

      const statusBadge = isDirty
        ? '<span class="badge-status dirty">🧺 In Laundry</span>'
        : '<span class="badge-status clean">✨ Clean</span>';

      const fitBadge = item.fit === 'tight'
        ? '<span class="badge-fit tight">Small</span>'
        : item.fit === 'loose'
          ? '<span class="badge-fit loose">Loose</span>'
          : '<span class="badge-fit">Fit</span>';

      card.innerHTML = `
        <div class="builder-item-thumb">
          <img src="${item.photo}" alt="${item.name}">
        </div>
        <div class="builder-item-name">${item.name}</div>
        <div class="builder-item-badge-row">
          ${statusBadge}
          ${fitBadge}
        </div>
      `;
      container.appendChild(card);
    });
  }

  function isItemSelectedInBuilder(item) {
    if (item.category === 'Tops' && state.builderSelection.top?.id === item.id) return true;
    if (item.category === 'Bottoms' && state.builderSelection.bottom?.id === item.id) return true;
    if (item.category === 'Shoes' && state.builderSelection.shoe?.id === item.id) return true;
    if (item.category === 'Accessories' && state.builderSelection.accessory?.id === item.id) return true;
    return false;
  }

  function selectBuilderItem(item) {
    if (item.category === 'Tops') state.builderSelection.top = item;
    if (item.category === 'Bottoms') state.builderSelection.bottom = item;
    if (item.category === 'Shoes') state.builderSelection.shoe = item;
    if (item.category === 'Accessories') state.builderSelection.accessory = item;

    if (item.condition === 'dirty') {
      showToast(`⚠️ Note: ${item.name} is in laundry, but we will still preview it!`);
    } else {
      showToast(`Added ${item.name} to look`);
    }

    renderBuilderGrid();
    updateBuilderTray();
  }

  function updateBuilderTray() {
    const tTop = document.getElementById('trayThumbTop');
    const lTop = document.getElementById('trayLabelTop');
    const tBot = document.getElementById('trayThumbBot');
    const lBot = document.getElementById('trayLabelBot');
    const tShoe = document.getElementById('trayThumbShoe');
    const lShoe = document.getElementById('trayLabelShoe');

    if (state.builderSelection.top) {
      if (tTop) tTop.src = state.builderSelection.top.photo;
      if (lTop) lTop.textContent = state.builderSelection.top.name;
    }
    if (state.builderSelection.bottom) {
      if (tBot) tBot.src = state.builderSelection.bottom.photo;
      if (lBot) lBot.textContent = state.builderSelection.bottom.name;
    }
    if (state.builderSelection.shoe) {
      if (tShoe) tShoe.src = state.builderSelection.shoe.photo;
      if (lShoe) lShoe.textContent = state.builderSelection.shoe.name;
    }
  }

  function resetBuilderSelections() {
    state.builderSelection = {
      top: WARDROBE_ITEMS[0],
      bottom: WARDROBE_ITEMS[1],
      shoe: WARDROBE_ITEMS[3],
      accessory: WARDROBE_ITEMS[9]
    };
    renderBuilderGrid();
    updateBuilderTray();
    showToast('Reset curated selections');
  }

  function previewCustomOutfitOnModel() {
    const selView = document.getElementById('builderSelectionView');
    const preView = document.getElementById('builderModelPreviewView');

    if (selView) selView.classList.add('hidden');
    if (preView) preView.classList.remove('hidden');

    // Dynamic model tryon mapping based on selections
    const modelImg = document.getElementById('builderPreviewModelImg');
    const topId = state.builderSelection.top?.id;
    if (modelImg) {
      if (topId === 'item_1') {
        modelImg.src = 'assets/model_tryon_navy.jpg'; // Navy shirt look
      } else if (topId === 'item_7') {
        modelImg.src = 'assets/model_tryon_linen.jpg'; // White linen look
      } else if (topId === 'item_3') {
        modelImg.src = 'assets/model_tryon_kurta.jpg'; // Kurta look
      } else if (topId === 'item_5') {
        modelImg.src = 'assets/model_tryon_maroon.jpg'; // Maroon look
      } else {
        modelImg.src = 'assets/model_tryon_navy.jpg';
      }
    }

    const cTop = document.getElementById('customThumbTop');
    const nTop = document.getElementById('customNameTop');
    const cBot = document.getElementById('customThumbBot');
    const nBot = document.getElementById('customNameBot');
    const cShoe = document.getElementById('customThumbShoe');
    const nShoe = document.getElementById('customNameShoe');

    if (cTop && state.builderSelection.top) cTop.src = state.builderSelection.top.photo;
    if (nTop && state.builderSelection.top) nTop.textContent = state.builderSelection.top.name;
    if (cBot && state.builderSelection.bottom) cBot.src = state.builderSelection.bottom.photo;
    if (nBot && state.builderSelection.bottom) nBot.textContent = state.builderSelection.bottom.name;
    if (cShoe && state.builderSelection.shoe) cShoe.src = state.builderSelection.shoe.photo;
    if (nShoe && state.builderSelection.shoe) nShoe.textContent = state.builderSelection.shoe.name;

    showToast('✨ Rendered custom outfit on model');
  }

  function backToBuilderSelection() {
    const selView = document.getElementById('builderSelectionView');
    const preView = document.getElementById('builderModelPreviewView');
    if (selView) selView.classList.remove('hidden');
    if (preView) preView.classList.add('hidden');
  }

  function confirmCustomOutfit() {
    const rTop = document.getElementById('readyImgTop');
    const rBot = document.getElementById('readyImgBot');
    const rShoe = document.getElementById('readyImgShoe');
    if (rTop && state.builderSelection.top) rTop.src = state.builderSelection.top.photo;
    if (rBot && state.builderSelection.bottom) rBot.src = state.builderSelection.bottom.photo;
    if (rShoe && state.builderSelection.shoe) rShoe.src = state.builderSelection.shoe.photo;

    showToast('✓ Custom outfit ready to wear!');
    goToScreen('outfit-ready');
  }

  // =========================================================================
  // 6. WARDROBE GRID & CONDITION (CLEAN / DIRTY / FIT) MANAGEMENT
  // =========================================================================
  function createWardrobeItemBox(item) {
    const box = document.createElement('div');
    box.className = 'wardrobe-item-box';

    const isClean = item.condition === 'clean';
    const statusBadge = isClean
      ? `<span class="badge-status clean" onclick="event.stopPropagation(); app.toggleItemCondition('${item.id}')" title="Tap to mark in laundry">✨ Clean</span>`
      : `<span class="badge-status dirty" onclick="event.stopPropagation(); app.toggleItemCondition('${item.id}')" title="Tap to mark clean">🧺 In Laundry</span>`;

    const fitBadge = item.fit === 'tight'
      ? `<span class="badge-fit tight">Tight</span>`
      : item.fit === 'loose'
        ? `<span class="badge-fit loose">Loose</span>`
        : `<span class="badge-fit">Perfect fit</span>`;

    box.innerHTML = `
      <div class="w-img-wrap" onclick="app.openConditionModal('${item.id}')">
        <img src="${item.photo}" alt="${item.name}" loading="lazy">
      </div>
      <div class="w-meta" onclick="app.openConditionModal('${item.id}')">
        <div class="w-name">${item.name}</div>
        <div class="w-sub" style="display:flex; gap:4px; margin-top:4px; flex-wrap:wrap;">
          ${statusBadge}
          ${fitBadge}
        </div>
      </div>
      <button class="w-dots" onclick="event.stopPropagation(); app.openConditionModal('${item.id}')">⋮</button>
    `;
    return box;
  }

  function renderWardrobeGrid(category = state.wardrobeActiveCategory, query = '') {
    const container = document.getElementById('wardrobeCardsGrid');
    if (!container) return;

    let items = WARDROBE_ITEMS.slice();

    // Condition filter
    if (category === 'Clean') {
      items = items.filter(i => i.condition === 'clean');
    } else if (category === 'Laundry') {
      items = items.filter(i => i.condition === 'dirty');
    }

    // Search query filter
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    const catNormalized = (category || 'all').toLowerCase();
    const isSingleCategory = catNormalized !== 'all' && catNormalized !== 'clean' && catNormalized !== 'laundry';

    // Partition items into balanced clothing categories
    const isShirt = i => {
      const c = (i.category || '').toLowerCase();
      return c === 'tops' || c === 'shirts' || c === 'shirt';
    };
    const isTrouser = i => {
      const c = (i.category || '').toLowerCase();
      return c === 'bottoms' || c === 'trousers' || c === 'trouser' || c === 'pants' || c === 'pant';
    };
    const isFootwear = i => {
      const c = (i.category || '').toLowerCase();
      return c === 'shoes' || c === 'footwear' || c === 'shoe';
    };
    const isAccessory = i => {
      const c = (i.category || '').toLowerCase();
      return c === 'accessories' || c === 'accessory';
    };

    const shirtsItems = items.filter(isShirt);
    const trousersItems = items.filter(isTrouser);
    const footwearItems = items.filter(isFootwear);
    const accessoriesItems = items.filter(isAccessory);

    container.innerHTML = '';
    container.className = 'wardrobe-sections-wrapper';

    function buildSection(id, icon, title, secItems) {
      if (secItems.length === 0) return null;
      const sec = document.createElement('section');
      sec.className = 'wardrobe-category-section';
      sec.id = id;

      const header = document.createElement('div');
      header.className = 'wardrobe-category-header';
      header.innerHTML = `
        <div class="wardrobe-category-title">
          <span class="cat-icon">${icon}</span>
          <span>${title}</span>
        </div>
        <span class="wardrobe-category-count">${secItems.length} item${secItems.length === 1 ? '' : 's'}</span>
      `;
      sec.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'wardrobe-2col-grid wardrobe-section-grid';
      secItems.forEach(item => grid.appendChild(createWardrobeItemBox(item)));
      sec.appendChild(grid);

      return sec;
    }

    let renderedAny = false;

    // 1. Dedicated Shirts Section
    if (!isSingleCategory || catNormalized === 'shirts' || catNormalized === 'tops') {
      const sec = buildSection('wardrobeSecShirts', '👕', 'Shirts', shirtsItems);
      if (sec) { container.appendChild(sec); renderedAny = true; }
    }

    // 2. Dedicated Trousers Section (directly below Shirts)
    if (!isSingleCategory || catNormalized === 'trousers' || catNormalized === 'bottoms' || catNormalized === 'pants') {
      const sec = buildSection('wardrobeSecTrousers', '👖', 'Trousers', trousersItems);
      if (sec) { container.appendChild(sec); renderedAny = true; }
    }

    // 3. Dedicated Footwear Section (directly below Trousers)
    if (!isSingleCategory || catNormalized === 'footwear' || catNormalized === 'shoes') {
      const sec = buildSection('wardrobeSecFootwear', '👟', 'Footwear', footwearItems);
      if (sec) { container.appendChild(sec); renderedAny = true; }
    }

    // 4. Dedicated Accessories Section (below Footwear)
    if (!isSingleCategory || catNormalized === 'accessories') {
      const sec = buildSection('wardrobeSecAccessories', '👜', 'Accessories', accessoriesItems);
      if (sec) { container.appendChild(sec); renderedAny = true; }
    }

    // Empty state fallback when no items match
    if (!renderedAny) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'wardrobe-empty-state';
      emptyBox.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 8px;">🧺</div>
        <strong>No clothing items found</strong>
        <p>${query ? `No items matching "${query}" in this view.` : 'No items found in this category.'}</p>
        ${query ? `<button class="btn-olive-primary" style="margin-top:12px; padding:6px 14px; font-size:0.8rem; border-radius:999px;" onclick="document.getElementById('wardrobeSearchInput').value=''; app.filterWardrobeGrid();">Clear search</button>` : ''}
      `;
      container.appendChild(emptyBox);
    }

    updateWardrobeCounts();
  }

  function filterWardrobeCategory(cat, btn) {
    state.wardrobeActiveCategory = cat;
    if (btn) {
      document.querySelectorAll('#wardrobeCatFilter .cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    const searchInput = document.getElementById('wardrobeSearchInput');
    const query = searchInput ? searchInput.value : '';
    renderWardrobeGrid(cat, query);
  }

  function filterWardrobeGrid() {
    const searchInput = document.getElementById('wardrobeSearchInput');
    const query = searchInput ? searchInput.value : '';
    renderWardrobeGrid(state.wardrobeActiveCategory, query);
  }

  function updateWardrobeCounts() {
    const cleanCount = WARDROBE_ITEMS.filter(i => i.condition === 'clean').length;
    const dirtyCount = WARDROBE_ITEMS.filter(i => i.condition === 'dirty').length;

    const countLabel = document.getElementById('wardrobeCountLabel');
    if (countLabel) countLabel.textContent = `${WARDROBE_ITEMS.length} items`;

    const cleanEl = document.getElementById('wardrobeCleanCount');
    const dirtyEl = document.getElementById('wardrobeLaundryCount');
    if (cleanEl) cleanEl.textContent = cleanCount;
    if (dirtyEl) dirtyEl.textContent = dirtyCount;
  }

  function toggleItemCondition(itemId) {
    const item = WARDROBE_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (item.condition === 'clean') {
      item.condition = 'dirty';
      showToast(`🧺 Marked "${item.name}" as in laundry (excluded from outfits)`);
    } else {
      item.condition = 'clean';
      showToast(`✨ Marked "${item.name}" as clean & ready to style!`);
    }

    renderWardrobeGrid();
    updateStylistWardrobeStats();
  }

  function openConditionModal(itemId) {
    const item = WARDROBE_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    state.activeEditingItemId = itemId;
    state.modalCondition = item.condition;
    state.modalFit = item.fit;

    const modal = document.getElementById('itemConditionModal');
    const imgEl = document.getElementById('modalItemImg');
    const titleEl = document.getElementById('modalItemTitle');
    const catEl = document.getElementById('modalItemCat');

    if (imgEl) imgEl.src = item.photo;
    if (titleEl) titleEl.textContent = item.name;
    if (catEl) catEl.textContent = `${item.category} · ${item.fit.toUpperCase()}`;

    // Update active pills
    selectModalCondition(item.condition);
    selectModalFit(item.fit);

    if (modal) modal.classList.remove('hidden');
  }

  function closeConditionModal() {
    const modal = document.getElementById('itemConditionModal');
    if (modal) modal.classList.add('hidden');
    state.activeEditingItemId = null;
  }

  function selectModalCondition(cond) {
    state.modalCondition = cond;
    const btnClean = document.getElementById('btnCondClean');
    const btnDirty = document.getElementById('btnCondDirty');

    if (btnClean && btnDirty) {
      btnClean.classList.toggle('active', cond === 'clean');
      btnDirty.classList.toggle('active', cond === 'dirty');
    }
  }

  function selectModalFit(fit) {
    state.modalFit = fit;
    const btnTight = document.getElementById('btnFitTight');
    const btnPerfect = document.getElementById('btnFitPerfect');
    const btnLoose = document.getElementById('btnFitLoose');

    if (btnTight && btnPerfect && btnLoose) {
      btnTight.classList.toggle('active', fit === 'tight');
      btnPerfect.classList.toggle('active', fit === 'perfect');
      btnLoose.classList.toggle('active', fit === 'loose');
    }
  }

  function saveModalConditionChanges() {
    if (!state.activeEditingItemId) return;
    const item = WARDROBE_ITEMS.find(i => i.id === state.activeEditingItemId);
    if (item) {
      item.condition = state.modalCondition;
      item.fit = state.modalFit;
      showToast(`Updated "${item.name}": ${item.condition === 'clean' ? '✨ Clean' : '🧺 In Laundry'}, ${item.fit} fit`);
    }
    closeConditionModal();
    renderWardrobeGrid();
    updateStylistWardrobeStats();
  }

  // =========================================================================
  // 7. SWAP AN ITEM INTERACTION
  // =========================================================================
  function openSwapScreen(slot) {
    state.activeSwapSlot = slot;
    const title = document.getElementById('swapHeaderTitle');
    if (title) {
      if (slot === 'top') title.textContent = 'Choose a different top';
      else if (slot === 'bottom') title.textContent = 'Choose different trousers';
      else title.textContent = 'Choose different shoes';
    }
    goToScreen('swap-item');
  }

  function selectSwapOption(id, name, photo, cardEl) {
    document.querySelectorAll('#swapGrid .swap-card').forEach(c => {
      c.classList.remove('selected');
      const chk = c.querySelector('.choice-checkbox');
      if (chk) chk.classList.remove('checked');
    });
    cardEl.classList.add('selected');
    const chk = cardEl.querySelector('.choice-checkbox');
    if (chk) chk.classList.add('checked');

    state.selectedSwapChoice = { id, name, photo };
  }

  function confirmSwap() {
    const slot = state.activeSwapSlot;
    const choice = state.selectedSwapChoice;

    if (slot === 'footwear') {
      const qShoe = document.getElementById('quadImgShoe');
      const detShoe = document.getElementById('detImgShoe');
      const rowShoe = document.getElementById('rowThumbShoe');
      const rowName = document.getElementById('rowNameShoe');

      if (qShoe) qShoe.src = choice.photo;
      if (detShoe) detShoe.src = choice.photo;
      if (rowShoe) rowShoe.src = choice.photo;
      if (rowName) rowName.textContent = choice.name;
    }
    showToast(`Swapped ${slot} to ${choice.name}`);
    goToScreen('outfit-details');
  }

  // =========================================================================
  // 8. OUTFIT DECISION ACTIONS (MARK AS WORN / SAVE FOR LATER)
  // =========================================================================
  function markAsWorn() {
    state.wearHistoryCount++;
    showToast('✓ Great choice! Added to your wear history.');
    setTimeout(() => goToScreen('outfit-ready'), 600);
  }

  function saveForLater() {
    showToast('🔖 Saved outfit for your next occasion.');
    goToScreen('saved');
  }

  function toggleBookmarkCurrent() {
    const look = LOOKS_DATA[state.currentLookIndex];
    if (!look) return;
    if (state.savedBookmarks.has(look.id)) {
      state.savedBookmarks.delete(look.id);
      showToast('Removed outfit from saved looks');
    } else {
      state.savedBookmarks.add(look.id);
      showToast('🔖 Saved outfit to your collection');
    }
  }

  function toggleStyleChoice(cardEl) {
    cardEl.classList.toggle('selected');
    const check = cardEl.querySelector('.style-choice-checkbox');
    if (check) check.classList.toggle('checked');
  }

  function simulateUpload() {
    showToast('Analyzing your garment photo...');
    setTimeout(() => {
      goToScreen('review-item');
    }, 1200);
  }

  function saveReviewedItem() {
    showToast('✓ Navy shirt added to your wardrobe!');
    setTimeout(() => {
      goToScreen('today');
    }, 800);
  }

  // =========================================================================
  // 9. PROFILE, SETTINGS & UTILITIES (PHASE 6 MODULAR SETTINGS SUITE)
  // =========================================================================
  let _settingsManagerInstance = null;
  function getSettingsManager() {
    if (_settingsManagerInstance) return _settingsManagerInstance;
    if (typeof window !== 'undefined' && window.WoobiSettings && typeof window.WoobiSettings.createSettings === 'function') {
      const store = (typeof window !== 'undefined' && window.woobiStore) ? window.woobiStore : null;
      const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
      _settingsManagerInstance = window.WoobiSettings.createSettings(store, studio);
      window.woobiSettings = _settingsManagerInstance;
      return _settingsManagerInstance;
    }
    return null;
  }

  function selectPlan(planType) {
    state.currentPlan = planType;
    document.querySelectorAll('.pricing-option-card').forEach(card => card.classList.remove('selected'));
    const target = planType === 'annual' ? document.getElementById('planAnnual') : document.getElementById('planMonthly');
    if (target) target.classList.add('selected');
    const sm = getSettingsManager();
    if (sm && sm.account) {
      sm.account.updateSubscription(planType, state.isPremium);
    }
  }

  function activatePremium() {
    state.isPremium = true;
    showToast('🎉 Welcome to Woobi Premium! All features unlocked.');
    const sm = getSettingsManager();
    if (sm && sm.account) {
      sm.account.updateSubscription(state.currentPlan, true);
    }
    setTimeout(() => goToScreen('today'), 800);
  }

  // =========================================================================
  // WOOBI PREMIUM SUBSCRIPTION & STYLE HINT ORCHESTRATION
  // =========================================================================
  function openStyleHint() {
    if (state.currentScreen !== 'today') {
      goToScreen('today');
    }
    serenOpenStylingReview();
  }

  function selectSubscriptionPlan(planId) {
    if (planId === 'free') {
      showToast('You are currently on the Free Forever plan.');
      return;
    }
    openUpgradeConfirmation(planId);
  }

  function openUpgradeConfirmation(planId) {
    state.pendingUpgradePlan = planId;
    const modal = document.getElementById('subUpgradeModal');
    if (!modal) return;

    const titleEl = document.getElementById('subModalTitle');
    const badgeEl = document.getElementById('subModalBadge');
    const nameEl = document.getElementById('subModalPlanName');
    const priceEl = document.getElementById('subModalPrice');
    const bulletsEl = document.getElementById('subModalBullets');

    if (planId === 'basic') {
      if (titleEl) titleEl.textContent = 'Upgrade to Woobi Basic';
      if (badgeEl) badgeEl.textContent = 'BASIC MEMBERSHIP';
      if (nameEl) nameEl.textContent = 'Woobi Basic';
      if (priceEl) priceEl.textContent = '179';
      if (bulletsEl) {
        bulletsEl.innerHTML = `
          <li><span class="check-bullet">✓</span> Everything in Free tier</li>
          <li><span class="check-bullet">✓</span> More daily AI outfit recommendations</li>
          <li><span class="check-bullet">✓</span> Expanded digital wardrobe capacity</li>
          <li><span class="check-bullet">✓</span> More Style Hint suggestions & combinations</li>
          <li><span class="check-bullet">✓</span> Additional outfit history and gallery features</li>
          <li><span class="check-bullet">✓</span> Ad-free experience</li>
        `;
      }
    } else {
      // Pro plan default
      if (titleEl) titleEl.textContent = 'Get Woobi Pro 👑';
      if (badgeEl) badgeEl.textContent = 'MOST POPULAR / BEST EXPERIENCE';
      if (nameEl) nameEl.textContent = 'Woobi Pro';
      if (priceEl) priceEl.textContent = '387';
      if (bulletsEl) {
        bulletsEl.innerHTML = `
          <li><span class="check-bullet gold">✓</span> Everything in Basic tier</li>
          <li><span class="check-bullet gold">✓</span> Advanced AI personal stylist (occasion & weather tuned)</li>
          <li><span class="check-bullet gold">✓</span> Generous / unlimited AI outfit recommendations</li>
          <li><span class="check-bullet gold">✓</span> Advanced colour matching & palette engine</li>
          <li><span class="check-bullet gold">✓</span> Premium Style Hint with detailed suggestions</li>
          <li><span class="check-bullet gold">✓</span> Advanced virtual try-on features</li>
          <li><span class="check-bullet gold">✓</span> Premium 3D mannequin customisation & exclusive themes</li>
          <li><span class="check-bullet gold">✓</span> Save unlimited favourite outfit combinations</li>
          <li><span class="check-bullet gold">✓</span> Priority access to new features & VIP support</li>
        `;
      }
    }

    modal.classList.remove('hidden');
  }

  function closeUpgradeConfirmation() {
    const modal = document.getElementById('subUpgradeModal');
    if (modal) modal.classList.add('hidden');
  }

  function confirmPlanPreference() {
    const plan = state.pendingUpgradePlan || 'pro';
    state.selectedPlanPreference = plan;
    closeUpgradeConfirmation();

    const planLabel = plan === 'pro' ? 'Pro (₹387/mo)' : 'Basic (₹179/mo)';
    showToast(`✓ Preference recorded for Woobi ${planLabel}! Payment gateway integration coming soon.`);

    updateSubscriptionUI();
  }

  function toggleFaq(element) {
    if (!element) return;
    element.classList.toggle('open');
  }

  function updateSubscriptionUI() {
    const current = state.isPremium ? (state.currentPlan || 'pro') : 'free';
    const pref = state.selectedPlanPreference;

    // Status bar update
    const tierEl = document.getElementById('subStatusTier');
    const badgeEl = document.getElementById('subStatusBadge');
    const captionEl = document.getElementById('subStatusCaption');
    const pricePill = document.getElementById('subStatusPricePill');

    if (tierEl) {
      if (current === 'free') {
        tierEl.textContent = 'Free Forever Plan';
        if (pricePill) pricePill.innerHTML = '₹0 <span class="per-txt">/ mo</span>';
        if (captionEl) {
          if (pref) {
            const prefLabel = pref === 'pro' ? 'Woobi Pro (₹387/mo)' : 'Woobi Basic (₹179/mo)';
            captionEl.textContent = `Active: Free Forever • Preference: ${prefLabel} (Gateway in progress)`;
          } else {
            captionEl.textContent = 'Standard 3D studio, wardrobe & daily streak features';
          }
        }
      } else if (current === 'basic') {
        tierEl.textContent = 'Woobi Basic Plan';
        if (pricePill) pricePill.innerHTML = '₹179 <span class="per-txt">/ mo</span>';
        if (captionEl) captionEl.textContent = 'Expanded wardrobe & daily AI outfit recommendations';
      } else {
        tierEl.textContent = 'Woobi Pro VIP Plan 👑';
        if (pricePill) pricePill.innerHTML = '₹387 <span class="per-txt">/ mo</span>';
        if (captionEl) captionEl.textContent = 'Full AI stylist, unlimited combinations & virtual try-on';
      }
    }

    // Update buttons on the plan cards preserving play button markup
    function updateTierButton(btn, text, isPro, isCurrent) {
      if (!btn) return;
      const textSpan = btn.querySelector('.btn-tier-text');
      if (textSpan) {
        textSpan.textContent = text;
      } else {
        const iconHtml = isCurrent
          ? `<span class="play-btn-circle check-circle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`
          : `<span class="play-btn-circle play-triangle${isPro ? ' gold-play' : ''}"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>`;
        btn.innerHTML = `${iconHtml}<span class="btn-tier-text">${text}</span>`;
      }
    }

    const btnFree = document.getElementById('btnPlanFree');
    const btnBasic = document.getElementById('btnPlanBasic');
    const btnPro = document.getElementById('btnPlanPro');

    if (btnFree) {
      if (current === 'free') {
        updateTierButton(btnFree, 'Current Plan', false, true);
        btnFree.disabled = true;
        btnFree.classList.add('btn-plan-current');
      } else {
        updateTierButton(btnFree, 'Switch to Free', false, false);
        btnFree.disabled = false;
        btnFree.classList.remove('btn-plan-current');
      }
    }

    if (btnBasic) {
      if (current === 'basic') {
        updateTierButton(btnBasic, 'Current Plan', false, true);
        btnBasic.disabled = true;
        btnBasic.classList.add('btn-plan-current');
      } else {
        const txt = (pref === 'basic') ? 'Preference Saved (₹179/mo)' : 'Upgrade to Basic';
        updateTierButton(btnBasic, txt, false, false);
        btnBasic.disabled = false;
        btnBasic.classList.remove('btn-plan-current');
      }
    }

    if (btnPro) {
      if (current === 'pro') {
        updateTierButton(btnPro, 'Current Plan 👑', true, true);
        btnPro.disabled = true;
        btnPro.classList.add('btn-plan-current');
      } else {
        const txt = (pref === 'pro') ? 'Preference Saved (₹387/mo)' : 'Get Woobi Pro';
        updateTierButton(btnPro, txt, true, false);
        btnPro.disabled = false;
        btnPro.classList.remove('btn-plan-current');
      }
    }

    initPlanSwipeGestures();
  }

  function switchPlanView(planId) {
    const track = document.getElementById('planCardsSliderTrack');
    const pill = document.getElementById('segmentedSlidePill');
    const btnFree = document.getElementById('segBtnFree');
    const btnBasic = document.getElementById('segBtnBasic');
    const btnPro = document.getElementById('segBtnPro');

    const btns = [btnFree, btnBasic, btnPro];
    btns.forEach(b => b && b.classList.remove('active'));

    if (pill) {
      pill.classList.remove('pill-free', 'pill-basic', 'pill-pro');
    }

    if (planId === 'free') {
      if (btnFree) btnFree.classList.add('active');
      if (pill) pill.classList.add('pill-free');
      if (track) track.style.transform = 'translateX(0%)';
    } else if (planId === 'basic') {
      if (btnBasic) btnBasic.classList.add('active');
      if (pill) pill.classList.add('pill-basic');
      if (track) track.style.transform = 'translateX(-33.333333%)';
    } else if (planId === 'pro') {
      if (btnPro) btnPro.classList.add('active');
      if (pill) pill.classList.add('pill-pro');
      if (track) track.style.transform = 'translateX(-66.666666%)';
    }
  }

  function initPlanSwipeGestures() {
    const viewport = document.getElementById('planCardsViewport');
    if (!viewport || viewport.dataset.swipeInit) return;
    viewport.dataset.swipeInit = 'true';

    let startX = 0;
    const plans = ['free', 'basic', 'pro'];

    viewport.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].screenX;
      const diff = startX - endX;
      let activeIndex = 0;
      if (document.getElementById('segBtnBasic')?.classList.contains('active')) activeIndex = 1;
      else if (document.getElementById('segBtnPro')?.classList.contains('active')) activeIndex = 2;

      if (Math.abs(diff) > 40) {
        if (diff > 0 && activeIndex < plans.length - 1) {
          switchPlanView(plans[activeIndex + 1]);
        } else if (diff < 0 && activeIndex > 0) {
          switchPlanView(plans[activeIndex - 1]);
        }
      }
    }, { passive: true });
  }

  function saveProfile() {
    const nameInput = document.getElementById('inputProfileName');
    const emailInput = document.getElementById('inputProfileEmail');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const sm = getSettingsManager();
    if (sm && sm.account) {
      const result = sm.account.updateProfile({ displayName: name, email: email });
      if (result.success) {
        showToast('✓ Profile successfully updated');
        const nameHeader = document.querySelector('.profile-user-name');
        if (nameHeader) nameHeader.textContent = name;
      } else {
        showToast(`✕ ${result.error || 'Failed to update profile'}`);
      }
    } else {
      showToast('✓ Profile saved');
    }
  }

  function updatePrivacyConsent() {
    const sm = getSettingsManager();
    const analytics = document.getElementById('toggleAnalyticsConsent');
    const crash = document.getElementById('toggleCrashReporting');
    if (sm && sm.privacy) {
      sm.privacy.updateConsent({
        analyticsConsent: analytics ? analytics.checked : false,
        crashReporting: crash ? crash.checked : true
      });
      showToast('✓ Privacy preferences saved');
    }
  }

  function exportUserData() {
    const sm = getSettingsManager();
    showToast('📦 Preparing data export package...');
    setTimeout(() => {
      let exportPayload = null;
      if (sm && sm.privacy) {
        const result = sm.privacy.exportUserData();
        if (result.success) exportPayload = result.data;
      }
      if (!exportPayload) {
        exportPayload = {
          exportedAt: new Date().toISOString(),
          profile: { displayName: 'Suriya', email: 'suriya@example.com' },
          storageMode: 'client_local_only'
        };
      }
      try {
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `woobi-user-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Could not trigger browser download', e);
      }
      showToast('✓ User data package exported');
    }, 600);
  }

  function clearSavedLooksCache() {
    const sm = getSettingsManager();
    if (sm && sm.privacy) {
      sm.privacy.clearSavedLooksCache();
    }
    showToast('✓ Saved looks cache cleared');
  }

  function clearAvatarPreferencesCache() {
    const sm = getSettingsManager();
    if (sm && sm.privacy) {
      sm.privacy.clearAvatarPreferencesCache();
    }
    showToast('✓ Avatar preferences reset to default');
  }

  function signOut() {
    const sm = getSettingsManager();
    if (sm && sm.account) {
      sm.account.signOut();
    }
    showToast('Signed out of session');
    goToScreen('welcome');
  }

  function setAppTheme(theme) {
    const sm = getSettingsManager();
    if (sm && sm.appearance) {
      sm.appearance.setAppTheme(theme);
    }
    ['btnThemeLight', 'btnThemeDark', 'btnThemeSystem'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(theme === 'light' ? 'btnThemeLight' : theme === 'dark' ? 'btnThemeDark' : 'btnThemeSystem');
    if (activeBtn) activeBtn.classList.add('active');
    showToast(`Theme switched to ${theme}`);
  }

  function setStudioTheme(theme) {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    if (sm && sm.appearance) {
      sm.appearance.setStudioTheme(theme, studio);
    }
    ['theme-check-luxury', 'theme-check-nordic', 'theme-check-terracotta'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    const checkId = theme === 'luxury-cream' ? 'theme-check-luxury' : theme === 'nordic-minimal' ? 'theme-check-nordic' : 'theme-check-terracotta';
    const target = document.getElementById(checkId);
    if (target) target.textContent = '✓';
    showToast(`3D Studio atmosphere set to ${theme}`);
  }

  function setStudioLighting(preset) {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    if (sm && sm.appearance) {
      sm.appearance.setStudioLighting(preset, studio);
    }
    ['btnLightSoft', 'btnLightAtelier', 'btnLightGolden', 'btnLightDramatic', 'btnLightClean'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    const map = {
      'editorial_soft': 'btnLightSoft',
      'warm_atelier': 'btnLightAtelier',
      'golden_hour': 'btnLightGolden',
      'dramatic_chiaroscuro': 'btnLightDramatic',
      'high_key_clean': 'btnLightClean'
    };
    const target = document.getElementById(map[preset]);
    if (target) target.classList.add('active');
    showToast(`Studio lighting: ${preset.replace(/_/g, ' ')}`);
  }

  function toggleHighContrast(enabled) {
    const sm = getSettingsManager();
    if (sm && sm.appearance) {
      sm.appearance.toggleHighContrast(enabled);
    }
    showToast(enabled ? 'High contrast enabled' : 'High contrast disabled');
  }

  function resetAppearance() {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    if (sm && sm.appearance) {
      sm.appearance.resetAppearance(studio);
    }
    setAppTheme('light');
    setStudioTheme('luxury-cream');
    setStudioLighting('editorial_soft');
    const toggle = document.getElementById('toggleHighContrast');
    if (toggle) toggle.checked = false;
    showToast('Appearance reset to default');
  }

  function setPerformancePreset(preset) {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    let applied = preset;
    if (sm && sm.performance) {
      applied = sm.performance.setPreset(preset, studio);
    }
    ['btnPerfHigh', 'btnPerfMedium', 'btnPerfLow', 'btnPerfBattery', 'btnPerfAuto'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    const map = {
      'high': 'btnPerfHigh',
      'medium': 'btnPerfMedium',
      'low': 'btnPerfLow',
      'battery_saver': 'btnPerfBattery',
      'auto': 'btnPerfAuto'
    };
    const target = document.getElementById(map[preset]);
    if (target) target.classList.add('active');

    if (sm && sm.performance) {
      const current = sm.performance.getSettings();
      const shadowEl = document.getElementById('toggleShadows');
      if (shadowEl) shadowEl.checked = current.shadows !== 'off';
      const reflEl = document.getElementById('toggleReflections');
      if (reflEl) reflEl.checked = current.reflections !== 'off';
      const idleEl = document.getElementById('toggleIdleMotion');
      if (idleEl) idleEl.checked = current.idleAnimations !== false;
    }
    showToast(`Graphics profile: ${applied}`);
  }

  function toggleShadowQuality(enabled) {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    if (sm && sm.performance) {
      sm.performance.setShadowQuality(enabled ? 'soft' : 'off', studio);
    }
    showToast(enabled ? 'Real-time soft shadows on' : 'Shadows turned off');
  }

  function toggleReflectionQuality(enabled) {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    if (sm && sm.performance) {
      sm.performance.setReflectionQuality(enabled ? 'full' : 'off', studio);
    }
    showToast(enabled ? 'Mirror reflections on' : 'Reflections off');
  }

  function toggleIdleAnimations(enabled) {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    if (sm && sm.performance) {
      sm.performance.toggleIdleAnimations(enabled, studio);
    }
    showToast(enabled ? 'Breathing animations on' : 'Idle animations paused');
  }

  function resetPerformance() {
    const sm = getSettingsManager();
    const studio = (typeof window !== 'undefined' && (window.Studio3D || window.studio3d)) ? (window.Studio3D || window.studio3d) : null;
    if (sm && sm.performance) {
      sm.performance.resetPerformance(studio);
    }
    setPerformancePreset('high');
    showToast('Graphics settings restored to High');
  }

  async function requestNotificationPermission() {
    const sm = getSettingsManager();
    if (sm && sm.notifications) {
      const res = await sm.notifications.requestBrowserPermission();
      showToast(`Notifications permission: ${res.status}`);
      return res;
    }
    return { granted: false, status: 'unsupported' };
  }

  function saveReminderPreferences() {
    const sm = getSettingsManager();
    const reminderToggle = document.getElementById('toggleReminder');
    if (sm && sm.notifications) {
      sm.notifications.setCategoryEnabled('morningOutfits', reminderToggle ? reminderToggle.checked : true);
    }
    showToast('✓ Reminder preferences updated.');
    goToScreen('profile');
  }

  function exportWardrobe() {
    exportUserData();
  }

  function deleteAccount() {
    goToScreen('delete-account');
  }

  function showHelpSupport() {
    goToScreen('help-support');
  }

  function rotateCropImage() {
    const img = document.getElementById('cropTargetImg');
    if (!img) return;
    const currentRot = parseInt(img.dataset.rotation || '0', 10);
    const nextRot = (currentRot + 90) % 360;
    img.dataset.rotation = nextRot;
    img.style.transform = `rotate(${nextRot}deg)`;
  }

  function setAspectRatio(ratio, btn) {
    document.querySelectorAll('.aspect-ratio-tabs .cat-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const container = document.getElementById('cropAspectBox');
    if (!container) return;
    if (ratio === '1:1') {
      container.style.width = '200px';
      container.style.height = '200px';
    } else if (ratio === '3:4') {
      container.style.width = '180px';
      container.style.height = '240px';
    } else if (ratio === '4:3') {
      container.style.width = '240px';
      container.style.height = '180px';
    } else {
      container.style.width = '210px';
      container.style.height = '210px';
    }
  }

  function setAvailability(status) {
    const lbl = document.getElementById('selectedAvailLabel');
    if (lbl) lbl.textContent = status;
    const menu = document.getElementById('availDropdownMenu');
    if (menu) menu.classList.add('hidden');
    document.querySelectorAll('.dropdown-popover-menu .dropdown-option').forEach(opt => {
      opt.classList.toggle('active', opt.textContent.includes(status));
    });
    showToast(`Garment availability marked as ${status}`);
  }

  function selectFeedbackOption(labelEl) {
    document.querySelectorAll('.feedback-radio-list .feedback-option').forEach(opt => opt.classList.remove('selected'));
    labelEl.classList.add('selected');
    const radio = labelEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }

  function retryUpload() {
    showToast('🔄 Retrying photo upload...');
    setTimeout(() => {
      showToast('✅ All wardrobe items uploaded successfully!');
      setTimeout(() => goToScreen('today'), 800);
    }, 1000);
  }

  function tryReconnect() {
    showToast('📶 Reconnecting to Woobi Cloud...');
    setTimeout(() => {
      showToast('Online! Synchronizing latest suggestions.');
      goToScreen('today');
    }, 900);
  }

  function confirmDeleteAccount() {
    const sm = getSettingsManager();
    if (sm) {
      if (sm.privacy) sm.privacy.clearAllLocalData('CONFIRM_DELETE_ALL');
      if (sm.account) sm.account.deleteAccountData('CONFIRM_DELETE');
    }
    showToast('Account data deleted. Resetting to setup...');
    setTimeout(() => {
      goToScreen('welcome');
    }, 900);
  }

  // Toast Notification Helper
  function showToast(msg, type = 'info', duration = 3200) {
    if (typeof window !== 'undefined' && window.toastService && typeof window.toastService.show === 'function') {
      window.toastService.show(msg, type, duration);
    }
    const toast = document.getElementById('toastPopup');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, duration);
  }

  // =========================================================================
  // 07. INTERACTIVE 3D VIRTUAL FASHION STUDIO ENGINE
  // =========================================================================
  const studioState = {
    selectedTop: WARDROBE_ITEMS.find(i => i.id === 'item_1') || WARDROBE_ITEMS[0],
    selectedBottom: WARDROBE_ITEMS.find(i => i.id === 'item_2') || WARDROBE_ITEMS[1],
    selectedShoes: WARDROBE_ITEMS.find(i => i.id === 'item_4') || WARDROBE_ITEMS[3],
    selectedAccessory: WARDROBE_ITEMS.find(i => i.id === 'item_10') || null,
    activeCategory: 'Tops',
    isDrawerOpen: true,
    avatarRotation: 0,
    isGenerating: false,
    currentModelPhoto: 'assets/model_tryon_navy.jpg',
    presetIndex: 0
  };

  const STUDIO_PRESETS = [
    {
      name: 'Navy Everyday Contrast',
      modelPhoto: 'assets/model_tryon_navy.jpg',
      topId: 'item_1',
      bottomId: 'item_2',
      shoeId: 'item_4',
      accId: 'item_10',
      score: 92,
      headline: 'A breathable, crisp contrast look perfectly suited for Chennai heat.',
      pros: ['High-contrast navy and beige palette', 'Breathable lightweight cotton prevents heat retention', 'All items 100% clean and prepped'],
      cons: ['Casual footwear - swap to loafers for boardroom meetings']
    },
    {
      name: 'Crisp Linen Tailored',
      modelPhoto: 'assets/model_tryon_linen.jpg',
      topId: 'item_7',
      bottomId: 'item_2',
      shoeId: 'item_9',
      accId: 'item_10',
      score: 95,
      headline: 'Refined modern tailoring with relaxed natural drape.',
      pros: ['Pure linen weave maximizes natural airflow', 'Earthy tan loafers harmonize beautifully with beige chinos', 'Sharp minimalist watch accentuates clean cuffs'],
      cons: ['Wrinkle-sensitive in humid weather - iron gently']
    },
    {
      name: 'Modern Heritage Kurta',
      modelPhoto: 'assets/model_tryon_kurta.jpg',
      topId: 'item_3',
      bottomId: 'item_13',
      shoeId: 'item_9',
      accId: 'item_10',
      score: 89,
      headline: 'Elevated traditional drape with contemporary styling.',
      pros: ['Subtle olive tone flatters Indian skin tones', 'Comfortable relaxed silhouette for cultural celebrations', 'Supple leather loafers anchor the festive look'],
      cons: ['Palazzo pants require careful hem clearance outdoors']
    },
    {
      name: 'Terracotta Urban Street',
      modelPhoto: 'assets/model_tryon_maroon.jpg',
      topId: 'item_5',
      bottomId: 'item_6',
      shoeId: 'item_4',
      accId: 'item_10',
      score: 84,
      headline: 'Warm rich tones balanced with structured monochrome.',
      pros: ['Deep rich jewel tone adds visual warmth', 'Athletic sneakers ground the silhouette for walking ease', 'Clean wrist accessory adds subtle polish'],
      cons: ['Garment fit is slightly snug around shoulders']
    }
  ];


  // ===================================================================
  // SÉRÉN 3D VIRTUAL FASHION STUDIO CONTROLLER
  // ===================================================================

  const SUPABASE_CDN = 'https://lewsuhfhagpjootunpsa.supabase.co/storage/v1/object/public/Troys%20Assets/assets/';

  const SEREN_GARMENTS = [
    { id: 'cardigan', cat: 'tops', name: 'Cream Knit Cardigan', photo: SUPABASE_CDN + 'style_casual.jpg', is3D: true, sub: 'Cozy drop-shoulder knit' },
    { id: 'blazer', cat: 'tops', name: 'Camel Smart Blazer', photo: SUPABASE_CDN + 'smart_blazer.jpg', is3D: true, sub: 'Structured tailored wool' },
    { id: 'navy_shirt', cat: 'tops', name: 'Navy Oxford Shirt', photo: SUPABASE_CDN + 'navy_shirt.jpg', is3D: true, sub: 'Crisp button-down collar' },
    { id: 'striped_sweater', cat: 'tops', name: 'Breton Striped Sweater', photo: SUPABASE_CDN + 'style_casual.jpg', is3D: true, sub: 'French nautical knit' },
    { id: 'tank', cat: 'tops', name: 'Ribbed Ivory Tank', photo: SUPABASE_CDN + 'welcome_hero.jpg', is3D: true, sub: 'Scoop neck luxury cotton' },

    { id: 'taupe_wide', cat: 'bottoms', name: 'Tailored Taupe Trousers', photo: SUPABASE_CDN + 'beige_chinos.jpg', is3D: true, sub: 'Pleated high-waisted drape' },
    { id: 'dark_denim', cat: 'bottoms', name: 'Dark Indigo Straight Jeans', photo: SUPABASE_CDN + 'dark_denim.jpg', is3D: true, sub: 'Tailored Japanese denim' },
    { id: 'white_chinos', cat: 'bottoms', name: 'Crisp Ivory Chinos', photo: SUPABASE_CDN + 'beige_chinos.jpg', is3D: true, sub: 'Clean minimalist cut' },

    { id: 'blazer', cat: 'outerwear', name: 'Camel Smart Blazer', photo: SUPABASE_CDN + 'smart_blazer.jpg', is3D: true, sub: 'Structured tailored wool' },
    { id: 'cardigan', cat: 'outerwear', name: 'Cream Knit Cardigan', photo: SUPABASE_CDN + 'style_casual.jpg', is3D: true, sub: 'Cozy drop-shoulder knit' },

    { id: 'loafers', cat: 'shoes', name: 'Caramel Leather Loafers', photo: SUPABASE_CDN + 'tan_loafers.jpg', is3D: true, sub: 'Polished brass horsebit' },
    { id: 'sneakers', cat: 'shoes', name: 'Clean White Sneakers', photo: SUPABASE_CDN + 'white_sneakers.jpg', is3D: true, sub: 'Minimalist court leather' }
  ];

  const STYLING_REVIEWS = {
    'cardigan': {
      score: 94,
      summary: 'Elevated quiet luxury with rich textural harmony and soft tonal drape.',
      works: [
        'Cream ribbed knit texture complements fluid high-waisted trousers',
        'Tortoiseshell buttons create subtle grounding vertical interest',
        'Soft drop shoulder softens the silhouette naturally'
      ],
      improve: [
        'Add a slender caramel leather belt for tailored definition',
        'Gold huggie earrings would catch the studio light beautifully'
      ],
      altTop: 'blazer',
      altShoe: 'loafers'
    },
    'blazer': {
      score: 96,
      summary: 'Sharply tailored modernism with flawless proportion and warmth.',
      works: [
        'Structured camel wool shoulder line frames the posture with authority',
        'Crisp peaked lapels elongate the neckline',
        'Striking contrast against neutral trousers'
      ],
      improve: [
        'Push blazer sleeves up to forearm for effortless sprezzatura flair',
        'Pair with minimal leather envelope clutch for formal polish'
      ],
      altTop: 'navy_shirt',
      altShoe: 'loafers'
    },
    'navy_shirt': {
      score: 91,
      summary: 'Crisp coastal elegance with rich Mediterranean tone depth.',
      works: [
        'Deep navy poplin offers high visual contrast',
        'Pointed collar frames the jawline cleanly',
        'Timeless tailored silhouette'
      ],
      improve: [
        'Unbutton the top two buttons for relaxed movement',
        'Roll sleeves to mid-arm for an inspired weekend touch'
      ],
      altTop: 'cardigan',
      altShoe: 'sneakers'
    },
    'striped_sweater': {
      score: 89,
      summary: 'Playful French nautical ease with effortless everyday charm.',
      works: [
        'Breton stripe rhythm introduces dynamic optical dimension',
        'Clean crewneck balances wide-leg trouser volume',
        'Approachable, timeless weekend aesthetic'
      ],
      improve: [
        'Drape loosely over shoulders if layered over a clean tee',
        'Pair with clean white sneakers to anchor the nautical vibe'
      ],
      altTop: 'cardigan',
      altShoe: 'sneakers'
    },
    'tank': {
      score: 84,
      summary: 'Pure minimalist studio silhouette with clean architectural lines.',
      works: [
        'Ribbed knit vertical lines flatter the waistline taper',
        'Contrasting warm taupe trousers ground the soft ivory top',
        'Effortless base layer for summer warmth'
      ],
      improve: [
        'Shoulders are open — consider layering the cream knit cardigan for evening warmth',
        'A minimal pendant necklace would accent the scoop neckline'
      ],
      altTop: 'cardigan',
      altShoe: 'loafers'
    }
  };

  let serenCurrentCat = 'all';

  function initVirtualStudio() {
    if (window.Studio3D) {
      setTimeout(() => {
        window.Studio3D.init('seren3dContainer', 'seren3dCanvas');
      }, 50);
    }
    renderSerenGarments('all');
    updateSerenGreeting();
  }

  function renderSerenGarments(cat) {
    const grid = document.getElementById('serenGarmentGrid');
    if (!grid) return;

    serenCurrentCat = cat || 'all';

    let items = SEREN_GARMENTS;
    if (serenCurrentCat !== 'all') {
      items = items.filter(i => i.cat === serenCurrentCat);
    }

    if (state.wardrobe && state.wardrobe.length > 0) {
      const userItems = state.wardrobe.map(item => ({
        id: item.id,
        cat: item.category ? item.category.toLowerCase() : 'tops',
        name: item.name,
        photo: item.photo,
        is3D: false,
        sub: 'Closet Photo'
      }));

      if (serenCurrentCat === 'all') {
        items = [...items, ...userItems];
      } else {
        items = [...items, ...userItems.filter(i => i.cat === serenCurrentCat)];
      }
    }

    const renderCard = item => `
      <div class="seren-garment-item" onclick="app.serenWearGarment('${item.cat}', '${item.id}', ${item.is3D})" title="Wear ${item.name}">
        <div class="garment-thumb-box">
          <img src="${item.photo}" alt="${item.name}" onerror="this.src='assets/navy_shirt.jpg'">
          ${item.is3D ? '<span class="ready-3d-badge">3D READY</span>' : '<span class="ready-2d-badge">2D PHOTO</span>'}
        </div>
        <div class="garment-item-info">
          <strong class="garment-item-name">${item.name}</strong>
          <span class="garment-item-sub">${item.sub}</span>
        </div>
      </div>
    `;

    if (serenCurrentCat === 'all') {
      const tops = items.filter(i => i.cat === 'tops' || i.cat === 'shirts');
      const bottoms = items.filter(i => i.cat === 'bottoms' || i.cat === 'trousers');
      const shoes = items.filter(i => i.cat === 'shoes' || i.cat === 'footwear');
      const outerwear = items.filter(i => i.cat === 'outerwear');

      grid.innerHTML = `
        <div class="seren-cat-section" style="grid-column: 1 / -1; margin-bottom: 12px;">
          <div class="seren-cat-section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid rgba(220, 208, 192, 0.5);">
            <span style="font-weight:700; font-size:0.86rem; color:#2F241A;">👕 Shirts &amp; Tops</span>
            <span style="font-size:0.72rem; color:#726353; background:rgba(0,0,0,0.04); padding:2px 8px; border-radius:999px;">${tops.length} items</span>
          </div>
          <div class="seren-garment-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
            ${tops.map(renderCard).join('')}
          </div>
        </div>

        <div class="seren-cat-section" style="grid-column: 1 / -1; margin-top: 8px; margin-bottom: 12px;">
          <div class="seren-cat-section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid rgba(220, 208, 192, 0.5);">
            <span style="font-weight:700; font-size:0.86rem; color:#2F241A;">👖 Trousers &amp; Bottoms</span>
            <span style="font-size:0.72rem; color:#726353; background:rgba(0,0,0,0.04); padding:2px 8px; border-radius:999px;">${bottoms.length} items</span>
          </div>
          <div class="seren-garment-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
            ${bottoms.map(renderCard).join('')}
          </div>
        </div>

        <div class="seren-cat-section" style="grid-column: 1 / -1; margin-top: 8px; margin-bottom: 12px;">
          <div class="seren-cat-section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid rgba(220, 208, 192, 0.5);">
            <span style="font-weight:700; font-size:0.86rem; color:#2F241A;">👟 Footwear &amp; Shoes</span>
            <span style="font-size:0.72rem; color:#726353; background:rgba(0,0,0,0.04); padding:2px 8px; border-radius:999px;">${shoes.length} items</span>
          </div>
          <div class="seren-garment-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
            ${shoes.map(renderCard).join('')}
          </div>
        </div>

        ${outerwear.length > 0 ? `
          <div class="seren-cat-section" style="grid-column: 1 / -1; margin-top: 8px;">
            <div class="seren-cat-section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid rgba(220, 208, 192, 0.5);">
              <span style="font-weight:700; font-size:0.86rem; color:#2F241A;">🧥 Outerwear</span>
              <span style="font-size:0.72rem; color:#726353; background:rgba(0,0,0,0.04); padding:2px 8px; border-radius:999px;">${outerwear.length} items</span>
            </div>
            <div class="seren-garment-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
              ${outerwear.map(renderCard).join('')}
            </div>
          </div>
        ` : ''}
      `;
    } else {
      grid.innerHTML = items.map(renderCard).join('');
    }
  }

  function serenFilterCat(cat, btn) {
    if (btn) {
      document.querySelectorAll('.seren-cat-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
    }
    renderSerenGarments(cat);
  }

  function serenToggleWardrobe(forceOpen) {
    const sheet = document.getElementById('serenWardrobeSheet');
    if (!sheet) return;

    if (forceOpen === undefined) {
      sheet.classList.toggle('hidden');
      if (!sheet.classList.contains('hidden')) {
        setStudioCamera('WARDROBE_CLOSEUP');
      } else {
        setStudioCamera('STUDIO_OVERVIEW');
      }
    } else if (forceOpen) {
      sheet.classList.remove('hidden');
      setStudioCamera('WARDROBE_CLOSEUP');
    } else {
      sheet.classList.add('hidden');
      setStudioCamera('STUDIO_OVERVIEW');
    }
  }

  function serenToggleDailyLooks(forceOpen) {
    const drawer = document.getElementById('dailyLooksDrawer');
    if (!drawer) return;

    if (forceOpen === undefined) {
      drawer.classList.toggle('hidden');
    } else if (forceOpen) {
      drawer.classList.remove('hidden');
      renderCurrentLook();
    } else {
      drawer.classList.add('hidden');
    }
  }

  function serenWearGarment(cat, garmentId, is3D) {
    if (is3D && window.Studio3D) {
      let engineCat = 'top';
      if (cat === 'bottoms' || cat === 'bottom') engineCat = 'bottom';
      else if (cat === 'shoes' || cat === 'shoe') engineCat = 'shoes';
      else engineCat = 'top';

      const mappedId = garmentId === 'wide_linen' ? 'taupe_wide' : garmentId;
      window.Studio3D.equipGarment(engineCat, mappedId);
      window.Studio3D.setCameraState('AVATAR_FULL_BODY');

      const itemRecord = SEREN_GARMENTS.find(g => g.id === garmentId);
      const displayName = itemRecord ? itemRecord.name : garmentId.replace('_', ' ');
      showToast(`Equipped: ${displayName} ♡`);

      const thumb = document.getElementById('serenReviewThumb');
      if (thumb) {
        if (garmentId === 'cardigan') thumb.src = 'assets/style_casual.jpg';
        else if (garmentId === 'blazer') thumb.src = 'assets/smart_blazer.jpg';
        else if (garmentId === 'navy_shirt') thumb.src = 'assets/navy_shirt.jpg';
        else if (garmentId === 'striped_sweater') thumb.src = 'assets/style_casual.jpg';
        else if (garmentId === 'tank') thumb.src = 'assets/welcome_hero.jpg';
      }
    } else {
      showToast(`2D item selected. Previewing in wardrobe catalog.`);
    }

    setTimeout(() => {
      serenToggleWardrobe(false);
    }, 450);
  }

  function serenOpenStylingReview() {
    const modal = document.getElementById('serenReviewModal');
    if (!modal) return;

    // Dynamically calculate score & feedback based on worn 3D outfit
    const currentTop = (window.Studio3D && window.Studio3D.activeGarments) ? window.Studio3D.activeGarments.top : 'tank';
    const review = STYLING_REVIEWS[currentTop] || STYLING_REVIEWS['tank'];

    const scoreVal = document.getElementById('serenScoreVal');
    const scoreSummary = document.getElementById('serenScoreSummary');
    const worksList = document.getElementById('serenWorksList');
    const improveList = document.getElementById('serenImproveList');

    if (scoreVal) scoreVal.innerText = review.score;
    if (scoreSummary) scoreSummary.innerText = review.summary;
    if (worksList) {
      worksList.innerHTML = review.works.map(w => `<li>${w}</li>`).join('');
    }
    if (improveList) {
      improveList.innerHTML = review.improve.map(i => `<li>${i}</li>`).join('');
    }

    modal.classList.remove('hidden');
    if (window.Studio3D) window.Studio3D.setCameraState('MIRROR_VIEW');
  }

  function serenCloseReview() {
    const modal = document.getElementById('serenReviewModal');
    if (modal) modal.classList.add('hidden');
    if (window.Studio3D) window.Studio3D.setCameraState('STUDIO_OVERVIEW');
  }

  function serenApplySuggestion() {
    if (window.Studio3D) {
      const currentTop = window.Studio3D.activeGarments ? window.Studio3D.activeGarments.top : 'tank';
      const review = STYLING_REVIEWS[currentTop] || STYLING_REVIEWS['tank'];

      window.Studio3D.equipGarment('top', review.altTop || 'blazer');
      window.Studio3D.equipGarment('shoes', review.altShoe || 'loafers');
      window.Studio3D.setCameraState('AVATAR_FULL_BODY');

      showToast('Complementary styling suggestion applied! ✨');
    }
    serenCloseReview();
  }

  function serenSaveCurrentLook() {
    const currentOutfit = {
      id: 'look_' + Date.now(),
      name: 'Woobi Studio Look',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      occasion: 'Everyday Luxury',
      items: [
        { name: 'Crop Tank', photo: 'assets/welcome_hero.jpg' },
        { name: 'Cream Cardigan', photo: 'assets/style_casual.jpg' },
        { name: 'Wide Linen Trousers', photo: 'assets/beige_chinos.jpg' }
      ]
    };

    if (!state.savedLooks) state.savedLooks = [];
    state.savedLooks.unshift(currentOutfit);
    showToast('Look saved to your collection! ♡');
  }

  function serenCenterAction() {
    // Central Plus (+) action: Opens Clothing Capture category selector (Shirt, Pant, Shoe)
    openClothingCaptureMenu();
  }

  function onStudioCameraChanged(stateName) {
    const backBtn = document.getElementById('serenBackStudioBtn');
    const dragHint = document.getElementById('serenDragHint');
    const greeting = document.getElementById('serenFloatingGreeting');
    const tagline = document.querySelector('.seren-editorial-tagline-wrap');

    if (stateName === 'STUDIO_OVERVIEW') {
      if (backBtn) backBtn.classList.add('hidden');
      if (dragHint) dragHint.style.display = '';
      if (greeting) greeting.style.display = 'none';
      if (tagline) tagline.style.display = 'none';
    } else {
      if (backBtn) backBtn.classList.remove('hidden');
      if (dragHint) dragHint.style.display = 'none';
      if (greeting) greeting.style.display = 'none';
      if (tagline) tagline.style.display = 'none';
    }
  }

  function setStudioCamera(stateName) {
    if (window.Studio3D) {
      window.Studio3D.setCameraState(stateName);
    }
    onStudioCameraChanged(stateName);
  }

  function serenInteract(type) {
    if (type === 'vanity' || type === 'mirror') {
      serenOpenVanity(true);
    } else if (type === 'wardrobe') {
      if (window.Studio3D && window.Studio3D.currentCameraState === 'WARDROBE_CLOSEUP') {
        serenToggleWardrobe(true);
      } else {
        setStudioCamera('WARDROBE_CLOSEUP');
      }
    } else if (window.Studio3D) {
      if (typeof window.Studio3D.handleCanvasClick === 'function') {
        window.Studio3D.handleCanvasClick();
      }
    }
  }

  // =========================================================================
  // VANITY & PERSONALIZED AVATAR CUSTOMIZATION SYSTEM
  // =========================================================================
  function serenOpenVanity(forceOpen) {
    const sheet = document.getElementById('serenVanitySheet');
    if (!sheet) return;

    if (forceOpen === undefined) {
      sheet.classList.toggle('hidden');
    } else if (forceOpen) {
      sheet.classList.remove('hidden');
      if (window.Studio3D) window.Studio3D.setCameraState('VANITY_VIEW');
    } else {
      sheet.classList.add('hidden');
      if (window.Studio3D) window.Studio3D.setCameraState('STUDIO_OVERVIEW');
    }
  }

  function serenCloseVanity() {
    serenOpenVanity(false);
  }

  function serenSwitchVanityTab(tabName, btn) {
    document.querySelectorAll('.vanity-seg-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const appView = document.getElementById('vanityAppearanceView');
    const photoView = document.getElementById('vanityPhotoView');

    if (tabName === 'appearance') {
      if (appView) appView.style.display = 'block';
      if (photoView) photoView.style.display = 'none';
    } else {
      if (appView) appView.style.display = 'none';
      if (photoView) photoView.style.display = 'block';
    }
  }

  function serenSetGender(gender, btn) {
    if (btn) {
      btn.parentElement.querySelectorAll('.vanity-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    }
    if (window.Studio3D) window.Studio3D.setGenderPresentation(gender);
    showToast(`Gender presentation set to ${gender}.`);
  }

  function serenSetSkinTone(hex, btn) {
    if (btn) {
      document.querySelectorAll('#skinToneSwatches .skin-swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    }
    if (window.Studio3D) window.Studio3D.setSkinTone(hex);
  }

  function serenSetHairStyle(styleName, btn) {
    if (btn) {
      document.querySelectorAll('#hairStyleChips .vanity-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    }
    if (window.Studio3D) window.Studio3D.setHairstyle(styleName);
  }

  function serenSetHairColor(hex, btn) {
    if (btn) {
      document.querySelectorAll('#hairColorSwatches .skin-swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    }
    if (window.Studio3D) window.Studio3D.setHairColor(hex);
  }

  function serenSetProportions(preset, btn) {
    if (btn) {
      document.querySelectorAll('#proportionChips .vanity-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    }
    if (window.Studio3D) window.Studio3D.setBodyProportions(preset);
    showToast(`Body proportions adjusted to ${preset}.`);
  }

  function serenToggleAccessory(name, btn) {
    if (btn) {
      btn.classList.toggle('active');
      const isActive = btn.classList.contains('active');
      if (window.Studio3D) window.Studio3D.toggleAccessory(name, isActive);
      showToast(`${name.charAt(0).toUpperCase() + name.slice(1)} ${isActive ? 'equipped' : 'removed'}.`);
    }
  }

  function serenSaveAvatarCustomization() {
    if (window.Studio3D) {
      window.Studio3D.savePreferences();
    }
    serenCloseVanity();
    showToast('Avatar appearance saved to your profile! ✨');
  }

  // Consent-Based Photo Match Integration
  let currentDetectedPhotoTone = '#F3D5C6';
  let currentDetectedHairTone = '#1E120A';

  function serenHandlePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;
      const previewImg = document.getElementById('photoPreviewImg');
      const dropzoneEmpty = document.getElementById('dropzoneEmpty');
      const dropzonePreview = document.getElementById('dropzonePreview');
      const analysisBox = document.getElementById('photoAnalysisBox');

      if (previewImg) previewImg.src = dataUrl;
      if (dropzoneEmpty) dropzoneEmpty.classList.add('hidden');
      if (dropzonePreview) dropzonePreview.classList.remove('hidden');

      // Local Canvas Tone Analysis (No server upload - 100% consent and privacy maintained)
      const img = new Image();
      img.onload = function () {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        const p1 = ctx.getImageData(32, 28, 1, 1).data;
        const p2 = ctx.getImageData(32, 8, 1, 1).data;

        const toHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        currentDetectedPhotoTone = toHex(p1[0], p1[1], p1[2]);
        currentDetectedHairTone = toHex(p2[0], p2[1], p2[2]);

        const skinEl = document.getElementById('detectedSkinColor');
        const hairEl = document.getElementById('detectedHairColor');
        if (skinEl) skinEl.style.background = currentDetectedPhotoTone;
        if (hairEl) hairEl.style.background = currentDetectedHairTone;

        if (analysisBox) analysisBox.classList.remove('hidden');
        showToast('✓ Photo analyzed locally with complete privacy.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function serenApplyPhotoMatch() {
    if (window.Studio3D) {
      window.Studio3D.setSkinTone(currentDetectedPhotoTone);
      window.Studio3D.setHairColor(currentDetectedHairTone);
      window.Studio3D.savePreferences();
      showToast('Personalized likeness tones applied to 3D avatar! ✨');
    }
    serenCloseVanity();
  }

  function updateSerenGreeting() {
    const greetingTimeTag = document.getElementById('greetingTimeTag');
    if (!greetingTimeTag) return;
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17) {
      timeGreeting = 'Good evening';
    }
    const userName = (state && state.profile && state.profile.name) ? state.profile.name : 'Suriya';
    greetingTimeTag.textContent = `${timeGreeting}, ${userName}`;
  }

  // =========================================================================
  // 9. DAILY OUTFIT-UPLOAD STREAK & COUNTDOWN TIMER SYSTEM
  // =========================================================================
  const STREAK_STORAGE_KEY = 'woobi_outfit_streak_v2';

  // Helper: Determine calendar monthly restore cycle key (refreshes on 3rd of every month)
  function getMonthlyRestoreCycleKey(dateObj) {
    const d = dateObj || new Date();
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)
    const day = d.getDate();

    if (day >= 3) {
      // Current cycle starts on 3rd of this month
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    } else {
      // Prior cycle: belongs to cycle starting on 3rd of previous month
      const prev = new Date(year, month - 1, 3);
      return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  // ==========================================================================
  // DAILY OUTFIT STREAK, CAMERA, MEMORIES & CIRCULAR CALENDAR SYSTEM
  // ==========================================================================

  let currentCalYear = new Date().getFullYear();
  let currentCalMonth = new Date().getMonth(); // 0-indexed
  let cameraStream = null;
  let capturedPhotoDataUrl = null;

  function getStreakEngine() {
    if (typeof window !== 'undefined' && window.WoobiCore && window.WoobiCore.streak) {
      return window.WoobiCore.streak;
    }
    return null;
  }

  function getStreakStatusSafe(engine) {
    if (!engine) return null;
    if (typeof engine.getStatus === 'function') return engine.getStatus();
    if (typeof engine.getStreakStatus === 'function') return engine.getStreakStatus();
    return engine.state || null;
  }

  function initStreakState() {
    const engine = getStreakEngine();
    if (engine) {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem('woobi_streak_user_mode');
        } catch (e) { }
      }

      state.streak = getStreakStatusSafe(engine);
      if (typeof engine.on === 'function') {
        engine.on('streak:updated', (data) => {
          state.streak = getStreakStatusSafe(engine);
          updateStreakUI();
          const modal = document.getElementById('streakDetailsModal');
          if (modal && !modal.classList.contains('hidden')) {
            renderStreakCalendar();
          }
        });
        engine.on('streak:broken', (data) => {
          state.streak = getStreakStatusSafe(engine);
          triggerFlameBlowoutAnimation();
          updateStreakUI();
          if (state.streak && state.streak.hasEarnedStreak && state.streak.savedPreviousStreak > 0) {
            setTimeout(() => showMissedStreakModal(), 1000);
          }
        });
        engine.on('streak:restored', () => {
          state.streak = getStreakStatusSafe(engine);
          updateStreakUI();
          const modal = document.getElementById('streakDetailsModal');
          if (modal && !modal.classList.contains('hidden')) {
            renderStreakCalendar();
          }
        });
      }
    } else {
      // Local fallback state while waiting for core engine
      if (!state.streak) {
        state.streak = {
          currentStreak: 0,
          bestStreak: 0,
          savedPreviousStreak: 0,
          isStreakBroken: false,
          hasEarnedStreak: false,
          uploadedToday: false,
          deadline: Date.now() + 24 * 3600 * 1000
        };
      }

      // Automatically hook into core engine as soon as module mounts
      if (typeof window !== 'undefined' && !window._coreStreakHookAttached) {
        window._coreStreakHookAttached = true;
        window.addEventListener('woobi:core:ready', () => {
          initStreakState();
        });
        let pollCount = 0;
        const poller = setInterval(() => {
          pollCount++;
          if (getStreakEngine()) {
            clearInterval(poller);
            initStreakState();
          } else if (pollCount > 40) {
            clearInterval(poller);
          }
        }, 50);
      }
    }

    // Start 1-second countdown ticker
    if (window._streakTicker) clearInterval(window._streakTicker);
    window._streakTicker = setInterval(tickStreakCountdown, 1000);

    // Initial UI render
    updateStreakUI();

    // Wire up header buttons directly for bulletproof responsiveness
    const streakBtn = document.getElementById('streakHeaderPill');
    if (streakBtn) {
      streakBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        handleStreakIconClick();
      };
    }
    const cameraBtn = document.getElementById('streakCameraBtn');
    if (cameraBtn) {
      cameraBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        openCameraModal();
      };
    }
    const galleryBtn = document.getElementById('streakGalleryBtn');
    if (galleryBtn) {
      galleryBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        openMemoriesModal();
      };
    }
    const calendarBtn = document.getElementById('streakCalendarBtn');
    if (calendarBtn) {
      calendarBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        openStreakModal();
      };
    }
    const accountBtn = document.getElementById('streakAccountBtn');
    if (accountBtn) {
      accountBtn.onclick = (e) => {
        if (e) e.stopPropagation();
        goToScreen('profile');
      };
    }

    // Only show missed streak modal if user had earned a streak previously!
    if (state.streak && state.streak.isStreakBroken && state.streak.savedPreviousStreak > 0) {
      setTimeout(() => showMissedStreakModal(), 800);
    }
  }

  function tickStreakCountdown() {
    const engine = getStreakEngine();
    if (engine) {
      state.streak = getStreakStatusSafe(engine);
    }
    checkStreakUrgency();
    updateStreakUI();
  }

  function checkStreakUrgency() {
    const streak = state.streak;
    if (!streak || streak.isStreakBroken || streak.uploadedToday) return;

    const msRemaining = Math.max(0, streak.deadline - Date.now());
    const TWO_HOURS_MS = 2 * 3600 * 1000;

    if (msRemaining <= TWO_HOURS_MS && msRemaining > 0 && !streak.urgentReminderSent) {
      streak.urgentReminderSent = true;
      sendDailyNotification(
        '⚠️ 2 Hours Left on Your Outfit Streak!',
        `Only 2 hours left to snap today's outfit before your 🔥 ${streak.currentStreak}-day streak ends!`,
        true
      );
    }
  }

  function triggerFlameBlowoutAnimation() {
    const fireImg = document.getElementById('streakHeaderFireImg');
    const smokeImg = document.getElementById('streakHeaderSmokeImg');
    if (fireImg) fireImg.classList.add('hidden');
    if (smokeImg) smokeImg.classList.remove('hidden');

    const heroFire = document.getElementById('modalHeroFireImg');
    const heroSmoke = document.getElementById('modalHeroSmokeImg');
    if (heroFire) heroFire.classList.add('hidden');
    if (heroSmoke) heroSmoke.classList.remove('hidden');

    const pill = document.getElementById('streakHeaderPill');
    if (pill) pill.classList.remove('urgent', 'completed');
  }

  function triggerFlameReigniteAnimation() {
    const fireImg = document.getElementById('streakHeaderFireImg');
    const smokeImg = document.getElementById('streakHeaderSmokeImg');
    if (smokeImg) smokeImg.classList.add('hidden');
    if (fireImg) {
      fireImg.classList.remove('hidden');
      fireImg.style.animation = 'none';
      void fireImg.offsetWidth; // Trigger reflow
      fireImg.style.animation = 'realisticFlameFlicker 0.6s ease-in-out infinite alternate';
      setTimeout(() => {
        if (fireImg) fireImg.style.animation = 'realisticFlameFlicker 2.2s ease-in-out infinite alternate';
      }, 1200);
    }

    const pill = document.getElementById('streakHeaderPill');
    if (pill) pill.classList.remove('broken-streak');
  }

  function updateStreakUI() {
    const engine = getStreakEngine();
    let streak = null;
    if (engine) {
      streak = getStreakStatusSafe(engine);
      state.streak = streak;
    } else {
      streak = state.streak;
    }
    if (!streak) return;

    const count = typeof streak.currentStreak === 'number' ? streak.currentStreak : 0;
    const streakCountEl = document.getElementById('streakCount');
    const streakCountLabelEl = document.getElementById('streakCountLabel');
    const streakPillEl = document.getElementById('streakHeaderPill');
    const fireImg = document.getElementById('streakHeaderFireImg');
    const smokeImg = document.getElementById('streakHeaderSmokeImg');

    if (streakCountEl) streakCountEl.textContent = count;
    if (streakCountLabelEl) {
      streakCountLabelEl.textContent = count === 1 ? 'Streak' : 'Streaks';
    }

    // Determine current fire level for trio header icon
    let headerLevel = 1;
    if (engine && typeof engine.getFireLevel === 'function') {
      headerLevel = engine.getFireLevel(count);
    } else {
      if (count >= 100) headerLevel = 5;
      else if (count >= 50) headerLevel = 4;
      else if (count >= 30) headerLevel = 3;
      else if (count >= 10) headerLevel = 2;
      else headerLevel = 1;
    }

    // If streak is zero OR broken, place the bonfire in the home icon!
    const isBroken = Boolean(streak.isStreakBroken);
    const shouldShowBonfire = count === 0 || isBroken;

    if (shouldShowBonfire) {
      if (fireImg) fireImg.classList.add('hidden');
      if (smokeImg) smokeImg.classList.remove('hidden');
      if (streakPillEl) {
        streakPillEl.classList.add('broken-streak');
        streakPillEl.title = isBroken
          ? 'Streak broken! Click to restore your streak'
          : 'Daily Outfit Streak: 0 Streaks (Click to view calendar)';
      }
    } else {
      if (fireImg) {
        fireImg.classList.remove('hidden');
        fireImg.src = `assets/streak/fire_level_${headerLevel}.png`;
        fireImg.className = `streak-header-icon-img fire-lvl-${headerLevel}`;
      }
      if (smokeImg) smokeImg.classList.add('hidden');
      if (streakPillEl) {
        streakPillEl.classList.remove('broken-streak');
        streakPillEl.title = `Daily Outfit Streak: ${count} ${count === 1 ? 'Streak' : 'Streaks'} (Click to view calendar)`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // WOOBI STREAK CALENDAR & CIRCULAR FIRE/SMOKE ANIMATION
  // --------------------------------------------------------------------------
  function handleStreakIconClick() {
    const engine = getStreakEngine();
    const status = getStreakStatusSafe(engine) || state.streak;

    // When streak is broken, clicking the wood and smoke icon opens the Restore option!
    if (status && status.isStreakBroken && status.hasEarnedStreak && status.savedPreviousStreak > 0) {
      showMissedStreakModal();
    } else {
      // Active streak opens the calendar
      openStreakModal();
    }
  }

  function openStreakModal() {
    const modal = document.getElementById('streakDetailsModal');
    if (!modal) return;
    const engine = getStreakEngine();
    // Default to reference October 2026 if user has not yet uploaded in November 2026
    if (engine && !engine.hasUploadedToday() && (!engine.memories || !engine.memories.some(m => m.date && m.date.startsWith('2026-11')))) {
      currentCalYear = 2026;
      currentCalMonth = 9; // October (0-indexed)
    }
    renderStreakCalendar();
    modal.classList.remove('hidden');
  }

  function closeStreakModal() {
    const modal = document.getElementById('streakDetailsModal');
    if (modal) modal.classList.add('hidden');
  }

  function prevCalendarMonth() {
    currentCalMonth -= 1;
    if (currentCalMonth < 0) {
      currentCalMonth = 11;
      currentCalYear -= 1;
    }
    renderStreakCalendar();
  }

  function nextCalendarMonth() {
    currentCalMonth += 1;
    if (currentCalMonth > 11) {
      currentCalMonth = 0;
      currentCalYear += 1;
    }
    renderStreakCalendar();
  }

  function renderStreakCalendar() {
    const engine = getStreakEngine();
    const streak = getStreakStatusSafe(engine) || state.streak || { currentStreak: 0 };
    const curStreak = typeof streak.currentStreak === 'number' ? streak.currentStreak : 0;

    let tierLevel = 1;
    let tierName = 'First Fire';
    if (engine && typeof engine.getFireLevel === 'function') {
      tierLevel = engine.getFireLevel(curStreak);
      tierName = engine.getFireLevelName(curStreak);
    } else {
      if (curStreak >= 100) { tierLevel = 5; tierName = 'Final Fire'; }
      else if (curStreak >= 50) { tierLevel = 4; tierName = 'Fourth Fire'; }
      else if (curStreak >= 30) { tierLevel = 3; tierName = 'Third Fire'; }
      else if (curStreak >= 10) { tierLevel = 2; tierName = 'Second Fire'; }
      else { tierLevel = 1; tierName = 'First Fire'; }
    }

    const tierTextEl = document.getElementById('calTierText');
    if (tierTextEl) {
      tierTextEl.textContent = `${curStreak} ${curStreak === 1 ? 'Day' : 'Days'} Streak • ${tierName}`;
    }
    const tierFlameIconEl = document.getElementById('calTierFlameIcon');
    if (tierFlameIconEl) {
      tierFlameIconEl.innerHTML = `<img src="assets/streak/fire_level_${tierLevel}.png?v=20261104_4" class="cal-pill-fire-img" alt="Flame" />`;
    }
    const badge = document.getElementById('calHeaderStreakBadge');
    if (badge && !tierTextEl) {
      badge.textContent = `🔥 Current Streak: ${curStreak} ${curStreak === 1 ? 'Streak' : 'Streaks'}`;
    }

    let calData = null;
    if (engine && typeof engine.getMonthlyCalendarData === 'function') {
      calData = engine.getMonthlyCalendarData(currentCalYear, currentCalMonth);
    } else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const firstDay = new Date(currentCalYear, currentCalMonth, 1).getDay();
      const totalDays = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
      const now = new Date();
      const isCurMonth = now.getFullYear() === currentCalYear && now.getMonth() === currentCalMonth;
      const todayDate = now.getDate();
      const days = [];
      let runningStreak = 0;
      let activeDays = 0;
      let brokenDays = 0;
      let upcomingDays = 0;

      for (let d = 1; d <= totalDays; d++) {
        let status = 'upcoming';
        let fireLvl = 1;
        if (isCurMonth && d === todayDate) {
          status = 'today';
          upcomingDays++;
        } else if (isCurMonth && d < todayDate) {
          status = 'completed';
          activeDays++;
          runningStreak++;
          if (runningStreak >= 100) fireLvl = 5;
          else if (runningStreak >= 50) fireLvl = 4;
          else if (runningStreak >= 30) fireLvl = 3;
          else if (runningStreak >= 10) fireLvl = 2;
          else fireLvl = 1;
        } else {
          upcomingDays++;
        }
        days.push({ day: d, status, fireLevel: fireLvl });
      }

      calData = {
        year: currentCalYear,
        month: currentCalMonth,
        monthName: monthNames[currentCalMonth],
        totalDays,
        firstDayOfWeek: firstDay,
        days,
        stats: { activeDays, brokenDays, upcomingDays }
      };
    }

    const titleEl = document.getElementById('streakCalMonthTitle');
    const gridEl = document.getElementById('streakCalendarGrid');
    const activeEl = document.getElementById('calActiveCount');
    const brokenEl = document.getElementById('calBrokenCount');
    const upcomingEl = document.getElementById('calUpcomingCount');

    if (titleEl) {
      titleEl.textContent = `${calData.monthName} ${calData.year} ▾`;
    }

    if (activeEl) activeEl.textContent = calData.stats.activeDays;
    if (brokenEl) brokenEl.textContent = calData.stats.brokenDays;
    if (upcomingEl) upcomingEl.textContent = calData.stats.upcomingDays;

    if (!gridEl) return;
    gridEl.innerHTML = '';

    // Helper: Creates high-performance animated SVG with flowing fire streaks
    function createFlowingFireElement(level = 1) {
      const wrap = document.createElement('div');
      wrap.className = `flowing-fire-wrap fire-lvl-${level}`;
      wrap.innerHTML = `
        <svg class="flowing-fire-svg" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flameOuterGrad" x1="19" y1="44" x2="19" y2="2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FF2E00"/>
              <stop offset="30%" stop-color="#FF6A00"/>
              <stop offset="70%" stop-color="#FFA600"/>
              <stop offset="100%" stop-color="#FFF3A5"/>
            </linearGradient>
            <linearGradient id="flameCoreGrad" x1="19" y1="42" x2="19" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FF8A00"/>
              <stop offset="50%" stop-color="#FFDE3B"/>
              <stop offset="100%" stop-color="#FFFFFF"/>
            </linearGradient>
            <linearGradient id="flameStreakGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="#FF4500" stop-opacity="0.1"/>
              <stop offset="45%" stop-color="#FFB800" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#FFFFE8" stop-opacity="0.1"/>
            </linearGradient>
          </defs>
          <ellipse cx="19" cy="39" rx="14" ry="6" fill="#FFA500" class="fire-ambient-glow"/>
          <path class="flame-body-path" fill="url(#flameOuterGrad)"
            d="M19 2 C16 9 9 16 9 27 C9 36 13 42 19 43 C25 42 29 36 29 27 C29 16 22 9 19 2 Z"/>
          <path class="fire-flowing-streak streak-left" fill="url(#flameStreakGrad)"
            d="M14 36 C12 30 11 23 17 15 C15 21 14 28 16 35 Z"/>
          <path class="fire-flowing-streak streak-right" fill="url(#flameStreakGrad)"
            d="M24 36 C26 30 27 23 21 15 C23 21 24 28 22 35 Z"/>
          <path class="fire-flowing-streak streak-center" fill="url(#flameStreakGrad)"
            d="M18 32 C16 24 18 14 19 5 C20 14 22 24 20 32 Z"/>
          <path class="flame-core-path" fill="url(#flameCoreGrad)"
            d="M19 21 C16 26 14 30 14 36 C14 41 16 42 19 42 C22 42 24 41 24 36 C24 30 22 26 19 21 Z"/>
          <circle cx="15" cy="20" r="1.1" fill="#FFF4A3" class="flowing-ember ember-1"/>
          <circle cx="23" cy="16" r="1.0" fill="#FFCF5C" class="flowing-ember ember-2"/>
          <circle cx="19" cy="9"  r="1.2" fill="#FFFFFF" class="flowing-ember ember-3"/>
        </svg>
      `;
      return wrap;
    }

    // 1. Render empty offset slots for start of month (soft recessed placeholder tiles)
    for (let i = 0; i < calData.firstDayOfWeek; i++) {
      const emptySlot = document.createElement('div');
      emptySlot.className = 'date-tile-empty-recessed streak-cal-slot-empty';
      gridEl.appendChild(emptySlot);
    }

    // 2. Render each day in 3D Recessed Tile format with circular Crater Sockets
    calData.days.forEach(dayInfo => {
      const tile = document.createElement('div');
      tile.className = `date-tile-recessed ${dayInfo.status}`;
      tile.title = `${calData.monthName} ${dayInfo.day}: ${dayInfo.status.toUpperCase()}`;

      // Date number at top-left
      const numSpan = document.createElement('span');
      numSpan.className = 'date-tile-num';
      numSpan.textContent = dayInfo.day;
      tile.appendChild(numSpan);

      // Inner circular crater socket
      const crater = document.createElement('div');
      crater.className = `crater-socket ${dayInfo.status}-crater`;

      if (dayInfo.status === 'completed') {
        const lvl = Math.min(5, Math.max(1, dayInfo.fireLevel || 1));
        const delay = ((dayInfo.day * 0.19) % 1.6).toFixed(2);

        const fireWrap = document.createElement('div');
        fireWrap.className = `streak-cell-fire-wrap fire-lvl-${lvl} burning-flow-active fire-shaking-active`;
        fireWrap.style.animationDelay = `${delay}s`;

        const fireImg = document.createElement('img');
        fireImg.src = `assets/streak/fire_level_${lvl}.png?v=20261104_3`;
        fireImg.alt = `Streak Fire Level ${lvl}`;
        fireImg.className = `streak-cell-fire-img fire-lvl-${lvl}-img`;
        fireImg.style.animationDelay = `${delay}s`;
        fireImg.onerror = () => {
          fireImg.src = 'assets/streak/reference_flame_sample.png';
        };

        fireWrap.appendChild(fireImg);
        crater.appendChild(fireWrap);
      } else if (dayInfo.status === 'missed') {
        const delay = ((dayInfo.day * 0.23) % 2.1).toFixed(2);

        const bonfireWrap = document.createElement('div');
        bonfireWrap.className = 'streak-cell-bonfire-wrap bonfire-smoke-active';
        bonfireWrap.style.animationDelay = `${delay}s`;

        const bonfireImg = document.createElement('img');
        bonfireImg.src = `assets/streak/bonfire_smoke.png?v=20261104_1`;
        bonfireImg.alt = 'Missed Bonfire Smoke';
        bonfireImg.className = 'crater-bonfire-img animated-bonfire-smoke';
        bonfireImg.style.animationDelay = `${delay}s`;
        bonfireImg.onerror = () => {
          bonfireImg.src = 'assets/streak/reference_campfire_sample.png';
        };

        bonfireWrap.appendChild(bonfireImg);
        crater.appendChild(bonfireWrap);
      } else if (dayInfo.status === 'today') {
        const dot = document.createElement('div');
        dot.className = 'today-pulse-dot';
        crater.appendChild(dot);
      }

      tile.appendChild(crater);

      // Interactive Click Handling
      tile.addEventListener('click', () => {
        if (dayInfo.status === 'completed' && dayInfo.memory) {
          openMemoryDetail(dayInfo.memory.id);
        } else if (dayInfo.status === 'today') {
          closeStreakModal();
          openCameraModal();
        } else if (dayInfo.status === 'missed') {
          showMissedStreakModal();
        } else {
          showToast(`📅 ${calData.monthName} ${dayInfo.day}: ${dayInfo.status.charAt(0).toUpperCase() + dayInfo.status.slice(1)}`);
        }
      });

      gridEl.appendChild(tile);
    });
  }

  // --------------------------------------------------------------------------
  // DAILY STREAK CAMERA & CAPTURE
  // --------------------------------------------------------------------------
  async function openCameraModal() {
    const modal = document.getElementById('outfitCameraModal');
    if (!modal) return;

    capturedPhotoDataUrl = null;

    // Reset controls visibility
    const liveControls = document.getElementById('cameraLiveControls');
    const reviewControls = document.getElementById('cameraReviewContainer');
    const previewImg = document.getElementById('cameraCapturedPreview');
    const videoEl = document.getElementById('cameraVideo');
    const fallbackCard = document.getElementById('cameraFallbackCard');
    const overlayFrame = document.getElementById('cameraOverlayFrame');

    if (liveControls) liveControls.classList.remove('hidden');
    if (reviewControls) reviewControls.classList.add('hidden');
    if (previewImg) previewImg.classList.add('hidden');
    if (overlayFrame) overlayFrame.classList.remove('hidden');

    // Update streak advance numbers in review
    const currVal = document.getElementById('cameraCurrentStreakVal');
    const newVal = document.getElementById('cameraNewStreakVal');
    const engine = getStreakEngine();
    const streak = getStreakStatusSafe(engine) || state.streak || { currentStreak: 0 };
    const curStreak = typeof streak.currentStreak === 'number' ? streak.currentStreak : 0;
    const isAlreadyLogged = engine && typeof engine.hasUploadedToday === 'function' ? engine.hasUploadedToday() : false;

    if (currVal) currVal.textContent = curStreak;
    if (newVal) {
      newVal.textContent = isAlreadyLogged ? curStreak : (curStreak + 1);
    }

    const dupWarning = document.getElementById('cameraDuplicateWarning');
    const btnConfirm = document.getElementById('btnConfirmCapturedOutfit');

    if (dupWarning) {
      dupWarning.classList.toggle('hidden', !isAlreadyLogged);
      if (isAlreadyLogged) {
        dupWarning.innerHTML = `<span>✨ Streak for today completed (🔥 ${curStreak} ${curStreak === 1 ? 'Streak' : 'Streaks'}). Extra photos are saved to your Gallery!</span>`;
      }
    }
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.textContent = isAlreadyLogged ? 'Add Photo to Gallery 📸' : 'Confirm & Log Outfit 🔥';
    }

    modal.classList.remove('hidden');

    // Initialize Camera Stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } }
        });
        if (videoEl) {
          videoEl.srcObject = cameraStream;
          videoEl.classList.remove('hidden');
          videoEl.play();
        }
        if (fallbackCard) fallbackCard.classList.add('hidden');
      } catch (err) {
        console.warn('Camera stream inaccessible, activating fallback:', err.message);
        if (videoEl) videoEl.classList.add('hidden');
        if (fallbackCard) fallbackCard.classList.remove('hidden');
      }
    } else {
      if (videoEl) videoEl.classList.add('hidden');
      if (fallbackCard) fallbackCard.classList.remove('hidden');
    }
  }

  function closeCameraModal() {
    const modal = document.getElementById('outfitCameraModal');
    if (modal) modal.classList.add('hidden');

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }

  function captureCameraSnapshot() {
    const videoEl = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const previewImg = document.getElementById('cameraCapturedPreview');
    const overlayFrame = document.getElementById('cameraOverlayFrame');
    const liveControls = document.getElementById('cameraLiveControls');
    const reviewControls = document.getElementById('cameraReviewContainer');

    if (!videoEl || !canvas || videoEl.classList.contains('hidden') || !videoEl.videoWidth) {
      // Fallback: load curated outfit look
      loadSampleOutfitLook();
      return;
    }

    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    capturedPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    if (previewImg) {
      previewImg.src = capturedPhotoDataUrl;
      previewImg.classList.remove('hidden');
    }

    if (videoEl) videoEl.classList.add('hidden');
    if (overlayFrame) overlayFrame.classList.add('hidden');
    if (liveControls) liveControls.classList.add('hidden');
    if (reviewControls) reviewControls.classList.remove('hidden');
  }

  function triggerFileInputClick() {
    const fileInput = document.getElementById('outfitPhotoInput');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  function handleOutfitPhotoSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      capturedPhotoDataUrl = e.target.result;
      const previewImg = document.getElementById('cameraCapturedPreview');
      const videoEl = document.getElementById('cameraVideo');
      const overlayFrame = document.getElementById('cameraOverlayFrame');
      const fallbackCard = document.getElementById('cameraFallbackCard');
      const liveControls = document.getElementById('cameraLiveControls');
      const reviewControls = document.getElementById('cameraReviewContainer');

      if (previewImg) {
        previewImg.src = capturedPhotoDataUrl;
        previewImg.classList.remove('hidden');
      }
      if (videoEl) videoEl.classList.add('hidden');
      if (fallbackCard) fallbackCard.classList.add('hidden');
      if (overlayFrame) overlayFrame.classList.add('hidden');
      if (liveControls) liveControls.classList.add('hidden');
      if (reviewControls) reviewControls.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function loadSampleOutfitLook() {
    const samples = [
      { img: 'assets/navy_shirt.jpg', note: 'Tailored Navy Oxford & Sand Chinos' },
      { img: 'assets/white_linen_shirt.jpg', note: 'Relaxed White Linen Classic' },
      { img: 'assets/smart_blazer.jpg', note: 'Executive Structured Autumn Blazer' },
      { img: 'assets/terracotta_tee.jpg', note: 'Casual Earth Tone Terracotta Tee' },
      { img: 'assets/indigo_kurti.jpg', note: 'Festive Indigo Silk Ensemble' }
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    capturedPhotoDataUrl = picked.img;

    const previewImg = document.getElementById('cameraCapturedPreview');
    const noteInput = document.getElementById('cameraOutfitNoteInput');
    const videoEl = document.getElementById('cameraVideo');
    const overlayFrame = document.getElementById('cameraOverlayFrame');
    const fallbackCard = document.getElementById('cameraFallbackCard');
    const liveControls = document.getElementById('cameraLiveControls');
    const reviewControls = document.getElementById('cameraReviewContainer');

    if (previewImg) {
      previewImg.src = capturedPhotoDataUrl;
      previewImg.classList.remove('hidden');
    }
    if (noteInput) noteInput.value = picked.note;

    if (videoEl) videoEl.classList.add('hidden');
    if (fallbackCard) fallbackCard.classList.add('hidden');
    if (overlayFrame) overlayFrame.classList.add('hidden');
    if (liveControls) liveControls.classList.add('hidden');
    if (reviewControls) reviewControls.classList.remove('hidden');
  }

  function retakeCameraPhoto() {
    capturedPhotoDataUrl = null;
    const previewImg = document.getElementById('cameraCapturedPreview');
    const videoEl = document.getElementById('cameraVideo');
    const overlayFrame = document.getElementById('cameraOverlayFrame');
    const liveControls = document.getElementById('cameraLiveControls');
    const reviewControls = document.getElementById('cameraReviewContainer');

    if (previewImg) previewImg.classList.add('hidden');
    if (videoEl) videoEl.classList.remove('hidden');
    if (overlayFrame) overlayFrame.classList.remove('hidden');
    if (liveControls) liveControls.classList.remove('hidden');
    if (reviewControls) reviewControls.classList.add('hidden');
  }

  function confirmCapturedOutfit() {
    const engine = getStreakEngine();
    const noteInput = document.getElementById('cameraOutfitNoteInput');
    const note = noteInput ? noteInput.value : '';

    if (!engine) {
      showToast('⚠️ Streak state engine initializing...');
      return;
    }

    const res = engine.recordDailyOutfitUpload({
      photoUrl: capturedPhotoDataUrl || 'assets/welcome_hero.jpg',
      note: note.trim()
    });

    closeCameraModal();
    triggerFlameReigniteAnimation();
    updateStreakUI();

    if (!res.success && res.alreadyUploaded) {
      showToast(`📸 Outfit photo added to Gallery! Streak remains at ${res.streak} (1 per day).`);
      return;
    }

    showToast(`🔥 Streak increased to ${res.streak}! Outfit memory saved!`);
  }

  // --------------------------------------------------------------------------
  // OUTFIT MEMORIES GALLERY & LIGHTBOX
  // --------------------------------------------------------------------------
  function openMemoriesModal() {
    renderOutfitMemories();
    const modal = document.getElementById('outfitMemoriesModal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeMemoriesModal() {
    const modal = document.getElementById('outfitMemoriesModal');
    if (modal) modal.classList.add('hidden');
  }

  function renderOutfitMemories() {
    const engine = getStreakEngine();
    const memories = (engine && typeof engine.getAllMemories === 'function') ? engine.getAllMemories() : [];
    const gridEl = document.getElementById('memoriesGridContainer');
    const countBadge = document.getElementById('memoriesTotalCountBadge');

    if (countBadge) countBadge.textContent = `${memories.length} Memories Logged`;
    if (!gridEl) return;

    gridEl.innerHTML = '';

    if (memories.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: #8C755E;">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📷</span>
          <p style="font-size: 0.9rem; margin: 0;">No memories logged yet. Snap your first outfit today to start your streak!</p>
        </div>
      `;
      return;
    }

    memories.forEach(mem => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.innerHTML = `
        <div class="memory-thumb-wrap">
          <img src="${mem.photoUrl}" class="memory-thumb-img" alt="${mem.note}" />
          <span class="memory-streak-badge">Day ${mem.streakDay || 1} 🔥</span>
        </div>
        <div class="memory-card-meta">
          <span class="memory-card-date">${formatReadableDate(mem.date)}</span>
          <span class="memory-card-note">${mem.note || 'Outfit Look'}</span>
        </div>
      `;
      card.addEventListener('click', () => openMemoryDetail(mem.id));
      gridEl.appendChild(card);
    });
  }

  function formatReadableDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    return dateStr;
  }

  function openMemoryDetail(memoryId) {
    const engine = getStreakEngine();
    if (!engine) return;

    const memory = engine.memories.find(m => m.id === memoryId) || engine.memories[0];
    if (!memory) return;

    const modal = document.getElementById('memoryDetailModal');
    const imgEl = document.getElementById('memoryDetailImg');
    const dateTitle = document.getElementById('memoryDetailDateTitle');
    const streakTag = document.getElementById('memoryDetailStreakTag');
    const noteEl = document.getElementById('memoryDetailNote');
    const timeEl = document.getElementById('memoryDetailTimestamp');

    if (imgEl) imgEl.src = memory.photoUrl;
    if (dateTitle) dateTitle.textContent = formatReadableDate(memory.date);
    if (streakTag) streakTag.textContent = `Day ${memory.streakDay || 1} 🔥`;
    if (noteEl) noteEl.textContent = memory.note || 'Daily Outfit Look';
    if (timeEl) timeEl.textContent = `Logged on ${memory.date}`;

    if (modal) modal.classList.remove('hidden');
  }

  function closeMemoryDetailModal() {
    const modal = document.getElementById('memoryDetailModal');
    if (modal) modal.classList.add('hidden');
  }

  // --------------------------------------------------------------------------
  // MISSED STREAK & MONTHLY RESTORATION LOGIC
  // --------------------------------------------------------------------------
  function showMissedStreakModal() {
    const streak = state.streak;
    // DO NOT show lost streak to new user who has never earned one!
    if (!streak || !streak.hasEarnedStreak || (streak.currentStreak === 0 && streak.savedPreviousStreak === 0)) {
      return;
    }

    const modal = document.getElementById('missedStreakModal');
    if (!modal) return;

    const lostCountEl = document.getElementById('missedStreakLostCount');
    const statusCard = document.getElementById('restoreStatusCard');
    const statusIcon = document.getElementById('restoreStatusIcon');
    const statusTitle = document.getElementById('restoreStatusTitle');
    const statusSubtitle = document.getElementById('restoreStatusSubtitle');
    const btnRestore = document.getElementById('btnRestoreStreak');

    if (lostCountEl) lostCountEl.textContent = `${streak.savedPreviousStreak || 1} Days`;

    const engine = getStreakEngine();
    const isEligible = engine ? engine.isMonthlyRestoreAvailable() : true;
    const nextRefresh = engine ? engine.getNextRestoreRefreshDateStr() : 'the 3rd';

    if (isEligible) {
      if (statusCard) statusCard.classList.remove('ineligible');
      if (statusIcon) statusIcon.textContent = '✨';
      if (statusTitle) statusTitle.textContent = 'Monthly Restoration Available!';
      if (statusSubtitle) statusSubtitle.textContent = 'You have 1 free restore for this monthly cycle. (Refreshes on the 3rd of every month)';
      if (btnRestore) {
        btnRestore.disabled = false;
        btnRestore.textContent = `Restore Streak (${streak.savedPreviousStreak || 1} Days) 🔥`;
      }
    } else {
      if (statusCard) statusCard.classList.add('ineligible');
      if (statusIcon) statusIcon.textContent = '🔒';
      if (statusTitle) statusTitle.textContent = 'Monthly Restore Used for this Cycle';
      if (statusSubtitle) statusSubtitle.textContent = `Your free restore refreshes on ${nextRefresh}.`;
      if (btnRestore) {
        btnRestore.disabled = true;
        btnRestore.textContent = `Restore Used (Refreshes ${nextRefresh})`;
      }
    }

    modal.classList.remove('hidden');
  }

  function closeMissedStreakModal() {
    const modal = document.getElementById('missedStreakModal');
    if (modal) modal.classList.add('hidden');
  }

  function restoreMonthlyStreak() {
    const engine = getStreakEngine();
    if (!engine) return;

    if (!engine.isMonthlyRestoreAvailable()) {
      showToast(`⚠️ Monthly restore unavailable: Already used for this calendar month. Refreshes on ${engine.getNextRestoreRefreshDateStr()}.`);
      return;
    }

    const previousStreak = engine.state.savedPreviousStreak || 1;
    const confirmed = window.confirm(
      `Restore your previous streak of ${previousStreak} days?\n\nNote: You can only restore your streak once per calendar month.`
    );
    if (!confirmed) return;

    const res = engine.restoreMonthlyStreak();
    if (!res.success) {
      showToast(`⚠️ ${res.error || 'Monthly restore unavailable.'}`);
      return;
    }

    closeMissedStreakModal();
    triggerFlameReigniteAnimation();
    updateStreakUI();
    renderStreakCalendar();
    showToast(`✨ Streak restored to ${res.streak} days! Your burning flame is back! 🔥`);
  }

  function startNewStreak() {
    const engine = getStreakEngine();
    if (engine) engine.startFreshStreak();

    closeMissedStreakModal();
    updateStreakUI();
    showToast('Starting a fresh streak! Upload today\'s outfit to light your 🔥 flame.');
  }

  // --------------------------------------------------------------------------
  // DAILY NOTIFICATIONS & REMINDER SYSTEM
  // --------------------------------------------------------------------------
  function sendDailyNotification(title, body, isUrgent) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: 'assets/streak_fire.jpg' });
      } catch (e) {
        console.warn('System notification error', e);
      }
    }

    const banner = document.getElementById('inAppReminderBanner');
    const titleEl = document.getElementById('reminderBannerTitle');
    const bodyEl = document.getElementById('reminderBannerBody');
    const iconEl = document.getElementById('reminderBannerIcon');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    if (iconEl) iconEl.innerHTML = isUrgent ? '<span>⚠️</span>' : '<span>🔥</span>';

    if (banner) {
      banner.classList.toggle('urgent', isUrgent);
      banner.classList.remove('hidden');
    }
  }

  function dismissReminderBanner() {
    const banner = document.getElementById('inAppReminderBanner');
    if (banner) banner.classList.add('hidden');
  }

  // --------------------------------------------------------------------------
  // QA SIMULATION TOOLS
  // --------------------------------------------------------------------------
  function devSimulateUpload() {
    openCameraModal();
    loadSampleOutfitLook();
  }

  function devSimulateTwoHoursLeft() {
    const engine = getStreakEngine();
    if (!engine) return;
    engine.state.deadline = Date.now() + (1 * 3600 * 1000 + 59 * 60 * 1000);
    engine.state.urgentReminderSent = false;
    engine.state.uploadedToday = false;
    engine.state.isStreakBroken = false;
    engine.save();
    updateStreakUI();
    showToast('⏱️ Simulated: Exactly 1h 59m remaining (2-hour warning triggered)');
  }

  function devSimulateStreakBreak() {
    const engine = getStreakEngine();
    if (!engine) return;
    if (engine.state.currentStreak > 0) {
      engine.state.savedPreviousStreak = engine.state.currentStreak;
    }
    engine.state.deadline = Date.now() - 1000;
    engine.state.uploadedToday = false;
    engine.state.isStreakBroken = true;
    engine.state.currentStreak = 0;
    engine.save();
    triggerFlameBlowoutAnimation();
    updateStreakUI();
    showToast('💥 Simulated deadline expiration: Streak broken!');
    setTimeout(() => showMissedStreakModal(), 600);
  }

  function devToggleRestoreToken() {
    const engine = getStreakEngine();
    if (!engine) return;
    const currentCycle = engine.getMonthlyRestoreCycleKey();
    if (engine.state.lastRestoredCycleKey === currentCycle) {
      engine.state.lastRestoredCycleKey = null;
      showToast('🔄 Restored Monthly Token: Now ELIGIBLE for 3rd date cycle!');
    } else {
      engine.state.lastRestoredCycleKey = currentCycle;
      showToast('🔒 Marked Monthly Token as USED for current cycle.');
    }
    engine.save();
    updateStreakUI();
  }

  function devResetStreak() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STREAK_STORAGE_KEY);
      localStorage.removeItem('woobi_outfit_streak_v2');
      localStorage.removeItem('woobi_outfit_memories_v1');
    }
    const engine = getStreakEngine();
    if (engine) {
      engine.state.currentStreak = 0;
      engine.state.bestStreak = 0;
      engine.state.savedPreviousStreak = 0;
      engine.state.isStreakBroken = false;
      engine.state.hasEarnedStreak = false;
      engine.state.uploadedToday = false;
      engine.state.lastUploadDateStr = null;
      engine.state.lastRestoredCycleKey = null;
      engine.memories = [];
      engine.save();
    }
    initStreakState();
    showToast('🗑️ Reset streak to fresh starter state (0 days, no lost streak).');
  }

  function resetTestData() {
    const engine = getStreakEngine();
    if (engine && typeof engine.resetTestData === 'function') {
      engine.resetTestData();
    }
    state.streak = getStreakStatusSafe(engine);
    updateStreakUI();
    renderStreakCalendar();
    showToast('🔥 Reset 136-day test data (June 21 – Today) with Level 5 fire!');
  }

  function toggleTestUserMode() {
    const engine = getStreakEngine();
    if (!engine) return;
    const isTest = typeof engine.isTestUser === 'function' ? engine.isTestUser() : false;
    if (isTest) {
      if (typeof engine.switchToRealUser === 'function') {
        engine.switchToRealUser('user_real');
      }
      showToast('Switched to Real User mode (Authentic streaks).');
    } else {
      if (typeof engine.loadTestUserStreak136 === 'function') {
        engine.loadTestUserStreak136();
      }
      showToast('Switched to Test User (136-day streak with Level 5 fire)!');
    }
    state.streak = getStreakStatusSafe(engine);
    updateStreakUI();
    renderStreakCalendar();
  }

  // Legacy compatibility helpers
  function triggerOutfitPhotoUpload() {
    openCameraModal();
  }

  function openPhotoConfirmModal(imgUrl) {
    capturedPhotoDataUrl = imgUrl;
    openCameraModal();
  }

  function closePhotoConfirmModal() {
    closeCameraModal();
  }

  function confirmOutfitPhotoUpload() {
    confirmCapturedOutfit();
  }

  // =========================================================================
  // 9B. CLOTHING CAPTURE SYSTEM (SHIRT, PANT, SHOE SILHOUETTES & REVIEW)
  // =========================================================================
  let fallbackClothingState = null;
  let clothingCameraStream = null;
  let currentClothingPhotoDataUrl = null;
  let clothingCameraFacingMode = 'environment';
  let activeLightboxItem = null;

  function getClothingCaptureEngine() {
    if (typeof window !== 'undefined' && window.WoobiCore && window.WoobiCore.clothingCapture) {
      return window.WoobiCore.clothingCapture;
    }
    if (!fallbackClothingState) {
      fallbackClothingState = {
        captured: { shirt: [], pant: [], shoe: [] },
        activeCategory: 'shirt',
        limits: { shirt: 7, pant: 7, shoe: 2 },
        setActiveCategory(c) { this.activeCategory = (c || 'shirt').toLowerCase(); return this.activeCategory; },
        getActiveCategory() { return this.activeCategory; },
        canAdd(c = this.activeCategory) {
          const cat = (c || 'shirt').toLowerCase();
          return (this.captured[cat] || []).length < (this.limits[cat] || 0);
        },
        getRemainingSlots(c = this.activeCategory) {
          const cat = (c || 'shirt').toLowerCase();
          return Math.max(0, (this.limits[cat] || 0) - (this.captured[cat] || []).length);
        },
        getSlotSummary() {
          const s = this.captured.shirt.length, p = this.captured.pant.length, sh = this.captured.shoe.length;
          return {
            shirt: { count: s, max: 7, remaining: Math.max(0, 7 - s), isFull: s >= 7 },
            pant: { count: p, max: 7, remaining: Math.max(0, 7 - p), isFull: p >= 7 },
            shoe: { count: sh, max: 2, remaining: Math.max(0, 2 - sh), isFull: sh >= 2 },
            total: { count: s + p + sh, max: 16, remaining: Math.max(0, 16 - (s + p + sh)), isFull: (s + p + sh) >= 16 },
            activeCategory: this.activeCategory
          };
        },
        addConfirmedPhoto(cat, photo, meta = {}) {
          const c = (cat || this.activeCategory).toLowerCase();
          const limit = this.limits[c] || 7;
          if ((this.captured[c] || []).length >= limit) {
            return { success: false, error: `Maximum limit of ${limit} reached for ${c}` };
          }
          const item = {
            id: `capture_${c}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            category: c,
            internalCategory: c === 'shirt' ? 'Tops' : (c === 'pant' ? 'Bottoms' : 'Shoes'),
            name: meta.name || `${c.charAt(0).toUpperCase() + c.slice(1)} #${(this.captured[c] || []).length + 1}`,
            photo,
            timestamp: Date.now(),
            condition: 'clean',
            fit: 'perfect'
          };
          this.captured[c].push(item);
          return { success: true, item, summary: this.getSlotSummary() };
        },
        removePhoto(cat, id) {
          const c = (cat || '').toLowerCase();
          const list = this.captured[c] || [];
          const idx = list.findIndex(i => i.id === id);
          if (idx !== -1) {
            const [removed] = list.splice(idx, 1);
            return { success: true, removedItem: removed, freedSlot: true, summary: this.getSlotSummary() };
          }
          return { success: false, error: 'Item not found' };
        },
        getPhotos(c) {
          const cat = (c || '').toLowerCase();
          return cat ? [...(this.captured[cat] || [])] : {
            shirt: [...this.captured.shirt],
            pant: [...this.captured.pant],
            shoe: [...this.captured.shoe]
          };
        },
        getAllPhotos() {
          return [...this.captured.shirt, ...this.captured.pant, ...this.captured.shoe];
        },
        getTotalCount() {
          return this.captured.shirt.length + this.captured.pant.length + this.captured.shoe.length;
        },
        clearAll() {
          this.captured = { shirt: [], pant: [], shoe: [] };
        },
        exportToWardrobeItems() {
          return this.getAllPhotos().map((item, idx) => ({
            id: `wardrobe_item_${Date.now()}_${idx}_${item.id}`,
            name: item.name,
            category: item.internalCategory,
            subCategory: item.category.charAt(0).toUpperCase() + item.category.slice(1),
            photo: item.photo,
            condition: 'clean',
            fit: 'perfect',
            capturedVia: 'clothing_silhouette_capture',
            dateAdded: new Date(item.timestamp || Date.now()).toISOString()
          }));
        }
      };
    }
    return fallbackClothingState;
  }

  function openClothingCaptureMenu() {
    const modal = document.getElementById('clothingCaptureMenuModal');
    if (!modal) return;

    const engine = getClothingCaptureEngine();
    const summary = engine.getSlotSummary();

    const sBadge = document.getElementById('menuShirtSlots');
    const pBadge = document.getElementById('menuPantSlots');
    const shBadge = document.getElementById('menuShoeSlots');
    const reviewBtn = document.getElementById('menuReviewBtn');
    const reviewBtnText = document.getElementById('menuReviewBtnText');

    if (sBadge) {
      sBadge.textContent = `${summary.shirt.count} / ${summary.shirt.max}`;
      sBadge.classList.toggle('full', summary.shirt.isFull);
    }
    if (pBadge) {
      pBadge.textContent = `${summary.pant.count} / ${summary.pant.max}`;
      pBadge.classList.toggle('full', summary.pant.isFull);
    }
    if (shBadge) {
      shBadge.textContent = `${summary.shoe.count} / ${summary.shoe.max}`;
      shBadge.classList.toggle('full', summary.shoe.isFull);
    }

    if (reviewBtn && reviewBtnText) {
      reviewBtnText.textContent = `Review Captured (${summary.total.count} / 16)`;
      reviewBtn.disabled = summary.total.count === 0;
    }

    modal.classList.remove('hidden');
  }

  function closeClothingCaptureMenu() {
    const modal = document.getElementById('clothingCaptureMenuModal');
    if (modal) modal.classList.add('hidden');
  }

  async function openClothingCamera(category = 'shirt') {
    closeClothingCaptureMenu();
    closeClothingReview();

    const modal = document.getElementById('clothingCaptureCameraModal');
    if (!modal) return;

    const engine = getClothingCaptureEngine();
    engine.setActiveCategory(category);

    modal.classList.remove('hidden');
    switchClothingCategory(category);

    const videoEl = document.getElementById('clothingCameraVideo');
    const fallbackCard = document.getElementById('clothingCameraFallback');

    // Initialize media stream with facing mode
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        if (clothingCameraStream) {
          clothingCameraStream.getTracks().forEach(t => t.stop());
          clothingCameraStream = null;
        }

        clothingCameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: clothingCameraFacingMode,
            width: { ideal: 1080 },
            height: { ideal: 1440 }
          }
        });

        if (videoEl) {
          videoEl.srcObject = clothingCameraStream;
          videoEl.classList.remove('hidden');
          videoEl.play();
        }
        if (fallbackCard) fallbackCard.classList.add('hidden');
      } catch (err) {
        console.warn('Clothing camera inaccessible, showing fallback controls:', err.message);
        if (videoEl) videoEl.classList.add('hidden');
        if (fallbackCard) fallbackCard.classList.remove('hidden');
      }
    } else {
      if (videoEl) videoEl.classList.add('hidden');
      if (fallbackCard) fallbackCard.classList.remove('hidden');
    }
  }

  function closeClothingCamera() {
    const modal = document.getElementById('clothingCaptureCameraModal');
    if (modal) modal.classList.add('hidden');

    if (clothingCameraStream) {
      clothingCameraStream.getTracks().forEach(track => track.stop());
      clothingCameraStream = null;
    }

    currentClothingPhotoDataUrl = null;
  }

  function switchClothingCategory(category) {
    const cat = (category || 'shirt').toLowerCase();
    const engine = getClothingCaptureEngine();
    engine.setActiveCategory(cat);

    // Update active tab buttons
    const tabs = {
      shirt: document.getElementById('camTabShirt'),
      pant: document.getElementById('camTabPant'),
      shoe: document.getElementById('camTabShoe')
    };

    Object.keys(tabs).forEach(k => {
      if (tabs[k]) tabs[k].classList.toggle('active', k === cat);
    });

    // Update Silhouettes
    const silShirt = document.getElementById('silhouetteShirt');
    const silPant = document.getElementById('silhouettePant');
    const silShoe = document.getElementById('silhouetteShoe');

    if (silShirt) silShirt.classList.toggle('hidden', cat !== 'shirt');
    if (silPant) silPant.classList.toggle('hidden', cat !== 'pant');
    if (silShoe) silShoe.classList.toggle('hidden', cat !== 'shoe');

    // Update Guidelines text
    const guideText = document.getElementById('clothingGuideText');
    if (guideText) {
      if (cat === 'shirt') {
        guideText.textContent = '👕 Lay shirt flat and align shoulders & torso inside the outline';
      } else if (cat === 'pant') {
        guideText.textContent = '👖 Lay pants flat and align waistband & legs inside the outline';
      } else {
        guideText.textContent = '👟 Place footwear pair side-by-side inside the outline';
      }
    }

    // Reset capture review state to live
    retakeClothingPhoto();

    // Update slot counters and badges
    updateClothingCameraBadges();
  }

  function updateClothingCameraBadges() {
    const engine = getClothingCaptureEngine();
    const summary = engine.getSlotSummary();
    const activeCat = summary.activeCategory;
    const catInfo = summary[activeCat] || summary.shirt;

    const bShirt = document.getElementById('camBadgeShirt');
    const bPant = document.getElementById('camBadgePant');
    const bShoe = document.getElementById('camBadgeShoe');
    const revBadge = document.getElementById('camReviewCountBadge');
    const slotPill = document.getElementById('clothingSlotStatusPill');
    const shutterBtn = document.getElementById('clothingShutterBtn');

    if (bShirt) bShirt.textContent = `${summary.shirt.count}/${summary.shirt.max}`;
    if (bPant) bPant.textContent = `${summary.pant.count}/${summary.pant.max}`;
    if (bShoe) bShoe.textContent = `${summary.shoe.count}/${summary.shoe.max}`;
    if (revBadge) revBadge.textContent = `${summary.total.count}`;

    const icon = activeCat === 'shirt' ? '👕' : (activeCat === 'pant' ? '👖' : '👟');
    const name = activeCat.charAt(0).toUpperCase() + activeCat.slice(1);

    if (slotPill) {
      if (catInfo.isFull) {
        slotPill.textContent = `${icon} ${name} Slots Full (${catInfo.count}/${catInfo.max}) • Tap Review`;
        slotPill.style.background = 'rgba(180, 40, 40, 0.75)';
      } else {
        slotPill.textContent = `${icon} ${name}: ${catInfo.count + 1} of ${catInfo.max} (${catInfo.remaining} remaining)`;
        slotPill.style.background = 'rgba(0, 0, 0, 0.65)';
      }
    }

    if (shutterBtn) {
      shutterBtn.disabled = catInfo.isFull;
    }
  }

  function captureClothingSnapshot() {
    const engine = getClothingCaptureEngine();
    const activeCat = engine.getActiveCategory();

    if (!engine.canAdd(activeCat)) {
      showToast(`⚠️ ${activeCat.toUpperCase()} is full. Review or remove a photo to take another.`);
      return;
    }

    const videoEl = document.getElementById('clothingCameraVideo');
    const canvas = document.getElementById('clothingCameraCanvas');
    const previewImg = document.getElementById('clothingCapturedPreview');
    const silFrame = document.getElementById('clothingSilhouetteFrame');
    const liveControls = document.getElementById('clothingCameraLiveControls');
    const reviewControls = document.getElementById('clothingCameraReviewControls');

    if (!videoEl || !canvas || videoEl.classList.contains('hidden') || !videoEl.videoWidth) {
      // Fallback: load sample photo
      loadSampleClothingPhoto();
      return;
    }

    // DRAW ONLY RAW VIDEO PIXELS TO CANVAS - SILHOUETTES ARE NEVER IN SAVED PHOTO
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    currentClothingPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (previewImg) {
      previewImg.src = currentClothingPhotoDataUrl;
      previewImg.classList.remove('hidden');
    }

    if (videoEl) videoEl.classList.add('hidden');
    if (silFrame) silFrame.classList.add('hidden');
    if (liveControls) liveControls.classList.add('hidden');
    if (reviewControls) reviewControls.classList.remove('hidden');
  }

  function retakeClothingPhoto() {
    currentClothingPhotoDataUrl = null;

    const videoEl = document.getElementById('clothingCameraVideo');
    const previewImg = document.getElementById('clothingCapturedPreview');
    const silFrame = document.getElementById('clothingSilhouetteFrame');
    const liveControls = document.getElementById('clothingCameraLiveControls');
    const reviewControls = document.getElementById('clothingCameraReviewControls');

    if (previewImg) previewImg.classList.add('hidden');
    if (silFrame) silFrame.classList.remove('hidden');
    if (liveControls) liveControls.classList.remove('hidden');
    if (reviewControls) reviewControls.classList.add('hidden');

    if (videoEl && clothingCameraStream) {
      videoEl.classList.remove('hidden');
    }
  }

  function confirmClothingPhoto() {
    if (!currentClothingPhotoDataUrl) {
      showToast('⚠️ No photo captured to confirm');
      return;
    }

    const engine = getClothingCaptureEngine();
    const activeCat = engine.getActiveCategory();

    const res = engine.addConfirmedPhoto(activeCat, currentClothingPhotoDataUrl);

    if (!res.success) {
      showToast(`⚠️ ${res.error}`);
      return;
    }

    const summary = engine.getSlotSummary();
    const catName = activeCat.charAt(0).toUpperCase() + activeCat.slice(1);
    const catCount = summary[activeCat].count;
    const catMax = summary[activeCat].max;

    showToast(`✓ Confirmed ${catName} #${catCount} (${catCount}/${catMax}) ✨`);

    // Reset viewfinder for next capture
    retakeClothingPhoto();
    updateClothingCameraBadges();

    // If active category reached maximum, suggest next step
    if (summary[activeCat].isFull) {
      if (summary.total.isFull) {
        showToast('🎉 All 16 wardrobe slots filled! Opening review...');
        setTimeout(() => openClothingReview(), 600);
      } else {
        // Suggest or switch to next available category
        let nextCat = null;
        if (!summary.shirt.isFull) nextCat = 'shirt';
        else if (!summary.pant.isFull) nextCat = 'pant';
        else if (!summary.shoe.isFull) nextCat = 'shoe';

        if (nextCat) {
          showToast(`✓ ${catName} slots complete (${catMax}/${catMax}). Switched to ${nextCat.toUpperCase()} guide!`);
          switchClothingCategory(nextCat);
        } else {
          openClothingReview();
        }
      }
    }
  }

  function flipClothingCamera() {
    clothingCameraFacingMode = (clothingCameraFacingMode === 'environment' ? 'user' : 'environment');
    const engine = getClothingCaptureEngine();
    openClothingCamera(engine.getActiveCategory());
  }

  function triggerClothingFileInput() {
    const input = document.getElementById('clothingFileInput');
    if (input) input.click();
  }

  function handleClothingFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      currentClothingPhotoDataUrl = e.target.result;

      const videoEl = document.getElementById('clothingCameraVideo');
      const previewImg = document.getElementById('clothingCapturedPreview');
      const silFrame = document.getElementById('clothingSilhouetteFrame');
      const liveControls = document.getElementById('clothingCameraLiveControls');
      const reviewControls = document.getElementById('clothingCameraReviewControls');
      const fallbackCard = document.getElementById('clothingCameraFallback');

      if (previewImg) {
        previewImg.src = currentClothingPhotoDataUrl;
        previewImg.classList.remove('hidden');
      }

      if (videoEl) videoEl.classList.add('hidden');
      if (fallbackCard) fallbackCard.classList.add('hidden');
      if (silFrame) silFrame.classList.add('hidden');
      if (liveControls) liveControls.classList.add('hidden');
      if (reviewControls) reviewControls.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
  }

  function loadSampleClothingPhoto() {
    const engine = getClothingCaptureEngine();
    const activeCat = engine.getActiveCategory();

    const sampleMap = {
      shirt: 'assets/navy_shirt.jpg',
      pant: 'assets/beige_chinos.jpg',
      shoe: 'assets/white_sneakers.jpg'
    };

    currentClothingPhotoDataUrl = sampleMap[activeCat] || 'assets/navy_shirt.jpg';

    const videoEl = document.getElementById('clothingCameraVideo');
    const previewImg = document.getElementById('clothingCapturedPreview');
    const silFrame = document.getElementById('clothingSilhouetteFrame');
    const liveControls = document.getElementById('clothingCameraLiveControls');
    const reviewControls = document.getElementById('clothingCameraReviewControls');
    const fallbackCard = document.getElementById('clothingCameraFallback');

    if (previewImg) {
      previewImg.src = currentClothingPhotoDataUrl;
      previewImg.classList.remove('hidden');
    }

    if (videoEl) videoEl.classList.add('hidden');
    if (fallbackCard) fallbackCard.classList.add('hidden');
    if (silFrame) silFrame.classList.add('hidden');
    if (liveControls) liveControls.classList.add('hidden');
    if (reviewControls) reviewControls.classList.remove('hidden');
  }

  function openClothingReview() {
    closeClothingCamera();
    closeClothingCaptureMenu();

    const modal = document.getElementById('clothingCaptureReviewModal');
    if (!modal) return;

    renderClothingReviewGrid();
    modal.classList.remove('hidden');
  }

  function closeClothingReview() {
    const modal = document.getElementById('clothingCaptureReviewModal');
    if (modal) modal.classList.add('hidden');
  }

  function renderClothingReviewGrid() {
    const engine = getClothingCaptureEngine();
    const summary = engine.getSlotSummary();

    const totalBadge = document.getElementById('reviewTotalBadge');
    if (totalBadge) totalBadge.textContent = `${summary.total.count} of 16 Selected`;

    const sPill = document.getElementById('reviewShirtCountPill');
    const pPill = document.getElementById('reviewPantCountPill');
    const shPill = document.getElementById('reviewShoeCountPill');

    if (sPill) sPill.textContent = `${summary.shirt.count} / ${summary.shirt.max}`;
    if (pPill) pPill.textContent = `${summary.pant.count} / ${summary.pant.max}`;
    if (shPill) shPill.textContent = `${summary.shoe.count} / ${summary.shoe.max}`;

    const tally = document.getElementById('reviewTallySummary');
    if (tally) {
      tally.textContent = `${summary.shirt.count} Shirts • ${summary.pant.count} Pants • ${summary.shoe.count} Shoes confirmed`;
    }

    const saveBtn = document.getElementById('btnSaveWardrobeSelection');
    if (saveBtn) {
      saveBtn.disabled = summary.total.count === 0;
      saveBtn.textContent = summary.total.count === 0
        ? 'Capture clothes to finish'
        : `Finish & Save ${summary.total.count} Clothes to Wardrobe ✨`;
    }

    // Render Shirts Grid
    renderCategoryGridSection('shirt', 'reviewShirtsGrid', summary.shirt.max);
    // Render Pants Grid
    renderCategoryGridSection('pant', 'reviewPantsGrid', summary.pant.max);
    // Render Shoes Grid
    renderCategoryGridSection('shoe', 'reviewShoesGrid', summary.shoe.max);
  }

  function renderCategoryGridSection(category, containerId, maxCount) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const engine = getClothingCaptureEngine();
    const items = engine.getPhotos(category);
    container.innerHTML = '';

    // Render Confirmed Items
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'clothing-card-item';
      card.innerHTML = `
        <img src="${item.photo}" class="clothing-card-img" alt="${item.name}" onclick="app.openClothingLightbox('${item.photo}', '${item.name}', '${category}', '${item.id}')" />
        <button type="button" class="clothing-card-remove-btn" onclick="event.stopPropagation(); app.removeClothingPhoto('${category}', '${item.id}')" title="Remove this photo">✕</button>
        <div class="clothing-card-label">${item.name}</div>
      `;
      container.appendChild(card);
    });

    // Render Add/Retake Empty Slot Card if under capacity
    if (items.length < maxCount) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'clothing-empty-slot';
      const label = category === 'shirt' ? 'Shirt' : (category === 'pant' ? 'Pant' : 'Shoe');
      emptyCard.innerHTML = `
        <span class="clothing-empty-icon">+</span>
        <span class="clothing-empty-text">Add ${label}</span>
      `;
      emptyCard.onclick = () => openClothingCamera(category);
      container.appendChild(emptyCard);
    }
  }

  function removeClothingPhoto(category, photoId) {
    const engine = getClothingCaptureEngine();
    const res = engine.removePhoto(category, photoId);

    if (res.success) {
      showToast('🗑️ Photo removed. Slot freed!');
      renderClothingReviewGrid();
    }
  }

  function openClothingLightbox(photoUrl, title, category, photoId) {
    const modal = document.getElementById('clothingPreviewLightbox');
    const img = document.getElementById('lightboxImg');
    const titleEl = document.getElementById('lightboxTitle');
    const removeBtn = document.getElementById('lightboxRemoveBtn');

    if (!modal) return;

    activeLightboxItem = { category, photoId };
    if (img) img.src = photoUrl;
    if (titleEl) titleEl.textContent = title || 'Garment Preview';

    if (removeBtn) {
      removeBtn.onclick = () => {
        closeClothingLightbox();
        removeClothingPhoto(category, photoId);
      };
    }

    modal.classList.remove('hidden');
  }

  function closeClothingLightbox() {
    const modal = document.getElementById('clothingPreviewLightbox');
    if (modal) modal.classList.add('hidden');
    activeLightboxItem = null;
  }

  async function saveCapturedClothingToWardrobe() {
    const engine = getClothingCaptureEngine();
    const newItems = engine.exportToWardrobeItems();

    if (!newItems || newItems.length === 0) {
      showToast('⚠️ No captured clothes to save');
      return;
    }

    // 1. Prepend to in-memory WARDROBE_ITEMS
    newItems.forEach(item => {
      WARDROBE_ITEMS.unshift(item);
    });

    // 2. Prepend to state.wardrobe
    if (!Array.isArray(state.wardrobe)) state.wardrobe = [];
    newItems.forEach(item => {
      state.wardrobe.unshift(item);
    });

    // 3. Persist to localStorage for session durability
    try {
      const existing = JSON.parse(localStorage.getItem('woobi_captured_wardrobe_v1') || '[]');
      localStorage.setItem('woobi_captured_wardrobe_v1', JSON.stringify([...newItems, ...existing]));
    } catch (err) {
      console.warn('Could not persist to localStorage:', err);
    }

    // 4. Background sync with backend if session is present
    const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('woobi_auth_token') : null;
    if (authToken && typeof fetch !== 'undefined') {
      newItems.forEach(item => {
        fetch('/api/v1/wardrobe/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: item.name,
            category: item.category,
            photo: item.photo,
            condition: item.condition,
            fit: item.fit
          })
        }).catch(err => console.warn('Background sync failed:', err.message));
      });
    }

    // 5. Refresh all consumer modules (AI Stylist, 3D Studio, Wardrobe Grid)
    renderWardrobeGrid();
    updateWardrobeCounts();
    updateStylistWardrobeStats();
    renderSerenGarments();

    showToast(`✓ Successfully added ${newItems.length} clothes to your wardrobe! ✨`);

    // 6. Clear session and close review
    engine.clearAll();
    closeClothingReview();

    // 7. Transition to Wardrobe screen to see new clothes
    goToScreen('wardrobe');
  }

  function loadPersistedCapturedWardrobe() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = JSON.parse(localStorage.getItem('woobi_captured_wardrobe_v1') || '[]');
        if (Array.isArray(saved) && saved.length > 0) {
          saved.forEach(item => {
            if (!WARDROBE_ITEMS.some(i => i.id === item.id)) {
              WARDROBE_ITEMS.unshift(item);
            }
          });
          if (!Array.isArray(state.wardrobe)) state.wardrobe = [];
          saved.forEach(item => {
            if (!state.wardrobe.some(i => i.id === item.id)) {
              state.wardrobe.unshift(item);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Error loading persisted captured wardrobe:', err);
    }
  }


  // =========================================================================
  // 10. INTERACTIVE WEEKLY PLANNER & CALENDAR ENGINE
  // =========================================================================
  const PLANNER_STORAGE_KEY = 'woobi_weekly_calendar_v1';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const PLANNER_SAMPLE_OUTFITS = [
    {
      id: 'look_easy_everyday',
      title: 'Easy everyday',
      occasion: 'College',
      tag: 'Casual',
      caption: 'A relaxed navy cotton shirt paired with beige chinos and white sneakers.',
      previewPhoto: 'assets/model_tryon_navy.jpg',
      items: [
        { name: 'Navy shirt', photo: 'assets/navy_shirt.jpg' },
        { name: 'Beige chinos', photo: 'assets/beige_chinos.jpg' },
        { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' },
        { name: 'Leather watch', photo: 'assets/leather_watch.jpg' }
      ]
    },
    {
      id: 'look_office_ready',
      title: 'Office ready',
      occasion: 'Office',
      tag: 'Work',
      caption: 'Crisp breathable white linen tailored with beige chinos and tan loafers.',
      previewPhoto: 'assets/model_tryon_linen.jpg',
      items: [
        { name: 'White linen shirt', photo: 'assets/white_linen_shirt.jpg' },
        { name: 'Beige chinos', photo: 'assets/beige_chinos.jpg' },
        { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg' },
        { name: 'Leather watch', photo: 'assets/leather_watch.jpg' }
      ]
    },
    {
      id: 'look_weekend_casual',
      title: 'Weekend casual',
      occasion: 'Weekend',
      tag: 'Weekend',
      caption: 'Lightweight breathable olive kurta with relaxed cream palazzo.',
      previewPhoto: 'assets/model_tryon_kurta.jpg',
      items: [
        { name: 'Olive kurta', photo: 'assets/olive_kurta.jpg' },
        { name: 'Cream palazzo', photo: 'assets/cream_palazzo.jpg' },
        { name: 'Tan loafers', photo: 'assets/tan_loafers.jpg' }
      ]
    },
    {
      id: 'look_urban_minimal',
      title: 'Relaxed Urban Minimal',
      occasion: 'City Casual',
      tag: 'Casual',
      caption: 'Deep maroon top paired with dark pleated skirt and white sneakers.',
      previewPhoto: 'assets/model_tryon_maroon.jpg',
      items: [
        { name: 'Maroon top', photo: 'assets/maroon_top.jpg' },
        { name: 'Dark skirt', photo: 'assets/dark_skirt.jpg' },
        { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' }
      ]
    },
    {
      id: 'look_tailored_blazer',
      title: 'Smart Tailored Blazer',
      occasion: 'Meeting',
      tag: 'Work',
      caption: 'Structured smart blazer with dark denim and black trainers.',
      previewPhoto: 'assets/smart_blazer.jpg',
      items: [
        { name: 'Tailored blazer', photo: 'assets/smart_blazer.jpg' },
        { name: 'Dark denim', photo: 'assets/dark_denim.jpg' },
        { name: 'Black trainers', photo: 'assets/black_trainers.jpg' }
      ]
    },
    {
      id: 'look_heritage_kurti',
      title: 'Heritage Indigo Kurti',
      occasion: 'Celebration',
      tag: 'Ethnic',
      caption: 'Handcrafted indigo kurti paired with cream palazzo and brown sandals.',
      previewPhoto: 'assets/indigo_kurti.jpg',
      items: [
        { name: 'Indigo kurti', photo: 'assets/indigo_kurti.jpg' },
        { name: 'Cream palazzo', photo: 'assets/cream_palazzo.jpg' },
        { name: 'Brown sandals', photo: 'assets/brown_sandals.jpg' }
      ]
    },
    {
      id: 'look_terracotta_street',
      title: 'Terracotta City Walk',
      occasion: 'Everyday',
      tag: 'Weekend',
      caption: 'Warm earthy terracotta tee paired with dark denim and white sneakers.',
      previewPhoto: 'assets/terracotta_tee.jpg',
      items: [
        { name: 'Terracotta tee', photo: 'assets/terracotta_tee.jpg' },
        { name: 'Dark denim', photo: 'assets/dark_denim.jpg' },
        { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' }
      ]
    }
  ];

  const plannerState = {
    weekOffset: 0,
    selectedDateKey: null,
    assigningForDateKey: null,
    filterCategory: 'All',
    plannedOutfits: {}
  };

  function getPlannerWeekDays(weekOffset = 0) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon, ... 6 is Sat
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dateNum}`;
      const isToday = d.toDateString() === now.toDateString();

      days.push({
        dateObj: d,
        dateKey,
        dayName: dayNames[i],
        dayNum: d.getDate(),
        dateDisplay: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        fullDisplay: `${dayNames[i]}, ${d.getDate()} ${monthNames[d.getMonth()]}`,
        isToday
      });
    }
    return days;
  }

  function initPlannerState() {
    try {
      const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
      if (saved) {
        plannerState.plannedOutfits = JSON.parse(saved);
      } else {
        // Initialize with standard starting looks on Monday and Tuesday of current week
        const currentDays = getPlannerWeekDays(0);
        plannerState.plannedOutfits = {
          [currentDays[0].dateKey]: PLANNER_SAMPLE_OUTFITS[0],
          [currentDays[1].dateKey]: PLANNER_SAMPLE_OUTFITS[1]
        };
        savePlannerState();
      }
    } catch (e) {
      console.warn('Could not read planner state:', e);
      plannerState.plannedOutfits = {};
    }

    if (!plannerState.selectedDateKey) {
      const currentDays = getPlannerWeekDays(0);
      const todayDay = currentDays.find(d => d.isToday);
      plannerState.selectedDateKey = todayDay ? todayDay.dateKey : currentDays[0].dateKey;
    }
  }

  function savePlannerState() {
    try {
      localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(plannerState.plannedOutfits));
    } catch (e) {
      console.warn('Could not save planner state:', e);
    }
  }

  function renderWeeklyCalendar() {
    const days = getPlannerWeekDays(plannerState.weekOffset);
    const stripEl = document.getElementById('plannerWeekStrip');
    const streamEl = document.getElementById('weeklyScheduleStream');
    const titleEl = document.getElementById('plannerWeekTitle');
    const subEl = document.getElementById('plannerWeekSub');
    const countEl = document.getElementById('plannerSummaryCount');
    const badgeEl = document.getElementById('plannerSelectedDateBadge');
    const fillEl = document.getElementById('plannerProgressFill');

    // Title & Subtitle for Week Range
    if (titleEl) {
      const first = days[0];
      const last = days[6];
      titleEl.textContent = `${first.dateDisplay} – ${last.dateDisplay}, ${first.dateObj.getFullYear()}`;
    }
    if (subEl) {
      if (plannerState.weekOffset === 0) {
        subEl.textContent = 'This Week (Current)';
      } else if (plannerState.weekOffset === 1) {
        subEl.textContent = 'Next Week';
      } else if (plannerState.weekOffset === -1) {
        subEl.textContent = 'Last Week';
      } else if (plannerState.weekOffset > 1) {
        subEl.textContent = `In ${plannerState.weekOffset} Weeks`;
      } else {
        subEl.textContent = `${Math.abs(plannerState.weekOffset)} Weeks Ago`;
      }
    }

    // Ensure selected date is set
    const hasSelectedInWeek = days.some(d => d.dateKey === plannerState.selectedDateKey);
    if (!hasSelectedInWeek) {
      const todayDay = days.find(d => d.isToday);
      plannerState.selectedDateKey = todayDay ? todayDay.dateKey : days[0].dateKey;
    }

    const selectedDayObj = days.find(d => d.dateKey === plannerState.selectedDateKey) || days[0];
    if (badgeEl) {
      badgeEl.textContent = `Selected: ${selectedDayObj.fullDisplay}`;
    }

    // Count planned days in this active week
    let plannedInWeekCount = 0;
    days.forEach(d => {
      if (plannerState.plannedOutfits[d.dateKey]) {
        plannedInWeekCount++;
      }
    });

    if (countEl) {
      countEl.innerHTML = `<strong>${plannedInWeekCount} of 7</strong> days planned`;
    }
    if (fillEl) {
      const percent = Math.round((plannedInWeekCount / 7) * 100);
      fillEl.style.width = `${percent}%`;
    }

    // Render Weekly Strip
    if (stripEl) {
      stripEl.innerHTML = days.map(day => {
        const isSelected = day.dateKey === plannerState.selectedDateKey;
        const hasPlan = !!plannerState.plannedOutfits[day.dateKey];
        return `
          <div class="day-col ${isSelected ? 'selected-day-col' : ''} ${day.isToday ? 'is-today' : ''}" 
               onclick="app.selectPlannerDate('${day.dateKey}', true)"
               title="${day.fullDisplay}${hasPlan ? ' (Outfit Planned)' : ''}">
            <span class="d-name">${day.dayName}</span>
            <span class="d-num ${isSelected ? 'active-bubble' : ''}">${day.dayNum}</span>
            <span class="d-dot ${hasPlan ? 'has-plan' : ''}"></span>
          </div>
        `;
      }).join('');
    }

    // Render Daily Schedule Cards
    if (streamEl) {
      streamEl.innerHTML = days.map(day => {
        const isSelected = day.dateKey === plannerState.selectedDateKey;
        const outfit = plannerState.plannedOutfits[day.dateKey];

        if (outfit) {
          const thumbsHtml = (outfit.items || []).slice(0, 4).map(it =>
            `<img src="${escapeHtml(it.photo)}" alt="${escapeHtml(it.name)}" title="${escapeHtml(it.name)}">`
          ).join('');

          return `
            <div class="day-plan-card has-outfit ${isSelected ? 'selected-day' : ''}" 
                 id="card-${day.dateKey}" 
                 onclick="app.selectPlannerDate('${day.dateKey}', false)">
              <div class="dp-day-info">
                <strong>${day.dayName}</strong>
                <span>${day.dateDisplay}</span>
                ${day.isToday ? '<span class="dp-today-tag">Today</span>' : ''}
              </div>
              <div class="dp-outfit-preview">
                <div class="dp-outfit-meta">
                  <div class="dp-title-row">
                    <span class="dp-outfit-title">${escapeHtml(outfit.title)}</span>
                    <span class="dp-occ-tag">${escapeHtml(outfit.occasion || outfit.tag || 'Casual')}</span>
                  </div>
                  <div class="dp-thumbs-row">
                    ${thumbsHtml}
                  </div>
                </div>
              </div>
              <div class="dp-actions-row" onclick="event.stopPropagation()">
                <button class="btn-plan-replace" onclick="app.openPlannerOutfitModal('${day.dateKey}')" title="Replace outfit for ${day.fullDisplay}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                  <span>Replace</span>
                </button>
                <button class="btn-plan-remove" onclick="app.removePlannerOutfit('${day.dateKey}')" title="Remove outfit for ${day.fullDisplay}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="day-plan-card empty-day ${isSelected ? 'selected-day' : ''}" 
                 id="card-${day.dateKey}" 
                 onclick="app.selectPlannerDate('${day.dateKey}', false)">
              <div class="dp-day-info">
                <strong>${day.dayName}</strong>
                <span>${day.dateDisplay}</span>
                ${day.isToday ? '<span class="dp-today-tag">Today</span>' : ''}
              </div>
              <span class="dp-empty-text">No outfit planned yet</span>
              <button class="btn-plan-add" onclick="event.stopPropagation(); app.openPlannerOutfitModal('${day.dateKey}')" title="Plan outfit for ${day.fullDisplay}">
                <span class="btn-plus-icon">+</span>
                <span>Plan</span>
              </button>
            </div>
          `;
        }
      }).join('');
    }
  }

  function selectPlannerDate(dateKey, shouldScroll = true) {
    plannerState.selectedDateKey = dateKey;
    renderWeeklyCalendar();

    if (shouldScroll) {
      const card = document.getElementById(`card-${dateKey}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function plannerChangeWeek(delta) {
    plannerState.weekOffset += delta;
    renderWeeklyCalendar();
  }

  function plannerJumpToToday() {
    plannerState.weekOffset = 0;
    const days = getPlannerWeekDays(0);
    const todayDay = days.find(d => d.isToday);
    plannerState.selectedDateKey = todayDay ? todayDay.dateKey : days[0].dateKey;
    renderWeeklyCalendar();
    showToast('📅 Jumped to current week.');
  }

  function weeklyPlannerGoBack() {
    goToScreen('today');
  }

  function openPlannerOutfitModal(dateKey) {
    plannerState.assigningForDateKey = dateKey;
    plannerState.selectedDateKey = dateKey;
    plannerState.filterCategory = 'All';

    const days = getPlannerWeekDays(plannerState.weekOffset);
    const dayObj = days.find(d => d.dateKey === dateKey) || {
      fullDisplay: dateKey
    };

    const modal = document.getElementById('plannerOutfitModal');
    const titleEl = document.getElementById('plannerModalTitle');
    const subEl = document.getElementById('plannerModalSub');
    const existingOutfit = plannerState.plannedOutfits[dateKey];

    if (subEl) {
      subEl.textContent = existingOutfit ? 'Replace Outfit' : 'Plan Outfit';
    }
    if (titleEl) {
      titleEl.textContent = existingOutfit
        ? `Replace look for ${dayObj.fullDisplay}`
        : `Choose look for ${dayObj.fullDisplay}`;
    }

    // Reset filter tabs active state
    document.querySelectorAll('#plannerFilterTabs .planner-filter-tab').forEach((b, idx) => {
      b.classList.toggle('active', idx === 0);
    });

    renderPlannerOutfitsList();

    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function closePlannerOutfitModal() {
    const modal = document.getElementById('plannerOutfitModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    plannerState.assigningForDateKey = null;
  }

  function filterPlannerOutfits(category, btnEl) {
    plannerState.filterCategory = category;
    document.querySelectorAll('#plannerFilterTabs .planner-filter-tab').forEach(b => {
      b.classList.toggle('active', b === btnEl);
    });
    renderPlannerOutfitsList();
  }

  function renderPlannerOutfitsList() {
    const gridEl = document.getElementById('plannerOutfitsGrid');
    if (!gridEl) return;

    const dateKey = plannerState.assigningForDateKey;
    const currentOutfit = dateKey ? plannerState.plannedOutfits[dateKey] : null;

    let filtered = PLANNER_SAMPLE_OUTFITS;
    if (plannerState.filterCategory && plannerState.filterCategory !== 'All') {
      filtered = PLANNER_SAMPLE_OUTFITS.filter(o =>
        (o.tag && o.tag.toLowerCase() === plannerState.filterCategory.toLowerCase()) ||
        (o.occasion && o.occasion.toLowerCase() === plannerState.filterCategory.toLowerCase())
      );
    }

    gridEl.innerHTML = filtered.map(outfit => {
      const isCurrentlyAssigned = currentOutfit && currentOutfit.id === outfit.id;
      const thumbsHtml = (outfit.items || []).slice(0, 4).map(it =>
        `<img src="${escapeHtml(it.photo)}" alt="${escapeHtml(it.name)}" title="${escapeHtml(it.name)}">`
      ).join('');

      return `
        <div class="planner-outfit-pick-card ${isCurrentlyAssigned ? 'currently-assigned' : ''}" 
             onclick="app.assignPlannerOutfit('${escapeHtml(outfit.id)}')">
          <img src="${escapeHtml(outfit.previewPhoto)}" class="pick-card-photo" alt="${escapeHtml(outfit.title)}">
          <div class="pick-card-body">
            <div class="pick-card-header">
              <span class="pick-card-title">${escapeHtml(outfit.title)}</span>
              <span class="dp-occ-tag">${escapeHtml(outfit.occasion || outfit.tag)}</span>
            </div>
            <p class="pick-card-caption">${escapeHtml(outfit.caption)}</p>
            <div class="pick-card-thumbs">
              ${thumbsHtml}
            </div>
          </div>
          ${isCurrentlyAssigned
          ? '<span class="badge-current-assigned">✓ Assigned</span>'
          : `<button class="btn-pick-assign" onclick="event.stopPropagation(); app.assignPlannerOutfit('${escapeHtml(outfit.id)}')">${currentOutfit ? 'Select' : 'Assign'}</button>`
        }
        </div>
      `;
    }).join('');
  }

  function assignPlannerOutfit(outfitId) {
    const dateKey = plannerState.assigningForDateKey || plannerState.selectedDateKey;
    if (!dateKey) return;

    const outfit = PLANNER_SAMPLE_OUTFITS.find(o => o.id === outfitId);
    if (!outfit) return;

    plannerState.plannedOutfits[dateKey] = outfit;
    savePlannerState();
    closePlannerOutfitModal();
    renderWeeklyCalendar();

    const days = getPlannerWeekDays(plannerState.weekOffset);
    const dayObj = days.find(d => d.dateKey === dateKey);
    const dayName = dayObj ? dayObj.fullDisplay : dateKey;
    showToast(`✓ "${outfit.title}" assigned to ${dayName}`);
  }

  function removePlannerOutfit(dateKey) {
    if (!dateKey || !plannerState.plannedOutfits[dateKey]) return;

    const outfit = plannerState.plannedOutfits[dateKey];
    delete plannerState.plannedOutfits[dateKey];
    savePlannerState();
    renderWeeklyCalendar();

    const days = getPlannerWeekDays(plannerState.weekOffset);
    const dayObj = days.find(d => d.dateKey === dateKey);
    const dayName = dayObj ? dayObj.fullDisplay : dateKey;
    showToast(`🗑️ Removed "${outfit.title}" from ${dayName}`);
  }

  function init() {
    if (typeof window !== 'undefined' && window.appBootstrap && typeof window.appBootstrap.start === 'function') {
      window.appBootstrap.start();
    }
    loadPersistedCapturedWardrobe();
    initStreakState();
    initPlannerState();

    renderCurrentLook();
    renderWardrobeGrid();
    updateWardrobeCounts();

    // Check URL parameters for direct screen access
    const params = new URLSearchParams(window.location.search);
    const requestedScreen = params.get('screen');
    if (requestedScreen) {
      goToScreen(requestedScreen === 'virtual-studio' ? 'today' : requestedScreen);
    } else {
      // Default to Sérén 3D Virtual Studio on Today Homepage
      goToScreen('today');
    }
  }

  // Expose public API to window for inline HTML onclick handlers
  const appExports = {
    goToScreen,
    setTodayCanvasMode,
    cycleLook,
    setTodayOccasion,
    openSwapScreen,
    selectSwapOption,
    confirmSwap,
    markAsWorn,
    saveForLater,
    toggleBookmarkCurrent,
    toggleStyleChoice,
    simulateUpload,
    saveReviewedItem,
    filterWardrobeCategory,
    filterWardrobeGrid,
    selectPlan,
    activatePremium,
    openStyleHint,
    selectSubscriptionPlan,
    openUpgradeConfirmation,
    closeUpgradeConfirmation,
    confirmPlanPreference,
    toggleFaq,
    updateSubscriptionUI,
    switchPlanView,
    scrollPlanCard: switchPlanView,
    saveReminderPreferences,
    exportWardrobe,
    exportUserData,
    saveProfile,
    updatePrivacyConsent,
    clearSavedLooksCache,
    clearAvatarPreferencesCache,
    signOut,
    setAppTheme,
    setStudioTheme,
    setStudioLighting,
    toggleHighContrast,
    resetAppearance,
    setPerformancePreset,
    toggleShadowQuality,
    toggleReflectionQuality,
    toggleIdleAnimations,
    resetPerformance,
    requestNotificationPermission,
    getSettingsManager,
    deleteAccount,
    showHelpSupport,
    rotateCropImage,
    setAspectRatio,
    setAvailability,
    selectFeedbackOption,
    retryUpload,
    tryReconnect,
    confirmDeleteAccount,

    // AI Stylist API
    selectStylistOption,
    generateStylistOutfit,
    regenerateAIOutfit,
    cycleStylistOption,
    confirmStylistOutfit,
    resetStylistQuestionnaire,
    setStylistViewMode,

    // Custom Builder API
    setBuilderTab,
    selectBuilderItem,
    resetBuilderSelections,
    previewCustomOutfitOnModel,
    confirmCustomOutfit,
    backToBuilderSelection,


    // Wardrobe Condition & Fit API
    toggleItemCondition,
    openConditionModal,
    closeConditionModal,
    selectModalCondition,
    selectModalFit,
    saveModalConditionChanges,

    // Sérén 3D Virtual Studio API
    initVirtualStudio,
    renderSerenGarments,
    serenFilterCat,
    serenToggleWardrobe,
    serenToggleDailyLooks,
    serenWearGarment,
    serenOpenStylingReview,
    serenOpenReview: serenOpenStylingReview,
    serenCloseReview,
    serenApplySuggestion,
    serenSaveCurrentLook,
    serenSaveLook: serenSaveCurrentLook,
    serenCenterAction,
    serenQuickAction: serenCenterAction,
    serenCycleLooks: () => serenToggleDailyLooks(true),
    setStudioCamera,
    onStudioCameraChanged,
    serenInteract,
    serenOpenVanity,
    serenCloseVanity,
    serenSwitchVanityTab,
    serenSetGender,
    serenSetSkinTone,
    serenSetHairStyle,
    serenSetHairColor,
    serenSetProportions,
    serenToggleAccessory,
    serenSaveAvatarCustomization,
    serenHandlePhotoUpload,
    serenApplyPhotoMatch,
    updateSerenGreeting,

    // Daily Outfit-Upload Streak, Camera, Memories & Circular Calendar API
    handleStreakIconClick,
    openStreakModal,
    closeStreakModal,
    prevCalendarMonth,
    nextCalendarMonth,
    renderStreakCalendar,
    seedStreakJun21ToToday: () => {
      const eng = getStreakEngine();
      if (eng && typeof eng.seedStreakJun21ToToday === 'function') {
        eng.seedStreakJun21ToToday();
      }
      renderStreakCalendar();
      updateStreakUI();
    },
    openCameraModal,
    closeCameraModal,
    captureCameraSnapshot,
    triggerFileInputClick,
    handleCameraFileSelected: handleOutfitPhotoSelected,
    loadSampleOutfitLook,
    confirmCapturedOutfit,
    retakeCameraPhoto,
    openMemoriesModal,
    closeMemoriesModal,
    openMemoryDetail,
    closeMemoryDetailModal,
    triggerOutfitPhotoUpload,
    handleOutfitPhotoSelected,
    openPhotoConfirmModal,
    closePhotoConfirmModal,
    confirmOutfitPhotoUpload,
    showMissedStreakModal,
    closeMissedStreakModal,
    restoreMonthlyStreak,
    startNewStreak,
    dismissReminderBanner,
    devSimulateUpload,
    devSimulateTwoHoursLeft,
    devSimulateStreakBreak,
    devToggleRestoreToken,
    devResetStreak,
    resetTestData,
    toggleTestUserMode,
    loadTestUserStreak136: () => {
      const eng = getStreakEngine();
      if (eng && typeof eng.loadTestUserStreak136 === 'function') {
        eng.loadTestUserStreak136();
      }
      renderStreakCalendar();
      updateStreakUI();
    },
    switchToRealUser: (id) => {
      const eng = getStreakEngine();
      if (eng && typeof eng.switchToRealUser === 'function') {
        eng.switchToRealUser(id);
      }
      renderStreakCalendar();
      updateStreakUI();
    },

    // Clothing Capture & Silhouette Digitization API
    openClothingCaptureMenu,
    closeClothingCaptureMenu,
    openClothingCamera,
    closeClothingCamera,
    switchClothingCategory,
    updateClothingCameraBadges,
    captureClothingSnapshot,
    retakeClothingPhoto,
    confirmClothingPhoto,
    flipClothingCamera,
    triggerClothingFileInput,
    handleClothingFileSelected,
    loadSampleClothingPhoto,
    openClothingReview,
    closeClothingReview,
    renderClothingReviewGrid,
    removeClothingPhoto,
    openClothingLightbox,
    closeClothingLightbox,
    saveCapturedClothingToWardrobe,
    loadPersistedCapturedWardrobe,

    // Interactive Weekly Calendar & Outfit Planner API
    renderWeeklyCalendar,
    selectPlannerDate,
    plannerChangeWeek,
    plannerJumpToToday,
    weeklyPlannerGoBack,
    openPlannerOutfitModal,
    closePlannerOutfitModal,
    filterPlannerOutfits,
    assignPlannerOutfit,
    removePlannerOutfit
  };

  window.app = Object.assign(window.app || {}, appExports);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
