/**
 * ============================================================================
 * 生日网页「内容与动画参数」配置中心
 * ============================================================================
 *
 * 后期想修改文字、照片数量、停留时间或动画数量时，优先修改本文件。
 * 修改颜色、字体、字号、卡片宽高时，优先修改 style.css 顶部的 :root 变量。
 *
 * 时间单位说明：
 * - 名称以 Ms 结尾：单位是毫秒。1000 毫秒 = 1 秒。
 * - 名称以 Seconds 结尾：单位是秒。
 *
 * 路径说明：
 * - "./photos/xxx.jpg" 表示项目 photos 文件夹中的图片。
 * - 图片文件名尽量只使用中文、英文、数字、短横线，不要使用特殊符号。
 */
window.BIRTHDAY_CONTENT = {
  /**
   * --------------------------------------------------------------------------
   * 0. 开场追逐爱心
   * --------------------------------------------------------------------------
   * moveEveryMs 越小，爱心换位置越快，也越难点击。
   * transitionMs 会自动同步给 style.css 中的开场移动动画。
   */
  opening: {
    eyebrow: "A LITTLE GAME BEFORE LOVE",
    title: "先抓住这颗心",
    description: "它有一点害羞，会在屏幕里偷偷跑来跑去。",
    notice: "请在安静环境，佩戴耳机为佳",
    tip: "成功点击爱心后，故事才会开始",

    // 爱心每隔多久随机移动一次。建议范围：700～1600。
    moveEveryMs: 600,

    // 爱心从一个位置滑向另一个位置所需时间。建议小于 moveEveryMs。
    transitionMs: 360,

    // 爱心与移动区域四边保留的最小距离，防止贴边难点。
    edgePaddingPx: 24,

    // 点击成功后，开场淡出多久再允许操作下一幕。
    exitDurationMs: 760,

    // 轨迹小爱心数量；数值越大，屏幕上的装饰越密。
    trailCount: 10,
  },

  /**
   * --------------------------------------------------------------------------
   * 1. 本地音乐、片段范围与点击切歌
   * --------------------------------------------------------------------------
   *
   * 【调整歌曲顺序】
   * 直接上下移动 playlist 中的整段对象。数组第 1 项的 track 编号是 0，
   * 第 2 项是 1，以此类推；"NEXT" 会按照这里的顺序循环切歌。
   *
   * 【调整歌曲片段】
   * start / end 支持 "分:秒"、"时:分:秒" 或直接填写秒数。
   * 例如 start: "01:18", end: "02:03" 表示播放 1分18秒～2分03秒。
   * 片段播放到 end 后会柔和淡出，再从 start 淡入循环，不会突然截断。
   *
   * 【调整每次点击播放什么】
   * actions 中可使用以下接口：
   * - "NEXT"：切到 playlist 中的下一首及其默认片段；
   * - "CONTINUE"：不切歌、不跳时间，延续上一首当前播放位置；
   * - 数字（如 3）：切到 playlist[3] 的默认片段；
   * - 对象：{ track: 3, start: "00:42", end: "01:25" }，为这次点击单独选片段；
   * - 数组：照片卡片等重复操作可逐项配置，超出数组长度后会循环使用。
   */
  music: {
    // 总音量，范围 0～1。建议佩戴耳机时保持在 0.35～0.65。
    volume: 0.52,

    // 切换歌曲时，旧歌淡出与新歌淡入同时进行的时长。
    crossfadeMs: 300,

    // 点击右上角音乐按钮暂停时的淡出时长。
    pauseFadeMs: 480,

    // 当前片段播放到 end 后，循环回 start 时使用的淡化时长。
    fragmentLoopFadeMs: 300,

    // 异地访问时的歌曲预加载与持久缓存接口。
    loading: {
      // 页面打开后优先缓存多少个“接下来最可能播放”的不同音频文件。
      preloadAhead: 3,

      // 进入照片场景或打开某张照片后，提前缓存后面几张照片对应的歌曲。
      photoPreloadAhead: 3,

      // 开场歌曲开始请求后，等待多久再缓存后续歌曲，避免同时抢占首曲带宽。
      preloadDelayMs: 1800,

      // 默认不下载整张歌单，避免第一次异地访问一次消耗几十 MB 流量。
      // 只有明确需要全歌单离线缓存时才改为 true。
      cacheWholePlaylist: false,

      // cacheWholePlaylist 为 true 时，再等待多久开始串行缓存其余歌曲。
      // 设为 0 表示即使开启 cacheWholePlaylist，也不启动整歌单后台缓存。
      cacheRemainingAfterMs: 0,

      // true：交给 Service Worker 持久缓存，刷新或下次打开仍可直接使用。
      persistentCache: true,

      // 访客开启“节省流量”时不主动下载尚未播放的歌曲。
      skipOnSaveData: true,
    },

    // “先抓住这颗心”开场页的播放接口。
    opening: {
      // true：页面打开后立即尝试播放；false：仍等用户主动点击后播放。
      // 注意：若浏览器拦截有声自动播放，会在开场页第一次点击/按键时立即补播。
      autoplay: true,

      // 支持 playlist 编号、歌曲 id、"NEXT"、"CONTINUE" 或 { track, start, end }。
      action: 0,

      // 自动播放被浏览器拦截时，是否在第一次真实操作中补播。
      retryOnFirstInteraction: true,

      // 开场歌曲淡入时长。
      fadeInMs: 700,
    },

    // 提示音或米老鼠出现时，暂时压低背景歌曲，突出前景音效。
    ducking: {
      enabled: true,

      // 压低后的音量比例。0.22 表示暂时保留正常背景音量的 22%。
      volumeRatio: 0.33,

      // 压低、保持、恢复的时长，单位均为毫秒。
      fadeOutMs: 200,
      holdMs: 0,
      fadeInMs: 200,

      // 两类事件可以分别覆盖默认保持时长，也可以分别关闭自动压低。
      chimeHoldMs: 190,
      mickeyHoldMs: 0,
      onChime: true,
      onMickeyAppear: true,
    },

    playlist: [
      { // 开场封面
        id: "sakura-grass",
        title: "Sweety - 樱花草",
        src: "./assets/audio/optimized/sakura-grass.mp3",
        start: "00:20",
        end: "04:30",
      },
      {
        id: "special-person",
        title: "方大同 - 特别的人",
        src: "./assets/audio/optimized/special-person.mp3",
        start: "02:13",
        end: "03:55",
      },
      {
        id: "love-message",
        title: "郭静 - 爱情讯息",
        src: "./assets/audio/optimized/love-message.mp3",
        start: "01:11",
        end: "01:50",
      },
      {
        id: "love-message",
        title: "郭静 - 爱情讯息",
        src: "./assets/audio/optimized/love-message.mp3",
        start: "03:19",
        end: "04:10",
      },
      {
        id: "suddenly",
        title: "莫文蔚 - 忽然之间",
        src: "./assets/audio/optimized/suddenly.mp3",
        start: "00:45",
        end: "01:13",
      },
      {
        id: "suddenly",
        title: "莫文蔚 - 忽然之间",
        src: "./assets/audio/optimized/suddenly.mp3",
        start: "1:34",
        end: "03:35",
      },
      {
        id: "slowly-fall-for-you",
        title: "莫文蔚 - 慢慢喜欢你",
        src: "./assets/audio/optimized/slowly-fall-for-you.mp3",
        start: "02:39",
        end: "03:13",
      },
      {
        id: "slowly-fall-for-you",
        title: "莫文蔚 - 慢慢喜欢你",
        src: "./assets/audio/optimized/slowly-fall-for-you.mp3",
        start: "00:00",
        end: "03:13",
      },
      {
        id: "dear-you",
        title: "任素汐 - 亲爱的你啊",
        src: "./assets/audio/optimized/dear-you.mp3",
        start: "02:09",
        end: "02:30",
      },
      {
        id: "dear-you",  // 开场爱心树
        title: "任素汐 - 亲爱的你啊",
        src: "./assets/audio/optimized/dear-you.mp3",
        start: "00:00",
        end: "03:50",
      },
      {
        id: "what-i-miss",
        title: "孙燕姿 - 我怀念的",
        src: "./assets/audio/optimized/what-i-miss.mp3",
        start: "02:21",
        end: "04:42",
      },

      {
        id: "sakura-grass",
        title: "Sweety - 樱花草",
        src: "./assets/audio/optimized/sakura-grass.mp3",
        start: "02:38",
        end: "04:30",
      },
      {
        id: "another-me-in-world",
        title: "阿肆, 郭采洁 - 世界上的另一个我",
        src: "./assets/audio/optimized/another-me-in-world.mp3",
        start: "00:17",
        end: null,
      },
      {
        id: "beauty-around-you",
        title: "柏松 - 世间美好与你环环相扣",
        src: "./assets/audio/optimized/beauty-around-you.mp3",
        start: "00:57",
        end: null,
      },
      {
        id: "thief-of-time",
        title: "金玟岐 - 岁月神偷",
        src: "./assets/audio/optimized/thief-of-time.mp3",
        start: "00:47",
        end: null,
      },
      {
        id: "so-many-people",
        title: "莫文蔚 - 这世界那么多人",
        src: "./assets/audio/optimized/so-many-people.mp3",
        start: "01:39",
        end: null,
      },
      {
        id: "green-light",
        title: "孙燕姿 - 绿光",
        src: "./assets/audio/optimized/green-light.mp3",
        start: "00:14",
        end: null,
      },
      {
        id: "encounter",
        title: "孙燕姿 - 遇见",
        src: "./assets/audio/optimized/encounter.mp3",
        start: "01:14",
        end: null,
      },
      {
        id: "love-be-frank",
        title: "萧潇 - 爱要坦荡荡",
        src: "./assets/audio/optimized/love-be-frank.mp3",
        start: "00:15",
        end: null,
      },
      {
        id: "what-can-not",
        title: "许嵩 - 有何不可",
        src: "./assets/audio/optimized/what-can-not.mp3",
        start: "00:22",
        end: null,
      },
      {
        id: "side-face",
        title: "于果 - 侧脸",
        src: "./assets/audio/optimized/side-face.mp3",
        start: "00:40",
        end: null,
      },
      {
        id: "he-doesnt-understand",
        title: "张杰 - 他不懂",
        src: "./assets/audio/optimized/he-doesnt-understand.mp3",
        start: "00:44",
        end: null,
      },
      {
        id: "big-big-world",
        title: "Emilia - Big Big World",
        src: "./assets/audio/optimized/big-big-world.mp3",
        start: "00:04",
        end: null,
      },
      {
        id: "together-no-matter-how-far",
        title: "G.E.M.邓紫棋 - 多远都要在一起",
        src: "./assets/audio/optimized/together-no-matter-how-far.mp3",
        start: "00:48",
        end: null,
      },
      {
        id: "full-stop",
        title: "G.E.M.邓紫棋 - 句号",
        src: "./assets/audio/optimized/full-stop.mp3",
        start: "00:06",
        end: null,
      },
      {
        id: "i-wanted-you",
        title: "Ina Wroldsen - I wanted you",
        src: "./assets/audio/optimized/i-wanted-you.mp3",
        start: "00:18",
        end: null,
      },
      {
        id: "famous",
        title: "Ivy Adara - Famous",
        src: "./assets/audio/optimized/famous.mp3",
        start: "00:00",
        end: null,
      },
      {
        id: "lucky",
        title: "Lenka - Lucky",
        src: "./assets/audio/optimized/lucky.mp3",
        start: "00:00",
        end: null,
      },
      {
        id: "love-story",
        title: "Taylor Swift - Love Story",
        src: "./assets/audio/optimized/love-story.mp3",
        start: "00:14",
        end: null,
      },
      {
        id: "summer-vibe",
        title: "Walk off the Earth - Summer Vibe",
        src: "./assets/audio/optimized/summer-vibe.mp3",
        start: "00:45",
        end: null,
      },
    ],

    actions: {
      // 【开场移动爱心】
      // 点击“先抓住这颗心”页面中不断移动的“抓住我”爱心。
      catchHeart: "CONTINUE",

      // 【爱心树中央红心】
      // 进入爱心树页面后，点击画布中央的红心。
      loveTreeHeart: 9,

      // 【一起许愿】
      // 米老鼠出现后，点击“一起许愿”按钮。
      wishButton: 7,

      // 【照片流照片——这一个就是点击照片切歌的接口】
      // 点击照片流中的任意照片、打开照片大图时触发。
      // photoCard: "NEXT",
      photoCard: [

        { // "方大同 - 特别的人
          track: "special-person",
          start: "02:13",
          end: "03:55",
        },

        // { //  "莫文蔚 - 慢慢喜欢你"
        //   track: "slowly-fall-for-you",
        //   start: "02:39",
        //   end: "03:13",
        // },

        { // Sweety - 樱花草
          track: "sakura-grass",
          start: "02:38",
          end: "04:30",
        },

         // 1. 阿肆, 郭采洁 - 世界上的另一个我
        {
          track: "another-me-in-world",
          start: "00:17",
          end: null,
        },

        // 2. 柏松 - 世间美好与你环环相扣
        {
          track: "beauty-around-you",
          start: "00:57",
          end: null,
        },

        // 3. 金玟岐 - 岁月神偷
        {
          track: "thief-of-time",
          start: "00:47",
          end: null,
        },

        // 4. 莫文蔚 - 这世界那么多人
        {
          track: "so-many-people",
          start: "01:39",
          end: null,
        },

        // 5. 孙燕姿 - 绿光
        {
          track: "green-light",
          start: "00:14",
          end: null,
        },

        // 6. 孙燕姿 - 遇见
        {
          track: "encounter",
          start: "01:14",
          end: null,
        },

        // 7. 萧潇 - 爱要坦荡荡
        {
          track: "love-be-frank",
          start: "00:15",
          end: null,
        },

        // 8. 许嵩 - 有何不可
        {
          track: "what-can-not",
          start: "00:22",
          end: null,
        },

        // 9. 于果 - 侧脸
        {
          track: "side-face",
          start: "00:40",
          end: null,
        },

        // 10. 张杰 - 他不懂
        {
          track: "he-doesnt-understand",
          start: "00:44",
          end: null,
        },

        // 11. Emilia - Big Big World
        {
          track: "big-big-world",
          start: "00:04",
          end: null,
        },

        // 12. G.E.M.邓紫棋 - 多远都要在一起
        {
          track: "together-no-matter-how-far",
          start: "00:48",
          end: null,
        },

        // 13. G.E.M.邓紫棋 - 句号
        {
          track: "full-stop",
          start: "00:06",
          end: null,
        },

        // 14. Ina Wroldsen - I wanted you
        {
          track: "i-wanted-you",
          start: "00:18",
          end: null,
        },

        // 15. Ivy Adara - Famous
        {
          track: "famous",
          start: "00:00",
          end: null,
        },

        // 16. Lenka - Lucky
        {
          track: "lucky",
          start: "00:00",
          end: null,
        },

        // 17. Taylor Swift - Love Story
        {
          track: "love-story",
          start: "00:14",
          end: null,
        },

        // 18. Walk off the Earth - Summer Vibe
        {
          track: "summer-vibe",
          start: "00:45",
          end: null,
        },
      ],

      // 【关闭照片大图】
      // 点击大图右上角关闭按钮，或者点击大图外侧背景时触发。
      // CONTINUE 表示关闭大图时继续当前歌曲，不重新切歌。
      photoLightboxClose: "CONTINUE",

      // 【让故事继续】
      // 照片流页面中点击“让故事继续”按钮。
      finishPhotosButton: "CONTINUE",

      // 【签收礼物】
      // 点击“签收礼物”按钮。
      acceptGiftButton: "NEXT",

      // 【打开礼物盒】
      // 点击页面中央的礼物盒。
      giftBox: "NEXT",

      // 【收下这份心意】
      // 点击生日卡片中的“收下这份心意”按钮。
      keepGiftButton: "NEXT",

      // 【右上角音乐开关】
      // 手动暂停后再次点击音乐按钮，继续原来的歌曲和播放位置。
      musicToggle: "CONTINUE",
    },
  },

  /**
   * --------------------------------------------------------------------------
   * 1.1 网页资源加载优化
   * --------------------------------------------------------------------------
   * 这些参数只影响加载时机，不改变照片顺序、文案或动画效果。
   */
  loading: {
    // true：启用 sw.js 持久缓存；部署到 GitHub Pages / 自定义域名时建议保持开启。
    serviceWorker: true,

    // 照片进入可视区域前，提前多少个屏幕宽度开始加载缩略图。
    photoLoadAheadScreens: 1.25,

    // 页面打开后多久开始在后台串行缓存全部照片流缩略图。
    thumbnailWarmupDelayMs: 4500,

    // 打开一张照片时，额外预取前后各几张放大预览图。
    previewNeighborCount: 1,

    // 访客开启“节省流量”时，不主动缓存未显示的照片缩略图。
    skipOnSaveData: true,
  },

  /**
   * --------------------------------------------------------------------------
   * 2. 爱心树与情书
   * --------------------------------------------------------------------------
   */
  story: {
    // 打字机每个汉字出现的间隔。越小越快；建议范围：35～110。
    characterDelayMs: 120,

    // 文字全部显示完后，米老鼠再等待多久出现。
    invitationDelayMs: 600,

    // 情书正文。使用 \n 表示换行，\n\n 表示空一行。
    copy:
        "To M.J.：\n\n" +
        // "　　人海茫茫，我们有幸相逢，从初识到相知。一同拥有过无数温柔美好的瞬间，历经误会，短暂别离。这个页面删删减减，多次改版每次意义不同！既是珍藏回忆，更是美好期许，命运兜兜转转，缘分让我们回到彼此身旁。往后岁岁朝朝，只想紧紧牵着你的手，共同奔赴万千世界。\n\n"+
        "　　20岁，一个人生奇特的转折点。褪去十八岁的青涩，却又鲜有那份成熟。20岁是青春，更是力量！一段充满挣扎与考验的时光，一段自我沉淀迅速成长的年纪。非常有幸作为你人生的一位摆渡人，一起披荆斩棘，寻找彼岸。诚然过程似乎并不如想象般美好，从信封到网页，故事的意义发生了变化，但很高兴故事的结尾并没止步于此，命运兜兜转转，好巧认识你 ~ \n       无论如何，希望我们仍是最好的朋友，一位从呱呱落地6.6kg，到如今奋斗了7304天的好朋友！ \n"+
        // "　　无论如何，希望我们仍是最好的朋友，一位从呱呱落地6.6kg，到如今奋斗了7304天的好朋友！\n\n"+
        "　　祝生日快乐！",
  },

  /**
   * 相识计时的起点。
   * 格式：年、月、日、时、分、秒。
   * 注意：JavaScript 的月份从 0 开始，1 代表二月。
   */
  relationship: {
    startedAt: [2006, 7, 22, 20, 0, 0, 0],
  },

  /**
   * --------------------------------------------------------------------------
   * 3. 各场景时间
   * --------------------------------------------------------------------------
   */
  timing: {
    // 点击“许愿”后，米老鼠头像铺满屏幕所持续的时间。
    transitionCoverMs: 1900,

    // 照片场景出现后，转场遮罩淡出的时间。
    transitionRevealMs: 760,

    // 照片场景进入后，“让故事继续”按钮多久出现。
    photoContinueButtonMs: 1800,

    // 照片场景自动播放多久后，米老鼠带礼物出现。
    photoDurationMs: 16000,

    // 点击“签收礼物”后，礼物盒等待多久自动打开。
    giftOpenDelayMs: 720,

    // 礼物盒打开后，卡片等待多久升起。
    cardRevealDelayMs: 760,
  },

  /**
   * --------------------------------------------------------------------------
   * 4. 动画数量与密度
   * --------------------------------------------------------------------------
   */
  effects: {
    /**
     * 转场米老鼠头数量 = transitionHeadRows × transitionHeadColumns。
     * 当前 8 × 12 = 96 个。
     * 如果手机性能较弱，可改成 6 × 8；想更密可改成 10 × 14。
     */
    transitionHeadRows: 8,
    transitionHeadColumns: 12,

    // 爱心树花朵数量。越大越浓密，同时绘制压力越高。
    treeBloomCount: 700,

    // 礼物场景中闪烁的小星星数量。
    giftSparkleCount: 40,

    // 点击“收下心意”后向上飘动的爱心数量。
    finalFloatingHeartCount: 60,

    /**
     * 照片流速度：
     * 每新增一张照片，总动画时长增加多少秒。
     * 数值越大，移动越慢；数值越小，移动越快。
     */
    photoSecondsPerCard: 7,

    // 无论照片多少，照片流完成一轮至少需要多少秒。
    minimumPhotoTrackSeconds: 38,

    /**
     * 手动浏览灵敏度：
     * photoWheelSensitivity 控制鼠标滚轮/触控板每次推进的距离。
     * photoSwipeSensitivity 控制手机或鼠标左右拖动时跟手的距离。
     * 1 为自然速度；0.6 更柔和；1.5 更灵敏。
     */
    photoWheelSensitivity: 1,
    photoSwipeSensitivity: 1,
  },

  /**
   * --------------------------------------------------------------------------
   * 4. 照片流内容
   * --------------------------------------------------------------------------
   *
   * 如何继续添加很多张照片：
   * 1. 把原图复制到 photos 文件夹。
   * 2. 另外生成一张小缩略图和一张中等尺寸预览图，分别放进
   *    assets/media/thumbs 与 assets/media/previews，避免异地访问直接下载大原图。
   * 3. 复制下面任意一个完整的 { ... } 照片对象。
   * 4. 粘贴到 photos 数组末尾，确保前一个对象结尾保留逗号。
   * 5. 修改 src、thumbnail、preview、alt、top、bottom；视频可设置 type、poster、loop。
   *
   * 示例：
   * {
   *   src: "./photos/photo-07.jpg",                 // 原图，只作为保留接口
   *   thumbnail: "./assets/media/thumbs/photo-07.jpg", // 照片流小图
   *   preview: "./assets/media/previews/photo-07.jpg", // 点击放大时加载
   *   alt: "第七张生日回忆照片",
   *   top: "照片上方的文字。",
   *   bottom: "照片下方的文字。",
   * },
   *
   * MP4 / WebM 视频示例（视频在照片墙内会静音循环播放）：
   * {
   *   src: "./photos/memory-video.mp4",
   *   type: "video",
   *   poster: "./photos/memory-video-cover.jpg", // 可选：视频加载前的封面
   *   autoplay: true,
   *   loop: true,
   *   muted: true, // 浏览器允许自动播放所必需，放大后可手动取消静音
   *   alt: "一段生日视频回忆",
   *   top: "视频上方的文字。",
   *   bottom: "视频下方的文字。",
   * },
   *
   * GIF 动图与普通图片写法完全相同，只需把 src 改成 "./photos/xxx.gif"。
   * type 通常可以省略，程序会根据 mp4、webm、ogg 等扩展名自动识别视频。
   *
   * 如果暂时没有图片，把 src 留空字符串 ""，网页会自动显示占位卡片。
   * 图片、动图和视频数量无需在其他文件登记，JavaScript 会自动扩展并保持无缝流动。
   */
  // photos: [
  //  {
  //     src: "./photos/photos (10).jpg",
  //     alt: "",
  //     top: "不用刻意寻找浪漫，你站着的地方就是风景。",
  //     bottom: "陪伴是最长情的告白，而你在就是最好的答案。"
  //   },
  //   {
  //     src: "./photos/photos (5).jpg",
  //     alt: "",
  //     top: "在奔走于各自未来的日子里，请照顾好那个努力的自己。",
  //     bottom: "愿你的每一次伏案，都能换来星光璀璨的明天。"
  //   },

  //   {
  //     src: "./photos/2.jpg",
  //     alt: "",
  //     top: "风吹过裙摆的刹那，定格了整个季节的轻盈。",
  //     bottom: "故事还长，这漫漫半生我们慢慢讲给岁月听。"
  //   },

  //   {
  //     src: "./photos/photos (8).jpg",
  //     alt: "",
  //     top: "以后没有我碎碎念的岁月，你要学会自己给自己拥抱。",
  //     bottom: "请把所有的热爱与期待，都毫无保留地留给自己。"
  //   },
  //   {
  //     src: "./photos/mv1.mp4",
  //     alt: "",
  //     top: "再忙碌的日子，也要记得给一日三餐留一点温柔的余地。",
  //     bottom: "替我好好照顾那个，我曾在意过无数遍的你。"
  //   },
  //   {
  //     src: "./photos/photos (14).jpg",
  //     alt: "",
  //     top: "谢谢你曾陪我走过一程，接下来的风景你要替我去赏。",
  //     bottom: "岁岁安好，前路漫长，愿你一生清澈，一生勇敢。"
  //   },
  //   {
  //     src: "./photos/photos9.jpg",
  //     alt: "",
  //     top: "烛光跃动在你的眼眸，像是藏着一万个星系。",
  //     bottom: "许下的每一个心愿，我都想为你保驾护航。"
  //   },
  //   {
  //     src: "./photos/photos (16).jpg",
  //     alt: "",
  //     top: "有你分享的快乐，总会在心里停留得更久。",
  //     bottom: "把今天的愿望，交给明天慢慢实现。"
  //   },
  //   {
  //     src: "./photos/photos (9).jpg",
  //     alt: "",
  //     top: "第一次把平凡的日子，认真地收进记忆里。",
  //     bottom: "原来幸福，就是回头时你一直都在。"
  //   },
  //   {
  //   src: "./photos/photos (2).jpg",
  //   alt: "",
  //   top: "一起走过的路，连风景都有了特别的名字。",
  //   bottom: "下一站、下下一站，也想继续陪你抵达。"
  //   },
  //   {
  //     src: "./photos/photos (11).jpg",
  //     alt: "",
  //     top: "照片会褪色，但被爱着的感觉不会。",
  //     bottom: "愿新的一岁，仍有花、星光和好多好多爱。"
  //   },
  //   {
  //     src: "./photos/photos (7).jpg",
  //     alt: "",
  //     top: "那些没有准备的瞬间，后来都成了珍藏。",
  //     bottom: "爱把普通的一天，变成值得纪念的一天。"
  //   },
  //   {
  //     src: "./photos/photos (4).jpg",
  //     alt: "",
  //     top: "书页里翻过的不仅是岁月，还有你不断生长的灵魂。",
  //     bottom: "保持对世界的好奇，你终将成为自己的太阳。"
  //   },
  //   {
  //     src: "./photos/肖像大头照.jpg",
  //     alt: "",
  //     top: "每一个崭新的清晨，都是为了迎接更好的你而存在。",
  //     bottom: "把遗憾留在昨天，去拥抱那个无限可能的未来。"
  //   },

  //   {
  //     src: "./photos/photos (6).jpg",
  //     alt: "",
  //     top: "走过四季的更迭，才懂得最美的诗句就在眼前。",
  //     bottom: "岁岁年年，万喜万般宜，只要始终是你。"
  //   },
  //   {
  //     src: "./photos/photos (1).jpg",
  //     alt: "",
  //     top: "光落在脸上的时候，时间也变得很温柔。",
  //     bottom: "愿往后的每一次快门，都有我们的笑容。"
  //   },
  //   {
  //     src: "./photos/photos (12).jpg",
  //     alt: "",
  //     top: "万水千山的旅程，愿你踏出的每一步都坚定且从容。",
  //     bottom: "在我看不见的远方，请你务必熠熠生辉。"
  //   },
  //   {
  //     src: "./photos/portrait-full.jpg",
  //     alt: "",
  //     top: "偶尔觉得孤单也没关系，那是你在独自长大的声音。",
  //     bottom: "愿你拥有披荆斩棘的勇气，也有安然入梦的宁静。"
  //   },

  //   {
  //     src: "./photos/photos (13).jpg",
  //     alt: "",
  //     top: "故事的分岔路口，我的缺席并不妨碍你的耀眼。",
  //     bottom: "带着我的祝愿向前走吧，不要回头，要向着光。"
  //   },


  //   {
  //     src: "./photos/photos (15).jpg",
  //     alt: "",
  //     top: "哪怕以后的路要一个人走，也要记得留意沿途的花香。",
  //     bottom: "愿你把日子过得丰盈，连同我的那一份热忱。"
  //   }



  // ],

  photos: [
    {
      src: "./photos/photos (10).jpg",
      thumbnail: "./assets/media/thumbs/photo-01.jpg",
      preview: "./assets/media/previews/photo-01.jpg",
      alt: "",
      top: "不必费力追逐浪漫，你本身 便是 醉美 风景！",
      bottom: "陪伴是最长情的告白，余生，只想与你相伴"
    },
    {
      src: "./photos/photos (4).jpg",
      thumbnail: "./assets/media/thumbs/photo-02.jpg",
      preview: "./assets/media/previews/photo-02.jpg",
      alt: "",
      top: "再忙碌的日子，也要记得给一日三餐留一点温柔的余地",
      bottom: "好好照顾那个  我曾在意过无数遍的你。"
    },

    {
      src: "./photos/photos (8).jpg",
      thumbnail: "./assets/media/thumbs/photo-03.jpg",
      preview: "./assets/media/previews/photo-03.jpg",
      alt: "",
      top: "风吹过裙摆的刹那，定格了季节的轻盈",
      bottom: "故事还长，我们慢慢讲给岁月听。"
    },
    {
      src: "./photos/mv1.mp4",
      type: "video",
      muted: true,
      poster: "./assets/media/thumbs/video-04.jpg",
      alt: "",
      top: "第一次把平凡的日子，认真地收进记忆里",
      bottom: "原来幸福就是，回头时 你一直都在"
    },
    {
      src: "./photos/photos (14).jpg",
      thumbnail: "./assets/media/thumbs/photo-05.jpg",
      preview: "./assets/media/previews/photo-05.jpg",
      alt: "",
      top: "何其有幸与你相伴一程，往后人间风月，我们一同览尽。",
      bottom: "前路漫漫岁岁安然，陪你永远清澈，永远热烈勇敢鲜活。"
    },
    {
      src: "./photos/photos9.jpg",
      thumbnail: "./assets/media/thumbs/photo-06.jpg",
      preview: "./assets/media/previews/photo-06.jpg",
      alt: "",
      top: "烛光摇曳，眼底尽揽浩瀚星河",
      bottom: "你许下的每一个愿望，我都愿倾尽温柔实现"
    },
    {
      src: "./photos/photos (16).jpg",
      thumbnail: "./assets/media/thumbs/photo-07.jpg",
      preview: "./assets/media/previews/photo-07.jpg",
      alt: "",
      top: "与你共享过的欢喜，会在心底久久滚烫，不曾消散",
      bottom: "美好期许，慢慢兑现。"
    },
    {
      src: "./photos/photos (9).jpg",
      thumbnail: "./assets/media/thumbs/photo-08.jpg",
      preview: "./assets/media/previews/photo-08.jpg",
      alt: "",
      top: "把平凡细碎的朝夕，珍藏进我们的回忆",
      bottom: "蓦然回首，身旁始终是你"
    },
    {
      src: "./photos/2.jpg",
      thumbnail: "./assets/media/thumbs/photo-09.jpg",
      preview: "./assets/media/previews/photo-09.jpg",
      alt: "",
      top: "今晚月色真美。",
      bottom: "风也温柔，我很想你"
    },
    {
      src: "./photos/photos (2).jpg",
      thumbnail: "./assets/media/thumbs/photo-10.jpg",
      preview: "./assets/media/previews/photo-10.jpg",
      alt: "",
      top: "一起走过的路，连风景都有了特别的名字",
      bottom: "下一站、下下一站，也想继续陪你抵达"
    },
    {
      src: "./photos/photos (11).jpg",
      thumbnail: "./assets/media/thumbs/photo-11.jpg",
      preview: "./assets/media/previews/photo-11.jpg",
      alt: "",
      top: "照片会褪色，但被爱着的感觉不会",
      bottom: "愿新的一岁，仍有花、星光和好多好多爱"
    },
    {
      src: "./photos/photos (7).jpg",
      thumbnail: "./assets/media/thumbs/photo-12.jpg",
      preview: "./assets/media/previews/photo-12.jpg",
      alt: "",
      top: "那些没有准备的瞬间，后来都成了珍藏",
      bottom: "爱把普通的一天，变成值得纪念的一天"
    },
    {
      src: "./photos/photos (5).jpg",
      thumbnail: "./assets/media/thumbs/photo-13.jpg",
      preview: "./assets/media/previews/photo-13.jpg",
      alt: "",
      top: "书页翻过岁岁光阴，也见证着闪闪发光的你不断成长。",
      bottom: "永远保有对世界的热忱好奇，活成自己的太阳。"
    },
    {
      src: "./photos/肖像大头照.jpg",
      thumbnail: "./assets/media/thumbs/photo-14.jpg",
      preview: "./assets/media/previews/photo-14.jpg",
      alt: "",
      top: "有你分享的快乐，总会在心里停留得更久。",
      bottom: "把今天的愿望，交给明天慢慢实现。"
    },
    {  //     top: "走过四季的更迭，才懂得最美的诗句就在眼前。",
  //     bottom: "岁岁年年，万喜万般宜，只要始终是你。"
      src: "./photos/photos (6).jpg",
      thumbnail: "./assets/media/thumbs/photo-15.jpg",
      preview: "./assets/media/previews/photo-15.jpg",
      alt: "",
      top: "四季更迭，饱览最美诗篇。",
      bottom: "岁岁年年，只要是你，始终是你"
    },
    {
      src: "./photos/photos (1).jpg",
      thumbnail: "./assets/media/thumbs/photo-16.jpg",
      preview: "./assets/media/previews/photo-16.jpg",
      alt: "",
      top: "光落在脸上的时候，时间也变得很温柔。",
      bottom: "愿往后的每一次快门，都有我们的笑容。"
    },
    {
      src: "./photos/photos (12).jpg",
      thumbnail: "./assets/media/thumbs/photo-17.jpg",
      preview: "./assets/media/previews/photo-17.jpg",
      alt: "",
      top: "见过无数落日晚霞，唯独对你满心牵挂",
      bottom: "愿往后所有的美好，都奔赴向你而来"
    },

    {
      src: "./photos/portrait-full.jpg",
      thumbnail: "./assets/media/thumbs/photo-18.jpg",
      preview: "./assets/media/previews/photo-18.jpg",
      alt: "",
      top: "倘若偶尔疲惫迷茫也没关系，我便是你的港湾与归处",
      bottom: "愿你拥有披荆斩棘的底气，亦拥有放松倾诉的宁静"
    },

    {
      src: "./photos/photos (15).jpg",
      thumbnail: "./assets/media/thumbs/photo-19.jpg",
      preview: "./assets/media/previews/photo-19.jpg",
      alt: "",
      top: "往后山河远阔不必独行，我会伴你沿途共赏人间花香。",
      bottom: "愿日子热烈丰盈，世间所有美好热忱，我们一同共享。"
    }
  ],


  /**
   * --------------------------------------------------------------------------
   * 6. 礼物卡片文字
   * --------------------------------------------------------------------------
   *
   * lines 数组中的每一项都会生成一个独立段落。
   * 如果一句话不想换行：
   * - 可以缩短这句话；
   * - 或在 style.css 顶部减小 --birthday-body-size；
   * - 或增大 --birthday-card-width。
   */
  card: {
    eyebrow: "FOR MY DEAREST",
    title: "生日快乐，我最珍贵的宝贝",
    lines: [
      "愿你新的一岁，眼里有光，心里有梦",
      "愿所有小小的期待，都在某一天悄悄抵达",
      "也愿你知道，无论走到哪里，都会有人一直爱你",
      // "今晚月色真美，下弦渐满  风也温柔， 南风阵阵",
      ""
    ],
    signature: "",
    finalWish: "愿你每一个愿望，都在未来被温柔接住。",
  },
};
