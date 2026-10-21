import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// ==========================================
// พื้นหลัง Aurora Glow สไตล์เดียวกับคลิป lovio
// ==========================================
const AuroraBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const moveX = Math.sin(frame / 40) * 60;
  const moveY = Math.cos(frame / 40) * 40;

  return (
    <AbsoluteFill className="bg-[#040711] overflow-hidden">
      <div
        style={{ transform: `translate(${moveX}px,${moveY}px)` }}
        className="absolute -top-40 -left-40 w-[900px] h-[900px] rounded-full bg-blue-600/25 blur-[160px]"
      />
      <div
        style={{ transform: `translate(${-moveX}px,${-moveY}px)` }}
        className="absolute -bottom-40 -right-40 w-[800px] h-[800px] rounded-full bg-indigo-500/20 blur-[150px]"
      />
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 1: Glass Prompt ("Hello, World...")
// ==========================================
const Scene1Prompt: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const text = 'Hello, World. Looking for a builder who turns ideas into reality?';
  const charsShown = Math.floor(
    interpolate(frame, [15, 85], [0, text.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const boxScale = spring({ frame, fps, config: { damping: 14 } });
  const zoomOut = interpolate(frame, [95, 120], [1, 2.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [95, 118], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stacks = ['React / Next.js', 'Vue / Nuxt.js', 'TypeScript', 'Tailwind CSS', 'AI Workflow'];

  return (
    <AbsoluteFill
      style={{ transform: `scale(${boxScale * zoomOut})`, opacity: fadeOut }}
      className="flex flex-col items-center justify-center p-12"
    >
      <div className="w-[1050px] rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/15 p-10 shadow-[0_20px_80px_rgba(0,100,255,0.2)]">
        <div className="text-4xl text-white font-light tracking-wide min-h-[56px] flex items-center">
          <span>{text.slice(0, charsShown)}</span>
          <span
            style={{ opacity: Math.sin(frame / 4) > 0 ? 1 : 0 }}
            className="inline-block w-1 h-10 bg-cyan-400 ml-2"
          />
        </div>

        <div className="mt-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-2xl">
              +
            </div>
            <div className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-base flex items-center gap-2">
              <span>🌐</span> Public Profile
            </div>
            {stacks.map((stack, i) => {
              const badgeAppear = spring({
                frame: frame - (20 + i * 8),
                fps,
                config: { damping: 12 },
              });
              return (
                <div
                  key={stack}
                  style={{ transform: `scale(${badgeAppear})`, opacity: badgeAppear }}
                  className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-200 text-sm font-medium"
                >
                  {stack}
                </div>
              );
            })}
          </div>

          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/40">
            ↑
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 2: Role Morph & Name Reveal
// ==========================================
const Scene2Identity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const roles = [
    { label: "I'm a Software Engineer.", start: 0, end: 38 },
    { label: 'Full-Stack Developer.', start: 38, end: 76 },
    { label: 'AI Forward Deployed Engineer.', start: 76, end: 115 },
  ];

  const nameEnter = spring({
    frame: frame - 115,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center">
      {roles.map((r, idx) => {
        const active = frame >= r.start && frame < r.end;
        if (!active) return null;
        const localFrame = frame - r.start;
        const pop = spring({ frame: localFrame, fps, config: { damping: 12 } });
        const blur = interpolate(localFrame, [0, 8], [12, 0], { extrapolateRight: 'clamp' });

        return (
          <h2
            key={idx}
            style={{
              transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])})`,
              filter: `blur(${blur}px)`,
            }}
            className="text-7xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent"
          >
            {r.label}
          </h2>
        );
      })}

      {frame >= 115 && (
        <div
          style={{
            transform: `translateY(${interpolate(nameEnter, [0, 1], [40, 0])}px) scale(${interpolate(
              nameEnter,
              [0, 1],
              [0.9, 1]
            )})`,
            opacity: nameEnter,
          }}
          className="flex flex-col items-center"
        >
          <div className="text-cyan-400 text-xl tracking-[0.35em] uppercase mb-4 font-semibold">
            Meet The Builder
          </div>
          <h1 className="text-8xl font-extrabold text-white tracking-tight flex items-center gap-5">
            <span className="inline-block w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-300 shadow-[0_0_40px_rgba(56,189,248,0.7)]" />
            Pear Thanchanok
          </h1>
          <p className="mt-5 text-2xl text-slate-300 font-light">
            Every great thing starts with an idea.
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 3: Glass IDE + Portfolio Preview
// ==========================================
const Scene3IDE: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelSpring = spring({ frame, fps, config: { damping: 15 } });
  const rotateX = interpolate(panelSpring, [0, 1], [18, 0]);
  const scale = interpolate(panelSpring, [0, 1], [0.85, 1]);

  const codeLines = [
    `import { Engineer, AIWorkflow } from '@pear/core';`,
    `import { Vue, Nuxt, React, Next, TypeScript } from 'tech-stack';`,
    ``,
    `export const PearThanchanok = () => {`,
    `  const role = "AI Forward Deployed Engineer";`,
    `  const philosophy = "Every great thing starts with an idea.";`,
    ``,
    `  return (`,
    `    <DigitalExperience`,
    `      architect="Pear Thanchanok"`,
    `      stack={[Vue, Nuxt, React, Next, TypeScript, "TailwindCSS"]}`,
    `      state={["Redux-Saga", "React Query", "Docker"]}`,
    `      aiPowered={true}`,
    `    />`,
    `  );`,
    `};`,
  ];

  return (
    <AbsoluteFill className="flex items-center justify-center p-14" style={{ perspective: '1400px' }}>
      <div
        style={{
          transform: `rotateX(${rotateX}deg) scale(${scale})`,
        }}
        className="w-[1550px] h-[820px] rounded-3xl bg-slate-900/75 backdrop-blur-2xl border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >
        {/* Top bar */}
        <div className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500/80" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400/80" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/80" />
            <span className="ml-4 text-sm text-white/60 font-mono">
              src/architect/PearThanchanok.tsx
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-1 rounded-full bg-white/10 text-xs text-white/80">
              ⚡ AI-Augmented Workflow
            </span>
            <span className="px-4 py-1 rounded-full bg-blue-500 text-xs text-white font-semibold">
              Deploy Ready
            </span>
          </div>
        </div>

        {/* Content: Left Code / Right Live Portfolio Preview */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          <div className="col-span-6 p-8 font-mono text-base leading-relaxed border-r border-white/10 flex flex-col justify-center">
            {codeLines.map((line, i) => {
              const lineOpacity = interpolate(frame - i * 3, [0, 8], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div key={i} style={{ opacity: lineOpacity }} className="flex">
                  <span className="w-8 text-slate-600 select-none">{i + 1}</span>
                  <span className="text-cyan-200">{line}</span>
                </div>
              );
            })}
          </div>

          {/* Right Preview: home-portfolio.jpg */}
          <div className="col-span-6 p-6 bg-slate-950/60 flex flex-col justify-center items-center relative">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl relative">
              <Img
                src={staticFile('home-portfolio.jpg')}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 4: วงเล็บปีกกา { } กางออก + สไลด์ผลงาน
// ==========================================
const Scene4BracketsShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalDuration = 175;

  // จังหวะกางวงเล็บ { }
  const bracketSpread = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // เลื่อนสายพานรูปภาพจากขวาไปซ้าย
  const trackX = interpolate(frame, [0, totalDuration - 45], [550, -650], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ช่วงท้ายฉาก (45 เฟรมสุดท้าย): ซูมขยายการ์ดใบกลางขึ้นมาเต็มจอ
  const zoomToFull = spring({
    frame: frame - (totalDuration - 45),
    fps,
    config: { damping: 16, stiffness: 80 },
  });

  const containerScale = interpolate(zoomToFull, [0, 1], [1, 1.45]);
  const bracketOpacity = interpolate(frame, [totalDuration - 50, totalDuration - 35], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leftBracketX = interpolate(bracketSpread, [0, 1], [-120, -490]);
  const rightBracketX = interpolate(bracketSpread, [0, 1], [120, 490]);

  const projects = [
    {
      title: 'Portfolio & Identity',
      subtitle: 'Thought • System • Experience',
      img: 'home-portfolio.jpg',
      type: 'wide' as const,
    },
    {
      title: 'Moonlit Choices',
      subtitle: 'Interactive Romantic Fantasy Web',
      img: 'home-moonlit.jpg',
      type: 'wide' as const,
    },
    {
      title: 'Little House Workspace',
      subtitle: '3D Interactive Cat Task & Repo Space',
      img: 'home-work.jpg',
      type: 'wide' as const,
    },
    {
      title: 'Life Quest Companion',
      subtitle: 'Smart Daily Finance & Planning AI',
      img: 'home-life-mobile.png',
      imgSecond: 'life-finance.png',
      type: 'mobile-pair' as const,
    },
  ];

  return (
    <AbsoluteFill className="overflow-hidden flex items-center justify-center">
      {/* พื้นหลังแบ่งครึ่งซ้าย-ขวา */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 h-full bg-[#090d16]" />
        <div className="w-1/2 h-full bg-[#161f30]" />
      </div>

      {/* เส้นแนวนอนวิ่งผ่านหลังการ์ด */}
      <div className="absolute w-full h-[2px] bg-white/20" />

      {/* สายพานการ์ดผลงาน */}
      <div
        style={{
          transform: `translateX(${trackX}px) scale(${containerScale})`,
        }}
        className="flex items-center gap-12 z-10"
      >
        {projects.map((proj, index) => (
          <div
            key={index}
            className="w-[820px] h-[480px] rounded-2xl bg-slate-900 border border-white/25 shadow-[0_25px_70px_rgba(0,0,0,0.65)] overflow-hidden relative flex-shrink-0"
          >
            {proj.type === 'wide' ? (
              <Img
                src={staticFile(proj.img)}
                className="w-full h-full object-cover"
              />
            ) : (
              // แสดงภาพ Mobile 2 หน้าคู่กันสำหรับโปรเจกต์ Life Quest
              <div className="w-full h-full bg-[#071a12] flex items-center justify-center gap-8 p-6">
                <Img
                  src={staticFile(proj.img)}
                  className="h-full w-auto rounded-xl border border-emerald-500/30 shadow-xl object-contain"
                />
                {proj.imgSecond && (
                  <Img
                    src={staticFile(proj.imgSecond)}
                    className="h-full w-auto rounded-xl border border-emerald-500/30 shadow-xl object-contain"
                  />
                )}
              </div>
            )}

            {/* ป้ายชื่อโปรเจกต์มุมล่าง */}
            <div className="absolute bottom-4 left-4 px-5 py-2.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/15">
              <div className="text-white font-bold text-lg">{proj.title}</div>
              <div className="text-cyan-300 text-xs">{proj.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* วงเล็บปีกกา { } ขนาดใหญ่ตรงกลางจอ */}
      <div
        style={{
          opacity: bracketOpacity,
          transform: `translateX(${leftBracketX}px)`,
        }}
        className="absolute z-20 text-[340px] font-extralight text-white select-none leading-none"
      >
        {'{'}
      </div>
      <div
        style={{
          opacity: bracketOpacity,
          transform: `translateX(${rightBracketX}px)`,
        }}
        className="absolute z-20 text-[340px] font-extralight text-white select-none leading-none"
      >
        {'}'}
      </div>
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 5: Grid Lines + "More about what's next"
// ==========================================
const Scene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 14 } });
  const secondPhase = frame >= 60;
  const finalSpring = spring({ frame: frame - 60, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill className="flex items-center justify-center">
      {/* เส้น Grid ตัดกัน */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-[300px] border-y border-white/20" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-full w-[900px] border-x border-white/20" />
      </div>

      {!secondPhase ? (
        <div
          style={{ transform: `scale(${pop})`, opacity: pop }}
          className="w-[900px] h-[300px] bg-white/[0.06] backdrop-blur-xl flex items-center justify-center"
        >
          <h2 className="text-6xl font-medium text-white tracking-tight">
            More about <span className="text-cyan-400">what&apos;s next</span>
          </h2>
        </div>
      ) : (
        <div
          style={{ transform: `scale(${finalSpring})`, opacity: finalSpring }}
          className="flex flex-col items-center justify-center text-center z-10 px-12"
        >
          <p className="text-2xl text-cyan-300 tracking-widest uppercase mb-3">
            Available for impactful projects
          </p>
          <h1 className="text-7xl font-extrabold text-white mb-4">
            Let&apos;s build together — Pear Thanchanok
          </h1>
          <p className="text-2xl text-white/70 font-light">
            Software Engineer • Full-Stack Developer • AI Forward Deployed Engineer
          </p>
          <div className="mt-8 px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-lg">
            linkedin.com/in/thanchanok-thiju-128a66232
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// MAIN COMPOSITION (รวมทุกฉากเข้าด้วยกัน)
// ==========================================
export const PearTeaser: React.FC = () => {
  return (
    <AbsoluteFill className="font-sans">
      <AuroraBackground />

      {/* Scene 1: 0:00 - 0:04 (120 เฟรม) */}
      <Sequence from={0} durationInFrames={120}>
        <Scene1Prompt />
      </Sequence>

      {/* Scene 2: 0:04 - 0:09.5 (165 เฟรม) */}
      <Sequence from={120} durationInFrames={165}>
        <Scene2Identity />
      </Sequence>

      {/* Scene 3: 0:09.5 - 0:14.5 (150 เฟรม) */}
      <Sequence from={285} durationInFrames={150}>
        <Scene3IDE />
      </Sequence>

      {/* Scene 4: 0:14.5 - 0:20.33 (175 เฟรม) */}
      <Sequence from={435} durationInFrames={175}>
        <Scene4BracketsShowcase />
      </Sequence>

      {/* Scene 5: 0:20.33 - 0:24 (110 เฟรม) */}
      <Sequence from={610} durationInFrames={110}>
        <Scene5Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
