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
  const music = document.querySelector("#backgroundMusic");
  const musicToggle = document.querySelector("#musicToggle");
  const interactionStatus = document.querySelector("#interactionStatus");
  const mainScene = document.querySelector("#main");
  const mouseIntro = document.querySelector("#mouseIntro");
  const wishButton = document.querySelector("#wishButton");
  const mouseTransition = document.querySelector("#mouseTransition");
  const mouseHeads = document.querySelector("#mouseHeads");
  const photoScene = document.querySelector("#photoScene");
  const photoContent = document.querySelector("#photoContent");
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

  /**
   * 统一读取数字配置：若用户误填文字或负数，则使用默认值。
   * minimum 用于防止速度为 0、数量为负数等无效情况。
   */
  function configuredNumber(value, fallback, minimum = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, number) : fallback;
  }

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
  let synthContext = null;
  let synthGain = null;
  let synthTimer = 0;
  let synthStep = 0;
  let invitationScheduled = false;
  let photoSceneStarted = false;
  let giftGuideShown = false;
  let giftOpened = false;
  let floatingHeartsCreated = false;
  let lightboxReturnTarget = null;
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
    if (phase === "idle" && isSeedHit(event)) startExperience();
  });

  canvas.addEventListener("keydown", (event) => {
    if (phase !== "idle") return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startExperience();
    }
  });

  // 开场移动爱心：鼠标点击、触摸点击和键盘 Enter/空格都能成功进入。
  catchHeart.addEventListener("click", unlockOpeningGate);

  // 各场景主要按钮。
  wishButton.addEventListener("click", startMouseTransition);
  finishPhotosButton.addEventListener("click", showGiftGuide);
  acceptGiftButton.addEventListener("click", openGiftSequence);
  giftBox.addEventListener("click", openGiftBox);
  keepGiftButton.addEventListener("click", keepBirthdayGift);
  closePhotoLightboxButton.addEventListener("click", closePhotoLightbox);
  photoLightbox.addEventListener("click", (event) => {
    if (event.target === photoLightbox) closePhotoLightbox();
  });
  lightboxImage.addEventListener("error", () => {
    lightboxFrame.classList.remove("has-image");
    lightboxPlaceholder.hidden = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && photoLightbox.classList.contains("is-visible")) {
      closePhotoLightbox();
    }
  });

  // 浏览器尺寸改变时，把移动爱心重新放回当前可见范围。
  window.addEventListener("resize", () => {
    if (phase === "opening") moveCatchHeart(true);
  });

  // 背景音乐开关。
  musicToggle.addEventListener("click", () => {
    musicWanted = !musicWanted;
    if (musicWanted) {
      startMusic();
    } else {
      stopMusic();
    }
    updateMusicButton();
  });

  music.addEventListener("playing", () => {
    if (!musicWanted) {
      music.pause();
      return;
    }
    stopSynth();
    updateMusicButton(true);
  });

  music.addEventListener("pause", () => {
    if (!synthTimer) updateMusicButton(false);
  });

  /**
   * 不在页面刚打开时自动播放声音。
   * 用户抓住开场爱心后，真实点击手势会启动音乐，更符合浏览器播放规则，
   * 也与“请在安静环境，佩戴耳机为佳”的提示保持一致。
   */
  updateMusicButton(false);

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

    // 点击爱心属于真实用户手势，可可靠地启动浏览器音频。
    musicWanted = true;
    startMusic();
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
    musicWanted = true;
    startMusic();
    updateMusicButton();
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
    playChime([523.25, 659.25, 783.99]);
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
      "进入照片流场景，照片会从右向左缓缓经过，并显示上下文字说明。";

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
  }

  // 为一条照片配置创建“上文字 + 相框 + 下文字”的完整卡片。
  function createPhotoCard(photo, index, isPrimarySet) {
    const card = document.createElement("article");
    card.className = "photo-card";
    card.style.setProperty("--tilt", `${index % 2 ? 1.1 : -0.9}deg`);
    card.setAttribute("role", "button");
    card.tabIndex = isPrimarySet ? 0 : -1;
    card.setAttribute(
      "aria-label",
      `放大查看${photo.alt || `第 ${index + 1} 张生日照片`}`,
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
    placeholderLabel.textContent = `在 photos 文件夹放入照片 ${String(
      index + 1,
    ).padStart(2, "0")}`;
    placeholder.append(placeholderMark, placeholderLabel);
    frame.append(placeholder);

    const source = typeof photo.src === "string" ? photo.src.trim() : "";
    if (source) {
      const image = document.createElement("img");
      image.className = "photo-image";
      image.loading = "lazy";
      image.decoding = "async";
      image.alt = photo.alt || `第 ${index + 1} 张生日照片`;
      image.addEventListener(
        "load",
        () => frame.classList.add("has-image"),
        { once: true },
      );
      image.addEventListener(
        "error",
        () => {
          frame.classList.remove("has-image");
          image.remove();
        },
        { once: true },
      );
      image.src = source;
      frame.append(image);
    }

    const bottomCaption = document.createElement("p");
    bottomCaption.className = "photo-caption photo-caption-bottom";
    bottomCaption.textContent =
      photo.bottom || "把这一刻，交给照片替我们记住。";

    card.append(topCaption, frame, bottomCaption);
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

  // 放大照片并暂停照片轨道；trigger 用于关闭后恢复键盘焦点。
  function openPhotoLightbox(photo, index, trigger) {
    if (!photoScene.classList.contains("is-active")) return;

    const source = typeof photo.src === "string" ? photo.src.trim() : "";
    lightboxReturnTarget = trigger;
    lightboxTopCaption.textContent =
      photo.top || "这里会放入一段温柔的小回忆。";
    lightboxBottomCaption.textContent =
      photo.bottom || "把这一刻，交给照片替我们记住。";
    lightboxImage.alt = photo.alt || `第 ${index + 1} 张生日照片`;
    lightboxFrame.classList.toggle("has-image", Boolean(source));
    lightboxPlaceholder.hidden = Boolean(source);

    if (source) {
      lightboxImage.src = source;
    } else {
      lightboxImage.removeAttribute("src");
    }

    photoTrack.classList.add("is-paused");
    photoLightbox.classList.add("is-visible");
    photoLightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    interactionStatus.textContent =
      "照片已经放大，照片流暂时停下；关闭后会继续流动。";
    closePhotoLightboxButton.focus({ preventScroll: true });
  }

  // 关闭大图并恢复照片流动画。
  function closePhotoLightbox() {
    if (!photoLightbox.classList.contains("is-visible")) return;
    photoLightbox.classList.remove("is-visible");
    photoLightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    photoTrack.classList.remove("is-paused");
    lightboxImage.removeAttribute("src");
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

  // 播放一次性的轻柔提示音；不影响背景音乐。
  async function playChime(frequencies) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      synthContext ||= new AudioContext();
      if (synthContext.state === "suspended") await synthContext.resume();
      const master = synthContext.createGain();
      master.gain.value = 0.12;
      master.connect(synthContext.destination);
      const now = synthContext.currentTime;

      frequencies.forEach((frequency, index) => {
        const oscillator = synthContext.createOscillator();
        const gain = synthContext.createGain();
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
      // Sound decoration is optional; the visual interaction should continue.
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

  // 优先播放远程 MP3；加载失败时自动使用 Web Audio 备用旋律。
  async function startMusic() {
    musicWanted = true;
    // Start the local Web Audio melody inside the user gesture so sound works
    // even when the original remote MP3 is slow, unavailable, or mixed-content
    // blocked on an HTTPS deployment. It stops as soon as the MP3 begins.
    startSynth();
    updateMusicButton(true);

    try {
      await music.play();
      if (musicWanted) {
        stopSynth();
        updateMusicButton(true);
      } else {
        music.pause();
      }
    } catch {
      if (musicWanted) {
        startSynth();
        updateMusicButton(true);
      }
    }
  }

  function stopMusic() {
    musicWanted = false;
    music.pause();
    stopSynth();
    updateMusicButton(false);
  }

  function updateMusicButton(forcePlaying) {
    const playing =
      typeof forcePlaying === "boolean"
        ? forcePlaying
        : musicWanted && (!music.paused || Boolean(synthTimer));
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.setAttribute(
      "aria-label",
      playing ? "暂停背景音乐" : "播放背景音乐",
    );
    musicToggle.querySelector("span").textContent = playing ? "♫" : "♪";
  }

  function startSynth() {
    if (!musicWanted || synthTimer) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    synthContext ||= new AudioContext();
    if (synthContext.state === "suspended") synthContext.resume();
    synthGain ||= synthContext.createGain();
    synthGain.gain.value = 0.15;
    synthGain.connect(synthContext.destination);

    const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
    const playNote = () => {
      if (!musicWanted || !synthContext) return;
      const now = synthContext.currentTime;
      const oscillator = synthContext.createOscillator();
      const gain = synthContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = notes[synthStep % notes.length];
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.13, now + 0.04);
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
  }

  function stopSynth() {
    if (synthTimer) window.clearInterval(synthTimer);
    synthTimer = 0;
    if (synthContext?.state === "running") synthContext.suspend();
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
    for (const timer of sceneTimers) window.clearTimeout(timer);
    sceneTimers.clear();
    cancelAnimationFrame(storyAnimationId);
  });
})();
