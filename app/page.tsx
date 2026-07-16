"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const scenes = [
  { id: "hello", number: "01", label: "序章" },
  { id: "memory", number: "02", label: "星轨" },
  { id: "wish", number: "03", label: "愿望" },
] as const;

const memories = [
  {
    no: "01",
    eyebrow: "THE FIRST SPARK",
    title: "第一次心动",
    copy: "人海里多看你的那一眼，后来变成了我所有故事的开场。",
    accent: "#ff8ca8",
  },
  {
    no: "02",
    eyebrow: "OUR LITTLE GALAXY",
    title: "一起看过的风景",
    copy: "那些走过的街、吹过的晚风，都因为身边是你而闪闪发光。",
    accent: "#b394ff",
  },
  {
    no: "03",
    eyebrow: "EVERYDAY MAGIC",
    title: "平凡的小确幸",
    copy: "最喜欢的从来不是盛大的时刻，是每一个有你在的普通日子。",
    accent: "#ffd98e",
  },
];

type Spark = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  drift: number;
};

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let sparks: Spark[] = [];
    const pointer = { x: -1000, y: -1000 };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(150, Math.max(65, Math.floor((width * height) / 11000)));
      sparks = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.35 + 0.25,
        speed: Math.random() * 0.14 + 0.03,
        alpha: Math.random() * 0.66 + 0.2,
        drift: Math.random() * 0.16 - 0.08,
      }));
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const spark of sparks) {
        const dx = pointer.x - spark.x;
        const dy = pointer.y - spark.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 130 && distance > 0) {
          spark.x -= (dx / distance) * 0.28;
          spark.y -= (dy / distance) * 0.28;
        }
        if (!reduced) {
          spark.y -= spark.speed;
          spark.x += spark.drift;
        }
        if (spark.y < -4) spark.y = height + 4;
        if (spark.x < -4) spark.x = width + 4;
        if (spark.x > width + 4) spark.x = -4;

        const twinkle = reduced ? spark.alpha : spark.alpha + Math.sin(Date.now() * 0.0018 + spark.x) * 0.16;
        context.beginPath();
        context.fillStyle = `rgba(255, 226, 177, ${Math.max(0.08, twinkle)})`;
        context.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        context.fill();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="star-field" aria-hidden="true" />;
}

function Cake({ wished }: { wished: boolean }) {
  return (
    <div className={`cosmic-cake ${wished ? "is-wished" : ""}`} aria-hidden="true">
      <span className="cake-halo halo-one" />
      <span className="cake-halo halo-two" />
      <span className="cake-planet planet-one" />
      <span className="cake-planet planet-two" />
      <span className="cake-planet planet-three" />
      <div className="cake-top">
        {[0, 1, 2].map((candle) => (
          <span className={`candle candle-${candle + 1}`} key={candle}>
            <i className="flame" />
          </span>
        ))}
      </div>
      <div className="cake-body">
        <span className="icing-dot dot-one" />
        <span className="icing-dot dot-two" />
        <span className="icing-dot dot-three" />
        <span className="icing-line line-one" />
        <span className="icing-line line-two" />
      </div>
      <div className="cake-plate" />
      <span className="cake-label">FOR YOU</span>
    </div>
  );
}

export default function Home() {
  const [scene, setScene] = useState(0);
  const [activeMemory, setActiveMemory] = useState(0);
  const [wished, setWished] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const confetti = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        left: (index * 37 + 7) % 100,
        delay: (index % 9) * 0.07,
        duration: 1.9 + (index % 5) * 0.22,
        rotate: (index * 47) % 240,
      })),
    [],
  );

  const playTone = (kind: "nav" | "wish") => {
    if (!soundOn) return;
    const audio = new AudioContext();
    const notes = kind === "wish" ? [523.25, 659.25, 783.99] : [523.25];
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + index * 0.09;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.36);
    });
    window.setTimeout(() => void audio.close(), 900);
  };

  const goTo = (index: number) => {
    setScene(index);
    playTone("nav");
  };

  const makeWish = () => {
    setWished(true);
    setBurstKey((key) => key + 1);
    playTone("wish");
  };

  return (
    <main className={`experience scene-${scene}`}>
      <StarField />
      <div className="aurora aurora-left" aria-hidden="true" />
      <div className="aurora aurora-right" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" onClick={() => goTo(0)} aria-label="回到生日序章">
          <span className="brand-orbit"><i /></span>
          <span>
            <b>TO MY FAVORITE PERSON</b>
            <small>A SMALL UNIVERSE, MADE FOR YOU</small>
          </span>
        </button>
        <div className="top-actions">
          <span className="special-day"><i /> SPECIAL DAY · 2026</span>
          <button
            className={`sound-toggle ${soundOn ? "is-on" : ""}`}
            onClick={() => setSoundOn((on) => !on)}
            aria-label={soundOn ? "关闭轻音效" : "开启轻音效"}
            aria-pressed={soundOn}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <nav className="scene-nav" aria-label="生日页面章节">
        {scenes.map((item, index) => (
          <button
            key={item.id}
            className={scene === index ? "active" : ""}
            onClick={() => goTo(index)}
            aria-current={scene === index ? "step" : undefined}
            data-testid={`nav-${item.id}`}
          >
            <span>{item.number}</span>
            <b>{item.label}</b>
          </button>
        ))}
      </nav>

      <div className="scene-viewport">
        <section className={`scene-panel intro-panel ${scene === 0 ? "is-active" : ""}`} aria-hidden={scene !== 0}>
          <div className="intro-copy">
            <div className="eyebrow"><i /> A LETTER FROM THE STARS</div>
            <p className="hand-note">Hey, birthday girl</p>
            <h1>今天，宇宙<br />为你<span>点亮</span></h1>
            <p className="lead">
              我把想对你说的话，藏进了这片小小星系。<br className="desktop-only" />
              请慢慢拆开——每一颗星星，都是一句喜欢你。
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => goTo(1)}>
                <span>开启这趟生日旅行</span><i>↗</i>
              </button>
              <button className="text-button" onClick={() => { setBurstKey((key) => key + 1); playTone("nav"); }}>
                <i className="tiny-star">✦</i> 点亮星光
              </button>
            </div>
          </div>
          <div className="hero-art">
            <div className="orbit-copy orbit-top">YOU ARE MY FAVORITE PLACE</div>
            <Cake wished={false} />
            <div className="floating-note note-left"><b>100%</b><span>LOVE &amp; LUCK</span></div>
            <div className="floating-note note-right"><span>MAKE A</span><b>WISH</b></div>
          </div>
        </section>

        <section className={`scene-panel memory-panel ${scene === 1 ? "is-active" : ""}`} aria-hidden={scene !== 1}>
          <div className="memory-heading">
            <div className="eyebrow"><i /> OUR CONSTELLATION</div>
            <p className="hand-note">The best parts of us</p>
            <h2>把回忆连成<span>星轨</span></h2>
            <p>轻触一颗星，看看我们共同收藏的闪光时刻。</p>
          </div>
          <div className="memory-stage">
            <div className="constellation-lines" aria-hidden="true">
              <i className="line-a" /><i className="line-b" /><i className="line-c" />
              <span className="star-a">✦</span><span className="star-b">✦</span><span className="star-c">✦</span>
            </div>
            <div className="memory-cards">
              {memories.map((memory, index) => (
                <button
                  key={memory.no}
                  className={`memory-card ${activeMemory === index ? "active" : ""}`}
                  onClick={() => { setActiveMemory(index); playTone("nav"); }}
                  style={{ "--card-accent": memory.accent } as React.CSSProperties}
                >
                  <span className="memory-no">/ {memory.no}</span>
                  <i className="memory-gem">✦</i>
                  <small>{memory.eyebrow}</small>
                  <h3>{memory.title}</h3>
                  <p>{memory.copy}</p>
                  <span className="card-arrow">↗</span>
                </button>
              ))}
            </div>
            <div className="memory-caption" key={activeMemory}>
              <span>{memories[activeMemory].no}</span>
              <p>“ {memories[activeMemory].copy} ”</p>
            </div>
          </div>
          <button className="next-whisper" onClick={() => goTo(2)}>还有最后一份惊喜 <span>→</span></button>
        </section>

        <section className={`scene-panel wish-panel ${scene === 2 ? "is-active" : ""}`} aria-hidden={scene !== 2}>
          <div className="wish-copy">
            <div className="eyebrow"><i /> ONE LAST LITTLE THING</div>
            <p className="hand-note">Close your eyes</p>
            <h2>{wished ? <>愿你的每一天<br />都被<span>温柔接住</span></> : <>现在，许一个<br /><span>闪闪发光</span>的愿望</>}</h2>
            <p className="lead">
              {wished
                ? "生日快乐，我最爱的女孩。新的一岁，也请继续做那个自由、热烈、闪闪发光的你。"
                : "准备好了吗？点下按钮的瞬间，我会替你把愿望送进宇宙。"}
            </p>
            {!wished ? (
              <button className="primary-button wish-button" onClick={makeWish} data-testid="wish-button">
                <span>闭上眼，许下愿望</span><i>✦</i>
              </button>
            ) : (
              <div className="wish-success" role="status">
                <span>WISH SENT</span><i />
                <button onClick={() => { setWished(false); setBurstKey(0); }}>再许一次</button>
              </div>
            )}
          </div>
          <div className="wish-art">
            <div className="wish-rings" aria-hidden="true"><i /><i /><i /></div>
            <Cake wished={wished} />
            <p className="wish-instruction">{wished ? "YOUR WISH IS AMONG THE STARS" : "TAP THE BUTTON · MAKE IT COUNT"}</p>
          </div>
        </section>
      </div>

      <div className={`confetti-layer ${burstKey ? "burst" : ""}`} key={burstKey} aria-hidden="true">
        {confetti.map((piece, index) => (
          <i
            key={index}
            style={{
              "--left": `${piece.left}%`,
              "--delay": `${piece.delay}s`,
              "--duration": `${piece.duration}s`,
              "--rotate": `${piece.rotate}deg`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <footer className="footerbar">
        <span>MADE WITH <b>♥</b> &amp; A LITTLE STARLIGHT</span>
        <div className="progress-track" aria-hidden="true"><i style={{ width: `${((scene + 1) / scenes.length) * 100}%` }} /></div>
        <span><b>0{scene + 1}</b> / 03</span>
      </footer>
    </main>
  );
}
