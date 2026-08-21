(() => {
  "use strict";

  /**
   * ==========================================================================
   * JavaScript 主控制文件
   * ==========================================================================
   *
   * 本文件按以下顺序工作：
   * 1. 开场追逐爱心；
   * 2. Canvas 爱心树；
   * 3. 情书打字机与计时器；
   * 4. 米老鼠许愿转场；
   * 5. 照片流与照片放大；
   * 6. 礼物盒与生日卡片。
   *
   * 日常调参请优先修改 birthday-content.js，不建议直接改动画函数。
   */

  // Canvas 的内部设计尺寸。CSS 会负责把画布等比缩放到不同屏幕。
  const WIDTH = 1100;
  const HEIGHT = 680;

  // 爱心树场景中，初始红心种子的设计坐标。
  const SEED = { x: WIDTH / 2 - 20, y: HEIGHT / 2 };

  // Canvas 绘图颜色；网页其他颜色主要在 style.css 顶部修改。
  const LOVE_RED = "rgb(190, 26, 37)";
  const INK = "rgb(35, 31, 32)";
  const PAPER = "#fffbee";

  /* -------------------------------------------------------------------------
   * DOM 元素缓存：把 HTML 中经常使用的元素先保存下来。
   * ---------------------------------------------------------------------- */
  const openingGate = document.querySelector("#openingGate");
  const openingEyebrow = openingGate.querySelector(".opening-eyebrow");
  const openingTitle = document.querySelector("#openingTitle");
  const openingDescription = document.querySelector("#openingDescription");
  const openingNoticeText = document.querySelector("#openingNoticeText");
  const openingTip = openingGate.querySelector(".opening-tip");
  const catchArena = document.querySelector("#catchArena");
  const catchHeart = document.querySelector("#catchHeart");
  const catchTrail = document.querySelector("#catchTrail");
  const canvas = document.querySelector("#loveCanvas");
  const ctx = canvas.getContext("2d");
  const story = document.querySelector("#story");
  const storyText = document.querySelector("#storyText");
  const clockBox = document.querySelector("#clockBox");
  const clock = document.querySelector("#clock");
  const musicDecks = [
    document.querySelector("#backgroundMusic"),
    document.querySelector("#backgroundMusicAlt"),
  ].filter(Boolean);
  const musicToggle = document.querySelector("#musicToggle");
  const interactionStatus = document.querySelector("#interactionStatus");
  const mainScene = document.querySelector("#main");
  const mouseIntro = document.querySelector("#mouseIntro");
  const wishButton = document.querySelector("#wishButton");
  const mouseTransition = document.querySelector("#mouseTransition");
  const mouseHeads = document.querySelector("#mouseHeads");
  const photoScene = document.querySelector("#photoScene");
  const photoContent = document.querySelector("#photoContent");
  const filmWindow = document.querySelector("#filmWindow");
  const photoTrack = document.querySelector("#photoTrack");
  const photoLightbox = document.querySelector("#photoLightbox");
  const closePhotoLightboxButton = document.querySelector(
    "#closePhotoLightbox",
  );
  const lightboxTopCaption = document.querySelector("#lightboxTopCaption");
  const lightboxBottomCaption = document.querySelector(
    "#lightboxBottomCaption",
  );
  const lightboxFrame = document.querySelector("#lightboxFrame");
  const lightboxImage = document.querySelector("#lightboxImage");
  const lightboxVideo = document.querySelector("#lightboxVideo");
  const lightboxPlaceholder = document.querySelector(
    "#lightboxPlaceholder",
  );
  const finishPhotosButton = document.querySelector("#finishPhotosButton");
  const photoGiftGuide = document.querySelector("#photoGiftGuide");
  const acceptGiftButton = document.querySelector("#acceptGiftButton");
  const giftOverlay = document.querySelector("#giftOverlay");
  const giftBox = document.querySelector("#giftBox");
  const giftSparkles = document.querySelector("#giftSparkles");
  const birthdayCard = document.querySelector("#birthdayCard");
  const cardEyebrow = document.querySelector("#cardEyebrow");
  const cardTitle = document.querySelector("#cardTitle");
  const cardLines = document.querySelector("#cardLines");
  const cardSignature = document.querySelector("#cardSignature");
  const keepGiftButton = document.querySelector("#keepGiftButton");
  const finalWish = document.querySelector("#finalWish");

  // Canvas 不可用时直接停止，避免后续脚本连续报错。
  if (!ctx) {
    interactionStatus.textContent =
      "当前浏览器不支持 HTML5 Canvas，请换用最新版浏览器。";
    return;
  }

  const finalLayer = document.createElement("canvas");
  finalLayer.width = WIDTH;
  finalLayer.height = HEIGHT;
  const finalCtx = finalLayer.getContext("2d");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const motionScale = reducedMotion ? 0.18 : 1;

  /**
   * 内容配置来自 birthday-content.js。
   * 下方对象只在配置文件加载失败时作为安全备用。
   */
  const birthdayContent = window.BIRTHDAY_CONTENT || {
    opening: {},
    story: {},
    relationship: {},
    timing: { photoDurationMs: 16000 },
    effects: {},
    photos: [],
    card: {
      eyebrow: "FOR MY DEAREST",
      title: "生日快乐",
      lines: ["愿所有美好，都在新的一岁与你相遇。"],
      signature: "—— 永远爱你的人",
      finalWish: "愿你每一个愿望，都在未来被温柔接住。",
    },
  };

  // 把各组配置分别保存，后续读取更清晰。
  const openingConfig = birthdayContent.opening || {};
  const storyConfig = birthdayContent.story || {};
  const relationshipConfig = birthdayContent.relationship || {};
  const timingConfig = birthdayContent.timing || {};
  const effectsConfig = birthdayContent.effects || {};
  const musicConfig = birthdayContent.music || {};
  const loadingConfig =
    birthdayContent.loading && typeof birthdayContent.loading === "object"
      ? birthdayContent.loading
      : {};
  const musicLoadingConfig =
    musicConfig.loading && typeof musicConfig.loading === "object"
      ? musicConfig.loading
      : {};

  /**
   * 统一读取数字配置：若用户误填文字或负数，则使用默认值。
   * minimum 用于防止速度为 0、数量为负数等无效情况。
   */
  function configuredNumber(value, fallback, minimum = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, number) : fallback;
  }

  // 异步加载和持久缓存参数，均可在 birthday-content.js / loading 中调整。
  const serviceWorkerEnabled = loadingConfig.serviceWorker !== false;
  const photoLoadAheadScreens = configuredNumber(
    loadingConfig.photoLoadAheadScreens,
    1.25,
    0,
  );
  const photoThumbnailWarmupDelayMs = configuredNumber(
    loadingConfig.thumbnailWarmupDelayMs,
    4500,
    0,
  );
  const photoPreviewNeighborCount = Math.round(
    configuredNumber(loadingConfig.previewNeighborCount, 1, 0),
  );
  const photoSkipOnSaveData = loadingConfig.skipOnSaveData !== false;
  const musicPreloadAhead = Math.round(
    configuredNumber(musicLoadingConfig.preloadAhead, 3, 0),
  );
  const musicPhotoPreloadAhead = Math.round(
    configuredNumber(musicLoadingConfig.photoPreloadAhead, 3, 0),
  );
  const musicPreloadDelayMs = configuredNumber(
    musicLoadingConfig.preloadDelayMs,
    1800,
    0,
  );
  const musicCacheWholePlaylist =
    musicLoadingConfig.cacheWholePlaylist === true;
  const musicCacheRemainingAfterMs = configuredNumber(
    musicLoadingConfig.cacheRemainingAfterMs,
    0,
    0,
  );
  const musicPersistentCache = musicLoadingConfig.persistentCache !== false;
  const musicSkipOnSaveData = musicLoadingConfig.skipOnSaveData !== false;

  // 音乐动作保留符号；在 birthday-content.js / music.actions 中直接使用。
  const MUSIC_NEXT = "NEXT";
  const MUSIC_CONTINUE = "CONTINUE";
  const musicPlaylist = (Array.isArray(musicConfig.playlist)
    ? musicConfig.playlist
    : []
  ).filter(
    (track) => track && typeof track.src === "string" && track.src.trim(),
  );
  const musicActions =
    musicConfig.actions && typeof musicConfig.actions === "object"
      ? musicConfig.actions
      : {};
  const musicVolume = clamp(configuredNumber(musicConfig.volume, 0.52, 0));
  const musicCrossfadeMs = configuredNumber(
    musicConfig.crossfadeMs,
    1400,
    0,
  );
  const musicPauseFadeMs = configuredNumber(
    musicConfig.pauseFadeMs,
    480,
    0,
  );
  const musicFragmentLoopFadeMs = configuredNumber(
    musicConfig.fragmentLoopFadeMs,
    900,
    0,
  );
  const musicOpeningPlaybackConfig =
    musicConfig.opening && typeof musicConfig.opening === "object"
      ? musicConfig.opening
      : {};
  const musicOpeningAutoplay = musicOpeningPlaybackConfig.autoplay === true;
  const musicOpeningAction = Object.prototype.hasOwnProperty.call(
    musicOpeningPlaybackConfig,
    "action",
  )
    ? musicOpeningPlaybackConfig.action
    : 0;
  const musicOpeningRetryOnInteraction =
    musicOpeningPlaybackConfig.retryOnFirstInteraction !== false;
  const musicOpeningFadeInMs = configuredNumber(
    musicOpeningPlaybackConfig.fadeInMs,
    musicCrossfadeMs,
    0,
  );
  const musicDuckingConfig =
    musicConfig.ducking && typeof musicConfig.ducking === "object"
      ? musicConfig.ducking
      : {};
  const musicDuckingEnabled = musicDuckingConfig.enabled !== false;
  const musicDuckVolumeRatio = clamp(
    configuredNumber(musicDuckingConfig.volumeRatio, 0.22, 0),
  );
  const musicDuckFadeOutMs = configuredNumber(
    musicDuckingConfig.fadeOutMs,
    260,
    0,
  );
  const musicDuckHoldMs = configuredNumber(
    musicDuckingConfig.holdMs,
    2000,
    0,
  );
  const musicDuckFadeInMs = configuredNumber(
    musicDuckingConfig.fadeInMs,
    820,
    0,
  );
  const musicDuckChimeHoldMs = configuredNumber(
    musicDuckingConfig.chimeHoldMs,
    musicDuckHoldMs,
    0,
  );
  const musicDuckMickeyHoldMs = configuredNumber(
    musicDuckingConfig.mickeyHoldMs,
    musicDuckHoldMs,
    0,
  );
  const musicDuckOnChime =
    musicDuckingEnabled && musicDuckingConfig.onChime !== false;
  const musicDuckOnMickeyAppear =
    musicDuckingEnabled && musicDuckingConfig.onMickeyAppear !== false;
  const SYNTH_MUSIC_VOLUME = 0.12;

  // 开场参数。减少动态效果的用户会自动得到更短的移动动画。
  const openingMoveEveryMs = configuredNumber(
    openingConfig.moveEveryMs,
    1050,
    300,
  );
  const openingTransitionMs = reducedMotion
    ? 1
    : configuredNumber(openingConfig.transitionMs, 720, 100);
  const openingEdgePaddingPx = configuredNumber(
    openingConfig.edgePaddingPx,
    24,
    0,
  );
  const openingExitDurationMs = reducedMotion
    ? 80
    : configuredNumber(openingConfig.exitDurationMs, 760, 100);

  // 把 JS 中的移动时间同步给 CSS，修改配置文件即可同时影响动画。
  document.documentElement.style.setProperty(
    "--opening-heart-transition",
    `${openingTransitionMs}ms`,
  );
  document.documentElement.style.setProperty(
    "--opening-exit-duration",
    `${openingExitDurationMs}ms`,
  );

  /**
   * 爱心树分段动画时间：
   * shrinkEnd = 红心缩小结束；
   * fallEnd = 种子下落结束；
   * 后续生长、开花、移动时间会根据树枝数据自动计算。
   */
  const sequence = {
    shrinkEnd: 500 * motionScale,
    fallEnd: 1120 * motionScale,
  };

  /**
   * 爱心树树枝路径数据。
   * 每段格式：
   * [起点x, 起点y, 控制点x, 控制点y, 终点x, 终点y, 粗细, 长度, 子树枝]
   * 如果只是改文字、颜色、速度或卡片大小，不需要碰这里。
   */
  const branchConfig = [
    [
      535,
      680,
      570,
      250,
      500,
      200,
      30,
      100,
      [
        [
          540,
          500,
          455,
          417,
          340,
          400,
          13,
          100,
          [[450, 435, 434, 430, 394, 395, 2, 40]],
        ],
        [
          550,
          445,
          600,
          356,
          680,
          345,
          12,
          100,
          [[578, 400, 648, 409, 661, 426, 3, 80]],
        ],
        [539, 281, 537, 248, 534, 217, 3, 40],
        [
          546,
          397,
          413,
          247,
          328,
          244,
          9,
          80,
          [
            [427, 286, 383, 253, 371, 205, 2, 40],
            [498, 345, 435, 315, 395, 330, 4, 60],
          ],
        ],
        [
          546,
          357,
          608,
          252,
          678,
          221,
          6,
          100,
          [[590, 293, 646, 277, 648, 271, 2, 80]],
        ],
      ],
    ],
  ];

  // 情书与相识日期均可在 birthday-content.js 中直接修改。
  const storyCopy =
    storyConfig.copy ||
    "亲爱的你：\n\n愿所有美好，都在新的一岁与你相遇。";
  const relationshipParts = Array.isArray(relationshipConfig.startedAt)
    ? relationshipConfig.startedAt
    : [2017, 1, 1, 0, 0, 0, 2];
  const together = new Date(...relationshipParts);

  // Canvas 图形数据。
  const branches = [];
  const blooms = [];
  const fallingBlooms = [];
  const heartPoints = createHeartPoints();

  /**
   * 页面状态：
   * opening → idle → animating → complete → invitation → transition
   * → photos → gift-invitation → gift
   */
  let phase = "opening";
  let openingMoveTimer = 0;
  let openingUnlocked = false;
  let lastCatchPosition = null;
  let animationStartedAt = 0;
  let lastFrameAt = 0;
  let lastPetalAt = 0;
  let storyStarted = false;
  let storyAnimationId = 0;
  let clockTimer = 0;
  let musicWanted = false;
  let activeMusicDeckIndex = -1;
  let currentMusicCue = null;
  let currentMusicTrackIndex = -1;
  let musicSwitchToken = 0;
  let musicFadeFrame = 0;
  let musicFadeGeneration = 0;
  let musicFadeResolve = null;
  let musicMonitorFrame = 0;
  let musicSwitching = false;
  const musicActionCounts = Object.create(null);
  const musicDeckCues = new WeakMap();
  const musicDeckTokens = new WeakMap();
  const musicDeckBaseVolumes = new WeakMap();
  let musicSynthFallbackAllowed = true;
  let musicDuckFactor = 1;
  let musicDuckFrame = 0;
  let musicDuckGeneration = 0;
  let musicDuckResolve = null;
  let musicDuckRestoreTimer = 0;
  let musicDuckRequestGeneration = 0;
  let openingMusicCue = null;
  let openingMusicAwaitingInteraction = false;
  let openingMusicRetryInstalled = false;
  let synthContext = null;
  let synthGain = null;
  let synthTimer = 0;
  let synthStep = 0;
  let chimeContext = null;
  let invitationScheduled = false;
  let photoSceneStarted = false;
  let giftGuideShown = false;
  let giftOpened = false;
  let floatingHeartsCreated = false;
  let lightboxReturnTarget = null;
  let lightboxMediaToken = 0;
  let photoPointerId = null;
  let photoPointerStartX = 0;
  let photoPointerStartY = 0;
  let photoPointerLastX = 0;
  let photoPointerDistance = 0;
  let photoTrackDragging = false;
  let suppressNextPhotoClick = false;
  let filmHintTimer = 0;
  let photoMediaObserver = null;
  let photoThumbnailWarmupTimer = 0;
  let musicPreloadTimer = 0;
  let musicPreloadAllTimer = 0;
  let imagePrefetchQueue = Promise.resolve();
  const audioPrefetchQueue = [];
  let audioPrefetchRunning = false;
  const pendingAudioPrefetchJobs = new Map();
  let serviceWorkerRegistrationPromise = null;
  const prefetchedMediaUrls = new Set();
  const sceneTimers = new Set();

  flattenBranches(branchConfig, 0);
  const branchDuration = branches.reduce(
    (max, branch) => Math.max(max, branch.delay + branch.duration),
    0,
  );

  sequence.growStart = sequence.fallEnd;
  sequence.growEnd = sequence.growStart + branchDuration;
  sequence.bloomStart = sequence.growEnd + 120 * motionScale;
  sequence.bloomEnd = sequence.bloomStart + 3500 * motionScale;
  sequence.moveStart = sequence.bloomEnd + 160 * motionScale;
  sequence.moveEnd = sequence.moveStart + 1450 * motionScale;

  /* -------------------------------------------------------------------------
   * 页面初始化：先准备所有场景，但只开放开场追逐爱心。
   * ---------------------------------------------------------------------- */
  createBlooms();
  buildPhotoStream();
  renderBirthdayCard();
  createGiftSparkles();
  drawIdle();
  initializeMusicDecks();
  exposeMusicInterface();
  registerPerformanceServiceWorker();
  startOpeningGate();

  // 爱心树红心的鼠标命中反馈；只有进入 idle 状态后才可点击。
  canvas.addEventListener("pointermove", (event) => {
    if (phase !== "idle") return;
    canvas.classList.toggle("is-clickable", isSeedHit(event));
  });

  canvas.addEventListener("pointerleave", () => {
    if (phase === "idle") canvas.classList.add("is-clickable");
  });

  canvas.addEventListener("click", (event) => {
    if (phase !== "idle" || !isSeedHit(event)) return;
    triggerMusicAction("loveTreeHeart");
    startExperience();
  });

  canvas.addEventListener("keydown", (event) => {
    if (phase !== "idle") return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerMusicAction("loveTreeHeart");
      startExperience();
    }
  });

  // 开场移动爱心：鼠标点击、触摸点击和键盘 Enter/空格都能成功进入。
  catchHeart.addEventListener("click", () => {
    if (openingUnlocked || phase !== "opening") return;
    triggerMusicAction("catchHeart", undefined, { forcePlay: true });
    unlockOpeningGate();
  });

  // 各场景主要按钮。只有真正生效的点击才会消费对应音乐动作。
  wishButton.addEventListener("click", () => {
    if (phase !== "invitation") return;
    triggerMusicAction("wishButton");
    startMouseTransition();
  });
  finishPhotosButton.addEventListener("click", () => {
    if (phase !== "photos" || giftGuideShown) return;
    triggerMusicAction("finishPhotosButton");
    showGiftGuide();
  });
  acceptGiftButton.addEventListener("click", () => {
    if (phase !== "gift-invitation") return;
    triggerMusicAction("acceptGiftButton");
    openGiftSequence();
  });
  giftBox.addEventListener("click", () => {
    if (phase !== "gift" || giftOpened) return;
    triggerMusicAction("giftBox");
    openGiftBox();
  });
  keepGiftButton.addEventListener("click", () => {
    if (
      !birthdayCard.classList.contains("is-visible") ||
      birthdayCard.classList.contains("is-kept")
    ) {
      return;
    }
    triggerMusicAction("keepGiftButton");
    keepBirthdayGift();
  });
  closePhotoLightboxButton.addEventListener("click", () => {
    if (!photoLightbox.classList.contains("is-visible")) return;
    triggerMusicAction("photoLightboxClose");
    closePhotoLightbox();
  });
  photoLightbox.addEventListener("click", (event) => {
    if (
      event.target !== photoLightbox ||
      !photoLightbox.classList.contains("is-visible")
    ) {
      return;
    }
    triggerMusicAction("photoLightboxClose");
    closePhotoLightbox();
  });
  lightboxImage.addEventListener("load", handleLightboxImageLoad);
  lightboxImage.addEventListener("error", handleLightboxMediaError);
  lightboxVideo.addEventListener("loadeddata", handleLightboxVideoLoad);
  lightboxVideo.addEventListener("error", handleLightboxMediaError);

  /**
   * 照片流操作：
   * - 电脑滚轮会沿照片轨道前后移动；
   * - 手机或鼠标左右拖动时暂时接管轨道；
   * - 松手后 CSS 自动动画从当前进度继续，不需要额外等待。
   */
  filmWindow.addEventListener("wheel", handlePhotoWheel, { passive: false });
  filmWindow.addEventListener("pointerdown", startPhotoDrag);
  filmWindow.addEventListener("pointermove", movePhotoDrag);
  filmWindow.addEventListener("pointerup", finishPhotoDrag);
  filmWindow.addEventListener("pointercancel", finishPhotoDrag);
  filmWindow.addEventListener("lostpointercapture", finishPhotoDrag);
  filmWindow.addEventListener("keydown", handlePhotoTrackKeyboard);
  filmWindow.addEventListener(
    "click",
    (event) => {
      if (!suppressNextPhotoClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressNextPhotoClick = false;
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && photoLightbox.classList.contains("is-visible")) {
      closePhotoLightbox();
    }
  });

  // 浏览器尺寸改变时，把移动爱心重新放回当前可见范围。
  window.addEventListener("resize", () => {
    if (phase === "opening") moveCatchHeart(true);
  });

  // 背景音乐开关：暂停时淡出；重新播放时默认延续当前片段。
  musicToggle.addEventListener("click", () => {
    // 自动播放被拦截时，第一次点击音乐按钮应补播，而不是误判成“暂停”。
    if (openingMusicAwaitingInteraction) {
      retryOpeningMusicAfterInteraction();
      return;
    }
    if (musicWanted) {
      stopMusic();
      return;
    }
    triggerMusicAction("musicToggle", undefined, { forcePlay: true });
  });

  /**
   * 根据 music.opening.autoplay 在开场页立即尝试播放。
   * 有声自动播放若被浏览器拦截，会在开场页第一次真实点击/按键时补播。
   */
  initializeOpeningMusicPlayback();

  /* =========================================================================
   * 0. 开场追逐爱心
   * ========================================================================= */

  /**
   * 写入开场文案，并启动爱心的定时随机移动。
   * 如果以后只改文案，直接修改 birthday-content.js 的 opening 对象即可。
   */
  function startOpeningGate() {
    setPhase("opening");
    openingEyebrow.textContent =
      openingConfig.eyebrow || "A LITTLE GAME BEFORE LOVE";
    openingTitle.textContent = openingConfig.title || "先抓住这颗心";
    openingDescription.textContent =
      openingConfig.description || "它会在屏幕里跑来跑去。";
    openingNoticeText.textContent =
      openingConfig.notice || "请在安静环境，佩戴耳机为佳";
    openingTip.textContent =
      openingConfig.tip || "成功点击爱心后，故事才会开始";

    // 等浏览器完成首次排版后再测量移动区域，避免得到 0 宽高。
    requestAnimationFrame(() => {
      moveCatchHeart(true);
      openingMoveTimer = window.setInterval(
        () => moveCatchHeart(false),
        openingMoveEveryMs,
      );
    });
  }

  /**
   * 把爱心移动到 catchArena 内的随机位置。
   * keepInsideOnly=true 用于窗口缩放：只保证位置合法，不生成额外轨迹。
   */
  function moveCatchHeart(keepInsideOnly = false) {
    if (openingUnlocked || phase !== "opening") return;

    const arenaWidth = catchArena.clientWidth;
    const arenaHeight = catchArena.clientHeight;
    const heartWidth = catchHeart.offsetWidth;
    const heartHeight = catchHeart.offsetHeight;
    if (!arenaWidth || !arenaHeight || !heartWidth || !heartHeight) return;

    const minX = Math.min(openingEdgePaddingPx, arenaWidth / 4);
    const minY = Math.min(openingEdgePaddingPx, arenaHeight / 4);
    const maxX = Math.max(minX, arenaWidth - heartWidth - minX);
    const maxY = Math.max(minY, arenaHeight - heartHeight - minY);
    const minimumJump = Math.min(arenaWidth, arenaHeight) * 0.3;

    let nextX = minX;
    let nextY = minY;

    // 最多尝试 12 次，尽量避免爱心只移动很短距离。
    for (let attempt = 0; attempt < 12; attempt += 1) {
      nextX = minX + Math.random() * Math.max(0, maxX - minX);
      nextY = minY + Math.random() * Math.max(0, maxY - minY);
      if (
        !lastCatchPosition ||
        Math.hypot(
          nextX - lastCatchPosition.x,
          nextY - lastCatchPosition.y,
        ) >= minimumJump
      ) {
        break;
      }
    }

    if (lastCatchPosition && !keepInsideOnly) {
      createCatchTrail(
        lastCatchPosition.x + heartWidth / 2,
        lastCatchPosition.y + heartHeight / 2,
      );
    }

    catchHeart.style.left = `${nextX}px`;
    catchHeart.style.top = `${nextY}px`;
    catchHeart.style.setProperty(
      "--catch-tilt",
      `${-11 + Math.random() * 22}deg`,
    );
    lastCatchPosition = { x: nextX, y: nextY };
  }

  /**
   * 在爱心离开的旧位置生成短暂的小爱心轨迹。
   * trailCount 控制同时最多保留多少个轨迹元素。
   */
  function createCatchTrail(x, y) {
    const maximumTrailCount = Math.round(
      configuredNumber(openingConfig.trailCount, 10, 0),
    );
    if (!maximumTrailCount) return;

    while (catchTrail.childElementCount >= maximumTrailCount) {
      catchTrail.firstElementChild?.remove();
    }

    const trailHeart = document.createElement("span");
    trailHeart.textContent = "♥";
    trailHeart.style.left = `${x}px`;
    trailHeart.style.top = `${y}px`;
    trailHeart.style.setProperty(
      "--trail-size",
      `${8 + Math.random() * 12}px`,
    );
    catchTrail.append(trailHeart);
    trailHeart.addEventListener("animationend", () => trailHeart.remove(), {
      once: true,
    });
  }

  /**
   * 成功抓住爱心：
   * 停止移动 → 播放确认动画和音乐 → 淡出开场 → 开放爱心树场景。
   */
  function unlockOpeningGate() {
    if (openingUnlocked || phase !== "opening") return;
    openingUnlocked = true;
    window.clearInterval(openingMoveTimer);
    openingMoveTimer = 0;
    setPhase("opening-caught");

    catchHeart.disabled = true;
    openingGate.classList.add("is-caught");
    interactionStatus.textContent =
      "成功抓住爱心。开场正在淡出，即将进入爱心树。";

    // 点击音频动作已在事件入口触发；这里仅播放不影响背景音乐的提示音。
    playChime([523.25, 659.25, 783.99]);

    scheduleScene(() => {
      openingGate.classList.add("is-hidden");
      openingGate.setAttribute("aria-hidden", "true");
      openingGate.inert = true;
      mainScene.setAttribute("aria-hidden", "false");
      canvas.classList.add("is-clickable");
      setPhase("idle");
      interactionStatus.textContent =
        "已经进入爱心树场景。点击页面中央红心继续。";
    }, openingExitDurationMs);
  }

  /* =========================================================================
   * 1. 通用状态与爱心树入口
   * ========================================================================= */

  // 每次场景变化都同步写入 body[data-phase]，CSS 和测试代码都可读取。
  function setPhase(nextPhase) {
    phase = nextPhase;
    document.body.dataset.phase = nextPhase;
  }

  // 点击爱心树中央红心后，正式开始 Canvas 生长动画。
  function startExperience() {
    if (phase !== "idle") return;
    setPhase("animating");
    canvas.classList.remove("is-clickable");
    canvas.setAttribute("aria-label", "爱心树正在生长");
    interactionStatus.textContent = "红心已被点击，爱心树正在生长。";
    animationStartedAt = performance.now();
    lastFrameAt = animationStartedAt;
    requestAnimationFrame(animateSequence);
  }

  /**
   * 爱心树主时间轴：每一帧根据 elapsed（已过去毫秒数）绘制当前画面。
   */
  function animateSequence(now) {
    const elapsed = now - animationStartedAt;
    drawSequence(elapsed);
    if (elapsed < sequence.moveEnd) {
      requestAnimationFrame(animateSequence);
      return;
    }

    buildFinalLayer();
    setPhase("complete");
    canvas.setAttribute("aria-label", "爱心树动画已完成");
    canvas.removeAttribute("tabindex");
    interactionStatus.textContent =
      "爱心树已经开满花朵，情书和相识计时已经出现。";
    revealStory();
    lastFrameAt = now;
    lastPetalAt = now;
    if (phase === "complete" || phase === "invitation") {
      requestAnimationFrame(animatePetals);
    }
  }

  // 绘制爱心树场景最初的静止红心与 click here 提示。
  function drawIdle() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawHeart(ctx, SEED.x, SEED.y, 2, LOVE_RED, 1, 0);

    ctx.save();
    ctx.strokeStyle = LOVE_RED;
    ctx.fillStyle = LOVE_RED;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SEED.x, SEED.y);
    ctx.lineTo(SEED.x + 15, SEED.y + 15);
    ctx.lineTo(SEED.x + 60, SEED.y + 15);
    ctx.stroke();
    ctx.font = '12px "Microsoft YaHei", Verdana, sans-serif';
    ctx.fillText("click here", SEED.x + 17, SEED.y + 28);
    ctx.restore();
  }

  // 按时间依次绘制红心缩小、种子下落、树生长、花朵开放和整体右移。
  function drawSequence(elapsed) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const groundProgress = clamp(
      (elapsed - sequence.shrinkEnd) /
        Math.max(sequence.growStart - sequence.shrinkEnd, 1),
    );
    if (groundProgress > 0) drawGround(ctx, groundProgress);

    if (elapsed < sequence.shrinkEnd) {
      const progress = easeOutCubic(elapsed / sequence.shrinkEnd);
      drawHeart(
        ctx,
        SEED.x,
        SEED.y,
        lerp(2, 0.2, progress),
        LOVE_RED,
        1,
        0,
      );
      drawSeedDot(ctx, SEED.x, SEED.y);
      return;
    }

    if (elapsed < sequence.fallEnd) {
      const progress = easeInCubic(
        (elapsed - sequence.shrinkEnd) /
          (sequence.fallEnd - sequence.shrinkEnd),
      );
      drawSeedDot(ctx, SEED.x, lerp(SEED.y, HEIGHT + 20, progress));
      return;
    }

    const shift =
      260 *
      easeInOutCubic(
        (elapsed - sequence.moveStart) /
          (sequence.moveEnd - sequence.moveStart),
      );

    drawBranches(ctx, elapsed - sequence.growStart, shift);
    drawBlooms(ctx, elapsed, shift);
  }

  function buildFinalLayer() {
    finalCtx.clearRect(0, 0, WIDTH, HEIGHT);
    drawGround(finalCtx, 1);
    drawBranches(finalCtx, Number.POSITIVE_INFINITY, 260);
    for (const bloom of blooms) drawBloom(finalCtx, bloom, 1, 260);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(finalLayer, 0, 0);
  }

  // 爱心树完成后持续生成少量飘落花瓣，保持画面有呼吸感。
  function animatePetals(now) {
    const delta = Math.min((now - lastFrameAt) / 1000, 0.05);
    lastFrameAt = now;

    if (now - lastPetalAt > 320 && fallingBlooms.length < 18) {
      const random = mulberry32(Math.floor(now) + fallingBlooms.length * 97);
      const amount = random() > 0.68 ? 2 : 1;
      for (let i = 0; i < amount; i += 1) {
        fallingBlooms.push({
          x: 650 + random() * 410,
          y: 120 + random() * 250,
          vx: -9 - random() * 20,
          vy: 22 + random() * 35,
          spin: (random() - 0.5) * 1.1,
          angle: random() * Math.PI * 2,
          scale: 0.35 + random() * 0.48,
          alpha: 0.45 + random() * 0.5,
          color: `rgb(255, ${Math.floor(random() * 190)}, ${Math.floor(
            80 + random() * 175,
          )})`,
        });
      }
      lastPetalAt = now;
    }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(finalLayer, 0, 0);

    for (let index = fallingBlooms.length - 1; index >= 0; index -= 1) {
      const petal = fallingBlooms[index];
      petal.x += petal.vx * delta;
      petal.y += petal.vy * delta;
      petal.vy += 6 * delta;
      petal.angle += petal.spin * delta;
      drawHeart(
        ctx,
        petal.x,
        petal.y,
        petal.scale,
        petal.color,
        petal.alpha,
        petal.angle,
      );
      if (petal.x < -30 || petal.y > HEIGHT + 30) {
        fallingBlooms.splice(index, 1);
      }
    }

    requestAnimationFrame(animatePetals);
  }

  function drawGround(target, progress) {
    const half = 600 * clamp(progress);
    target.save();
    target.strokeStyle = INK;
    target.lineWidth = 5;
    target.lineCap = "round";
    target.lineJoin = "round";
    target.beginPath();
    target.moveTo(SEED.x, HEIGHT - 2.5);
    target.lineTo(SEED.x + half, HEIGHT - 2.5);
    target.moveTo(SEED.x, HEIGHT - 2.5);
    target.lineTo(SEED.x - half, HEIGHT - 2.5);
    target.stroke();
    target.restore();
  }

  function drawSeedDot(target, x, y) {
    target.save();
    target.fillStyle = LOVE_RED;
    target.beginPath();
    target.arc(x, y, 10, 0, Math.PI * 2);
    target.fill();
    target.restore();
  }

  /**
   * 把 branchConfig 的嵌套树枝转成一维数组。
   * branchConfig 是几何路径数据，除非要改变树形，一般无需修改。
   */
  function flattenBranches(list, parentDelay) {
    for (const branch of list) {
      const duration = branch[7] * 10 * motionScale;
      branches.push({
        p0: { x: branch[0], y: branch[1] },
        p1: { x: branch[2], y: branch[3] },
        p2: { x: branch[4], y: branch[5] },
        radius: branch[6],
        length: branch[7],
        delay: parentDelay,
        duration,
      });
      if (branch[8]) flattenBranches(branch[8], parentDelay + duration);
    }
  }

  function drawBranches(target, elapsed, shift) {
    for (const branch of branches) {
      const progress = clamp(
        (elapsed - branch.delay) / Math.max(branch.duration, 1),
      );
      if (progress <= 0) continue;

      const steps = Math.max(1, Math.floor(branch.length * progress));
      target.save();
      target.fillStyle = INK;
      target.shadowColor = "rgba(35, 31, 32, 0.55)";
      target.shadowBlur = 2;
      for (let index = 0; index <= steps; index += 1) {
        const t = index / Math.max(branch.length - 1, 1);
        const point = quadraticBezier(branch.p0, branch.p1, branch.p2, t);
        const radius = Math.max(0.65, branch.radius * Math.pow(0.97, index));
        target.beginPath();
        target.arc(point.x + shift, point.y, radius, 0, Math.PI * 2);
        target.fill();
      }
      target.restore();
    }
  }

  // 在心形范围内随机生成花朵数据；数量由 effects.treeBloomCount 控制。
  function createBlooms() {
    const random = mulberry32(20170201);
    const targetBloomCount = Math.round(
      configuredNumber(effectsConfig.treeBloomCount, 700, 1),
    );
    let attempts = 0;
    while (
      blooms.length < targetBloomCount &&
      attempts < targetBloomCount * 150
    ) {
      attempts += 1;
      const x = 20 + random() * 1040;
      const y = 20 + random() * 610;
      if (!insideHeart(x - 540, 345 - y, 240)) continue;
      blooms.push({
        x,
        y,
        color: `rgb(255, ${Math.floor(random() * 256)}, ${Math.floor(
          random() * 256,
        )})`,
        alpha: 0.3 + random() * 0.7,
        angle: random() * Math.PI * 2,
        scale: 0.72 + random() * 0.28,
      });
    }
  }

  function drawBlooms(target, elapsed, shift) {
    const spread = Math.max(sequence.bloomEnd - sequence.bloomStart, 1);
    for (let index = 0; index < blooms.length; index += 1) {
      const bloom = blooms[index];
      const revealAt = sequence.bloomStart + (index / blooms.length) * spread;
      const progress = clamp((elapsed - revealAt) / Math.max(110 * motionScale, 1));
      if (progress <= 0) continue;
      drawBloom(target, bloom, easeOutBack(progress), shift);
    }
  }

  function drawBloom(target, bloom, progress, shift) {
    drawHeart(
      target,
      bloom.x + shift,
      bloom.y,
      bloom.scale * progress,
      bloom.color,
      bloom.alpha,
      bloom.angle,
    );
  }

  function createHeartPoints() {
    const points = [];
    for (let index = 10; index < 30; index += 0.2) {
      const t = index / Math.PI;
      points.push({
        x: 16 * Math.pow(Math.sin(t), 3),
        y:
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t),
      });
    }
    return points;
  }

  function drawHeart(target, x, y, scale, color, alpha, angle) {
    if (scale <= 0) return;
    target.save();
    target.translate(x, y);
    target.rotate(angle || 0);
    target.scale(scale, scale);
    target.globalAlpha = alpha;
    target.fillStyle = color;
    target.beginPath();
    target.moveTo(0, 0);
    for (const point of heartPoints) target.lineTo(point.x, -point.y);
    target.closePath();
    target.fill();
    target.restore();
  }

  /* =========================================================================
   * 2. 情书打字机、计时器与米老鼠邀请
   * ========================================================================= */

  function revealStory() {
    if (storyStarted) return;
    storyStarted = true;
    story.classList.add("is-visible");
    clockBox.classList.add("is-visible");
    updateClock();
    clockTimer = window.setInterval(updateClock, 1000);

    const startedAt = performance.now();
    // 修改 birthday-content.js / story.characterDelayMs 可调打字速度。
    const characterDelay = reducedMotion
      ? 8
      : configuredNumber(storyConfig.characterDelayMs, 75, 8);
    const write = (now) => {
      const count = Math.min(
        storyCopy.length,
        Math.floor((now - startedAt) / characterDelay),
      );
      storyText.replaceChildren(document.createTextNode(storyCopy.slice(0, count)));
      if (count < storyCopy.length) {
        const cursor = document.createElement("span");
        cursor.className = "type-cursor";
        cursor.textContent = "_";
        storyText.append(cursor);
        storyAnimationId = requestAnimationFrame(write);
      } else if (!invitationScheduled) {
        invitationScheduled = true;
        const invitationDelay = configuredNumber(
          storyConfig.invitationDelayMs,
          1200,
          0,
        );
        scheduleScene(
          showMouseInvitation,
          reducedMotion ? Math.min(280, invitationDelay) : invitationDelay,
        );
      }
    };
    storyAnimationId = requestAnimationFrame(write);
  }

  // 打字结束后显示右侧米老鼠和“许愿”按钮。
  function showMouseInvitation() {
    if (phase !== "complete") return;
    setPhase("invitation");
    duckForMickeyAppearance();
    mouseIntro.classList.add("is-visible");
    mouseIntro.setAttribute("aria-hidden", "false");
    interactionStatus.textContent =
      "一位圆耳鼠朋友从右侧出现，邀请你一起许下生日愿望。";
    wishButton.focus({ preventScroll: true });
  }

  /* =========================================================================
   * 3. 许愿转场与照片场景
   * ========================================================================= */

  // 点击“一起许愿”后创建米老鼠头铺屏转场，再切换到照片流。
  function startMouseTransition() {
    if (phase !== "invitation") return;
    setPhase("transition");
    duckForMickeyAppearance();
    playChime([523.25, 659.25, 783.99], {
      // 米老鼠铺屏已单独触发压低；关闭这里的重复请求，避免较短时长覆盖它。
      duck: !musicDuckOnMickeyAppear,
    });
    createTransitionHeads();
    mouseIntro.classList.remove("is-visible");
    mouseIntro.setAttribute("aria-hidden", "true");
    mouseTransition.classList.remove("is-revealing");
    mouseTransition.classList.add("is-active");
    mouseTransition.setAttribute("aria-hidden", "false");
    interactionStatus.textContent = "许愿转场开始，满屏圆耳鼠头像正在出现。";

    scheduleScene(
      () => {
        mainScene.classList.add("scene-hidden");
        mainScene.setAttribute("aria-hidden", "true");
        photoScene.classList.add("is-active");
        photoScene.setAttribute("aria-hidden", "false");
        startPhotoScene();
        window.scrollTo({ top: 0, behavior: "auto" });
        mouseTransition.classList.add("is-revealing");

        scheduleScene(() => {
          mouseTransition.classList.remove("is-active", "is-revealing");
          mouseTransition.setAttribute("aria-hidden", "true");
        }, reducedMotion
          ? 80
          : configuredNumber(timingConfig.transitionRevealMs, 760, 0));
      },
      reducedMotion
        ? 420
        : configuredNumber(timingConfig.transitionCoverMs, 1900, 0),
    );
  }

  // 启动照片场景的按钮计时和自动礼物邀请计时。
  function startPhotoScene() {
    if (photoSceneStarted) return;
    photoSceneStarted = true;
    setPhase("photos");
    interactionStatus.textContent =
      "进入回忆流场景，照片和视频会从右向左缓缓经过，并显示上下文字说明。";
    activatePhotoMediaLoading();
    prefetchPhotoMusicWindow(0);

    scheduleScene(
      () => {
        finishPhotosButton.classList.add("is-visible");
        finishPhotosButton.setAttribute("aria-hidden", "false");
        finishPhotosButton.tabIndex = 0;
      },
      reducedMotion
        ? 240
        : configuredNumber(timingConfig.photoContinueButtonMs, 3600, 0),
    );

    const configuredDuration = Number(
      timingConfig.photoDurationMs ?? birthdayContent.photoDurationMs,
    );
    const duration = Number.isFinite(configuredDuration)
      ? Math.max(5000, configuredDuration)
      : 18000;
    scheduleScene(showGiftGuide, reducedMotion ? duration * 0.22 : duration);
  }

  // 照片播放结束后让米老鼠从右侧出现；大图打开时会延后出现。
  function showGiftGuide() {
    if (!photoSceneStarted || giftGuideShown || phase === "gift") return;
    if (photoLightbox.classList.contains("is-visible")) {
      scheduleScene(showGiftGuide, reducedMotion ? 300 : 1200);
      return;
    }
    giftGuideShown = true;
    setPhase("gift-invitation");
    duckForMickeyAppearance();
    finishPhotosButton.classList.remove("is-visible");
    finishPhotosButton.setAttribute("aria-hidden", "true");
    finishPhotosButton.tabIndex = -1;
    photoGiftGuide.classList.add("is-visible");
    photoGiftGuide.setAttribute("aria-hidden", "false");
    interactionStatus.textContent =
      "圆耳鼠朋友带着礼物出现了，点击签收礼物继续。";
    acceptGiftButton.focus({ preventScroll: true });
  }

  /* =========================================================================
   * 4. 礼物盒与生日卡片
   * ========================================================================= */

  function openGiftSequence() {
    if (phase !== "gift-invitation") return;
    setPhase("gift");
    photoGiftGuide.classList.remove("is-visible");
    photoGiftGuide.setAttribute("aria-hidden", "true");
    photoContent.classList.add("is-blurred");
    photoContent.setAttribute("aria-hidden", "true");
    giftOverlay.classList.add("is-visible");
    giftOverlay.setAttribute("aria-hidden", "false");
    interactionStatus.textContent = "背景已经虚化，礼物盒正在打开。";
    playChime([392, 523.25, 659.25]);
    scheduleScene(
      openGiftBox,
      reducedMotion
        ? 80
        : configuredNumber(timingConfig.giftOpenDelayMs, 720, 0),
    );
  }

  function openGiftBox() {
    if (phase !== "gift" || giftOpened) return;
    giftOpened = true;
    giftBox.classList.add("is-open");
    giftBox.setAttribute("aria-label", "礼物盒已经打开");
    playChime([659.25, 783.99, 1046.5]);
    scheduleScene(
      () => {
        giftOverlay.classList.add("card-revealed");
        birthdayCard.classList.add("is-visible");
        interactionStatus.textContent = "礼物盒打开了，一张生日卡片升了起来。";
        keepGiftButton.focus({ preventScroll: true });
      },
      reducedMotion
        ? 100
        : configuredNumber(timingConfig.cardRevealDelayMs, 760, 0),
    );
  }

  function keepBirthdayGift() {
    if (!birthdayCard.classList.contains("is-visible")) return;
    birthdayCard.classList.add("is-kept");
    createFloatingHearts();
    playChime([523.25, 659.25, 783.99, 1046.5]);
    interactionStatus.textContent =
      "生日心意已经收下。愿每一个愿望，都被未来温柔接住。";
  }

  /* =========================================================================
   * 5. 照片流生成与大图交互
   * ========================================================================= */

  /**
   * 根据 photos 数组生成两套相同卡片。
   * 第二套是无障碍隐藏副本，用来衔接第一套，实现无限循环。
   */
  function buildPhotoStream() {
    const configuredPhotos = Array.isArray(birthdayContent.photos)
      ? birthdayContent.photos
      : [];
    const photos = configuredPhotos.length
      ? configuredPhotos
      : Array.from({ length: 6 }, (_, index) => ({
          src: "",
          alt: `第 ${index + 1} 张生日照片`,
          top: "这里会放入一段温柔的小回忆。",
          bottom: "把这一刻，交给照片替我们记住。",
        }));

    photoTrack.replaceChildren();
    const secondsPerCard = configuredNumber(
      effectsConfig.photoSecondsPerCard,
      7,
      1,
    );
    const minimumTrackSeconds = configuredNumber(
      effectsConfig.minimumPhotoTrackSeconds,
      38,
      5,
    );
    photoTrack.style.setProperty(
      "--track-duration",
      `${Math.max(minimumTrackSeconds, photos.length * secondsPerCard)}s`,
    );

    for (let setIndex = 0; setIndex < 2; setIndex += 1) {
      const set = document.createElement("div");
      set.className = "photo-track-set";
      if (setIndex === 1) set.setAttribute("aria-hidden", "true");

      photos.forEach((photo, index) => {
        set.append(createPhotoCard(photo || {}, index, setIndex === 0));
      });
      photoTrack.append(set);
    }
    preparePhotoMediaLoading();
  }

  function preparePhotoMediaLoading() {
    photoMediaObserver?.disconnect();
    photoMediaObserver = null;

    const pendingMedia = [...photoTrack.querySelectorAll("[data-photo-src]")];
    if (!("IntersectionObserver" in window)) {
      pendingMedia.forEach(loadDeferredPhotoMedia);
      schedulePhotoThumbnailWarmup();
      return;
    }

    const horizontalMargin = Math.round(photoLoadAheadScreens * 100);
    photoMediaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadDeferredPhotoMedia(entry.target);
          photoMediaObserver?.unobserve(entry.target);
        });
      },
      {
        root: filmWindow,
        rootMargin: "40px " + horizontalMargin + "% 40px " + horizontalMargin + "%",
        threshold: 0.01,
      },
    );
    pendingMedia.forEach((media) => photoMediaObserver.observe(media));
    schedulePhotoThumbnailWarmup();
  }

  function activatePhotoMediaLoading() {
    const media = [...photoTrack.querySelectorAll("[data-photo-src]")];
    media.slice(0, Math.min(6, media.length)).forEach((item) => {
      loadDeferredPhotoMedia(item);
      photoMediaObserver?.unobserve(item);
    });
  }

  function schedulePhotoThumbnailWarmup() {
    window.clearTimeout(photoThumbnailWarmupTimer);
    if (shouldSkipBackgroundPrefetch(photoSkipOnSaveData)) return;
    photoThumbnailWarmupTimer = window.setTimeout(() => {
      const thumbnailUrls = getConfiguredPhotos()
        .map((photo) => getPhotoThumbnailSource(photo))
        .filter(Boolean);
      queueMediaPrefetch(thumbnailUrls, "image");
    }, photoThumbnailWarmupDelayMs);
  }

  function loadDeferredPhotoMedia(media) {
    if (!(media instanceof HTMLElement) || media.dataset.loaded === "true") return;
    const source = media.dataset.photoSrc || "";
    if (!source) return;
    media.dataset.loaded = "true";
    media.removeAttribute("data-photo-src");
    if (media instanceof HTMLVideoElement) {
      media.src = source;
      media.load();
    } else if (media instanceof HTMLImageElement) {
      media.src = source;
    }
  }

  function getConfiguredPhotos() {
    return Array.isArray(birthdayContent.photos) ? birthdayContent.photos : [];
  }

  function getPhotoThumbnailSource(photo) {
    if (!photo || typeof photo !== "object") return "";
    const thumbnail =
      typeof photo.thumbnail === "string" ? photo.thumbnail.trim() : "";
    const poster = typeof photo.poster === "string" ? photo.poster.trim() : "";
    const source = typeof photo.src === "string" ? photo.src.trim() : "";
    return thumbnail || poster || source;
  }

  function getPhotoPreviewSource(photo) {
    if (!photo || typeof photo !== "object") return "";
    const preview = typeof photo.preview === "string" ? photo.preview.trim() : "";
    const source = typeof photo.src === "string" ? photo.src.trim() : "";
    return preview || source;
  }

  function prefetchPhotoPreview(photo) {
    if (shouldSkipBackgroundPrefetch(photoSkipOnSaveData)) return;
    const source = getPhotoPreviewSource(photo);
    if (source) queueMediaPrefetch([source], "image");
  }

  function prefetchNeighborPhotoPreviews(index) {
    if (
      photoPreviewNeighborCount <= 0 ||
      shouldSkipBackgroundPrefetch(photoSkipOnSaveData)
    ) {
      return;
    }
    const photos = getConfiguredPhotos();
    if (!photos.length) return;
    const urls = [];
    for (let offset = 1; offset <= photoPreviewNeighborCount; offset += 1) {
      const previous = photos[positiveModulo(index - offset, photos.length)];
      const next = photos[positiveModulo(index + offset, photos.length)];
      urls.push(getPhotoPreviewSource(previous), getPhotoPreviewSource(next));
    }
    queueMediaPrefetch(urls.filter(Boolean), "image");
  }

  // 访客主动开启“节省流量”后，不在后台抢先下载尚未查看的素材。
  function shouldSkipBackgroundPrefetch(skipOnSaveData) {
    if (!skipOnSaveData) return false;
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    return connection?.saveData === true;
  }

  // 注册持久缓存。file:// 本地直开或不支持 Service Worker 时会静默回退。
  function registerPerformanceServiceWorker() {
    if (serviceWorkerRegistrationPromise) {
      return serviceWorkerRegistrationPromise;
    }

    const canRegister =
      serviceWorkerEnabled &&
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!canRegister) {
      serviceWorkerRegistrationPromise = Promise.resolve(null);
      return serviceWorkerRegistrationPromise;
    }

    serviceWorkerRegistrationPromise = navigator.serviceWorker
      .register("./sw.js", {
        scope: "./",
        updateViaCache: "none",
      })
      .catch(() => null);
    return serviceWorkerRegistrationPromise;
  }

  function normalizeMediaUrl(source) {
    if (typeof source !== "string" || !source.trim()) return "";
    try {
      return new URL(source.trim(), document.baseURI).href;
    } catch {
      return "";
    }
  }

  /**
   * 图片和音频使用两条独立串行队列：小缩略图不会被几 MB 的歌曲阻塞，
   * 同一 URL 只下载一次。音频队列支持 priority，用户即将点击的歌曲可越过
   * 尚未开始的整歌单后台任务；当前正在下载的单个文件不会被粗暴中断。
   */
  function queueMediaPrefetch(sources, mediaType = "image", options = {}) {
    const sourceList = Array.isArray(sources) ? sources : [sources];
    const normalizedType = mediaType === "audio" ? "audio" : "image";

    if (normalizedType === "audio") {
      const priority = options?.priority === true;
      const queuedJobs = [];

      sourceList.forEach((source) => {
        const url = normalizeMediaUrl(source);
        if (!url) return;

        const pendingJob = pendingAudioPrefetchJobs.get(url);
        if (pendingJob) {
          if (priority) {
            const pendingIndex = audioPrefetchQueue.indexOf(pendingJob);
            if (pendingIndex >= 0) {
              audioPrefetchQueue.splice(pendingIndex, 1);
              queuedJobs.push(pendingJob);
            }
          }
          return;
        }

        if (prefetchedMediaUrls.has(url)) return;
        prefetchedMediaUrls.add(url);
        const job = { url };
        pendingAudioPrefetchJobs.set(url, job);
        queuedJobs.push(job);
      });

      if (queuedJobs.length) {
        if (priority) {
          audioPrefetchQueue.unshift(...queuedJobs);
        } else {
          audioPrefetchQueue.push(...queuedJobs);
        }
        void drainAudioPrefetchQueue();
      }
      return Promise.resolve();
    }

    let queue = imagePrefetchQueue;
    sourceList.forEach((source) => {
      const url = normalizeMediaUrl(source);
      if (!url || prefetchedMediaUrls.has(url)) return;
      prefetchedMediaUrls.add(url);
      queue = queue
        .then(() => prefetchSingleMediaUrl(url, normalizedType))
        .catch(() => {
          prefetchedMediaUrls.delete(url);
        });
    });

    imagePrefetchQueue = queue;
    return queue;
  }

  async function drainAudioPrefetchQueue() {
    if (audioPrefetchRunning) return;
    audioPrefetchRunning = true;

    try {
      while (audioPrefetchQueue.length) {
        const job = audioPrefetchQueue.shift();
        pendingAudioPrefetchJobs.delete(job.url);
        try {
          await prefetchSingleMediaUrl(job.url, "audio");
        } catch {
          prefetchedMediaUrls.delete(job.url);
        }
      }
    } finally {
      audioPrefetchRunning = false;
      if (audioPrefetchQueue.length) void drainAudioPrefetchQueue();
    }
  }

  async function prefetchSingleMediaUrl(url, mediaType) {
    const usePersistentWorker =
      serviceWorkerEnabled &&
      (mediaType !== "audio" || musicPersistentCache);

    if (usePersistentWorker && (await cacheUrlWithServiceWorker(url))) {
      return true;
    }

    const response = await fetch(url, {
      cache: "force-cache",
      credentials: "same-origin",
    });
    if (!response.ok && response.type !== "opaque") {
      throw new Error("Media prefetch failed: " + response.status);
    }
    await response.arrayBuffer();
    return true;
  }

  async function getReadyPerformanceWorker() {
    const registration = await registerPerformanceServiceWorker();
    if (!registration) return null;
    if (navigator.serviceWorker.controller) {
      return navigator.serviceWorker.controller;
    }
    if (registration.active) return registration.active;

    const readyRegistration = await Promise.race([
      navigator.serviceWorker.ready.catch(() => null),
      new Promise((resolve) => window.setTimeout(() => resolve(null), 10000)),
    ]);
    return (
      navigator.serviceWorker.controller ||
      readyRegistration?.active ||
      registration.active ||
      null
    );
  }

  async function cacheUrlWithServiceWorker(url) {
    const worker = await getReadyPerformanceWorker();
    if (!worker || typeof MessageChannel !== "function") return false;

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      let settled = false;
      const finish = (success) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        channel.port1.close();
        resolve(Boolean(success));
      };
      const timeout = window.setTimeout(() => finish(false), 180000);
      channel.port1.onmessage = (event) => finish(event.data?.ok === true);
      channel.port1.onmessageerror = () => finish(false);

      try {
        worker.postMessage({ type: "CACHE_URL", url }, [channel.port2]);
      } catch {
        finish(false);
      }
    });
  }

  /**
   * 只读取动作配置而不消费点击次数，用于判断某张照片接下来会请求哪首歌。
   */
  function getMusicActionForPrefetch(actionName, sequenceIndex) {
    const hasConfiguredAction = Object.prototype.hasOwnProperty.call(
      musicActions,
      actionName,
    );
    let action = hasConfiguredAction ? musicActions[actionName] : MUSIC_NEXT;

    if (!Array.isArray(action)) return action;
    if (!action.length) return MUSIC_CONTINUE;

    const suppliedIndex = Number(sequenceIndex);
    const actionIndex = Number.isFinite(suppliedIndex)
      ? Math.trunc(suppliedIndex)
      : 0;
    return action[positiveModulo(actionIndex, action.length)];
  }

  /**
   * 在不改变当前播放状态的前提下解析一个待缓存动作。
   * NEXT 会以传入的参考歌曲为基准，CONTINUE 则保持参考歌曲。
   */
  function resolveMusicCueForPrefetch(action, referenceTrackIndex = -1) {
    const normalizedSymbol =
      typeof action === "string" ? action.trim().toUpperCase() : "";
    if (normalizedSymbol === MUSIC_CONTINUE) {
      return referenceTrackIndex >= 0
        ? resolveMusicCue(referenceTrackIndex)
        : currentMusicCue;
    }
    if (normalizedSymbol === MUSIC_NEXT) {
      return resolveMusicCue(
        referenceTrackIndex >= 0 ? referenceTrackIndex + 1 : 0,
      );
    }

    if (action && typeof action === "object" && !Array.isArray(action)) {
      const referenceKey = ["track", "trackIndex", "index", "id", "title"].find(
        (key) => Object.prototype.hasOwnProperty.call(action, key),
      );
      const referenceValue = referenceKey ? action[referenceKey] : null;
      const objectSymbol =
        typeof referenceValue === "string"
          ? referenceValue.trim().toUpperCase()
          : "";

      if (objectSymbol === MUSIC_CONTINUE) {
        return referenceTrackIndex >= 0
          ? resolveMusicCue({ ...action, [referenceKey]: referenceTrackIndex })
          : currentMusicCue;
      }
      if (objectSymbol === MUSIC_NEXT) {
        return resolveMusicCue({
          ...action,
          [referenceKey]: referenceTrackIndex >= 0 ? referenceTrackIndex + 1 : 0,
        });
      }
    }

    return resolveMusicCue(action);
  }

  function appendUniqueMusicSource(target, seen, cue) {
    if (!cue?.src) return;
    const url = normalizeMediaUrl(cue.src);
    if (!url || seen.has(url)) return;
    seen.add(url);
    target.push(cue.src);
  }

  /**
   * 按真实故事流程组织首批优先级：爱心树、许愿、照片流最前面的几次点击。
   * 照片后段和礼物阶段会在用户接近时再用滑动窗口预取，避免页面打开后
   * 就把几十首照片歌曲全部放进后台队列。
   */
  function collectLikelyMusicSources(anchorCue = currentMusicCue) {
    const sources = [];
    const seen = new Set();
    let referenceTrackIndex = Number.isFinite(anchorCue?.trackIndex)
      ? anchorCue.trackIndex
      : currentMusicTrackIndex;

    const appendAction = (action) => {
      const cue = resolveMusicCueForPrefetch(action, referenceTrackIndex);
      if (!cue) return;
      referenceTrackIndex = cue.trackIndex;
      appendUniqueMusicSource(sources, seen, cue);
    };

    appendAction(getMusicActionForPrefetch("loveTreeHeart"));
    appendAction(getMusicActionForPrefetch("wishButton"));

    for (let index = 0; index < musicPhotoPreloadAhead; index += 1) {
      appendAction(getMusicActionForPrefetch("photoCard", index));
    }

    return sources;
  }

  /**
   * 鼠标移到照片或键盘聚焦照片时，只预取该照片点击后真正需要的音频。
   */
  function prefetchMusicForPhotoIndex(index) {
    if (
      !musicPlaylist.length ||
      shouldSkipBackgroundPrefetch(musicSkipOnSaveData)
    ) {
      return;
    }

    const action = getMusicActionForPrefetch("photoCard", index);
    const cue = resolveMusicCueForPrefetch(action, currentMusicTrackIndex);
    if (cue?.src) {
      queueMediaPrefetch([cue.src], "audio", { priority: true });
    }
  }

  /**
   * 根据照片点击顺序预取一个小型歌曲窗口。显式歌曲片段、NEXT 和 CONTINUE
   * 都沿用正式播放时的解析规则，不会修改当前歌曲或消耗任何点击计数。
   */
  function prefetchPhotoMusicWindow(
    startIndex,
    count = musicPhotoPreloadAhead,
  ) {
    if (
      !musicPlaylist.length ||
      shouldSkipBackgroundPrefetch(musicSkipOnSaveData)
    ) {
      return;
    }

    const firstIndex = Math.max(0, Math.trunc(Number(startIndex) || 0));
    const preloadCount = Math.round(
      configuredNumber(count, musicPhotoPreloadAhead, 0),
    );
    if (!preloadCount) return;

    const sources = [];
    const seen = new Set();
    let referenceTrackIndex = currentMusicTrackIndex;

    for (let offset = 0; offset < preloadCount; offset += 1) {
      const action = getMusicActionForPrefetch(
        "photoCard",
        firstIndex + offset,
      );
      const cue = resolveMusicCueForPrefetch(action, referenceTrackIndex);
      if (!cue) continue;
      referenceTrackIndex = cue.trackIndex;
      appendUniqueMusicSource(sources, seen, cue);
    }

    if (sources.length) {
      queueMediaPrefetch(sources, "audio", { priority: true });
    }
  }

  /**
   * 默认只缓存故事流程中马上可能播放的少量歌曲。只有显式开启
   * cacheWholePlaylist 后，才会在带宽空闲时把整张歌单加入后台队列。
   */
  function scheduleMusicPreloading(anchorCue = currentMusicCue) {
    window.clearTimeout(musicPreloadTimer);
    window.clearTimeout(musicPreloadAllTimer);
    musicPreloadTimer = 0;
    musicPreloadAllTimer = 0;

    if (
      !musicPlaylist.length ||
      shouldSkipBackgroundPrefetch(musicSkipOnSaveData)
    ) {
      return;
    }

    const currentUrl = normalizeMediaUrl(anchorCue?.src || "");
    const likelySources = collectLikelyMusicSources(anchorCue);
    const allSources = [];
    const seen = new Set();
    const appendSource = (source, allowCurrent = false) => {
      const url = normalizeMediaUrl(source);
      if (!url || seen.has(url) || (!allowCurrent && url === currentUrl)) return;
      seen.add(url);
      allSources.push(source);
    };

    likelySources.forEach((source) => appendSource(source));
    if (musicCacheWholePlaylist) {
      musicPlaylist.forEach((track) => appendSource(track.src));
    }

    const prioritySources = allSources.slice(0, musicPreloadAhead);
    const remainingSources = musicCacheWholePlaylist
      ? [
          ...(anchorCue?.src ? [anchorCue.src] : []),
          ...allSources.slice(prioritySources.length),
        ]
      : [];

    if (prioritySources.length) {
      musicPreloadTimer = window.setTimeout(() => {
        musicPreloadTimer = 0;
        queueMediaPrefetch(prioritySources, "audio", { priority: true });
      }, musicPreloadDelayMs);
    }

    if (
      musicCacheWholePlaylist &&
      musicCacheRemainingAfterMs > 0 &&
      remainingSources.length
    ) {
      musicPreloadAllTimer = window.setTimeout(() => {
        musicPreloadAllTimer = 0;
        queueMediaPrefetch(remainingSources, "audio");
      }, musicPreloadDelayMs + musicCacheRemainingAfterMs);
    }
  }

  /**
   * 判断一条素材是图片还是视频。
   * 可在 birthday-content.js 中显式填写 type: "video" / "image"；
   * 不填写时，会根据 mp4、webm、ogg 等文件扩展名自动识别。
   * GIF 属于图片格式，因此会由浏览器自动循环播放，无需额外配置。
   */
  function getPhotoMediaType(photo, source) {
    const configuredType =
      typeof photo.type === "string" ? photo.type.trim().toLowerCase() : "";
    if (configuredType === "video" || configuredType === "image") {
      return configuredType;
    }

    return /\.(?:mp4|webm|ogg|ogv|m4v|mov)(?:[?#].*)?$/i.test(source)
      ? "video"
      : "image";
  }

  // 为一条图片或视频配置创建“上文字 + 相框 + 下文字”的完整卡片。
  function createPhotoCard(photo, index, isPrimarySet) {
    const source = typeof photo.src === "string" ? photo.src.trim() : "";
    const mediaType = getPhotoMediaType(photo, source);
    const fallbackName =
      mediaType === "video"
        ? `第 ${index + 1} 段生日视频`
        : `第 ${index + 1} 张生日照片`;

    const card = document.createElement("article");
    card.className = "photo-card";
    card.style.setProperty("--tilt", `${index % 2 ? 1.1 : -0.9}deg`);
    card.setAttribute("role", "button");
    card.tabIndex = isPrimarySet ? 0 : -1;
    card.setAttribute(
      "aria-label",
      `${mediaType === "video" ? "播放查看" : "放大查看"}${
        photo.alt || fallbackName
      }`,
    );

    const topCaption = document.createElement("p");
    topCaption.className = "photo-caption photo-caption-top";
    topCaption.textContent =
      photo.top || "这里会放入一段温柔的小回忆。";

    const frame = document.createElement("div");
    frame.className = "photo-frame";
    frame.dataset.number = `NO.${String(index + 1).padStart(2, "0")}`;

    const placeholder = document.createElement("div");
    placeholder.className = "photo-placeholder";
    const placeholderMark = document.createElement("span");
    placeholderMark.className = "placeholder-mark";
    placeholderMark.append(document.createElement("span"));
    const placeholderLabel = document.createElement("span");
    placeholderLabel.className = "placeholder-label";
    placeholderLabel.textContent =
      mediaType === "video"
        ? `在 photos 文件夹放入视频 ${String(index + 1).padStart(2, "0")}`
        : `在 photos 文件夹放入照片 ${String(index + 1).padStart(2, "0")}`;
    placeholder.append(placeholderMark, placeholderLabel);
    frame.append(placeholder);

    if (source) {
      if (mediaType === "video") {
        const video = document.createElement("video");
        const posterSource =
          typeof photo.poster === "string" ? photo.poster.trim() : "";
        video.className = "photo-media photo-video";
        video.muted = photo.muted !== false;
        video.defaultMuted = video.muted;
        video.loop = photo.loop !== false;
        video.autoplay = photo.autoplay !== false;
        video.playsInline = true;
        video.preload =
          typeof photo.preload === "string" ? photo.preload : "metadata";
        video.disablePictureInPicture = true;
        video.setAttribute("aria-hidden", "true");
        video.dataset.photoSrc = source;
        if (posterSource) {
          video.poster = posterSource;
          frame.classList.add("has-media", "has-video", "has-poster");
        }
        if (typeof photo.fit === "string" && photo.fit.trim()) {
          video.style.objectFit = photo.fit.trim();
        }
        video.addEventListener(
          "loadeddata",
          () => {
            frame.classList.add("has-media", "has-video");
            if (video.autoplay) video.play().catch(() => {});
          },
          { once: true },
        );
        video.addEventListener(
          "error",
          () => {
            if (posterSource) {
              video.pause();
              video.removeAttribute("src");
              video.load();
              frame.classList.add("has-media", "has-video", "has-poster");
              return;
            }
            frame.classList.remove(
              "has-media",
              "has-video",
              "has-poster",
            );
            video.remove();
          },
          { once: true },
        );
        frame.append(video);

        // 小标签提示这是一段会循环播放的视频，不遮挡画面主体。
        const videoBadge = document.createElement("span");
        videoBadge.className = "photo-video-badge";
        videoBadge.textContent = "LOOP";
        videoBadge.setAttribute("aria-hidden", "true");
        frame.append(videoBadge);
      } else {
        const thumbnailSource = getPhotoThumbnailSource(photo);
        const image = document.createElement("img");
        image.className = "photo-media photo-image";
        image.loading = "eager";
        image.decoding = "async";
        image.draggable = false;
        image.alt = photo.alt || fallbackName;
        image.dataset.photoSrc = thumbnailSource;
        if (typeof photo.fit === "string" && photo.fit.trim()) {
          image.style.objectFit = photo.fit.trim();
        }
        image.addEventListener(
          "load",
          () => frame.classList.add("has-media", "has-image"),
          { once: true },
        );
        image.addEventListener(
          "error",
          () => {
            frame.classList.remove("has-media", "has-image");
            image.remove();
          },
          { once: true },
        );
        frame.append(image);
      }
    }

    const bottomCaption = document.createElement("p");
    bottomCaption.className = "photo-caption photo-caption-bottom";
    bottomCaption.textContent =
      photo.bottom || "把这一刻，交给照片替我们记住。";

    const warmCardResources = () => {
      prefetchPhotoPreview(photo);
      prefetchMusicForPhotoIndex(index);
    };

    card.append(topCaption, frame, bottomCaption);
    card.addEventListener("pointerenter", warmCardResources, { once: true });
    card.addEventListener("focusin", warmCardResources, { once: true });
    card.addEventListener("click", () => {
      openPhotoLightbox(photo, index, card);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openPhotoLightbox(photo, index, card);
    });
    return card;
  }

  /**
   * 找到 photo-flow 对应的 CSS 动画。
   * 滚轮和拖动通过改变 currentTime 前后移动，因此松手后仍能无缝自动播放。
   */
  function getPhotoTrackAnimation() {
    return (
      photoTrack
        .getAnimations()
        .find((animation) => animation.animationName === "photo-flow") ||
      photoTrack.getAnimations()[0] ||
      null
    );
  }

  // 把滚轮或滑动的像素距离换算成照片流动画进度。
  function shiftPhotoTrackByPixels(pixelDistance) {
    const animation = getPhotoTrackAnimation();
    const firstSet = photoTrack.querySelector(".photo-track-set");
    const loopDistance = firstSet?.getBoundingClientRect().width || 0;
    const duration = Number(animation?.effect?.getTiming().duration);
    if (!animation || !loopDistance || !Number.isFinite(duration) || !duration) {
      return;
    }

    const currentTime = Number(animation.currentTime) || 0;
    const timeDelta = (pixelDistance / loopDistance) * duration;
    animation.currentTime =
      ((currentTime + timeDelta) % duration + duration) % duration;
  }

  function showFilmInteractionHint() {
    filmWindow.classList.add("is-manual");
    window.clearTimeout(filmHintTimer);
    filmHintTimer = window.setTimeout(() => {
      filmWindow.classList.remove("is-manual");
    }, 850);
  }

  // 鼠标纵向滚轮会转换成横向照片浏览；触控板横向滚动同样可用。
  function handlePhotoWheel(event) {
    if (
      !photoScene.classList.contains("is-active") ||
      photoLightbox.classList.contains("is-visible")
    ) {
      return;
    }

    const dominantDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (!dominantDelta) return;

    event.preventDefault();
    const deltaModeScale =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 32
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? Math.max(320, filmWindow.clientWidth)
          : 1;
    const sensitivity = configuredNumber(
      effectsConfig.photoWheelSensitivity,
      1,
      0.1,
    );
    shiftPhotoTrackByPixels(dominantDelta * deltaModeScale * sensitivity);
    showFilmInteractionHint();
  }

  // 记录手机手指或鼠标按下位置；确认是横向手势后才接管轨道。
  function startPhotoDrag(event) {
    if (
      (event.pointerType === "mouse" && event.button !== 0) ||
      !photoScene.classList.contains("is-active") ||
      photoLightbox.classList.contains("is-visible")
    ) {
      return;
    }

    photoPointerId = event.pointerId;
    photoPointerStartX = event.clientX;
    photoPointerStartY = event.clientY;
    photoPointerLastX = event.clientX;
    photoPointerDistance = 0;
    photoTrackDragging = false;
  }

  function movePhotoDrag(event) {
    if (event.pointerId !== photoPointerId) return;

    const totalX = event.clientX - photoPointerStartX;
    const totalY = event.clientY - photoPointerStartY;
    if (
      !photoTrackDragging &&
      Math.abs(totalX) > 8 &&
      Math.abs(totalX) > Math.abs(totalY)
    ) {
      photoTrackDragging = true;
      photoTrack.classList.add("is-dragging");
      filmWindow.classList.add("is-dragging");
      filmWindow.setPointerCapture?.(event.pointerId);
    }

    if (!photoTrackDragging) return;
    event.preventDefault();
    const stepX = event.clientX - photoPointerLastX;
    const sensitivity = configuredNumber(
      effectsConfig.photoSwipeSensitivity,
      1,
      0.1,
    );
    shiftPhotoTrackByPixels(-stepX * sensitivity);
    photoPointerDistance += Math.abs(stepX);
    photoPointerLastX = event.clientX;
    showFilmInteractionHint();
  }

  function finishPhotoDrag(event) {
    if (event.pointerId !== photoPointerId) return;

    const pointerId = photoPointerId;
    const wasDragging = photoTrackDragging;
    suppressNextPhotoClick = wasDragging && photoPointerDistance > 8;
    photoTrackDragging = false;
    photoPointerId = null;
    photoTrack.classList.remove("is-dragging");
    filmWindow.classList.remove("is-dragging");

    // 先清空内部状态再释放捕获，避免 lostpointercapture 重复执行收尾逻辑。
    if (wasDragging && filmWindow.hasPointerCapture?.(pointerId)) {
      filmWindow.releasePointerCapture(pointerId);
    }

    // 拖动结束后的 click 紧随 pointerup 触发；下一轮事件循环后即可解除拦截。
    if (suppressNextPhotoClick) {
      window.setTimeout(() => {
        suppressNextPhotoClick = false;
      }, 0);
    }
  }

  // 键盘左右方向键也能浏览，方便没有滚轮或使用辅助设备的访客。
  function handlePhotoTrackKeyboard(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    shiftPhotoTrackByPixels(event.key === "ArrowRight" ? 180 : -180);
    showFilmInteractionHint();
  }

  // 放大图片或播放视频并暂停照片轨道；trigger 用于关闭后恢复键盘焦点。
  function openPhotoLightbox(photo, index, trigger) {
    if (!photoScene.classList.contains("is-active")) return;

    // photoCard 可配置为 NEXT、CONTINUE、单个片段或按照片序号排列的数组。
    triggerMusicAction("photoCard", index);
    prefetchPhotoMusicWindow(index + 1);

    const originalSource =
      typeof photo.src === "string" ? photo.src.trim() : "";
    const mediaType = getPhotoMediaType(photo, originalSource);
    const lightboxSource =
      mediaType === "video" ? originalSource : getPhotoPreviewSource(photo);
    lightboxReturnTarget = trigger;
    lightboxTopCaption.textContent =
      photo.top || "这里会放入一段温柔的小回忆。";
    lightboxBottomCaption.textContent =
      photo.bottom || "把这一刻，交给照片替我们记住。";
    const mediaToken = resetLightboxMedia();
    lightboxPlaceholder.hidden = false;

    if (lightboxSource && mediaType === "video") {
      lightboxVideo.dataset.mediaToken = String(mediaToken);
      lightboxVideo.muted = true;
      lightboxVideo.defaultMuted = true;
      lightboxVideo.loop = photo.loop !== false;
      lightboxVideo.playsInline = true;
      const poster =
        typeof photo.poster === "string" ? photo.poster.trim() : "";
      if (poster) {
        lightboxVideo.poster = poster;
        lightboxFrame.classList.add("has-media", "has-video");
        lightboxPlaceholder.hidden = true;
      }
      lightboxVideo.src = lightboxSource;
      lightboxVideo.load();
      lightboxVideo.play().catch(() => {});
    } else if (lightboxSource) {
      lightboxImage.dataset.mediaToken = String(mediaToken);
      lightboxImage.alt = photo.alt || `第 ${index + 1} 张生日照片`;
      lightboxImage.src = lightboxSource;
    }

    prefetchNeighborPhotoPreviews(index);
    photoTrack.classList.add("is-paused");
    photoLightbox.classList.add("is-visible");
    photoLightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    interactionStatus.textContent = lightboxSource
      ? mediaType === "video"
        ? "视频正在加载，照片流暂时停下；关闭后会继续流动。"
        : "照片正在加载，照片流暂时停下；关闭后会继续流动。"
      : "这张回忆暂时没有配置照片或视频。";
    closePhotoLightboxButton.focus({ preventScroll: true });
  }

  function isCurrentLightboxMedia(media) {
    return (
      media instanceof HTMLElement &&
      Number(media.dataset.mediaToken) === lightboxMediaToken
    );
  }

  function handleLightboxImageLoad(event) {
    if (!isCurrentLightboxMedia(event.currentTarget)) return;
    lightboxFrame.classList.remove("has-video");
    lightboxFrame.classList.add("has-media", "has-image");
    lightboxPlaceholder.hidden = true;
    interactionStatus.textContent =
      "照片已经放大，照片流暂时停下；关闭后会继续流动。";
  }

  function handleLightboxVideoLoad(event) {
    if (!isCurrentLightboxMedia(event.currentTarget)) return;
    lightboxFrame.classList.remove("has-image");
    lightboxFrame.classList.add("has-media", "has-video");
    lightboxPlaceholder.hidden = true;
    lightboxVideo.play().catch(() => {});
    interactionStatus.textContent =
      "视频已经打开并循环播放，照片流暂时停下；关闭后会继续流动。";
  }

  function handleLightboxMediaError(event) {
    if (!isCurrentLightboxMedia(event.currentTarget)) return;
    showLightboxPlaceholder();
    interactionStatus.textContent =
      "这项媒体暂时加载失败，请稍后重新打开。";
  }

  // 媒体加载失败或关闭弹层时，清理图片与视频，避免视频在后台继续发声或耗电。
  function resetLightboxMedia() {
    const token = ++lightboxMediaToken;
    lightboxFrame.classList.remove("has-media", "has-image", "has-video");
    delete lightboxImage.dataset.mediaToken;
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    delete lightboxVideo.dataset.mediaToken;
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.removeAttribute("poster");
    lightboxVideo.load();
    return token;
  }

  function showLightboxPlaceholder() {
    resetLightboxMedia();
    lightboxPlaceholder.hidden = false;
  }

  // 关闭放大层并恢复照片流动画。
  function closePhotoLightbox() {
    if (!photoLightbox.classList.contains("is-visible")) return;
    photoLightbox.classList.remove("is-visible");
    photoLightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    photoTrack.classList.remove("is-paused");
    resetLightboxMedia();
    lightboxPlaceholder.hidden = false;
    interactionStatus.textContent = "照片流已经继续缓缓流动。";

    if (lightboxReturnTarget?.isConnected) {
      lightboxReturnTarget.focus({ preventScroll: true });
    }
    lightboxReturnTarget = null;
  }

  // 把 birthday-content.js / card 中的文字写入礼物卡片。
  function renderBirthdayCard() {
    const card = birthdayContent.card || {};
    cardEyebrow.textContent = card.eyebrow || "FOR MY DEAREST";
    cardTitle.textContent = card.title || "生日快乐";
    cardLines.replaceChildren();

    const lines = Array.isArray(card.lines) && card.lines.length
      ? card.lines
      : ["愿所有美好，都在新的一岁与你相遇。"];
    for (const line of lines) {
      const paragraph = document.createElement("p");
      paragraph.textContent = String(line);
      cardLines.append(paragraph);
    }
    cardSignature.textContent = card.signature || "—— 永远爱你的人";
    finalWish.textContent =
      card.finalWish || "愿你每一个愿望，都在未来被温柔接住。";
  }

  /* =========================================================================
   * 6. 装饰元素生成器
   * ========================================================================= */

  // 生成米老鼠头转场；总数由“行数 × 列数”决定。
  function createTransitionHeads() {
    if (mouseHeads.childElementCount) return;
    const random = mulberry32(20260716);
    const colors = ["#6f484c", "#8c5559", "#b66768", "#d3837b", "#efb096"];
    const rowCount = Math.round(
      configuredNumber(effectsConfig.transitionHeadRows, 8, 1),
    );
    const columnCount = Math.round(
      configuredNumber(effectsConfig.transitionHeadColumns, 12, 1),
    );

    for (let row = 0; row < rowCount; row += 1) {
      for (let column = 0; column < columnCount; column += 1) {
        const head = document.createElement("span");
        head.className = "transition-head";
        head.append(document.createElement("span"));
        head.style.setProperty(
          "--left",
          `${((column + 0.2 + random() * 0.62) / columnCount) * 100}%`,
        );
        head.style.setProperty(
          "--top",
          `${((row + 0.12 + random() * 0.72) / rowCount) * 100}%`,
        );
        head.style.setProperty("--size", `${56 + random() * 94}px`);
        head.style.setProperty("--rotate", `${-28 + random() * 56}deg`);
        head.style.setProperty("--delay", `${random() * 760}ms`);
        head.style.setProperty(
          "--head-color",
          colors[Math.floor(random() * colors.length)],
        );
        mouseHeads.append(head);
      }
    }
  }

  // 生成礼物场景背景星光。
  function createGiftSparkles() {
    const random = mulberry32(19961224);
    const colors = ["#ffe4a3", "#f6bc87", "#f7d6c6", "#fff8dc"];
    const sparkleCount = Math.round(
      configuredNumber(effectsConfig.giftSparkleCount, 34, 0),
    );
    for (let index = 0; index < sparkleCount; index += 1) {
      const sparkle = document.createElement("span");
      sparkle.className = "sparkle";
      sparkle.style.setProperty("--left", `${4 + random() * 92}%`);
      sparkle.style.setProperty("--top", `${3 + random() * 88}%`);
      sparkle.style.setProperty("--size", `${7 + random() * 15}px`);
      sparkle.style.setProperty("--delay", `${random() * 2200}ms`);
      sparkle.style.setProperty("--duration", `${1200 + random() * 1900}ms`);
      sparkle.style.setProperty(
        "--sparkle-color",
        colors[Math.floor(random() * colors.length)],
      );
      giftSparkles.append(sparkle);
    }
  }

  // 用户收下卡片后生成向上漂浮的爱心。
  function createFloatingHearts() {
    if (floatingHeartsCreated) return;
    floatingHeartsCreated = true;
    const random = mulberry32(Date.now());
    const colors = ["#f6b2a2", "#e48081", "#ffd28d", "#fff1d1"];
    const heartCount = Math.round(
      configuredNumber(effectsConfig.finalFloatingHeartCount, 40, 0),
    );
    for (let index = 0; index < heartCount; index += 1) {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.textContent = "♥";
      heart.style.setProperty("--left", `${random() * 100}%`);
      heart.style.setProperty("--size", `${12 + random() * 24}px`);
      heart.style.setProperty("--delay", `${random() * 1500}ms`);
      heart.style.setProperty("--duration", `${3800 + random() * 3200}ms`);
      heart.style.setProperty(
        "--heart-color",
        colors[Math.floor(random() * colors.length)],
      );
      giftSparkles.append(heart);
    }
  }

  /* =========================================================================
   * 7. 时间、音频与通用数学工具
   * ========================================================================= */

  // 统一登记场景定时器，离开页面时可以一次性清理。
  function scheduleScene(callback, delay) {
    const timer = window.setTimeout(() => {
      sceneTimers.delete(timer);
      callback();
    }, Math.max(0, delay));
    sceneTimers.add(timer);
    return timer;
  }

  // 播放一次性的轻柔提示音；使用独立 AudioContext，不会被背景音乐备用旋律打断。
  async function playChime(frequencies, options = {}) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    // 原提示音完整保留，只在它响起前柔和压低背景歌曲。
    if (musicDuckOnChime && options.duck !== false) {
      const customDuck =
        options.duck && typeof options.duck === "object" ? options.duck : {};
      duckBackgroundMusic({
        ...customDuck,
        holdMs: configuredNumber(
          customDuck.holdMs ?? options.duckHoldMs,
          musicDuckChimeHoldMs,
          0,
        ),
      });
    }

    try {
      chimeContext ||= new AudioContext();
      if (chimeContext.state === "suspended") await chimeContext.resume();
      const master = chimeContext.createGain();
      master.gain.value = 0.12;
      master.connect(chimeContext.destination);
      const now = chimeContext.currentTime;

      frequencies.forEach((frequency, index) => {
        const oscillator = chimeContext.createOscillator();
        const gain = chimeContext.createGain();
        const startsAt = now + index * 0.11;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, startsAt);
        gain.gain.exponentialRampToValueAtTime(0.16, startsAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.75);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(startsAt);
        oscillator.stop(startsAt + 0.8);
      });
    } catch {
      // 提示音只是装饰；失败时仍继续视觉交互。
    }
  }

  // 每秒计算从 relationship.startedAt 到当前时间的差值。
  function updateClock() {
    const secondsTotal = Math.max(
      0,
      Math.floor((Date.now() - together.getTime()) / 1000),
    );
    const days = Math.floor(secondsTotal / 86400);
    const hours = String(Math.floor((secondsTotal % 86400) / 3600)).padStart(
      2,
      "0",
    );
    const minutes = String(Math.floor((secondsTotal % 3600) / 60)).padStart(
      2,
      "0",
    );
    const seconds = String(secondsTotal % 60).padStart(2, "0");
    clock.innerHTML =
      `第 <span class="digit">${days}</span> 天 ` +
      `<span class="digit">${hours}</span> 小时 ` +
      `<span class="digit">${minutes}</span> 分钟 ` +
      `<span class="digit">${seconds}</span> 秒`;
  }

  // 把浏览器点击坐标换算成 Canvas 设计坐标，判断是否点中红心。
  function isSeedHit(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    const onHeart = Math.hypot(x - SEED.x, y - SEED.y) <= 58;
    const onLabel =
      x >= SEED.x && x <= SEED.x + 86 && y >= SEED.y && y <= SEED.y + 42;
    return onHeart || onLabel;
  }

  /* =========================================================================
   * 本地音乐管理器
   * =========================================================================
   * 两个 audio 元素交替工作：新片段从 0 音量开始，旧片段同步淡出。
   * 歌单顺序、默认片段和每次点击的动作全部在 birthday-content.js 中配置。
   */

  function initializeMusicDecks() {
    musicDecks.forEach((deck, index) => {
      deck.preload = "auto";
      deck.loop = false;
      musicDeckBaseVolumes.set(deck, 0);
      deck.volume = 0;
      deck.setAttribute("playsinline", "");
      musicDeckCues.set(deck, null);
      musicDeckTokens.set(deck, 0);

      // 成功开始真实音频后，取消“首个操作补播”的监听，避免重新定位片段。
      deck.addEventListener("playing", confirmOpeningMusicPlayback);

      // requestAnimationFrame 在后台标签页可能暂停，ended 事件作为片段循环兜底。
      deck.addEventListener("ended", () => {
        if (
          !musicWanted ||
          musicSwitching ||
          index !== activeMusicDeckIndex
        ) {
          return;
        }
        const cue = musicDeckCues.get(deck) || currentMusicCue;
        if (cue) {
          switchToMusicCue(cue, {
            durationMs: musicFragmentLoopFadeMs,
            fragmentLoop: true,
          });
        }
      });

      deck.addEventListener("error", () => {
        if (!musicWanted) return;
        const isCurrentDeck =
          index === activeMusicDeckIndex ||
          musicDeckTokens.get(deck) === musicSwitchToken;
        if (isCurrentDeck && !hasPlayingMusicDeck()) startSynth();
      });
    });
  }

  /**
   * 在“先抓住这颗心”页面尝试播放配置的片段。
   * 浏览器允许时会立即播放；若被自动播放策略拦截，则等待第一次真实操作补播。
   */
  function initializeOpeningMusicPlayback() {
    updateMusicButton(false);
    if (!musicOpeningAutoplay || !musicPlaylist.length) return;

    openingMusicCue = resolveMusicCue(musicOpeningAction);
    if (!openingMusicCue) return;
    setCurrentMusicCue(openingMusicCue);

    if (musicOpeningRetryOnInteraction) {
      openingMusicAwaitingInteraction = true;
      installOpeningMusicRetry();
    }

    switchToMusicCue(openingMusicCue, {
      forcePlay: true,
      allowSynthFallback: false,
      durationMs: musicOpeningFadeInMs,
    }).then(() => {
      if (hasPlayingMusicDeck()) {
        confirmOpeningMusicPlayback();
      } else if (!musicOpeningRetryOnInteraction) {
        musicWanted = false;
        updateMusicButton(false);
      }
    });
    scheduleMusicPreloading(openingMusicCue);
  }

  function installOpeningMusicRetry() {
    if (openingMusicRetryInstalled) return;
    openingMusicRetryInstalled = true;
    document.addEventListener("pointerdown", handleOpeningMusicInteraction, true);
    document.addEventListener("keydown", handleOpeningMusicInteraction, true);
  }

  function removeOpeningMusicRetry() {
    if (!openingMusicRetryInstalled) return;
    openingMusicRetryInstalled = false;
    document.removeEventListener("pointerdown", handleOpeningMusicInteraction, true);
    document.removeEventListener("keydown", handleOpeningMusicInteraction, true);
  }

  function handleOpeningMusicInteraction(event) {
    if (!openingMusicAwaitingInteraction) {
      removeOpeningMusicRetry();
      return;
    }
    if (
      event.type === "keydown" &&
      (event.repeat || (event.key !== "Enter" && event.key !== " "))
    ) {
      return;
    }

    // 自动播放其实已成功时不再重载片段；后续 click 会按原按钮语义正常执行。
    if (hasPlayingMusicDeck()) {
      confirmOpeningMusicPlayback();
      return;
    }

    // 音乐按钮自己的 click 处理补播，避免 pointerdown 先播放、click 又立刻暂停。
    const target = event.target;
    if (target instanceof Element && musicToggle?.contains(target)) return;
    retryOpeningMusicAfterInteraction();
  }

  function retryOpeningMusicAfterInteraction() {
    if (!openingMusicAwaitingInteraction) {
      return applyMusicAction(MUSIC_CONTINUE, { forcePlay: true });
    }

    openingMusicAwaitingInteraction = false;
    removeOpeningMusicRetry();
    musicSynthFallbackAllowed = true;
    const cue = openingMusicCue || currentMusicCue || resolveMusicCue(0);
    if (cue) {
      setCurrentMusicCue(cue);
      return switchToMusicCue(cue, {
        forcePlay: true,
        allowSynthFallback: true,
        durationMs: musicOpeningFadeInMs,
      });
    }

    musicWanted = true;
    startSynth();
    updateMusicButton(true);
    return Promise.resolve(null);
  }

  function confirmOpeningMusicPlayback() {
    if (!openingMusicAwaitingInteraction) return;
    openingMusicAwaitingInteraction = false;
    musicSynthFallbackAllowed = true;
    removeOpeningMusicRetry();
  }

  function cancelOpeningMusicRetry() {
    openingMusicAwaitingInteraction = false;
    removeOpeningMusicRetry();
  }

  // 米老鼠真正进入画面时使用独立接口压低音乐，不新增或删除原有提示音。
  function duckForMickeyAppearance() {
    if (!musicDuckOnMickeyAppear) return Promise.resolve(false);
    return duckBackgroundMusic({ holdMs: musicDuckMickeyHoldMs });
  }

  /**
   * 暂时压低背景音乐，但不暂停、不改变歌曲时间。
   * options 支持 volumeRatio、fadeOutMs、holdMs、fadeInMs；直接传数字时代表 holdMs。
   */
  function duckBackgroundMusic(options = {}) {
    const normalizedOptions =
      typeof options === "number" ? { holdMs: options } : options || {};
    if (!musicDuckingEnabled && normalizedOptions.force !== true) {
      return Promise.resolve(false);
    }

    const ratio = clamp(
      configuredNumber(
        normalizedOptions.volumeRatio,
        musicDuckVolumeRatio,
        0,
      ),
    );
    const fadeOutMs = configuredNumber(
      normalizedOptions.fadeOutMs,
      musicDuckFadeOutMs,
      0,
    );
    const holdMs = configuredNumber(
      normalizedOptions.holdMs,
      musicDuckHoldMs,
      0,
    );
    const fadeInMs = configuredNumber(
      normalizedOptions.fadeInMs,
      musicDuckFadeInMs,
      0,
    );
    const requestGeneration = ++musicDuckRequestGeneration;
    if (musicDuckRestoreTimer) window.clearTimeout(musicDuckRestoreTimer);
    musicDuckRestoreTimer = 0;

    // 连续提示音只会继续压低或延长保持时间，不会意外把声音提前抬高。
    const targetFactor = Math.min(musicDuckFactor, ratio);
    return fadeMusicDuckFactor(targetFactor, fadeOutMs).then((completed) => {
      if (!completed || requestGeneration !== musicDuckRequestGeneration) {
        return false;
      }
      musicDuckRestoreTimer = window.setTimeout(() => {
        if (requestGeneration !== musicDuckRequestGeneration) return;
        restoreBackgroundMusicVolume({ fadeInMs });
      }, holdMs);
      return true;
    });
  }

  function restoreBackgroundMusicVolume(options = {}) {
    const normalizedOptions =
      typeof options === "number" ? { fadeInMs: options } : options || {};
    const fadeInMs = configuredNumber(
      normalizedOptions.fadeInMs,
      musicDuckFadeInMs,
      0,
    );
    ++musicDuckRequestGeneration;
    if (musicDuckRestoreTimer) window.clearTimeout(musicDuckRestoreTimer);
    musicDuckRestoreTimer = 0;
    return fadeMusicDuckFactor(1, fadeInMs);
  }

  function fadeMusicDuckFactor(target, duration) {
    cancelMusicDuckFade();
    const generation = musicDuckGeneration;
    const from = musicDuckFactor;
    const to = clamp(target);
    const fadeDuration = getMusicFadeDuration(duration);

    if (fadeDuration <= 0 || Math.abs(from - to) < 0.001) {
      setMusicDuckFactor(to);
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const startedAt = performance.now();
      musicDuckResolve = resolve;

      const step = (now) => {
        if (generation !== musicDuckGeneration) return;
        const progress = clamp((now - startedAt) / fadeDuration);
        setMusicDuckFactor(lerp(from, to, easeInOutCubic(progress)));
        if (progress >= 1) {
          musicDuckFrame = 0;
          musicDuckResolve = null;
          resolve(true);
          return;
        }
        musicDuckFrame = window.requestAnimationFrame(step);
      };

      musicDuckFrame = window.requestAnimationFrame(step);
    });
  }

  function cancelMusicDuckFade() {
    musicDuckGeneration += 1;
    if (musicDuckFrame) window.cancelAnimationFrame(musicDuckFrame);
    musicDuckFrame = 0;
    if (musicDuckResolve) {
      const resolve = musicDuckResolve;
      musicDuckResolve = null;
      resolve(false);
    }
  }

  function setMusicDuckFactor(value) {
    musicDuckFactor = clamp(value);
    applyMusicOutputVolumes();
  }

  function getMusicDeckBaseVolume(deck) {
    const volume = musicDeckBaseVolumes.get(deck);
    return Number.isFinite(volume) ? clamp(volume) : 0;
  }

  function setMusicDeckBaseVolume(deck, volume) {
    if (!deck) return;
    musicDeckBaseVolumes.set(deck, clamp(volume));
    deck.volume = clamp(getMusicDeckBaseVolume(deck) * musicDuckFactor);
  }

  function applyMusicOutputVolumes() {
    musicDecks.forEach((deck) => {
      deck.volume = clamp(getMusicDeckBaseVolume(deck) * musicDuckFactor);
    });
    if (synthGain) {
      synthGain.gain.value = SYNTH_MUSIC_VOLUME * musicDuckFactor;
    }
  }

  function exposeMusicInterface() {
    window.BIRTHDAY_MUSIC = Object.freeze({
      NEXT: MUSIC_NEXT,
      CONTINUE: MUSIC_CONTINUE,

      // 按 birthday-content.js / music.actions 中的动作名执行。
      trigger(actionName, sequenceIndex, options = {}) {
        return triggerMusicAction(actionName, sequenceIndex, options);
      },

      // 直接执行 NEXT、CONTINUE、歌单编号或 { track, start, end }。
      play(action = MUSIC_CONTINUE) {
        return applyMusicAction(action, { forcePlay: true });
      },

      next() {
        return applyMusicAction(MUSIC_NEXT, { forcePlay: true });
      },

      continueCurrent() {
        return applyMusicAction(MUSIC_CONTINUE, { forcePlay: true });
      },

      select(track, start, end) {
        const action =
          track && typeof track === "object"
            ? track
            : { track, start, end };
        return applyMusicAction(action, { forcePlay: true });
      },

      // 临时压低歌曲，不暂停播放。可传毫秒数或 { volumeRatio, fadeOutMs, holdMs, fadeInMs }。
      duck(options = {}) {
        return duckBackgroundMusic(options);
      },

      // 提前恢复正常背景音量；可传恢复时长或 { fadeInMs }。
      restoreVolume(options = {}) {
        return restoreBackgroundMusicVolume(options);
      },

      pause() {
        return stopMusic();
      },

      getState() {
        const deck = musicDecks[activeMusicDeckIndex] || null;
        const activeCue = deck ? musicDeckCues.get(deck) : null;
        return {
          wanted: musicWanted,
          playing:
            musicWanted &&
            (Boolean(synthTimer) ||
              musicSwitching ||
              musicDecks.some((item) => !item.paused && !item.ended)),
          switching: musicSwitching,
          openingRetryPending: openingMusicAwaitingInteraction,
          ducked: musicDuckFactor < 0.999,
          duckFactor: musicDuckFactor,
          trackIndex: currentMusicTrackIndex,
          cue: currentMusicCue ? { ...currentMusicCue } : null,
          activeCue: activeCue ? { ...activeCue } : null,
          currentTime: deck && Number.isFinite(deck.currentTime)
            ? deck.currentTime
            : 0,
          playlist: musicPlaylist.map((track, index) => ({
            index,
            id: track.id || "",
            title: track.title || "",
            src: track.src,
            start: track.start ?? 0,
            end: track.end ?? null,
          })),
        };
      },
    });
  }

  function triggerMusicAction(actionName, sequenceIndex, options = {}) {
    const hasConfiguredAction = Object.prototype.hasOwnProperty.call(
      musicActions,
      actionName,
    );
    let action = hasConfiguredAction ? musicActions[actionName] : MUSIC_NEXT;

    if (Array.isArray(action)) {
      if (!action.length) {
        action = MUSIC_CONTINUE;
      } else {
        let actionIndex;
        const suppliedIndex = Number(sequenceIndex);
        if (Number.isFinite(suppliedIndex)) {
          actionIndex = Math.trunc(suppliedIndex);
        } else {
          actionIndex = musicActionCounts[actionName] || 0;
          musicActionCounts[actionName] = actionIndex + 1;
        }
        action = action[positiveModulo(actionIndex, action.length)];
      }
    }

    return applyMusicAction(action, options);
  }

  function applyMusicAction(action, options = {}) {
    musicSynthFallbackAllowed = options.allowSynthFallback !== false;
    const normalizedSymbol =
      typeof action === "string" ? action.trim().toUpperCase() : "";

    if (normalizedSymbol === MUSIC_CONTINUE) {
      if (!currentMusicCue) {
        const initialIndex = currentMusicTrackIndex >= 0
          ? currentMusicTrackIndex
          : 0;
        const initialCue = resolveMusicCue(initialIndex);
        if (initialCue) setCurrentMusicCue(initialCue);
      }

      if (options.forcePlay) musicWanted = true;
      if (musicWanted) return continueCurrentMusic(options);
      updateMusicButton(false);
      return Promise.resolve(currentMusicCue);
    }

    const cue = resolveMusicCue(action);
    if (!cue) {
      if (options.forcePlay) {
        musicWanted = true;
        startSynth();
        updateMusicButton(true);
      }
      return Promise.resolve(null);
    }

    setCurrentMusicCue(cue);
    if (options.forcePlay) musicWanted = true;

    // 手动暂停后，普通页面点击仍可改变“下一次要播放的片段”，但不会擅自开声。
    if (!musicWanted) {
      ++musicSwitchToken;
      musicSwitching = false;
      stopMusicMonitor();
      cancelMusicFade();
      musicDecks.forEach((deck) => {
        deck.pause();
        setMusicDeckBaseVolume(deck, 0);
      });
      stopSynth();
      updateMusicButton(false);
      return Promise.resolve(cue);
    }

    return switchToMusicCue(cue, options);
  }

  function resolveMusicCue(action) {
    if (!musicPlaylist.length) return null;

    let trackReference = action;
    let customStart;
    let customEnd;
    let hasCustomStart = false;
    let hasCustomEnd = false;

    if (action && typeof action === "object" && !Array.isArray(action)) {
      if (Object.prototype.hasOwnProperty.call(action, "track")) {
        trackReference = action.track;
      } else if (Object.prototype.hasOwnProperty.call(action, "trackIndex")) {
        trackReference = action.trackIndex;
      } else if (Object.prototype.hasOwnProperty.call(action, "index")) {
        trackReference = action.index;
      } else if (Object.prototype.hasOwnProperty.call(action, "id")) {
        trackReference = action.id;
      } else if (Object.prototype.hasOwnProperty.call(action, "title")) {
        trackReference = action.title;
      } else {
        trackReference = currentMusicTrackIndex >= 0
          ? currentMusicTrackIndex
          : 0;
      }

      hasCustomStart = Object.prototype.hasOwnProperty.call(action, "start");
      hasCustomEnd = Object.prototype.hasOwnProperty.call(action, "end");
      customStart = action.start;
      customEnd = action.end;
    }

    if (typeof trackReference === "string") {
      const symbol = trackReference.trim().toUpperCase();
      if (symbol === MUSIC_NEXT) {
        trackReference = currentMusicTrackIndex >= 0
          ? currentMusicTrackIndex + 1
          : 0;
      } else if (symbol === MUSIC_CONTINUE) {
        return currentMusicCue || resolveMusicCue(
          currentMusicTrackIndex >= 0 ? currentMusicTrackIndex : 0,
        );
      }
    }

    const trackIndex = resolveTrackIndex(trackReference);
    if (trackIndex < 0) return null;
    const track = musicPlaylist[trackIndex];
    const start = parseMusicTime(
      hasCustomStart ? customStart : track.start,
      0,
    );
    const end = parseMusicTime(
      hasCustomEnd ? customEnd : track.end,
      null,
    );

    return createMusicCue(trackIndex, start, end);
  }

  function resolveTrackIndex(reference) {
    if (!musicPlaylist.length) return -1;

    if (typeof reference === "number" && Number.isFinite(reference)) {
      return positiveModulo(Math.trunc(reference), musicPlaylist.length);
    }

    if (typeof reference === "string") {
      const value = reference.trim();
      if (!value) return currentMusicTrackIndex >= 0
        ? currentMusicTrackIndex
        : 0;

      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        return positiveModulo(Math.trunc(numericValue), musicPlaylist.length);
      }

      const lowered = value.toLocaleLowerCase();
      const matchedIndex = musicPlaylist.findIndex((track) =>
        [track.id, track.title, track.src]
          .filter((item) => typeof item === "string")
          .some((item) => item.trim().toLocaleLowerCase() === lowered),
      );
      if (matchedIndex >= 0) return matchedIndex;
    }

    if (reference == null) {
      return currentMusicTrackIndex >= 0 ? currentMusicTrackIndex : 0;
    }

    // 配置拼写有误时仍按 NEXT 前进，避免一次点击完全没有声音反馈。
    return currentMusicTrackIndex >= 0
      ? positiveModulo(currentMusicTrackIndex + 1, musicPlaylist.length)
      : 0;
  }

  function parseMusicTime(value, fallback = 0) {
    if (value == null || value === "") return fallback;
    if (typeof value === "number") {
      return Number.isFinite(value) ? Math.max(0, value) : fallback;
    }
    if (typeof value !== "string") return fallback;

    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (!trimmed.includes(":")) {
      const seconds = Number(trimmed);
      return Number.isFinite(seconds) ? Math.max(0, seconds) : fallback;
    }

    const parts = trimmed.split(":").map(Number);
    if (
      parts.length < 2 ||
      parts.length > 3 ||
      parts.some((part) => !Number.isFinite(part) || part < 0)
    ) {
      return fallback;
    }

    return parts.reduce((seconds, part) => seconds * 60 + part, 0);
  }

  function positiveModulo(value, length) {
    return ((value % length) + length) % length;
  }

  function createMusicCue(trackIndex, start, end) {
    const track = musicPlaylist[trackIndex];
    const safeStart = Number.isFinite(start) ? Math.max(0, start) : 0;
    const safeEnd = Number.isFinite(end) ? Math.max(0, end) : null;
    const cue = {
      trackIndex,
      id: typeof track.id === "string" ? track.id : "",
      title:
        typeof track.title === "string" && track.title.trim()
          ? track.title.trim()
          : "歌曲 " + (trackIndex + 1),
      src: track.src.trim(),
      start: safeStart,
      end: safeEnd,
    };
    cue.key = getMusicCueKey(cue);
    return cue;
  }

  function getMusicCueKey(cue) {
    const end = Number.isFinite(cue.end) ? cue.end.toFixed(3) : "END";
    return [
      cue.trackIndex,
      cue.src,
      cue.start.toFixed(3),
      end,
    ].join("|");
  }

  function setCurrentMusicCue(cue) {
    currentMusicCue = cue;
    currentMusicTrackIndex = cue ? cue.trackIndex : -1;
  }

  function normalizeMusicCueForDuration(cue, duration) {
    const hasDuration = Number.isFinite(duration) && duration > 0;
    let start = Number.isFinite(cue.start) ? Math.max(0, cue.start) : 0;
    let end = Number.isFinite(cue.end) ? Math.max(0, cue.end) : null;

    if (hasDuration) {
      start = Math.min(start, Math.max(0, duration - 0.25));
      end = end == null ? duration : Math.min(end, duration);
      if (end <= start + 0.18) {
        start = Math.max(0, Math.min(start, duration - 1));
        end = duration;
      }
    } else if (end != null && end <= start + 0.05) {
      end = null;
    }

    const normalized = { ...cue, start, end };
    normalized.key = getMusicCueKey(normalized);
    return normalized;
  }

  function switchToMusicCue(cue, options = {}) {
    musicSynthFallbackAllowed = options.allowSynthFallback !== false;
    if (!cue || !musicDecks.length) {
      if (musicWanted) startSynth();
      return Promise.resolve(null);
    }

    setCurrentMusicCue(cue);
    if (options.forcePlay) musicWanted = true;
    if (!musicWanted) return Promise.resolve(cue);

    const token = ++musicSwitchToken;
    const previousActiveIndex = activeMusicDeckIndex;
    const hadPlayingDeck = hasPlayingMusicDeck();
    musicSwitching = true;
    stopMusicMonitor();
    cancelMusicFade();

    let targetIndex = 0;
    if (previousActiveIndex >= 0 && musicDecks.length > 1) {
      const candidates = musicDecks
        .map((deck, index) => ({ deck, index }))
        .filter(({ index }) => index !== previousActiveIndex)
        .sort(
          (left, right) =>
            getMusicDeckBaseVolume(left.deck) -
            getMusicDeckBaseVolume(right.deck),
        );
      targetIndex = candidates[0]?.index ?? 0;
    }

    const targetDeck = musicDecks[targetIndex];
    musicDeckTokens.set(targetDeck, token);
    musicDeckCues.set(targetDeck, cue);
    targetDeck.pause();
    targetDeck.loop = false;
    setMusicDeckBaseVolume(targetDeck, 0);
    targetDeck.src = cue.src;
    targetDeck.load();

    // 这一行必须在真实点击调用栈内执行，以通过手机和桌面浏览器的播放策略。
    const firstPlayAttempt = requestMusicDeckPlay(targetDeck);
    if (!hadPlayingDeck) startSynth();
    updateMusicButton(true);

    return finishMusicSwitch({
      token,
      cue,
      targetDeck,
      targetIndex,
      previousActiveIndex,
      firstPlayAttempt,
      durationMs:
        options.durationMs == null
          ? musicCrossfadeMs
          : configuredNumber(options.durationMs, musicCrossfadeMs, 0),
    });
  }

  async function finishMusicSwitch({
    token,
    cue,
    targetDeck,
    targetIndex,
    previousActiveIndex,
    firstPlayAttempt,
    durationMs,
  }) {
    const metadataReady = await waitForMusicMetadata(targetDeck);
    if (!isCurrentMusicOperation(token, targetDeck)) return null;
    if (!metadataReady) {
      return recoverFromMusicSwitchFailure(
        token,
        targetDeck,
        previousActiveIndex,
      );
    }

    const normalizedCue = normalizeMusicCueForDuration(
      cue,
      targetDeck.duration,
    );
    musicDeckCues.set(targetDeck, normalizedCue);
    setCurrentMusicCue(normalizedCue);
    setMusicDeckTime(targetDeck, normalizedCue.start);

    let didPlay = await waitForMusicPromise(firstPlayAttempt, 12000, false);
    if (!isCurrentMusicOperation(token, targetDeck)) return null;

    // 某些浏览器在 load 后第一次 play 会以 AbortError 结束；在完成定位后再补一次。
    if (!didPlay || targetDeck.paused) {
      didPlay = await waitForMusicPromise(
        requestMusicDeckPlay(targetDeck),
        8000,
        false,
      );
    }
    if (!isCurrentMusicOperation(token, targetDeck)) return null;
    if (!didPlay) {
      return recoverFromMusicSwitchFailure(
        token,
        targetDeck,
        previousActiveIndex,
      );
    }

    // play() 必须在真实点击调用栈内尽早发起；部分浏览器会在它真正开始时
    // 把元数据就绪后设置的 currentTime 重置为 0。本地预览服务器若不支持
    // HTTP Range，也可能要等更多数据到达后才能 seek，因此在淡入前短暂重试定位。
    await positionMusicDeckAtCueStart(targetDeck, normalizedCue.start, token);
    if (!isCurrentMusicOperation(token, targetDeck)) return null;

    const targets = musicDecks.map((deck, index) => ({
      deck,
      volume: index === targetIndex ? musicVolume : 0,
    }));
    const fadePromise = fadeMusicDecks(targets, durationMs);
    stopSynth();
    const completed = await fadePromise;

    if (
      !completed ||
      !isCurrentMusicOperation(token, targetDeck) ||
      !musicWanted
    ) {
      return null;
    }

    musicDecks.forEach((deck, index) => {
      if (index !== targetIndex) {
        deck.pause();
        setMusicDeckBaseVolume(deck, 0);
      }
    });
    setMusicDeckBaseVolume(targetDeck, musicVolume);
    activeMusicDeckIndex = targetIndex;
    musicSwitching = false;
    setCurrentMusicCue(normalizedCue);
    startMusicMonitor();
    updateMusicButton(true);
    scheduleMusicPreloading(normalizedCue);
    return normalizedCue;
  }

  async function recoverFromMusicSwitchFailure(
    token,
    failedDeck,
    previousActiveIndex,
  ) {
    if (!isCurrentMusicOperation(token, failedDeck)) return null;
    failedDeck.pause();
    setMusicDeckBaseVolume(failedDeck, 0);
    musicSwitching = false;

    const previousDeck = musicDecks[previousActiveIndex] || null;
    const previousCue = previousDeck
      ? musicDeckCues.get(previousDeck)
      : null;
    const canKeepPrevious =
      previousDeck &&
      previousCue &&
      !previousDeck.error &&
      !previousDeck.ended;

    if (canKeepPrevious) {
      if (previousDeck.paused) requestMusicDeckPlay(previousDeck);
      activeMusicDeckIndex = previousActiveIndex;
      setCurrentMusicCue(previousCue);
      const targets = musicDecks.map((deck) => ({
        deck,
        volume: deck === previousDeck ? musicVolume : 0,
      }));
      await fadeMusicDecks(targets, Math.min(musicPauseFadeMs, 320));
      if (token !== musicSwitchToken || !musicWanted) return null;
      stopSynth();
      startMusicMonitor();
      updateMusicButton(true);
      return previousCue;
    }

    activeMusicDeckIndex = -1;
    if (musicWanted) startSynth();
    updateMusicButton(musicWanted);
    return null;
  }

  function continueCurrentMusic(options = {}) {
    if (options.forcePlay) musicWanted = true;
    if (!musicWanted) return Promise.resolve(currentMusicCue);

    const cue = currentMusicCue || resolveMusicCue(
      currentMusicTrackIndex >= 0 ? currentMusicTrackIndex : 0,
    );
    if (!cue) {
      startSynth();
      updateMusicButton(true);
      return Promise.resolve(null);
    }
    setCurrentMusicCue(cue);

    // CONTINUE 在交叉淡化过程中不另开一次切换，保持当前过渡即可。
    if (musicSwitching) {
      updateMusicButton(true);
      return Promise.resolve(cue);
    }

    const deck = musicDecks[activeMusicDeckIndex] || null;
    const deckCue = deck ? musicDeckCues.get(deck) : null;
    if (!deck || !deckCue || deckCue.key !== cue.key) {
      return switchToMusicCue(cue, options);
    }

    if (!deck.paused && !deck.ended) {
      startMusicMonitor();
      updateMusicButton(true);
      return Promise.resolve(cue);
    }

    const token = ++musicSwitchToken;
    musicDeckTokens.set(deck, token);
    stopMusicMonitor();
    cancelMusicFade();
    musicSwitching = true;

    const end = Number.isFinite(deckCue.end) ? deckCue.end : Infinity;
    if (
      !Number.isFinite(deck.currentTime) ||
      deck.currentTime < deckCue.start - 0.05 ||
      deck.currentTime >= end - 0.05
    ) {
      setMusicDeckTime(deck, deckCue.start);
    }

    const hadPlayingDeck = hasPlayingMusicDeck();
    const playAttempt = requestMusicDeckPlay(deck);
    if (!hadPlayingDeck) startSynth();
    updateMusicButton(true);
    return finishMusicResume(token, deck, deckCue, playAttempt);
  }

  async function finishMusicResume(token, deck, cue, playAttempt) {
    let didPlay = await waitForMusicPromise(playAttempt, 8000, false);
    if (!isCurrentMusicOperation(token, deck)) return null;
    if (!didPlay || deck.paused) {
      didPlay = await waitForMusicPromise(
        requestMusicDeckPlay(deck),
        6000,
        false,
      );
    }
    if (!isCurrentMusicOperation(token, deck)) return null;

    if (!didPlay) {
      musicSwitching = false;
      startSynth();
      updateMusicButton(true);
      return null;
    }

    const targets = musicDecks.map((item) => ({
      deck: item,
      volume: item === deck ? musicVolume : 0,
    }));
    const fadePromise = fadeMusicDecks(targets, musicPauseFadeMs);
    stopSynth();
    const completed = await fadePromise;
    if (!completed || !isCurrentMusicOperation(token, deck) || !musicWanted) {
      return null;
    }

    musicDecks.forEach((item) => {
      if (item !== deck) {
        item.pause();
        setMusicDeckBaseVolume(item, 0);
      }
    });
    setMusicDeckBaseVolume(deck, musicVolume);
    musicSwitching = false;
    startMusicMonitor();
    updateMusicButton(true);
    return cue;
  }

  function startMusic() {
    return applyMusicAction(MUSIC_CONTINUE, { forcePlay: true });
  }

  function stopMusic() {
    musicWanted = false;
    cancelOpeningMusicRetry();
    const token = ++musicSwitchToken;
    musicSwitching = false;
    stopMusicMonitor();
    stopSynth();
    updateMusicButton(false);

    const targets = musicDecks.map((deck) => ({ deck, volume: 0 }));
    return fadeMusicDecks(targets, musicPauseFadeMs).then((completed) => {
      if (!completed || token !== musicSwitchToken || musicWanted) return false;
      musicDecks.forEach((deck) => {
        deck.pause();
        setMusicDeckBaseVolume(deck, 0);
      });
      return true;
    });
  }

  function updateMusicButton(forcePlaying) {
    if (!musicToggle) return;
    const playing =
      typeof forcePlaying === "boolean" ? forcePlaying : musicWanted;
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.setAttribute(
      "aria-label",
      playing ? "暂停背景音乐" : "播放背景音乐",
    );
    musicToggle.title = currentMusicCue?.title
      ? (playing ? "暂停：" : "播放：") + currentMusicCue.title
      : playing
        ? "暂停背景音乐"
        : "播放背景音乐";
    const icon = musicToggle.querySelector("span");
    if (icon) icon.textContent = playing ? "♫" : "♪";
  }

  function startMusicMonitor() {
    stopMusicMonitor();
    if (!musicWanted) return;

    const monitor = () => {
      musicMonitorFrame = 0;
      if (!musicWanted) return;

      if (!musicSwitching) {
        const deck = musicDecks[activeMusicDeckIndex] || null;
        const cue = deck ? musicDeckCues.get(deck) : null;
        if (deck && cue && !deck.paused && Number.isFinite(cue.end)) {
          const fadeMs = getMusicFadeDuration(musicFragmentLoopFadeMs);
          const segmentSeconds = Math.max(0.2, cue.end - cue.start);
          const leadSeconds = fadeMs > 0
            ? Math.min(fadeMs / 1000, segmentSeconds * 0.45)
            : 0.04;

          if (deck.currentTime >= cue.end - leadSeconds) {
            const remainingMs = Math.max(0, (cue.end - deck.currentTime) * 1000);
            switchToMusicCue(cue, {
              durationMs: fadeMs > 0 ? Math.min(fadeMs, remainingMs) : 0,
              fragmentLoop: true,
            });
            return;
          }
        }
      }

      musicMonitorFrame = window.requestAnimationFrame(monitor);
    };

    musicMonitorFrame = window.requestAnimationFrame(monitor);
  }

  function stopMusicMonitor() {
    if (musicMonitorFrame) window.cancelAnimationFrame(musicMonitorFrame);
    musicMonitorFrame = 0;
  }

  function fadeMusicDecks(targets, duration) {
    cancelMusicFade();
    const generation = musicFadeGeneration;
    const entries = targets
      .filter(({ deck }) => Boolean(deck))
      .map(({ deck, volume }) => ({
        deck,
        from: getMusicDeckBaseVolume(deck),
        to: clamp(volume),
      }));
    const fadeDuration = getMusicFadeDuration(duration);

    if (!entries.length || fadeDuration <= 0) {
      entries.forEach(({ deck, to }) => {
        setMusicDeckBaseVolume(deck, to);
      });
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const startedAt = performance.now();
      musicFadeResolve = resolve;

      const step = (now) => {
        if (generation !== musicFadeGeneration) return;
        const progress = clamp((now - startedAt) / fadeDuration);
        const eased = easeInOutCubic(progress);
        entries.forEach(({ deck, from, to }) => {
          setMusicDeckBaseVolume(deck, lerp(from, to, eased));
        });

        if (progress >= 1) {
          musicFadeFrame = 0;
          musicFadeResolve = null;
          resolve(true);
          return;
        }
        musicFadeFrame = window.requestAnimationFrame(step);
      };

      musicFadeFrame = window.requestAnimationFrame(step);
    });
  }

  function cancelMusicFade() {
    musicFadeGeneration += 1;
    if (musicFadeFrame) window.cancelAnimationFrame(musicFadeFrame);
    musicFadeFrame = 0;
    if (musicFadeResolve) {
      const resolve = musicFadeResolve;
      musicFadeResolve = null;
      resolve(false);
    }
  }

  function getMusicFadeDuration(duration) {
    const safeDuration = configuredNumber(duration, 0, 0);
    return reducedMotion ? Math.min(safeDuration, 180) : safeDuration;
  }

  function isCurrentMusicOperation(token, deck) {
    return (
      token === musicSwitchToken &&
      musicDeckTokens.get(deck) === token &&
      musicWanted
    );
  }

  function requestMusicDeckPlay(deck) {
    try {
      const result = deck.play();
      return result && typeof result.then === "function"
        ? result.then(() => true, () => false)
        : Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  function waitForMusicMetadata(deck, timeoutMs = 10000) {
    if (deck.readyState >= 1 && Number.isFinite(deck.duration)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        deck.removeEventListener("loadedmetadata", onReady);
        deck.removeEventListener("error", onError);
        resolve(value);
      };
      const onReady = () => finish(true);
      const onError = () => finish(false);
      const timeout = window.setTimeout(() => finish(false), timeoutMs);
      deck.addEventListener("loadedmetadata", onReady);
      deck.addEventListener("error", onError);
    });
  }

  function waitForMusicPromise(promise, timeoutMs, fallback) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(value);
      };
      const timeout = window.setTimeout(() => finish(fallback), timeoutMs);
      Promise.resolve(promise).then(finish, () => finish(fallback));
    });
  }

  async function positionMusicDeckAtCueStart(
    deck,
    time,
    token,
    timeoutMs = 3200,
  ) {
    const targetTime = Math.max(0, Number.isFinite(time) ? time : 0);
    const startedAt = performance.now();

    do {
      if (!isCurrentMusicOperation(token, deck)) return false;
      setMusicDeckTime(deck, targetTime);

      // 让浏览器完成一次 seek；无 Range 的简易本地服务器需要等缓冲推进后重试。
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      const currentTime = Number(deck.currentTime);
      if (
        Number.isFinite(currentTime) &&
        currentTime >= targetTime - 0.45 &&
        currentTime <= targetTime + 1.25
      ) {
        return true;
      }
    } while (performance.now() - startedAt < timeoutMs);

    // 超时后仍做最后一次定位；即使浏览器不报告 seek 状态，也不阻塞音乐播放。
    setMusicDeckTime(deck, targetTime);
    return false;
  }

  function setMusicDeckTime(deck, time) {
    try {
      deck.currentTime = Math.max(0, time);
    } catch {
      // metadata 刚就绪时个别旧浏览器可能暂时不可 seek；继续播放仍可正常工作。
    }
  }

  function hasPlayingMusicDeck() {
    return musicDecks.some(
      (deck) => !deck.paused && !deck.ended && !deck.error,
    );
  }

  // 本地文件无法加载时，用轻柔的 Web Audio 旋律兜底。
  function startSynth() {
    if (!musicWanted || !musicSynthFallbackAllowed || synthTimer) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      synthContext ||= new AudioContext();
      if (!synthGain) {
        synthGain = synthContext.createGain();
        synthGain.gain.value = SYNTH_MUSIC_VOLUME * musicDuckFactor;
        synthGain.connect(synthContext.destination);
      }
      if (synthContext.state === "suspended") {
        synthContext.resume().catch(() => {});
      }

      const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
      const playNote = () => {
        if (!musicWanted || !synthContext || synthContext.state === "closed") {
          return;
        }
        const now = synthContext.currentTime;
        const oscillator = synthContext.createOscillator();
        const gain = synthContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = notes[synthStep % notes.length];
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.11, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
        oscillator.connect(gain);
        gain.connect(synthGain);
        oscillator.start(now);
        oscillator.stop(now + 0.76);
        synthStep += 1;
      };

      playNote();
      synthTimer = window.setInterval(playNote, 620);
      updateMusicButton(true);
    } catch {
      // 音频兜底不可用时保持页面交互，不让异常影响视觉流程。
    }
  }

  function stopSynth() {
    if (synthTimer) window.clearInterval(synthTimer);
    synthTimer = 0;
    if (synthContext?.state === "running") {
      synthContext.suspend().catch(() => {});
    }
  }

  // 以下函数是树枝绘制和缓动动画使用的纯数学工具。
  function quadraticBezier(p0, p1, p2, t) {
    const oneMinusT = 1 - t;
    return {
      x:
        oneMinusT * oneMinusT * p0.x +
        2 * t * oneMinusT * p1.x +
        t * t * p2.x,
      y:
        oneMinusT * oneMinusT * p0.y +
        2 * t * oneMinusT * p1.y +
        t * t * p2.y,
    };
  }

  function insideHeart(x, y, radius) {
    const nx = x / radius;
    const ny = y / radius;
    return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny < 0;
  }

  function mulberry32(seed) {
    return () => {
      let value = (seed += 0x6d2b79f5);
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value) {
    return Math.min(1, Math.max(0, Number.isFinite(value) ? value : value > 0 ? 1 : 0));
  }

  function lerp(from, to, amount) {
    return from + (to - from) * clamp(amount);
  }

  function easeInCubic(value) {
    return Math.pow(clamp(value), 3);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - clamp(value), 3);
  }

  function easeInOutCubic(value) {
    const x = clamp(value);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function easeOutBack(value) {
    const x = clamp(value);
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  window.__loveExperience = {
    get phase() {
      return phase;
    },
    get sequenceDuration() {
      return sequence.moveEnd;
    },
    get bloomCount() {
      return blooms.length;
    },
    // 调试/自动化测试时可直接调用；正式用户仍需点击移动爱心。
    unlockOpening: unlockOpeningGate,
    start: startExperience,
    showInvitation: showMouseInvitation,
    startPhotos: startMouseTransition,
    showGift: showGiftGuide,
    openGift: openGiftSequence,
  };

  window.addEventListener("pagehide", () => {
    window.clearInterval(openingMoveTimer);
    window.clearInterval(clockTimer);
    window.clearInterval(synthTimer);
    window.clearTimeout(filmHintTimer);
    for (const timer of sceneTimers) window.clearTimeout(timer);
    sceneTimers.clear();
    cancelAnimationFrame(storyAnimationId);
  });
})();
