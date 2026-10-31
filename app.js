/**
 * AURA Wardrobe — Exact Replica Prototype Application Logic
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
    { id: 'item_16', name: 'Tailored blazer', category: 'Tops', photo: 'assets/smart_blazer.jpg', condition: 'clean', fit: 'tight' }
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
    currentPlan: 'monthly',
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

      'profile': 'profile',
      'wear-history': 'profile',
      'premium': 'profile',
      'manage-subscription': 'profile',
      'reminders': 'profile',
      'account-privacy': 'profile',
      'help-support': 'profile',
      'delete-account': 'profile',
      'new-password': 'profile'
    };

    const targetTab = navMapping[screenId] || 'today';
    document.querySelectorAll('.phone-bottom-nav .nav-tab').forEach(btn => {
      const isMatch = btn.textContent.toLowerCase().includes(targetTab);
      btn.classList.toggle('active', isMatch);
    });
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
  function renderWardrobeGrid(category = state.wardrobeActiveCategory, query = '') {
    const container = document.getElementById('wardrobeCardsGrid');
    if (!container) return;

    let items = WARDROBE_ITEMS.slice();

    // Category Filter
    if (category === 'Clean') {
      items = items.filter(i => i.condition === 'clean');
    } else if (category === 'Laundry') {
      items = items.filter(i => i.condition === 'dirty');
    } else if (category && category !== 'All') {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }

    // Search Query Filter
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    container.innerHTML = '';
    items.forEach(item => {
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
          <img src="${item.photo}" alt="${item.name}">
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

      container.appendChild(box);
    });

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
  // 9. PROFILE, SETTINGS & UTILITIES
  // =========================================================================
  function selectPlan(planType) {
    state.currentPlan = planType;
    document.querySelectorAll('.pricing-option-card').forEach(card => card.classList.remove('selected'));
    const target = planType === 'annual' ? document.getElementById('planAnnual') : document.getElementById('planMonthly');
    if (target) target.classList.add('selected');
  }

  function activatePremium() {
    state.isPremium = true;
    showToast('🎉 Welcome to AURA Premium! All features unlocked.');
    setTimeout(() => goToScreen('today'), 800);
  }

  function saveReminderPreferences() {
    showToast('✓ Reminder preferences updated.');
    goToScreen('profile');
  }

  function exportWardrobe() {
    showToast('📦 Preparing wardrobe data package...');
    setTimeout(() => {
      showToast('✓ Export ready! 16 garments packaged.');
    }, 1000);
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
    showToast('📶 Reconnecting to AURA Cloud...');
    setTimeout(() => {
      showToast('Online! Synchronizing latest suggestions.');
      goToScreen('today');
    }, 900);
  }

  function confirmDeleteAccount() {
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

  const SEREN_GARMENTS = [
    { id: 'cardigan', cat: 'tops', name: 'Cream Knit Cardigan', photo: 'assets/style_casual.jpg', is3D: true, sub: 'Cozy drop-shoulder knit' },
    { id: 'blazer', cat: 'tops', name: 'Camel Smart Blazer', photo: 'assets/smart_blazer.jpg', is3D: true, sub: 'Structured tailored wool' },
    { id: 'navy_shirt', cat: 'tops', name: 'Navy Oxford Shirt', photo: 'assets/navy_shirt.jpg', is3D: true, sub: 'Crisp button-down collar' },
    { id: 'striped_sweater', cat: 'tops', name: 'Breton Striped Sweater', photo: 'assets/style_casual.jpg', is3D: true, sub: 'French nautical knit' },
    { id: 'tank', cat: 'tops', name: 'Ribbed Ivory Tank', photo: 'assets/welcome_hero.jpg', is3D: true, sub: 'Scoop neck luxury cotton' },

    { id: 'taupe_wide', cat: 'bottoms', name: 'Tailored Taupe Trousers', photo: 'assets/beige_chinos.jpg', is3D: true, sub: 'Pleated high-waisted drape' },
    { id: 'dark_denim', cat: 'bottoms', name: 'Dark Indigo Straight Jeans', photo: 'assets/blue_jeans.jpg', is3D: true, sub: 'Tailored Japanese denim' },
    { id: 'white_chinos', cat: 'bottoms', name: 'Crisp Ivory Chinos', photo: 'assets/beige_chinos.jpg', is3D: true, sub: 'Clean minimalist cut' },

    { id: 'blazer', cat: 'outerwear', name: 'Camel Smart Blazer', photo: 'assets/smart_blazer.jpg', is3D: true, sub: 'Structured tailored wool' },
    { id: 'cardigan', cat: 'outerwear', name: 'Cream Knit Cardigan', photo: 'assets/style_casual.jpg', is3D: true, sub: 'Cozy drop-shoulder knit' },

    { id: 'loafers', cat: 'shoes', name: 'Caramel Leather Loafers', photo: 'assets/smart_blazer.jpg', is3D: true, sub: 'Polished brass horsebit' },
    { id: 'sneakers', cat: 'shoes', name: 'Clean White Sneakers', photo: 'assets/welcome_hero.jpg', is3D: true, sub: 'Minimalist court leather' }
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

    grid.innerHTML = items.map(item => `
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
    `).join('');
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
      name: 'Sérén Studio Look',
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
    // Quick action: Toggle wardrobe or cycle through curated looks
    const wardrobeSheet = document.getElementById('serenWardrobeSheet');
    if (wardrobeSheet && !wardrobeSheet.classList.contains('hidden')) {
      serenToggleWardrobe(false);
    } else {
      serenToggleWardrobe(true);
    }
  }

  function onStudioCameraChanged(stateName) {
    const backBtn = document.getElementById('serenBackStudioBtn');
    const hints = document.querySelectorAll('.spatial-3d-hint');
    const greeting = document.getElementById('serenFloatingGreeting');
    const tagline = document.querySelector('.seren-editorial-tagline-wrap');

    if (stateName === 'STUDIO_OVERVIEW') {
      if (backBtn) backBtn.classList.add('hidden');
      hints.forEach(h => h.style.display = '');
      if (greeting) greeting.style.display = '';
      if (tagline) tagline.style.display = '';
    } else {
      if (backBtn) backBtn.classList.remove('hidden');
      hints.forEach(h => h.style.display = 'none');
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
    reader.onload = function(e) {
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
      img.onload = function() {
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

  // Helper: Format next refresh date string (e.g. "Nov 3, 2026")
  function getNextRestoreRefreshDateStr(dateObj) {
    const d = dateObj || new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    let targetDate;
    if (day < 3) {
      targetDate = new Date(year, month, 3);
    } else {
      targetDate = new Date(year, month + 1, 3);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[targetDate.getMonth()]} 3, ${targetDate.getFullYear()}`;
  }

  function initStreakState() {
    let saved = null;
    try {
      const raw = localStorage.getItem(STREAK_STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.warn('Could not read streak from localStorage', e);
    }

    const now = Date.now();
    const defaultDeadline = now + (24 * 3600 * 1000); // 24-hour window from outfit recommendation

    if (!saved) {
      state.streak = {
        currentStreak: 5, // Default starter streak of 5 days
        savedPreviousStreak: 5,
        isStreakBroken: false,
        deadline: defaultDeadline,
        lastUploadTimestamp: now - (12 * 3600 * 1000),
        lastUploadDateStr: new Date(now - 12 * 3600 * 1000).toISOString().split('T')[0],
        lastRestoredCycleKey: null, // Eligible for restore!
        uploadedToday: false,
        morningReminderSent: false,
        urgentReminderSent: false
      };
      saveStreakState();
    } else {
      state.streak = saved;
      const todayStr = new Date().toISOString().split('T')[0];
      state.streak.uploadedToday = (state.streak.lastUploadDateStr === todayStr);
    }

    // Check deadline on launch
    checkStreakDeadline();

    // Start 1-second countdown ticker
    if (window._streakTicker) clearInterval(window._streakTicker);
    window._streakTicker = setInterval(tickStreakCountdown, 1000);

    // Initial UI render
    updateStreakUI();

    // If streak is already broken, surface missed upload modal
    if (state.streak.isStreakBroken) {
      setTimeout(() => {
        showMissedStreakModal();
      }, 700);
    }
  }

  function saveStreakState() {
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(state.streak));
    } catch (e) {
      console.warn('Could not persist streak to localStorage', e);
    }
  }

  function tickStreakCountdown() {
    if (!state.streak) return;
    checkStreakDeadline();
    updateStreakUI();
  }

  function checkStreakDeadline() {
    const streak = state.streak;
    if (!streak) return;

    if (streak.isStreakBroken) return;
    if (streak.uploadedToday) return;

    const now = Date.now();
    const msRemaining = streak.deadline - now;

    // 1. Deadline passed: Streak breaks
    if (msRemaining <= 0) {
      breakStreak();
      return;
    }

    // 2. Last 2 Hours Warning Threshold: msRemaining <= 2 hours
    const TWO_HOURS_MS = 2 * 3600 * 1000;
    if (msRemaining <= TWO_HOURS_MS) {
      if (!streak.urgentReminderSent) {
        streak.urgentReminderSent = true;
        saveStreakState();
        sendDailyNotification(
          '⚠️ 2 Hours Left on Your Outfit Streak!',
          `Only 2 hours left to upload today's outfit photo before your 🔥 ${streak.currentStreak}-day streak ends!`,
          true
        );
      }
    } else {
      // Normal Reminder: e.g. 8 hours remaining
      const EIGHT_HOURS_MS = 8 * 3600 * 1000;
      if (msRemaining <= EIGHT_HOURS_MS && !streak.morningReminderSent) {
        streak.morningReminderSent = true;
        saveStreakState();
        sendDailyNotification(
          'Woobi Daily Outfit Reminder 🔥',
          `Don't forget to snap and upload your recommended outfit to maintain your 🔥 ${streak.currentStreak}-day streak!`,
          false
        );
      }
    }
  }

  function breakStreak() {
    const streak = state.streak;
    if (streak.isStreakBroken) return;

    streak.isStreakBroken = true;
    if (streak.currentStreak > 0) {
      streak.savedPreviousStreak = streak.currentStreak;
    } else if (!streak.savedPreviousStreak) {
      streak.savedPreviousStreak = 1;
    }
    streak.currentStreak = 0;
    streak.uploadedToday = false;
    saveStreakState();

    // Trigger visual flame blowout and smoke animation
    triggerFlameBlowoutAnimation();

    // Show missed upload modal
    setTimeout(() => {
      showMissedStreakModal();
    }, 1200);
  }

  function triggerFlameBlowoutAnimation() {
    const flameWrapper = document.getElementById('streakFlameWrapper');
    if (flameWrapper) {
      flameWrapper.classList.remove('reignited');
      flameWrapper.classList.add('blown-out');
    }

    const pill = document.getElementById('streakHeaderPill');
    if (pill) {
      pill.classList.remove('urgent', 'completed');
    }

    const timer = document.getElementById('streakTimer');
    if (timer) timer.textContent = '00:00:00';
  }

  function updateStreakUI() {
    const streak = state.streak;
    if (!streak) return;

    const streakCountEl = document.getElementById('streakCount');
    const streakTimerEl = document.getElementById('streakTimer');
    const streakPillEl = document.getElementById('streakHeaderPill');
    const streakDrawerCountEl = document.querySelector('.streak-drawer-count');
    const readyTimerMini = document.getElementById('streakReadyTimerMini');
    const flameWrapper = document.getElementById('streakFlameWrapper');

    if (streakCountEl) streakCountEl.textContent = streak.currentStreak;
    if (streakDrawerCountEl) streakDrawerCountEl.textContent = streak.currentStreak;

    if (streak.isStreakBroken) {
      if (streakTimerEl) streakTimerEl.textContent = 'Ended';
      if (streakPillEl) {
        streakPillEl.classList.remove('urgent', 'completed');
      }
      if (flameWrapper && !flameWrapper.classList.contains('blown-out')) {
        flameWrapper.classList.add('blown-out');
      }
      return;
    }

    // Flame should be active
    if (flameWrapper && flameWrapper.classList.contains('blown-out')) {
      flameWrapper.classList.remove('blown-out');
    }

    if (streak.uploadedToday) {
      if (streakTimerEl) streakTimerEl.textContent = '✓ Done';
      if (streakPillEl) {
        streakPillEl.classList.remove('urgent');
        streakPillEl.classList.add('completed');
      }
      if (readyTimerMini) readyTimerMini.textContent = '✓ Uploaded';
      return;
    }

    const now = Date.now();
    const diff = Math.max(0, streak.deadline - now);

    const hours = Math.floor(diff / (3600 * 1000));
    const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);

    const formattedTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (streakTimerEl) streakTimerEl.textContent = formattedTime;
    if (readyTimerMini) readyTimerMini.textContent = `⏳ ${hours}h ${mins}m left`;

    // Last 2 Hours Warning Threshold: <= 2 hours (7200 seconds)
    const isUrgent = diff <= (2 * 3600 * 1000);
    if (streakPillEl) {
      streakPillEl.classList.toggle('urgent', isUrgent);
      streakPillEl.classList.remove('completed');
    }
  }

  // Camera upload triggers
  function triggerOutfitPhotoUpload() {
    const input = document.getElementById('outfitPhotoInput');
    if (input) {
      input.value = '';
      input.click();
    }
  }

  function handleOutfitPhotoSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      openPhotoConfirmModal(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function openPhotoConfirmModal(imgDataUrl) {
    const modal = document.getElementById('outfitPhotoConfirmModal');
    const previewImg = document.getElementById('outfitPhotoPreviewImg');
    const currVal = document.getElementById('confirmCurrentStreakVal');
    const newVal = document.getElementById('confirmNewStreakVal');

    if (previewImg) previewImg.src = imgDataUrl || 'assets/welcome_hero.jpg';
    if (currVal) currVal.textContent = state.streak ? state.streak.currentStreak : 0;
    if (newVal) newVal.textContent = (state.streak ? state.streak.currentStreak : 0) + 1;

    if (modal) modal.classList.remove('hidden');
  }

  function closePhotoConfirmModal() {
    const modal = document.getElementById('outfitPhotoConfirmModal');
    if (modal) modal.classList.add('hidden');
  }

  function confirmOutfitPhotoUpload() {
    closePhotoConfirmModal();

    const streak = state.streak;
    streak.currentStreak = (streak.currentStreak || 0) + 1;
    streak.savedPreviousStreak = streak.currentStreak;
    streak.isStreakBroken = false;
    streak.uploadedToday = true;
    streak.lastUploadTimestamp = Date.now();
    streak.lastUploadDateStr = new Date().toISOString().split('T')[0];
    streak.deadline = Date.now() + (24 * 3600 * 1000); // Reset next 24h deadline
    streak.morningReminderSent = false;
    streak.urgentReminderSent = false;
    saveStreakState();

    // Re-ignite flame animation
    const flameWrapper = document.getElementById('streakFlameWrapper');
    if (flameWrapper) {
      flameWrapper.classList.remove('blown-out');
      flameWrapper.classList.add('reignited');
      setTimeout(() => flameWrapper.classList.remove('reignited'), 1000);
    }

    updateStreakUI();
    dismissReminderBanner();

    showToast(`🔥 Streak increased to ${streak.currentStreak}! Amazing look!`);
  }

  // Missed Upload Modal and Monthly Restoration Logic
  function showMissedStreakModal() {
    const modal = document.getElementById('missedStreakModal');
    if (!modal) return;

    const streak = state.streak;
    const lostCountEl = document.getElementById('missedStreakLostCount');
    const statusCard = document.getElementById('restoreStatusCard');
    const statusIcon = document.getElementById('restoreStatusIcon');
    const statusTitle = document.getElementById('restoreStatusTitle');
    const statusSubtitle = document.getElementById('restoreStatusSubtitle');
    const btnRestore = document.getElementById('btnRestoreStreak');

    if (lostCountEl) {
      lostCountEl.textContent = `${streak.savedPreviousStreak || 1} Days`;
    }

    // Check Monthly Restore Eligibility (Refreshes on 3rd of month)
    const currentCycleKey = getMonthlyRestoreCycleKey(new Date());
    const isEligible = streak.lastRestoredCycleKey !== currentCycleKey;
    const nextRefreshDate = getNextRestoreRefreshDateStr(new Date());

    if (isEligible) {
      if (statusCard) statusCard.classList.remove('ineligible');
      if (statusIcon) statusIcon.textContent = '✨';
      if (statusTitle) statusTitle.textContent = 'Monthly Restoration Available!';
      if (statusSubtitle) statusSubtitle.textContent = `You have 1 free restore for this monthly cycle. (Refreshes on the 3rd of every month)`;
      if (btnRestore) {
        btnRestore.disabled = false;
        btnRestore.textContent = `Restore Streak (${streak.savedPreviousStreak || 1} Days) 🔥`;
      }
    } else {
      if (statusCard) statusCard.classList.add('ineligible');
      if (statusIcon) statusIcon.textContent = '🔒';
      if (statusTitle) statusTitle.textContent = 'Monthly Restore Used for this Cycle';
      if (statusSubtitle) statusSubtitle.textContent = `Your free restore refreshes on ${nextRefreshDate}.`;
      if (btnRestore) {
        btnRestore.disabled = true;
        btnRestore.textContent = `Restore Used (Refreshes ${nextRefreshDate})`;
      }
    }

    modal.classList.remove('hidden');
  }

  function closeMissedStreakModal() {
    const modal = document.getElementById('missedStreakModal');
    if (modal) modal.classList.add('hidden');
  }

  function restoreMonthlyStreak() {
    const streak = state.streak;
    const currentCycleKey = getMonthlyRestoreCycleKey(new Date());

    if (streak.lastRestoredCycleKey === currentCycleKey) {
      showToast('⚠️ Monthly restore already used. Refreshes on the 3rd.');
      return;
    }

    streak.currentStreak = streak.savedPreviousStreak || 1;
    streak.isStreakBroken = false;
    streak.lastRestoredCycleKey = currentCycleKey;
    streak.deadline = Date.now() + (24 * 3600 * 1000);
    saveStreakState();

    closeMissedStreakModal();

    // Re-ignite flame
    const flameWrapper = document.getElementById('streakFlameWrapper');
    if (flameWrapper) {
      flameWrapper.classList.remove('blown-out');
      flameWrapper.classList.add('reignited');
      setTimeout(() => flameWrapper.classList.remove('reignited'), 1200);
    }

    updateStreakUI();
    showToast(`✨ Streak restored to ${streak.currentStreak}! Your flame is back! 🔥`);
  }

  function startNewStreak() {
    const streak = state.streak;
    streak.currentStreak = 0;
    streak.savedPreviousStreak = 0;
    streak.isStreakBroken = false;
    streak.uploadedToday = false;
    streak.deadline = Date.now() + (24 * 3600 * 1000);
    saveStreakState();

    closeMissedStreakModal();
    updateStreakUI();
    showToast('Starting a fresh streak! Upload today\'s outfit to light your 🔥 flame.');
  }

  // Streak Details Modal
  function openStreakModal() {
    const modal = document.getElementById('streakDetailsModal');
    if (!modal) return;

    const streak = state.streak;
    const heroCount = document.getElementById('modalHeroStreakCount');
    const heroCountdown = document.getElementById('modalHeroCountdown');
    const heroRestore = document.getElementById('modalHeroRestoreStatus');

    if (heroCount) heroCount.textContent = streak.currentStreak;
    if (heroCountdown) {
      const now = Date.now();
      const diff = Math.max(0, streak.deadline - now);
      const hours = Math.floor(diff / (3600 * 1000));
      const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
      heroCountdown.textContent = streak.uploadedToday ? 'Completed Today' : `${hours}h ${mins}m`;
    }

    const currentCycleKey = getMonthlyRestoreCycleKey(new Date());
    const isEligible = streak.lastRestoredCycleKey !== currentCycleKey;
    if (heroRestore) {
      heroRestore.textContent = isEligible ? 'Available (3rd)' : 'Used this month';
    }

    modal.classList.remove('hidden');
  }

  function closeStreakModal() {
    const modal = document.getElementById('streakDetailsModal');
    if (modal) modal.classList.add('hidden');
  }

  // Daily Reminder Notifications System
  function sendDailyNotification(title, body, isUrgent) {
    // 1. Web Notification API if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: 'assets/welcome_hero.jpg'
        });
      } catch (e) {
        console.warn('System notification error', e);
      }
    } else if ('Notification' in window && Notification.permission === 'default') {
      // Prompt user politely
      Notification.requestPermission();
    }

    // 2. In-App Floating Reminder Banner
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

  // QA & Developer Simulation Tools
  function devSimulateUpload() {
    openPhotoConfirmModal('assets/navy_shirt.jpg');
  }

  function devSimulateTwoHoursLeft() {
    if (!state.streak) return;
    state.streak.deadline = Date.now() + (1 * 3600 * 1000 + 59 * 60 * 1000); // 1h 59m
    state.streak.urgentReminderSent = false;
    state.streak.uploadedToday = false;
    state.streak.isStreakBroken = false;
    saveStreakState();
    checkStreakDeadline();
    updateStreakUI();
    showToast('⏱️ Simulated: Exactly 1h 59m remaining (2-hour warning triggered)');
  }

  function devSimulateStreakBreak() {
    if (!state.streak) return;
    if (state.streak.currentStreak > 0) {
      state.streak.savedPreviousStreak = state.streak.currentStreak;
    }
    state.streak.deadline = Date.now() - 1000;
    saveStreakState();
    breakStreak();
    showToast('💥 Simulated deadline expiration: Streak broken!');
  }

  function devToggleRestoreToken() {
    if (!state.streak) return;
    const currentCycleKey = getMonthlyRestoreCycleKey(new Date());
    if (state.streak.lastRestoredCycleKey === currentCycleKey) {
      state.streak.lastRestoredCycleKey = null;
      showToast('🔄 Restored Monthly Token: Now ELIGIBLE for 3rd date cycle!');
    } else {
      state.streak.lastRestoredCycleKey = currentCycleKey;
      showToast('🔒 Marked Monthly Token as USED for current cycle.');
    }
    saveStreakState();
    checkStreakDeadline();
    updateStreakUI();
  }

  function devResetStreak() {
    localStorage.removeItem(STREAK_STORAGE_KEY);
    initStreakState();
    showToast('🗑️ Reset streak to default 5-day active streak.');
  }

  function init() {
    if (typeof window !== 'undefined' && window.appBootstrap && typeof window.appBootstrap.start === 'function') {
      window.appBootstrap.start();
    }
    initStreakState();

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
    saveReminderPreferences,
    exportWardrobe,
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

    // Daily Outfit-Upload Streak & Countdown Timer API
    openStreakModal,
    closeStreakModal,
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
    devResetStreak
  };

  window.app = Object.assign(window.app || {}, appExports);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
