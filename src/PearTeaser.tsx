import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  Easing,
  random,
  Html5Audio,
} from "remotion";
import { ding, mouseClick, uiSwitch, whip, whoosh } from "@remotion/sfx";

// ==========================================
// Timing helpers
// ==========================================
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const EASE = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
const GLIDE = Easing.bezier(0.33, 0, 0.1, 1);

const progress = (frame: number, start: number, end: number, easing = EASE) =>
  interpolate(frame, [start, end], [0, 1], { ...CLAMP, easing });
const mix = (p: number, from: number, to: number) => from + (to - from) * p;

const NAME = "Pear Thanchanok";

// ==========================================
// พื้นหลังแต่ละโทน (เหมือนคลิป lovio ที่เปลี่ยนพื้นตามฉาก)
// ==========================================
// frameOffset: ให้ฉากที่อยู่ใน Sequence ใช้เวลาเดียวกับ aurora ของฉากก่อนหน้า (ขอบ transition ไม่เห็นรอยต่อ)
const AuroraBackground: React.FC<{ frameOffset?: number }> = ({
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame() + frameOffset;
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

// ริบบิ้นม่วง-น้ำเงินเบลอ ๆ หลังคำเด่น (KEYWORD)
const PurpleWaves: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const ribbons = [
    {
      top: 600,
      rot: -14,
      speed: 0.7,
      amp: 50,
      from: "rgba(124,58,237,0.95)",
      to: "rgba(59,130,246,0.9)",
    },
    {
      top: 160,
      rot: 20,
      speed: 0.5,
      amp: 40,
      from: "rgba(37,99,235,0.85)",
      to: "rgba(192,38,211,0.7)",
    },
    {
      top: 900,
      rot: -4,
      speed: 0.9,
      amp: 30,
      from: "rgba(168,85,247,0.7)",
      to: "rgba(79,70,229,0.8)",
    },
  ];
  return (
    <AbsoluteFill
      className="overflow-hidden"
      style={{ background: "#05040f", opacity }}
    >
      {ribbons.map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: -300,
            top: r.top - 150,
            width: 2520,
            height: 300,
            background: `linear-gradient(90deg, transparent 0%, ${r.from} 30%, ${r.to} 70%, transparent 100%)`,
            filter: "blur(70px)",
            transform: `translateY(${Math.sin(t * r.speed + i) * r.amp}px) rotate(${r.rot + Math.sin(t * r.speed * 0.8) * 4}deg)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// แสงฟ้าลอยขึ้นจากขอบล่าง (ฉาก "ready to launch")
const BlueGlowBackground: React.FC<{ opacity?: number }> = ({
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 25) * 0.04;
  return (
    <AbsoluteFill
      className="overflow-hidden"
      style={{ background: "#040816", opacity }}
    >
      <div
        className="absolute rounded-full"
        style={{
          left: "50%",
          bottom: -460,
          width: 2000,
          height: 900,
          transform: `translateX(-50%) scale(${breathe})`,
          background:
            "radial-gradient(closest-side, rgba(110,130,255,0.95), rgba(59,80,230,0.55) 45%, rgba(30,40,140,0) 100%)",
          filter: "blur(30px)",
        }}
      />
    </AbsoluteFill>
  );
};

// ไล่เฉดสว่างตอนจบ (ฉาก "What will you create today")
const BrightBackground: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #f1edff 0%, #b8c4ff 14%, #6d86f5 32%, #2a3fbf 55%, #0d1550 78%, #060a1f 100%)",
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          left: "50%",
          top: -380,
          width: 1800,
          height: 700,
          transform: `translateX(-50%) translateX(${Math.sin(frame / 30) * 80}px)`,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0))",
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};

// ==========================================
// ชิ้นส่วนที่ใช้ซ้ำ
// ==========================================
// โลโก้: ลูกแพร์ (Pear) + prompt ">_" ของ terminal — ใช้ทั้งหน้าชื่อ และเป็นรูปทรง transition
// พิกัดใน viewBox 0–100 — clip-path ใช้กึ่งกลางกล่อง (50, 50) เดียวกับ <LogoMark> จึงซ้อนกันพอดี
const PEAR_BODY =
  "M50 16 C59 16 63 25 63 34 C63 42 69 46 75 53 C84 63 85 80 75 89 C67 96 57 98 50 98 C43 98 33 96 25 89 C15 80 16 63 25 53 C31 46 37 42 37 34 C37 25 41 16 50 16 Z";
const PEAR_CENTER_Y = 50;

// แปลง path ลูกแพร์เป็นพิกัดบนจอ (สำหรับ clip-path: path())
const pearPathAt = (cx: number, cy: number, size: number) => {
  const tokens = PEAR_BODY.match(/[MCZ]|-?[\d.]+/g) ?? [];
  let isX = true;
  return tokens
    .map((t) => {
      if (/[MCZ]/.test(t)) {
        isX = true;
        return t;
      }
      const n = Number(t);
      const v = isX
        ? cx + ((n - 50) / 100) * size
        : cy + ((n - PEAR_CENTER_Y) / 100) * size;
      isX = !isX;
      return v.toFixed(1);
    })
    .join(" ");
};

const LogoMark: React.FC<{ size: number; style?: React.CSSProperties }> = ({
  size,
  style,
}) => {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        flexShrink: 0,
        overflow: "visible",
        filter: `drop-shadow(0 0 ${size * 0.22}px rgba(56,189,248,0.6))`,
        ...style,
      }}
    >
      <defs>
        <linearGradient id={`pear-fill-${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* ก้าน + ใบ */}
      <path
        d="M50 18 C50 12 51 8 54 5"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path d="M55 10 C60 2 71 2 75 6 C70 13 61 15 55 10 Z" fill="#5eead4" />
      <path d={PEAR_BODY} fill={`url(#pear-fill-${id})`} />
      {/* แสงสะท้อน */}
      <ellipse
        cx={36}
        cy={66}
        rx={7}
        ry={13}
        fill="white"
        opacity={0.28}
        transform="rotate(18 36 66)"
      />
      {/* prompt >_ */}
      <path
        d="M40 61 L49 69.5 L40 78"
        fill="none"
        stroke="white"
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54 78.5 H64"
        stroke="white"
        strokeWidth={5.5}
        strokeLinecap="round"
      />
    </svg>
  );
};

// ตัวอักษรกระจายตัวแล้วประกอบกลับ (เหมือน "ready to launch" ในคลิปตัวอย่าง)
const ScrambleText: React.FC<{
  text: string;
  start: number;
  seed: string;
  exitStart?: number;
  colors?: string[];
  style?: React.CSSProperties;
  maxDelay?: number; // ตัวอักษรเริ่มเข้ามาห่างกันสูงสุดกี่เฟรม
}> = ({ text, start, seed, exitStart, colors, style, maxDelay = 12 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = [...text];

  return (
    <span style={{ display: "inline-flex", whiteSpace: "pre", ...style }}>
      {chars.map((ch, i) => {
        const dx = (random(`${seed}-x-${i}`) - 0.5) * 220;
        const dy = (random(`${seed}-y-${i}`) - 0.5) * 120;
        const delay = random(`${seed}-d-${i}`) * maxDelay;
        const enter = spring({
          frame: frame - start - delay,
          fps,
          config: { damping: 16, stiffness: 110 },
        });
        const exit =
          exitStart === undefined
            ? 0
            : progress(
                frame,
                exitStart + delay * 0.6,
                exitStart + delay * 0.6 + 14,
                EASE_IN,
              );
        const off = 1 - enter + exit;
        const color = colors
          ? interpolateColors(
              chars.length > 1 ? i / (chars.length - 1) : 0,
              colors.map((_, k) => k / (colors.length - 1)),
              colors,
            )
          : undefined;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translate(${dx * off}px, ${dy * off}px)`,
              opacity: Math.min(1, enter) * (1 - exit),
              filter: `blur(${Math.max(0, off) * 12}px)`,
              color,
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </span>
  );
};

// โลโก้ + ชื่อที่เลื่อนออกมาจากหลังโลโก้ (เหมือน "lovio" wordmark)
const NameLockup: React.FC<{
  reveal: number;
  markSize: number;
  markStyle?: React.CSSProperties;
  exitStart?: number;
}> = ({ reveal, markSize, markStyle, exitStart }) => (
  <div className="flex items-center">
    <LogoMark size={markSize} style={markStyle} />
    <div
      style={{
        maxWidth: reveal * 1200,
        paddingLeft: reveal * 34,
        overflow: reveal >= 0.999 ? "visible" : "hidden",
      }}
    >
      <div
        className="text-white font-extrabold tracking-tight"
        style={{
          fontSize: 112,
          lineHeight: 1.15,
          whiteSpace: "pre",
          transform: `translateX(${(1 - reveal) * -280}px)`,
          opacity: interpolate(reveal, [0, 0.4], [0, 1], CLAMP),
        }}
      >
        <ScrambleText
          text={NAME}
          start={-1000}
          seed="name"
          exitStart={exitStart}
        />
      </div>
    </div>
  </div>
);

const GlobeIcon: React.FC = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
  </svg>
);

// ==========================================
// SCENE 0: console.log("hello world") ใน glass terminal
// ตัวอักษรค่อย ๆ ลอยเข้ามาทีละตัว + caret ไหลต่อเนื่อง (ไม่กระโดดทีละช่อง)
// ==========================================
const PUNCT = "rgba(226,232,240,0.55)";
const HELLO_TOKENS = [
  { t: "console", c: "#7dd3fc" },
  { t: ".", c: PUNCT },
  { t: "log", c: "#c4b5fd" },
  { t: "(", c: PUNCT },
  { t: '"hello world"', c: "#86efac" },
  { t: ")", c: PUNCT },
  { t: ";", c: PUNCT },
];
const HELLO_CHARS: { ch: string; c: string }[] = HELLO_TOKENS.reduce<
  { ch: string; c: string }[]
>((acc, tok) => acc.concat([...tok.t].map((ch) => ({ ch, c: tok.c }))), []);
const HELLO_FONT = 48;
const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// จังหวะฉาก hello:
// หน้าต่างลอยขึ้น → พิมพ์โค้ด → เมาส์กด Run
// → คลื่นกระแทก + loading → ✓ Done → หน้าต่างจางหาย + โลโก้ลูกแพร์เด้ง → ลูกแพร์ขยายเปิดฉากถัดไป
const HELLO_TYPE = { start: 16, end: 70 };
const HELLO_CURSOR = { enter: 70, arrive: 88 };
const HELLO_CLICK = 90;
const HELLO_LOAD = { open: 94, start: 98, end: 128 };
const HELLO_EXIT = 140;
// ขนาดหน้าต่าง terminal (จัดกลางจอ) — ใช้คำนวณตำแหน่งปุ่ม Run บนจอ
const HELLO_WINDOW_W = 1000;
const HELLO_HEADER_H = 48; // h-12
const HELLO_CODE_ROW_H = 72 + HELLO_FONT * 1.3; // py-9 + line-height
const HELLO_PANEL_H = 104; // แถบ Running… + bar ตอนเปิดเต็ม
const HELLO_WINDOW_H = 2 + HELLO_HEADER_H + HELLO_CODE_ROW_H + HELLO_PANEL_H;
// กลางปุ่ม Run ตอนกด (ก่อนแถบ loading เปิด หน้าต่างยังเตี้ยกว่า)
const HELLO_RUN_BTN = {
  x: 960 + HELLO_WINDOW_W / 2 - 64,
  y: 540 - (HELLO_WINDOW_H - HELLO_PANEL_H) / 2 + HELLO_HEADER_H / 2,
};
// หน้าต่างจางหาย → โลโก้ลูกแพร์เด้งกลางจอ → รูปลูกแพร์ขยายเต็มจอ = เปิดฉาก prompt
const LOGO_POP_AT = HELLO_EXIT + 6;
const LOGO_POP_SIZE = 150;
const LAUNCH_AT = LOGO_POP_AT + 10;
const LAUNCH_GROW = 18;
const launchPearSize = (t: number) =>
  interpolate(t, [0, LAUNCH_GROW], [LOGO_POP_SIZE, 9000], {
    ...CLAMP,
    easing: Easing.bezier(0.55, 0, 0.85, 0.35),
  });

const MouseCursor: React.FC<{ press: number; style?: React.CSSProperties }> = ({
  press,
  style,
}) => (
  <svg
    width={44}
    height={44}
    viewBox="0 0 24 24"
    style={{
      transformOrigin: "3px 2px",
      transform: `scale(${1 - press * 0.15})`,
      filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
      ...style,
    }}
  >
    <path
      d="M3 2 L3 19.5 L7.6 15.4 L10.6 22 L13.6 20.7 L10.7 14.2 L17 14.2 Z"
      fill="white"
      stroke="#0b1020"
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
  </svg>
);

const HELLO_SPARKS = Array.from({ length: 16 }, (_, i) => ({
  angle: (i / 16) * Math.PI * 2 + random(`spark-a-${i}`) * 0.3,
  dist: 110 + random(`spark-d-${i}`) * 120,
  size: 4 + random(`spark-s-${i}`) * 5,
}));

const HelloScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // หน้าต่างลอยขึ้นนิด ๆ + จางจากเบลอ
  const windowIn = spring({
    frame: frame - 2,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  // จำนวนตัวอักษรที่พิมพ์แล้วแบบทศนิยม — ใช้ทั้งการ fade ของตัวอักษรและตำแหน่ง caret
  const typed = interpolate(
    frame,
    [HELLO_TYPE.start, HELLO_TYPE.end],
    [0, HELLO_CHARS.length],
    { ...CLAMP, easing: Easing.bezier(0.37, 0, 0.63, 1) },
  );
  const glow = progress(frame, HELLO_TYPE.end - 2, HELLO_TYPE.end + 14, EASE);
  const out = progress(frame, HELLO_EXIT, HELLO_EXIT + 20, EASE);
  const logoPop = spring({
    frame: frame - LOGO_POP_AT,
    fps,
    config: { damping: 11, stiffness: 150 },
  });
  const logoSize =
    frame < LAUNCH_AT ? LOGO_POP_SIZE : launchPearSize(frame - LAUNCH_AT);
  const caretOpacity =
    (frame < HELLO_TYPE.end
      ? frame < HELLO_TYPE.start
        ? 0.6 + 0.4 * Math.cos(frame / 2.5)
        : 1
      : 0.55 + 0.45 * Math.cos((frame - HELLO_TYPE.end) / 5)) *
    (1 - progress(frame, HELLO_CLICK, HELLO_CLICK + 8));

  // เมาส์: เลื่อนเข้าจากมุมขวาล่าง → กด → จางหาย
  const cursorMove = progress(
    frame,
    HELLO_CURSOR.enter,
    HELLO_CURSOR.arrive,
    Easing.bezier(0.25, 0.1, 0.25, 1),
  );
  const cursorOpacity =
    progress(frame, HELLO_CURSOR.enter, HELLO_CURSOR.enter + 6) *
    (1 - progress(frame, HELLO_CLICK + 14, HELLO_CLICK + 24));
  const press =
    progress(frame, HELLO_CLICK, HELLO_CLICK + 3) *
    (1 - progress(frame, HELLO_CLICK + 3, HELLO_CLICK + 8));
  const ripple = progress(frame, HELLO_CLICK, HELLO_CLICK + 18, EASE_OUT);
  const ran = progress(frame, HELLO_CLICK, HELLO_CLICK + 6);
  // คลื่นกระแทก + ประกาย + จอสั่นนิด ๆ ตอนกด
  const shock = progress(frame, HELLO_CLICK, HELLO_CLICK + 26, EASE_OUT);
  const sparks = progress(frame, HELLO_CLICK, HELLO_CLICK + 20, EASE_OUT);
  const shake =
    frame >= HELLO_CLICK
      ? 5 *
        (1 - progress(frame, HELLO_CLICK, HELLO_CLICK + 9)) *
        Math.sin(frame * 2.7)
      : 0;

  // แถบ loading ใต้บรรทัดโค้ด
  const panel = progress(frame, HELLO_LOAD.open, HELLO_LOAD.open + 12, EASE);
  const load = progress(
    frame,
    HELLO_LOAD.start,
    HELLO_LOAD.end,
    Easing.bezier(0.45, 0, 0.2, 1),
  );
  const done = progress(frame, HELLO_LOAD.end, HELLO_LOAD.end + 6);
  const shimmer = ((frame - HELLO_LOAD.start) * 3) % 140;

  return (
    <AbsoluteFill>
      <AuroraBackground />

      {/* หน้าต่าง (+สั่นนิด ๆ ตอนกด Run) */}
      <AbsoluteFill
        style={{
          transform: `translate(${shake}px, ${shake * 0.6}px) scale(${1 - out * 0.08})`,
          opacity: 1 - out,
          filter: out > 0 ? `blur(${out * 10}px)` : undefined,
        }}
      >
        <AbsoluteFill className="flex items-center justify-center">
          <div
            className="relative"
            style={{
              width: HELLO_WINDOW_W,
              transform: `translateY(${(1 - windowIn) * 24}px) scale(${mix(windowIn, 0.94, 1)})`,
              filter: `blur(${(1 - Math.min(1, windowIn)) * 8}px)`,
              opacity: Math.min(1, windowIn),
            }}
          >
            <div className="relative rounded-3xl border border-white/15 shadow-[0_30px_100px_rgba(0,0,0,0.55)] overflow-hidden bg-[linear-gradient(160deg,rgba(30,41,82,0.82),rgba(12,18,40,0.88))]">
              <div className="h-12 px-5 flex items-center gap-2.5 border-b border-white/10 bg-white/[0.03]">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="ml-3 font-mono text-[17px] text-white/50">
                  hello.ts
                </span>
                {/* ปุ่ม Run */}
                <div
                  className="ml-auto relative h-8 px-4 rounded-full flex items-center gap-2 text-[16px] font-semibold border"
                  style={{
                    transform: `scale(${1 - press * 0.08})`,
                    background: `rgba(52,211,153,${mix(ran, 0.16, 0.35)})`,
                    borderColor: `rgba(110,231,183,${mix(ran, 0.35, 0.7)})`,
                    color: "#d1fae5",
                    boxShadow: `0 0 ${ran * 24}px rgba(52,211,153,0.55)`,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M2 1 L11 6 L2 11 Z" fill="currentColor" />
                  </svg>
                  Run
                  <span
                    className="absolute inset-0 rounded-full border-2 border-emerald-300"
                    style={{
                      transform: `scale(${mix(ripple, 1, 1.9)})`,
                      opacity: ripple > 0 ? (1 - ripple) * 0.8 : 0,
                    }}
                  />
                </div>
              </div>
              <div
                className="flex items-center font-mono px-12 py-9"
                style={{ fontSize: HELLO_FONT, lineHeight: 1.3 }}
              >
                <span className="text-white/20 mr-[1.2ch]">1</span>
                <span
                  className="relative inline-flex"
                  style={{ whiteSpace: "pre" }}
                >
                  {HELLO_CHARS.map(({ ch, c }, i) => {
                    const p = smoothstep(typed - i);
                    const isString = c === "#86efac";
                    return (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          width: "1ch",
                          color: c,
                          opacity: p,
                          filter: `blur(${(1 - p) * 8}px)`,
                          transform: `translateY(${(1 - p) * 14}px)`,
                          textShadow: isString
                            ? `0 0 ${glow * 28}px rgba(134,239,172,${0.7 * glow})`
                            : undefined,
                        }}
                      >
                        {ch === " " ? " " : ch}
                      </span>
                    );
                  })}
                  {/* caret ไหลตาม typed แบบต่อเนื่อง */}
                  <span
                    className="absolute bg-cyan-300 rounded-full"
                    style={{
                      left: `${typed}ch`,
                      top: "12%",
                      width: 5,
                      height: "76%",
                      marginLeft: 4,
                      opacity: caretOpacity,
                      boxShadow: "0 0 16px rgba(103,232,249,0.9)",
                    }}
                  />
                </span>
              </div>

              {/* ผลการรัน: Running… + loading bar */}
              <div
                className="overflow-hidden"
                style={{ maxHeight: panel * 120, opacity: panel }}
              >
                <div className="border-t border-white/10 px-12 pt-5 pb-7 font-mono">
                  <div className="flex items-center justify-between text-[22px]">
                    <span
                      style={{
                        color: interpolateColors(
                          done,
                          [0, 1],
                          ["rgba(226,232,240,0.7)", "#6ee7b7"],
                        ),
                      }}
                    >
                      {done > 0.5
                        ? "✓ Done — hello world"
                        : "› Running hello.ts…"}
                    </span>
                    <span className="text-white/60 tabular-nums">
                      {Math.round(load * 100)}%
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{
                        width: `${load * 100}%`,
                        background: "linear-gradient(90deg, #2563eb, #22d3ee)",
                        boxShadow: "0 0 18px rgba(34,211,238,0.7)",
                      }}
                    >
                      <div
                        className="absolute top-0 h-full w-24"
                        style={{
                          left: shimmer - 40,
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                          opacity: 1 - done,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* เมาส์ (อยู่นอกหน้าต่างเพื่อไม่ให้ถูกตัดขอบ) — ปลายลูกศรชี้กลางปุ่ม Run */}
            <div
              className="absolute"
              style={{
                left: "calc(100% - 72px)",
                top: 20,
                opacity: cursorOpacity,
                transform: `translate(${(1 - cursorMove) * 340}px, ${(1 - cursorMove) * 380}px)`,
              }}
            >
              <MouseCursor press={press} />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* คลื่นกระแทกจากปุ่ม Run + ประกายแตกออก */}
      {frame >= HELLO_CLICK && shock < 1 && (
        <div
          className="absolute rounded-full"
          style={{
            left: HELLO_RUN_BTN.x,
            top: HELLO_RUN_BTN.y,
            width: mix(shock, 40, 2600),
            height: mix(shock, 40, 2600),
            transform: "translate(-50%, -50%)",
            border: `${mix(shock, 4, 1.5)}px solid rgba(110,231,183,${0.7 * (1 - shock)})`,
            boxShadow: `0 0 40px rgba(52,211,153,${0.4 * (1 - shock)}), inset 0 0 40px rgba(52,211,153,${0.25 * (1 - shock)})`,
          }}
        />
      )}
      {frame >= HELLO_CLICK &&
        sparks < 1 &&
        HELLO_SPARKS.map((sp, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: HELLO_RUN_BTN.x + Math.cos(sp.angle) * sp.dist * sparks,
              top: HELLO_RUN_BTN.y + Math.sin(sp.angle) * sp.dist * sparks,
              width: sp.size,
              height: sp.size,
              transform: "translate(-50%, -50%)",
              background: i % 2 ? "#6ee7b7" : "#67e8f9",
              boxShadow: "0 0 12px rgba(103,232,249,0.9)",
              opacity: 1 - sparks,
            }}
          />
        ))}

      {/* โลโก้ลูกแพร์เด้งขึ้น แล้วขยายตาม clip ของฉากถัดไป (ขอบเรืองแสงที่เห็นรอบ ๆ มาจากตัวนี้) */}
      {frame >= LOGO_POP_AT && (
        <div
          className="absolute"
          style={{
            left: 960 - logoSize / 2,
            top: 540 - logoSize / 2,
            transform: `scale(${logoPop}) rotate(${(1 - Math.min(1, logoPop)) * -40}deg)`,
          }}
        >
          <LogoMark size={logoSize} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 1: โลโก้ลูกแพร์ขยายเต็มจอ → "+" → pill → Glass Prompt → ซูมเข้าไปพิมพ์
// ==========================================
const PROMPT_BOX = { w: 1200, h: 232, cy: 610, pad: 26 };
const TYPED = "Every business problem deserves a real solution";
// คำท้ายประโยคที่ถูกดึงออกมาเป็นคำเด่นในฉากถัดไป
const KEYWORD = "solution";
// ตำแหน่งกลางคำ KEYWORD บนจอ ตอนพิมพ์จบ (หลังซูมรอบแรก) — จุดที่กล้องพุ่งเข้าไป
const KEYWORD_FOCUS = { x: 1503, y: 553 };
// พิมพ์จบ → แพนกล้องไปทางขวาให้คำอยู่กลางจอ → ซูมเข้าหาคำ
const KEYWORD_PAN = { start: 142, end: 170 };
const KEYWORD_PUSH = { start: 166, end: 188 };
const STACKS = [
  "React / Next.js",
  "Vue / Nuxt.js",
  "TypeScript",
  "Tailwind CSS",
  "AI Workflow",
];

const PromptScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // เปิดฉากด้วยรูปทรงโลโก้ลูกแพร์ที่ขยายจากกลางจอ
  const clip =
    frame >= LAUNCH_GROW
      ? undefined
      : `path('${pearPathAt(960, 540, launchPearSize(frame))}')`;

  // ประกอบกล่อง: + → pill "Public Profile" → กล่องเต็ม
  const plusIn = spring({
    frame: frame - 16,
    fps,
    config: { damping: 13, stiffness: 140 },
  });
  const pillP = progress(frame, 32, 52, EASE_OUT);
  const boxP = progress(frame, 52, 80, EASE);
  const pillW = pillP * 236;
  const rowW = 64 + (pillW > 0.5 ? 14 + pillW : 0);
  const boxW = mix(boxP, rowW, PROMPT_BOX.w);
  const boxH = mix(boxP, 64, PROMPT_BOX.h);
  const pad = mix(boxP, 0, PROMPT_BOX.pad);

  const titleIn = progress(frame, 66, 86, EASE_OUT);
  const placeholder = progress(frame, 74, 86) * (1 - progress(frame, 96, 100));

  // ซูมเข้าไปในกล่องตอนพิมพ์
  const zoom = progress(frame, 96, 140, EASE);
  const charsShown = Math.floor(
    interpolate(frame, [100, 142], [0, TYPED.length], CLAMP),
  );
  // พิมพ์จบ → แพนไปทางขวาจนคำ KEYWORD อยู่กลางจอ → กล้องพุ่งเข้าหาคำ (เร่งขึ้นเรื่อย ๆ)
  const pan = progress(frame, KEYWORD_PAN.start, KEYWORD_PAN.end, EASE);
  const push = progress(
    frame,
    KEYWORD_PUSH.start,
    KEYWORD_PUSH.end,
    Easing.bezier(0.4, 0, 0.85, 0.45),
  );
  const textLeft = 960 - PROMPT_BOX.w / 2 + PROMPT_BOX.pad + 10;
  const textY = PROMPT_BOX.cy - PROMPT_BOX.h / 2 + PROMPT_BOX.pad + 30;

  return (
    <AbsoluteFill style={{ clipPath: clip }}>
      <AuroraBackground frameOffset={AT.prompt} />
      {/* สีโลโก้ในรูปลูกแพร์ค่อย ๆ จางออก เผยฉากข้างใน */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(160deg, #a5f3fc 0%, #38bdf8 45%, #2563eb 100%)",
          opacity: 1 - progress(frame, 2, 16, EASE),
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(165,205,255,0.75) 0%, rgba(59,130,246,0.35) 30%, rgba(30,58,138,0) 65%)",
          opacity: 1 - progress(frame, 24, 70),
        }}
      />

      <AbsoluteFill
        style={{
          transformOrigin: `${KEYWORD_FOCUS.x}px ${KEYWORD_FOCUS.y}px`,
          transform: `translate(${pan * (960 - KEYWORD_FOCUS.x)}px, ${pan * (540 - KEYWORD_FOCUS.y)}px) scale(${mix(push, 1, 5.5)})`,
          filter: push > 0 ? `blur(${push * push * 6}px)` : undefined,
        }}
      >
        <AbsoluteFill
          style={{
            transformOrigin: `${textLeft}px ${textY}px`,
            transform: `translateX(${mix(zoom, 0, -180)}px) scale(${mix(zoom, 1, 1.95)})`,
          }}
        >
          {/* หัวข้อเหนือกล่อง */}
          <div
            className="absolute left-0 right-0 flex flex-col items-center"
            style={{
              top: PROMPT_BOX.cy - PROMPT_BOX.h / 2 - 170,
              opacity: titleIn * (1 - zoom),
              filter: `blur(${(1 - titleIn) * 12}px)`,
              transform: `translateY(${(1 - titleIn) * 20}px)`,
            }}
          >
            <div
              className="flex items-center gap-4 text-white font-bold tracking-tight"
              style={{ fontSize: 60 }}
            >
              Looking for a builder?
              <LogoMark size={46} />
            </div>
            <div className="mt-2 text-white/60" style={{ fontSize: 26 }}>
              From business needs to deployed AI — end to end
            </div>
          </div>

          {/* กล่อง prompt ที่ขยายจากปุ่ม + */}
          <div
            className="absolute rounded-[32px]"
            style={{
              left: 960 - boxW / 2,
              top: PROMPT_BOX.cy - boxH / 2,
              width: boxW,
              height: boxH,
              background: `rgba(255,255,255,${0.06 * boxP})`,
              border: `1px solid rgba(255,255,255,${0.15 * boxP})`,
              backdropFilter: boxP > 0 ? "blur(24px)" : undefined,
              boxShadow: `0 20px 80px rgba(0,100,255,${0.2 * boxP})`,
            }}
          >
            <div
              className="absolute flex items-center text-white font-light tracking-wide"
              style={{ left: pad + 10, top: pad + 6, height: 48, fontSize: 34 }}
            >
              {charsShown > 0 ? (
                <span>{TYPED.slice(0, charsShown)}</span>
              ) : (
                <span
                  className="text-white/45"
                  style={{ opacity: placeholder }}
                >
                  Ask Pear to build something…
                </span>
              )}
              {frame >= 98 && frame < KEYWORD_PAN.start && (
                <span
                  style={{ opacity: Math.sin(frame / 4) > 0 ? 1 : 0 }}
                  className="inline-block w-[3px] h-10 bg-cyan-300 ml-1"
                />
              )}
            </div>

            {/* แถวล่าง: + / Public Profile / stack badges */}
            <div
              className="absolute flex items-center"
              style={{ left: pad, bottom: pad, height: 64 }}
            >
              <div
                className="w-16 h-16 rounded-full bg-white/10 border border-white/25 backdrop-blur-xl flex items-center justify-center text-white"
                style={{
                  transform: `scale(${plusIn}) rotate(${(1 - plusIn) * 90}deg)`,
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M12 4v16M4 12h16" />
                </svg>
              </div>
              <div
                className="h-16 rounded-full bg-white/10 border border-white/25 backdrop-blur-xl text-white/90 overflow-hidden flex items-center"
                style={{
                  width: pillW,
                  marginLeft: pillW > 0.5 ? 14 : 0,
                  opacity: pillP > 0 ? 1 : 0,
                }}
              >
                <div
                  className="flex items-center gap-3 px-5 whitespace-nowrap"
                  style={{ fontSize: 24 }}
                >
                  <GlobeIcon /> Public Profile
                </div>
              </div>
              <div className="flex items-center gap-2.5 ml-3.5">
                {STACKS.map((stack, i) => {
                  const badge = spring({
                    frame: frame - (80 + i * 4),
                    fps,
                    config: { damping: 12 },
                  });
                  return (
                    <div
                      key={stack}
                      style={{
                        transform: `scale(${badge})`,
                        opacity: Math.min(1, badge),
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-200 text-[15px] font-medium whitespace-nowrap"
                    >
                      {stack}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="absolute w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/40"
              style={{
                right: pad,
                bottom: pad + 4,
                transform: `scale(${progress(frame, 70, 84, EASE_OUT)})`,
              }}
            >
              ↑
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 2: คำเด่น (KEYWORD) → กลายเป็นโลโก้ → ชื่อเลื่อนออกมา
// ==========================================
// จังหวะฉากคำเด่น → โลโก้ → ชื่อ (เฟรมภายในฉาก)
const NAME_T = {
  wordIn: 20, // คำเด่น zoom out ลงขนาดปกติ
  wordOut: [52, 70] as const,
  mark: 60, // โลโก้หมุนเข้า
  shrink: [80, 94] as const,
  reveal: [88, 124] as const, // ชื่อเลื่อนออกจากหลังโลโก้
  caption: [112, 128, 152, 162] as const,
  exit: 158, // ตัวอักษรชื่อกระจายออก
  end: 178,
};

const IdeaNameScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgIn = progress(frame, 0, 6, EASE_OUT);
  // ต่อจากกล้องที่พุ่งเข้าไป: คำเริ่มใหญ่ แล้ว zoom out เร็ว ๆ ลงขนาดปกติ
  const wordIn = progress(frame, 0, NAME_T.wordIn, EASE_OUT);
  const wordFade = progress(frame, 0, 4);
  const wordOut = progress(
    frame,
    NAME_T.wordOut[0],
    NAME_T.wordOut[1],
    EASE_IN,
  );

  const markP = spring({
    frame: frame - NAME_T.mark,
    fps,
    config: { damping: 11, stiffness: 90 },
  });
  const markShrink = progress(frame, NAME_T.shrink[0], NAME_T.shrink[1], EASE);
  const reveal = progress(frame, NAME_T.reveal[0], NAME_T.reveal[1], GLIDE);
  const captionIn =
    progress(frame, NAME_T.caption[0], NAME_T.caption[1], EASE_OUT) *
    (1 - progress(frame, NAME_T.caption[2], NAME_T.caption[3]));
  const markExit = progress(frame, NAME_T.exit, NAME_T.exit + 14, EASE_IN);

  return (
    <AbsoluteFill>
      <PurpleWaves opacity={bgIn} />

      <AbsoluteFill className="flex items-center justify-center">
        <div
          className="font-bold tracking-tight bg-gradient-to-r from-violet-300 via-indigo-400 to-sky-400 bg-clip-text text-transparent"
          style={{
            fontSize: 210,
            lineHeight: 1.2,
            opacity: wordFade * (1 - wordOut),
            transform: `scale(${mix(wordIn, 1.8, 1) * mix(wordOut, 1, 0.35)})`,
            filter: `blur(${mix(wordIn, 8, 1.5) + wordOut * 24}px) drop-shadow(0 0 30px rgba(129,140,248,0.6))`,
          }}
        >
          {KEYWORD}
        </div>
      </AbsoluteFill>

      {frame >= NAME_T.mark - 2 && (
        <AbsoluteFill className="flex flex-col items-center justify-center">
          <div
            className="text-cyan-300 tracking-[0.35em] uppercase font-semibold mb-6"
            style={{
              fontSize: 26,
              opacity: captionIn,
              filter: `blur(${(1 - captionIn) * 8}px)`,
            }}
          >
            Meet The Builder
          </div>
          <NameLockup
            reveal={reveal}
            markSize={mix(markShrink, 150, 104)}
            exitStart={NAME_T.exit}
            markStyle={{
              transform: `scale(${markP * (1 - markExit)}) rotate(${(1 - markP) * -140}deg)`,
              filter: `blur(${Math.max(0, 1 - markP) * 10 + markExit * 12}px)`,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 3: เส้นลากผ่านแต่ละตำแหน่ง ไปจบที่ AI Forward Deployed Engineer
// ==========================================
type Pt = { x: number; y: number };
type Segment = { d: string; samples: Pt[]; lens: number[]; length: number };

const ROLE_LABELS = [
  "Business Analysis",
  "System Analysis",
  "UX/UI Designer",
  "Software Developer",
  "AI Forward Deployed Engineer",
];
const ROLE_STEP = 1050;
const ROLE_NODES = ROLE_LABELS.map((label, i) => ({
  x: i * ROLE_STEP,
  y: i % 2 === 0 ? 40 : -40,
  label,
  tag: i === ROLE_LABELS.length - 1 ? `0${i + 1} — Now` : `0${i + 1}`,
  above: i % 2 === 0,
}));

const cubicAt = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x:
      u * u * u * a.x +
      3 * u * u * t * b.x +
      3 * u * t * t * c.x +
      t * t * t * d.x,
    y:
      u * u * u * a.y +
      3 * u * u * t * b.y +
      3 * u * t * t * c.y +
      t * t * t * d.y,
  };
};

const buildSegment = (a: Pt, b: Pt): Segment => {
  const dx = b.x - a.x;
  const c1 = { x: a.x + dx * 0.5, y: a.y };
  const c2 = { x: b.x - dx * 0.5, y: b.y };
  const samples: Pt[] = [];
  const lens: number[] = [];
  for (let i = 0; i <= 80; i++) {
    const p = cubicAt(a, c1, c2, b, i / 80);
    lens.push(
      i === 0
        ? 0
        : lens[i - 1] +
            Math.hypot(p.x - samples[i - 1].x, p.y - samples[i - 1].y),
    );
    samples.push(p);
  }
  return {
    d: `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`,
    samples,
    lens,
    length: lens[lens.length - 1],
  };
};

const pointAt = (seg: Segment, p: number): Pt => {
  const target = p * seg.length;
  const i = Math.max(
    1,
    seg.lens.findIndex((l) => l >= target),
  );
  const span = seg.lens[i] - seg.lens[i - 1] || 1;
  const t = (target - seg.lens[i - 1]) / span;
  return {
    x: mix(t, seg.samples[i - 1].x, seg.samples[i].x),
    y: mix(t, seg.samples[i - 1].y, seg.samples[i].y),
  };
};

const LEAD_IN = buildSegment({ x: -1200, y: 40 }, ROLE_NODES[0]);
const ROLE_SEGMENTS = ROLE_NODES.slice(1).map((node, i) =>
  buildSegment(ROLE_NODES[i], node),
);
// ทุก ๆ ROLE_BEAT เฟรม: จุดถัดไปเด้งขึ้น → ชื่อตำแหน่งประกอบตัว → เส้นวิ่งไปจุดถัดไป
// ตำแหน่ง 1–4: จุดเด้ง → ชื่อประกอบตัว → ค้างอ่าน ~0.5 วิ → เส้นวิ่งไปตำแหน่งถัดไป
const ROLE_BEAT = 51;
const ROLE_LINE_DRAW = 18;
const ROLE_TIMING = ROLE_NODES.map((_, i) => ({
  dot: 6 + i * ROLE_BEAT,
  label: 8 + i * ROLE_BEAT,
}));
const ROLE_SEG_TIMING = ROLE_SEGMENTS.map((_, i): [number, number] => [
  6 + (i + 1) * ROLE_BEAT - ROLE_LINE_DRAW,
  6 + (i + 1) * ROLE_BEAT,
]);
const ROLE_LAST = ROLE_TIMING[ROLE_TIMING.length - 1].dot;
// ตำแหน่งสุดท้าย (FDE) ค้างให้ดูนานกว่าตำแหน่งอื่น ก่อนถอยกล้องดูภาพรวม
const ROLE_FINAL = {
  ring: [20, 42],
  overview: [50, 74],
  exit: [86, 102],
} as const;
const ROLES_DURATION = ROLE_LAST + ROLE_FINAL.exit[1] + 2;
const LAST_ROLE_X = ROLE_NODES[ROLE_NODES.length - 1].x;
const OVERVIEW = { x: LAST_ROLE_X / 2 + 280, scale: 0.33 };

const RolesPathScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgIn = progress(frame, 0, 10, EASE_OUT);
  const lead = progress(frame, 0, 16, EASE_OUT);
  const segP = ROLE_SEG_TIMING.map(([a, b]) => progress(frame, a, b, EASE));
  const ring = progress(
    frame,
    ROLE_LAST + ROLE_FINAL.ring[0],
    ROLE_LAST + ROLE_FINAL.ring[1],
    EASE,
  );
  const ov = progress(
    frame,
    ROLE_LAST + ROLE_FINAL.overview[0],
    ROLE_LAST + ROLE_FINAL.overview[1],
    EASE,
  );
  const exit = progress(
    frame,
    ROLE_LAST + ROLE_FINAL.exit[0],
    ROLE_LAST + ROLE_FINAL.exit[1],
    EASE_IN,
  );

  // หัวเส้นอยู่บนเส้นล่าสุดที่เริ่มวาดแล้ว
  let head: Pt = ROLE_NODES[0];
  ROLE_SEGMENTS.forEach((seg, k) => {
    if (frame >= ROLE_SEG_TIMING[k][0]) head = pointAt(seg, segP[k]);
  });
  const camX = mix(ov, head.x, OVERVIEW.x);
  const camY = mix(ov, head.y * 0.6, 0);
  const camScale = mix(ov, 1, OVERVIEW.scale) * (1 - exit * 0.08);
  const drawing = segP.some((p) => p > 0 && p < 1);

  const dims = ROLE_NODES.map((_, i) =>
    i === ROLE_NODES.length - 1
      ? 1
      : mix(
          ov,
          1 -
            0.6 *
              progress(
                frame,
                ROLE_TIMING[i + 1].label,
                ROLE_TIMING[i + 1].label + 14,
              ),
          0.75,
        ),
  );

  const lineStroke = (seg: Segment, p: number, key: string) => (
    <path
      key={key}
      d={seg.d}
      pathLength={seg.length}
      fill="none"
      stroke="url(#role-line)"
      strokeWidth={4}
      strokeLinecap="round"
      strokeDasharray={`${seg.length} ${seg.length}`}
      strokeDashoffset={seg.length * (1 - p)}
      opacity={p > 0 ? 1 : 0}
    />
  );

  return (
    <AbsoluteFill>
      <BlueGlowBackground opacity={bgIn * (1 - exit)} />

      <AbsoluteFill
        style={{ opacity: 1 - exit, filter: `blur(${exit * 12}px)` }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            transform: `translate(960px, 540px) scale(${camScale}) translate(${-camX}px, ${-camY}px)`,
          }}
        >
          <svg
            className="absolute"
            style={{
              left: -1600,
              top: -800,
              overflow: "visible",
              filter: "drop-shadow(0 0 10px rgba(125,211,252,0.8))",
            }}
            width={LAST_ROLE_X + 3200}
            height={1600}
            viewBox={`-1600 -800 ${LAST_ROLE_X + 3200} 1600`}
          >
            <defs>
              <linearGradient
                id="role-line"
                gradientUnits="userSpaceOnUse"
                x1={-1200}
                x2={LAST_ROLE_X}
                y1={0}
                y2={0}
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="30%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
            </defs>
            {/* ราง (เส้นประจาง ๆ) */}
            {ROLE_SEGMENTS.map((seg, i) => (
              <path
                key={`rail-${i}`}
                d={seg.d}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={3}
                strokeDasharray="2 16"
                strokeLinecap="round"
                opacity={bgIn}
              />
            ))}
            {lineStroke(LEAD_IN, lead, "lead")}
            {ROLE_SEGMENTS.map((seg, k) =>
              lineStroke(seg, segP[k], `seg-${k}`),
            )}
          </svg>

          {/* หัวเส้นเรืองแสงที่กำลังวิ่ง */}
          {drawing && (
            <div
              className="absolute rounded-full bg-white"
              style={{
                left: head.x - 9,
                top: head.y - 9,
                width: 18,
                height: 18,
                boxShadow:
                  "0 0 24px 8px rgba(125,211,252,0.9), 0 0 70px 20px rgba(96,165,250,0.6)",
              }}
            />
          )}

          {ROLE_NODES.map((node, i) => {
            const hero = i === ROLE_NODES.length - 1;
            const dot = spring({
              frame: frame - ROLE_TIMING[i].dot,
              fps,
              config: { damping: 10, stiffness: 160 },
            });
            const dotSize = hero ? 30 : 22;
            const pulse = progress(
              frame,
              ROLE_TIMING[i].dot,
              ROLE_TIMING[i].dot + 30,
              EASE_OUT,
            );
            const tagIn = progress(
              frame,
              ROLE_TIMING[i].label + 6,
              ROLE_TIMING[i].label + 20,
              EASE_OUT,
            );
            return (
              <React.Fragment key={node.label}>
                <div
                  className="absolute rounded-full"
                  style={{
                    left: node.x - dotSize / 2,
                    top: node.y - dotSize / 2,
                    width: dotSize,
                    height: dotSize,
                    background: hero ? "#a5f3fc" : "#ffffff",
                    transform: `scale(${dot})`,
                    boxShadow: hero
                      ? "0 0 30px 10px rgba(56,189,248,0.9)"
                      : "0 0 18px 4px rgba(255,255,255,0.6)",
                  }}
                />
                {hero && (
                  <div
                    className="absolute rounded-full border-2 border-cyan-300"
                    style={{
                      left: node.x - 30,
                      top: node.y - 30,
                      width: 60,
                      height: 60,
                      transform: `scale(${mix(pulse, 0.5, 3.2)})`,
                      opacity: pulse > 0 ? (1 - pulse) * 0.8 : 0,
                    }}
                  />
                )}

                <div
                  className="absolute flex flex-col items-center"
                  style={{
                    left: node.x,
                    top: node.y,
                    opacity: dims[i],
                    transform: node.above
                      ? "translate(-50%, calc(-100% - 56px))"
                      : "translate(-50%, 56px)",
                  }}
                >
                  {node.above && (
                    <div
                      className="mb-3 font-mono tracking-[0.3em] uppercase"
                      style={{
                        fontSize: 26,
                        opacity: tagIn,
                        color: hero ? "#67e8f9" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {node.tag}
                    </div>
                  )}
                  <div
                    className="relative"
                    style={{ padding: hero ? "18px 48px" : 0 }}
                  >
                    {hero && (
                      <svg
                        className="absolute inset-0 w-full h-full"
                        style={{ overflow: "visible" }}
                      >
                        <rect
                          x={0}
                          y={0}
                          width="100%"
                          height="100%"
                          rx={92}
                          pathLength={1}
                          fill={`rgba(56,189,248,${0.08 * ring})`}
                          stroke="#67e8f9"
                          strokeWidth={3}
                          strokeDasharray="1 1"
                          strokeDashoffset={1 - ring}
                          opacity={ring > 0 ? 1 : 0}
                          style={{
                            filter:
                              "drop-shadow(0 0 12px rgba(103,232,249,0.8))",
                          }}
                        />
                      </svg>
                    )}
                    <ScrambleText
                      text={node.label}
                      start={ROLE_TIMING[i].label}
                      seed={`role-${i}`}
                      maxDelay={5}
                      colors={
                        hero ? ["#ffffff", "#a5f3fc", "#60a5fa"] : undefined
                      }
                      style={{
                        fontSize: hero ? 104 : 92,
                        fontWeight: hero ? 800 : 600,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                        color: "white",
                      }}
                    />
                  </div>
                  {!node.above && (
                    <div
                      className="mt-3 font-mono tracking-[0.3em] uppercase text-white/55"
                      style={{ fontSize: 26, opacity: tagIn }}
                    >
                      {node.tag}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 4: pill เรืองแสง → ขยายเป็น Glass IDE → หดเป็นการ์ดผลงาน
// ==========================================
const IDE = { w: 1550, h: 820 };
const CARD = { w: 820, h: 480, step: 880 };
const CODE_LINES = [
  `import { Engineer, AIWorkflow } from '@pear/core';`,
  `import { Vue, Nuxt, React, Next, TypeScript } from 'tech-stack';`,
  ``,
  `export const PearThanchanok = () => {`,
  `  const role = "AI Forward Deployed Engineer";`,
  `  const philosophy = "Every business problem deserves a real solution.";`,
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
const TAGLINE = "from problem to production";

const IDEScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillIn = spring({
    frame: frame - 2,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const widen = progress(frame, 12, 32, EASE);
  const tall = progress(frame, 30, 54, EASE);
  const shrink = progress(frame, 124, 156, EASE);

  const w = mix(shrink, mix(widen, 96, IDE.w), CARD.w);
  const h = mix(shrink, mix(tall, mix(widen, 34, 56), IDE.h), CARD.h);
  const radius = Math.min(h / 2, mix(shrink, 24, 16));

  const chromeIn = progress(frame, 22, 34);
  const bodyIn = progress(frame, 44, 58);
  const previewIn = progress(frame, 60, 76, EASE_OUT);
  const coverIn = progress(frame, 122, 140);
  const dim = progress(frame, 78, 90) * (1 - progress(frame, 112, 124));

  return (
    <AbsoluteFill>
      <div
        className="absolute overflow-hidden"
        style={{
          left: 960 - w / 2,
          top: 540 - h / 2,
          width: w,
          height: h,
          borderRadius: radius,
          transform: `scale(${pillIn})`,
          background: `linear-gradient(90deg, rgba(37,99,235,${1 - widen}), rgba(56,189,248,${1 - widen})), rgba(15,23,42,${0.75 * widen})`,
          border: "1px solid rgba(255,255,255,0.2)",
          backdropFilter: "blur(24px)",
          boxShadow: `0 30px 100px rgba(0,0,0,${0.8 * widen}), 0 0 ${40 * (1 - widen)}px rgba(56,189,248,0.8)`,
          filter: `blur(${dim * 6}px) brightness(${1 - dim * 0.35})`,
        }}
      >
        <div
          className="absolute left-1/2 top-0 flex flex-col"
          style={{ width: IDE.w, height: IDE.h, marginLeft: -IDE.w / 2 }}
        >
          {/* Top bar */}
          <div
            className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-white/[0.03]"
            style={{ opacity: chromeIn }}
          >
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
          <div
            className="flex-1 grid grid-cols-12 overflow-hidden"
            style={{ opacity: bodyIn }}
          >
            <div className="col-span-6 p-8 font-mono text-base leading-relaxed border-r border-white/10 flex flex-col justify-center">
              {CODE_LINES.map((line, i) => {
                const start = 52 + i * 4;
                const shown = Math.floor(
                  interpolate(
                    frame,
                    [start, start + 8],
                    [0, line.length],
                    CLAMP,
                  ),
                );
                const typing = frame >= start && frame < start + 10;
                return (
                  <div
                    key={i}
                    className="flex"
                    style={{ opacity: frame >= start ? 1 : 0 }}
                  >
                    <span className="w-8 text-slate-600 select-none">
                      {i + 1}
                    </span>
                    <span className="text-cyan-200 whitespace-pre">
                      {line.slice(0, shown)}
                    </span>
                    {typing && (
                      <span className="inline-block w-2 h-5 bg-cyan-300 ml-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="col-span-6 p-6 bg-slate-950/60 flex flex-col justify-center items-center relative">
              <div
                className="w-full h-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl relative"
                style={{
                  opacity: previewIn,
                  transform: `scale(${mix(previewIn, 0.94, 1)})`,
                }}
              >
                <Img
                  src={staticFile("home-portfolio.jpg")}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ตอนหด: preview ขยายเต็มหน้าต่าง กลายเป็นการ์ดใบแรกของฉากถัดไป */}
        <Img
          src={staticFile("home-portfolio.jpg")}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: coverIn }}
        />
      </div>

      {/* ข้อความ 3D ลอยทับ IDE (เหมือน "in any direction") */}
      <AbsoluteFill
        className="flex items-center justify-center"
        style={{ perspective: 1200 }}
      >
        <div
          className="flex font-bold tracking-tight"
          style={{
            fontSize: 132,
            whiteSpace: "pre",
            transform: "rotateY(-16deg) rotateX(8deg)",
            opacity: 1 - progress(frame, 112, 122),
            filter: `blur(${progress(frame, 112, 122) * 16}px)`,
          }}
        >
          {[...TAGLINE].map((ch, j) => {
            const p = progress(frame, 80 + j * 1.2, 90 + j * 1.2, EASE_OUT);
            const accent = j >= TAGLINE.indexOf("production");
            return (
              <span
                key={j}
                style={{
                  display: "inline-block",
                  opacity: p,
                  filter: `blur(${(1 - p) * 14}px)`,
                  transform: `translateZ(${(1 - p) * 200}px)`,
                  color: accent ? "#7dd3fc" : "white",
                  textShadow: "0 10px 40px rgba(0,0,0,0.5)",
                }}
              >
                {ch === " " ? " " : ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 5: วงเล็บปีกกา { } + สายพานการ์ดผลงาน → การ์ดกลายเป็นช่อง grid
// ==========================================
const PROJECTS = [
  {
    title: "Portfolio & Identity",
    subtitle: "Thought • System • Experience",
    img: "home-portfolio.jpg",
    type: "wide" as const,
  },
  {
    title: "Moonlit Choices",
    subtitle: "Interactive Romantic Fantasy Web",
    img: "home-moonlit.jpg",
    type: "wide" as const,
  },
  {
    title: "Little House Workspace",
    subtitle: "3D Interactive Cat Task & Repo Space",
    img: "home-work.jpg",
    type: "wide" as const,
  },
  {
    title: "Life Quest Companion",
    subtitle: "Smart Daily Finance & Planning AI",
    img: "home-life-mobile.png",
    imgSecond: "life-finance.png",
    type: "mobile-pair" as const,
  },
];
const GRID_CELL = { w: 900, h: 300 };
const TRACK_STEPS: [number, number][] = [
  [30, 46],
  [64, 80],
  [98, 114],
];

const SplitBackground: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill style={{ opacity, flexDirection: "row" }}>
    <div className="w-1/2 h-full bg-[#090d16]" />
    <div className="w-1/2 h-full bg-[#161f30]" />
  </AbsoluteFill>
);

const GridLines: React.FC<{ p: number }> = ({ p }) => {
  const x0 = 960 - GRID_CELL.w / 2;
  const x1 = 960 + GRID_CELL.w / 2;
  const y0 = 540 - GRID_CELL.h / 2;
  const y1 = 540 + GRID_CELL.h / 2;
  return (
    <AbsoluteFill className="pointer-events-none">
      {[y0, y1].map((y) => (
        <div
          key={`h-${y}`}
          className="absolute left-0 w-full h-px bg-white/20"
          style={{ top: y, transform: `scaleX(${p})` }}
        />
      ))}
      {[x0, x1].map((x) => (
        <div
          key={`v-${x}`}
          className="absolute top-0 h-full w-px bg-white/20"
          style={{ left: x, transform: `scaleY(${p})` }}
        />
      ))}
    </AbsoluteFill>
  );
};

const ShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pos = TRACK_STEPS.reduce(
    (acc, [a, b]) => acc + progress(frame, a, b, EASE),
    0,
  );
  const bracketOpen = spring({
    frame: frame - 4,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const bracketGap = mix(bracketOpen, 380, 480);
  const bracketOpacity = Math.min(
    progress(frame, 4, 14),
    1 - progress(frame, 130, 140),
  );
  const neighborsIn = progress(frame, 4, 18);
  const neighborsOut = progress(frame, 130, 144, EASE_IN);
  const lineIn = progress(frame, 0, 18, EASE_OUT);
  const gridIn = progress(frame, 138, 160, EASE_OUT);
  const morph = progress(frame, 144, 170, EASE);
  const bgIn = progress(frame, 0, 14);
  const last = PROJECTS.length - 1;

  return (
    <AbsoluteFill className="overflow-hidden">
      <SplitBackground opacity={bgIn} />

      {/* เส้นแนวนอนวิ่งผ่านหลังการ์ด */}
      <div
        className="absolute left-0 w-full h-[2px] bg-white/20"
        style={{
          top: 539,
          transform: `scaleX(${lineIn})`,
          opacity: 1 - neighborsOut,
        }}
      />

      <GridLines p={gridIn} />

      {PROJECTS.map((proj, i) => {
        const d = i - pos;
        const a = Math.min(1, Math.abs(d));
        const isLast = i === last;
        const cardW = isLast ? mix(morph, CARD.w, GRID_CELL.w) : CARD.w;
        const cardH = isLast ? mix(morph, CARD.h, GRID_CELL.h) : CARD.h;
        const scale = (1 - 0.16 * a) * (isLast ? 1 : 1 - neighborsOut * 0.1);
        const opacity =
          (1 - 0.5 * a) *
          (i === 0 ? 1 : neighborsIn) *
          (isLast ? 1 : 1 - neighborsOut);
        const content = isLast ? 1 - progress(frame, 148, 166) : 1;
        const chip =
          progress(frame, 10, 22) *
          (isLast ? 1 - progress(frame, 140, 150) : 1);
        return (
          <div
            key={proj.title}
            className="absolute overflow-hidden"
            style={{
              left: 960 + d * CARD.step - cardW / 2,
              top: 540 - cardH / 2,
              width: cardW,
              height: cardH,
              opacity,
              transform: `scale(${scale})`,
              borderRadius: mix(isLast ? morph : 0, 16, 0),
              border: `1px solid rgba(255,255,255,${isLast ? mix(morph, 0.25, 0) : 0.25})`,
              background: isLast
                ? `rgba(255,255,255,${0.06 * morph})`
                : undefined,
              backdropFilter: isLast && morph > 0 ? "blur(20px)" : undefined,
              boxShadow: `0 25px 70px rgba(0,0,0,${0.65 * content})`,
              zIndex: 10,
            }}
          >
            <div
              className="absolute inset-0 bg-slate-900"
              style={{ opacity: content }}
            >
              {proj.type === "wide" ? (
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
              <div
                className="absolute bottom-4 left-4 px-5 py-2.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/15"
                style={{ opacity: chip }}
              >
                <div className="text-white font-bold text-lg">{proj.title}</div>
                <div className="text-cyan-300 text-xs">{proj.subtitle}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* วงเล็บปีกกา { } ขนาบการ์ดใบกลาง */}
      {["{", "}"].map((ch, i) => (
        <div
          key={ch}
          className="absolute z-20 font-extralight text-white select-none leading-none"
          style={{
            fontSize: 340,
            left: 960 + (i === 0 ? -bracketGap : bracketGap),
            top: 540,
            opacity: bracketOpacity,
            transform: "translate(-50%, -54%)",
          }}
        >
          {ch}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 6: Grid Lines + "More about what's next"
// ==========================================
const GridTextScene: React.FC = () => {
  const frame = useCurrentFrame();
  const words = [
    { t: "More", at: 4 },
    { t: "about", at: 12 },
    { t: "what’s", at: 20 },
    { t: "next", at: 30, accent: true },
  ];

  return (
    <AbsoluteFill>
      <SplitBackground />
      <GridLines p={1} />
      <div
        className="absolute flex items-center justify-center gap-[0.28em] text-white font-medium tracking-tight"
        style={{
          left: 960 - GRID_CELL.w / 2,
          top: 540 - GRID_CELL.h / 2,
          width: GRID_CELL.w,
          height: GRID_CELL.h,
          fontSize: 64,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        {words.map((w) => {
          const p = progress(frame, w.at, w.at + 12, EASE_OUT);
          return (
            <span
              key={w.t}
              style={{
                opacity: p,
                filter: `blur(${(1 - p) * 12}px)`,
                transform: `translateY(${(1 - p) * 12}px)`,
                color: w.accent
                  ? interpolateColors(
                      frame,
                      [w.at + 14, w.at + 34],
                      ["#22d3ee", "#ffffff"],
                    )
                  : undefined,
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ==========================================
// SCENE 7: แสงสว่างกวาดลงมา → "Let's build together." → โลโก้ปิดท้าย
// ==========================================
const OUTRO_WORDS = [
  { t: "Let’s", at: 14, big: false },
  { t: "build", at: 22, big: false },
  { t: "together.", at: 32, big: true },
];

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wipe = progress(frame, 0, 20, EASE);
  const mask =
    wipe < 1
      ? `linear-gradient(to bottom, #000 ${wipe * 130 - 30}%, transparent ${wipe * 130}%)`
      : undefined;
  const smallOut = progress(frame, 58, 72, EASE);
  const wordsOut = progress(frame, 76, 88, EASE_IN);
  const darkIn = progress(frame, 80, 92);

  const markP = spring({
    frame: frame - 84,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const markShrink = progress(frame, 100, 112, EASE);
  const reveal = progress(frame, 108, 134, GLIDE);
  const sloganIn = progress(frame, 126, 140, EASE_OUT);
  const subIn = progress(frame, 132, 146, EASE_OUT);
  const emailIn = progress(frame, 142, 156, EASE_OUT);
  const linkIn = progress(frame, 148, 162, EASE_OUT);

  return (
    <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>
      <BrightBackground />

      <AbsoluteFill
        className="flex items-baseline justify-center"
        style={{
          alignItems: "center",
          opacity: 1 - wordsOut,
          filter: `blur(${wordsOut * 16}px)`,
        }}
      >
        <div className="flex items-baseline">
          {OUTRO_WORDS.map((w) => {
            const p = progress(frame, w.at, w.at + 16, EASE_OUT);
            const gone = w.big ? 0 : smallOut;
            return (
              <span
                key={w.t}
                className={
                  w.big
                    ? "font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent"
                    : "font-medium text-white/90"
                }
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  fontSize: w.big ? 168 : 76,
                  lineHeight: 1.25,
                  maxWidth: p * (w.big ? 900 : 320) * (1 - gone),
                  paddingRight: w.big ? 0 : 0.28 * 76 * (1 - gone),
                  opacity: p * (1 - gone),
                  filter: `blur(${(1 - p) * 12}px)`,
                }}
              >
                {w.t}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "#050817", opacity: darkIn }}>
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 50% 45% at 50% 50%, rgba(37,99,235,0.28), transparent 70%)",
          }}
        />
      </AbsoluteFill>

      {frame >= 84 && (
        <AbsoluteFill className="flex flex-col items-center justify-center">
          <NameLockup
            reveal={reveal}
            markSize={mix(markShrink, 260, 104)}
            markStyle={{
              transform: `scale(${markP}) rotate(${(1 - markP) * 160}deg)`,
              filter: `blur(${Math.max(0, 1 - markP) * 12}px)`,
            }}
          />
          {/* สโลแกน */}
          <p
            className="mt-7 text-white/90 font-semibold tracking-tight"
            style={{
              fontSize: 38,
              opacity: sloganIn,
              transform: `translateY(${(1 - sloganIn) * 16}px)`,
            }}
          >
            Your one-stop builder, end to end.
          </p>
          <p
            className="mt-2 text-white/55 font-light"
            style={{
              fontSize: 26,
              opacity: subIn,
              transform: `translateY(${(1 - subIn) * 12}px)`,
            }}
          >
            From business problem to deployed AI.
          </p>

          {/* ช่องทางติดต่อ */}
          <div
            className="mt-9 flex items-center gap-4"
            style={{ flexDirection: "row" }}
          >
            <div
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-sky-400/15 border border-sky-300/40 text-sky-50 text-2xl"
              style={{
                opacity: emailIn,
                transform: `scale(${mix(emailIn, 0.9, 1)})`,
                boxShadow: `0 0 ${emailIn * 30}px rgba(56,189,248,0.35)`,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <path d="M3.5 6.5 L12 13 L20.5 6.5" />
              </svg>
              thanchanok.thv@gmail.com
            </div>
            <div
              className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white/80 text-xl"
              style={{
                opacity: linkIn,
                transform: `scale(${mix(linkIn, 0.9, 1)})`,
              }}
            >
              @mee.webdev
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ==========================================
// เวลาเริ่มของแต่ละฉาก (เฟรม) — ใช้ทั้ง Sequence และเสียงประกอบ
// ==========================================
const AT_PROMPT = LAUNCH_AT;
const AT_IDEA = AT_PROMPT + KEYWORD_PUSH.end - 2;
const AT_ROLES = AT_IDEA + NAME_T.end - 5;
const AT_IDE = AT_ROLES + ROLES_DURATION - 15; // ซ้อนกับช่วง exit ของฉากตำแหน่งงาน
const AT = {
  hello: 0,
  prompt: AT_PROMPT,
  idea: AT_IDEA,
  roles: AT_ROLES,
  ide: AT_IDE,
  showcase: AT_IDE + 162,
  grid: AT_IDE + 338,
  outro: AT_IDE + 410,
};

// ==========================================
// เสียงประกอบ (@remotion/sfx) — เฟรมอ้างอิงจากจุดเริ่มของแต่ละ Sequence ด้านล่าง
// ==========================================
const TYPING_CLICKS = Array.from({ length: 9 }, (_, i) => ({
  at: AT.prompt + 102 + i * 4,
  src: mouseClick,
  volume: 0.12,
}));
const SFX: { at: number; src: string; volume: number }[] = [
  { at: AT.hello + 2, src: whoosh, volume: 0.18 }, // หน้าต่างลอยขึ้น
  ...Array.from({ length: 13 }, (_, i) => ({
    at: AT.hello + HELLO_TYPE.start + i * 4,
    src: mouseClick,
    volume: 0.07,
  })), // เสียงพิมพ์ใน terminal
  { at: AT.hello + HELLO_CLICK, src: mouseClick, volume: 0.55 }, // กด Run
  { at: AT.hello + HELLO_CLICK + 1, src: whoosh, volume: 0.3 }, // คลื่นกระแทก
  { at: AT.hello + HELLO_LOAD.end, src: uiSwitch, volume: 0.3 }, // รันเสร็จ
  { at: AT.hello + LOGO_POP_AT, src: ding, volume: 0.3 }, // โลโก้ลูกแพร์เด้งขึ้น
  { at: AT.prompt, src: whoosh, volume: 0.5 }, // ลูกแพร์ขยายเปิดฉาก
  { at: AT.prompt + 16, src: mouseClick, volume: 0.45 }, // ปุ่ม +
  { at: AT.prompt + 32, src: uiSwitch, volume: 0.35 }, // pill Public Profile
  ...TYPING_CLICKS,
  { at: AT.prompt + KEYWORD_PAN.start, src: whoosh, volume: 0.2 }, // แพนกล้องไปทางขวา
  { at: AT.prompt + KEYWORD_PUSH.start + 4, src: whoosh, volume: 0.55 }, // กล้องพุ่งเข้าคำเด่น แล้ว zoom out
  { at: AT.idea + NAME_T.mark, src: whip, volume: 0.3 }, // โลโก้หมุนเข้า
  { at: AT.idea + NAME_T.reveal[0], src: whoosh, volume: 0.25 }, // ชื่อเลื่อนออก
  { at: AT.roles, src: whoosh, volume: 0.35 }, // เข้าฉากเส้นตำแหน่งงาน
  ...ROLE_SEG_TIMING.map(([a]) => ({
    at: AT.roles + a,
    src: whip,
    volume: 0.22,
  })), // เส้นวิ่งไปตำแหน่งถัดไป
  { at: AT.roles + ROLE_LAST, src: ding, volume: 0.35 }, // ถึง AI Forward Deployed Engineer
  { at: AT.ide, src: uiSwitch, volume: 0.4 }, // pill เรืองแสง
  { at: AT.ide + 12, src: whoosh, volume: 0.3 }, // ขยายเป็น IDE
  { at: AT.ide + 80, src: whoosh, volume: 0.3 }, // from problem to production
  { at: AT.ide + 124, src: whoosh, volume: 0.3 }, // หดเป็นการ์ด
  { at: AT.showcase + 4, src: whip, volume: 0.3 }, // วงเล็บกาง
  ...TRACK_STEPS.map(([a]) => ({
    at: AT.showcase + a,
    src: whoosh,
    volume: 0.2,
  })), // สายพานเลื่อน
  { at: AT.grid + 4, src: uiSwitch, volume: 0.25 }, // More about what's next
  { at: AT.outro, src: whoosh, volume: 0.55 }, // แสงกวาดลงมา
  { at: AT.outro + 84, src: whoosh, volume: 0.35 }, // โลโก้ปิดท้าย
  { at: AT.outro + 108, src: ding, volume: 0.4 }, // ชื่อเลื่อนออก
];

const SoundEffects: React.FC = () => (
  <>
    {SFX.map((sfx, i) => (
      <Sequence key={i} from={sfx.at} durationInFrames={60} layout="none">
        <Html5Audio src={sfx.src} volume={sfx.volume} />
      </Sequence>
    ))}
  </>
);

// ==========================================
// MAIN COMPOSITION (รวมทุกฉากเข้าด้วยกัน) — ยาวตาม AT.outro + 170
// ฉากซ้อนกันช่วงรอยต่อเพื่อให้ transition ไหลต่อกัน
// ==========================================
export const PEAR_TEASER_DURATION = AT.outro + 200;

export const PearTeaser: React.FC = () => {
  return (
    <AbsoluteFill className="font-sans">
      <AuroraBackground />
      <SoundEffects />

      {/* 0:00 console.log("hello world") → กด Run → loading → โลโก้ลูกแพร์ */}
      <Sequence durationInFrames={AT.prompt + 45}>
        <HelloScene />
      </Sequence>

      {/* 0:05.2 โลโก้ลูกแพร์ขยายเต็มจอ → กล่อง prompt → ซูมพิมพ์ → แพน → ซูมเข้าคำเด่น */}
      <Sequence from={AT.prompt} durationInFrames={KEYWORD_PUSH.end + 4}>
        <PromptScene />
      </Sequence>

      {/* 0:11.4 คำเด่น "solution" → โลโก้ → ชื่อ */}
      <Sequence from={AT.idea} durationInFrames={NAME_T.end}>
        <IdeaNameScene />
      </Sequence>

      {/* 0:17.2 เส้นลากผ่านตำแหน่งงาน → AI Forward Deployed Engineer */}
      <Sequence from={AT.roles} durationInFrames={ROLES_DURATION}>
        <RolesPathScene />
      </Sequence>

      {/* 0:27.1 pill → Glass IDE → หดเป็นการ์ด */}
      <Sequence from={AT.ide} durationInFrames={162}>
        <IDEScene />
      </Sequence>

      {/* 0:32.5 { } สายพานผลงาน → ช่อง grid */}
      <Sequence from={AT.showcase} durationInFrames={176}>
        <ShowcaseScene />
      </Sequence>

      {/* 0:38.4 More about what's next */}
      <Sequence from={AT.grid} durationInFrames={90}>
        <GridTextScene />
      </Sequence>

      {/* 0:40.8 แสงกวาด → Let's build together → โลโก้ */}
      <Sequence from={AT.outro} durationInFrames={200}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
