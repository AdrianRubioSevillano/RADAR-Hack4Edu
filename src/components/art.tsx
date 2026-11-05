import type { ReactNode } from "react";

export type MascotMood = "hello" | "think" | "cheer" | "try";

// Radi: la mascota, derivada del logo (disco de radar y birrete). Decorativa.
export function Mascot({
  mood = "hello",
  size = 96,
}: {
  mood?: MascotMood;
  size?: number;
}) {
  const eyeY = mood === "think" ? 64 : 68;
  return (
    <svg
      className={`mascot mascot-${mood}`}
      width={size}
      height={size * 1.08}
      viewBox="0 0 120 130"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="radi-body" cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#7BE0FC" />
          <stop offset="0.55" stopColor="#2FB5F5" />
          <stop offset="1" stopColor="#0068C8" />
        </radialGradient>
      </defs>
      <g className="mascot-ping">
        <path d="M92 26a40 40 0 0 1 14 18" fill="none" stroke="#2FB5F5" strokeWidth="5" strokeLinecap="round" />
        <path d="M99 14a54 54 0 0 1 18 26" fill="none" stroke="#2FB5F5" strokeWidth="5" strokeLinecap="round" opacity=".5" />
      </g>
      <g className="mascot-body">
        <circle cx="60" cy="74" r="44" fill="url(#radi-body)" stroke="#002048" strokeWidth="4" />
        <circle cx="31" cy="86" r="6" fill="#FF9C7A" opacity=".75" />
        <circle cx="89" cy="86" r="6" fill="#FF9C7A" opacity=".75" />
        <path d="M32 88a34 34 0 0 0 56 0" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
        {mood === "cheer" ? (
          <>
            <path d="M36 70q8-11 16 0" fill="none" stroke="#002048" strokeWidth="5" strokeLinecap="round" />
            <path d="M68 70q8-11 16 0" fill="none" stroke="#002048" strokeWidth="5" strokeLinecap="round" />
            <path d="M44 82q16 22 32 0z" fill="#002048" />
            <path d="M52 91q8 6 16 0" fill="none" stroke="#EE6A3C" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="44" cy={eyeY} r="9.5" fill="#fff" stroke="#002048" strokeWidth="3" />
            <circle cx="76" cy={eyeY} r="9.5" fill="#fff" stroke="#002048" strokeWidth="3" />
            <circle cx={mood === "think" ? 47 : 45} cy={mood === "think" ? eyeY - 3 : eyeY + 1} r="4.6" fill="#002048" />
            <circle cx={mood === "think" ? 79 : 77} cy={mood === "think" ? eyeY - 3 : eyeY + 1} r="4.6" fill="#002048" />
            {mood === "hello" && <path d="M47 87q13 11 26 0" fill="none" stroke="#002048" strokeWidth="4.5" strokeLinecap="round" />}
            {mood === "think" && <path d="M52 90h15" fill="none" stroke="#002048" strokeWidth="4.5" strokeLinecap="round" />}
            {mood === "try" && <path d="M50 89q10 6 20-1" fill="none" stroke="#002048" strokeWidth="4.5" strokeLinecap="round" />}
          </>
        )}
        <path d="M60 8 103 26 60 44 17 26Z" fill="#002048" stroke="#002048" strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 35v9q24 13 48 0v-9L60 45Z" fill="#0A3266" stroke="#002048" strokeWidth="3" strokeLinejoin="round" />
        <path d="M99 28v22" stroke="#FFC629" strokeWidth="4" strokeLinecap="round" />
        <circle cx="99" cy="54" r="5" fill="#FFC629" stroke="#002048" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export function Speech({
  mood,
  children,
  size,
}: {
  mood: MascotMood;
  children: ReactNode;
  size?: number;
}) {
  return (
    <div className="speech">
      <Mascot mood={mood} size={size} />
      <div className="speech-bubble">{children}</div>
    </div>
  );
}

const AVATAR_COLORS = ["#2FB5F5", "#FFC629", "#EE6A3C", "#0FA58A", "#F49AC1", "#7FA8F5", "#9BD770", "#F7A35C"];
const SKIN = ["#FFDDB8", "#F2C094", "#C98E60", "#8D5A3B", "#FFE9D2"];

// Avatar ficticio derivado del número de lista. Sus periodos (8, 5 y 4) no son
// múltiplos de 3 a propósito: no deben delatar el grupo generador (i mod 3).
export function Avatar({ index, size = 44 }: { index: number; size?: number }) {
  const shirt = AVATAR_COLORS[(index * 5 + 2) % AVATAR_COLORS.length] ?? "#2FB5F5";
  const skin = SKIN[(index * 3 + 1) % SKIN.length] ?? "#FFDDB8";
  const hair = (index * 7) % 4;
  const hairColor = index % 5 < 2 ? "#3B2A20" : index % 5 === 2 ? "#7A4A22" : index % 5 === 3 ? "#111C33" : "#C9812A";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="avatar">
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="#EAF6FE" stroke="#002048" strokeWidth="3" />
      <path d="M9 45c1-10 7-13 15-13s14 3 15 13Z" fill={shirt} stroke="#002048" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="24" cy="22" r="10.5" fill={skin} stroke="#002048" strokeWidth="2.5" />
      {hair === 0 && <path d="M13.5 21c0-9 5-12 10.5-12s10.5 3 10.5 12c-5-1-8-3-10-6-2 3-6 5-11 6Z" fill={hairColor} stroke="#002048" strokeWidth="2" strokeLinejoin="round" />}
      {hair === 1 && <path d="M13 24c-3-11 4-15 11-15s14 4 11 15c-1-5-3-8-6-9-5 2-11 2-13 0-2 2-3 5-3 9Z" fill={hairColor} stroke="#002048" strokeWidth="2" strokeLinejoin="round" />}
      {hair === 2 && <path d="M14 18c1-6 5-9 10-9s9 3 10 9c-6-3-14-3-20 0Z" fill={hairColor} stroke="#002048" strokeWidth="2" strokeLinejoin="round" />}
      {hair === 3 && <><circle cx="12.5" cy="14" r="4" fill={hairColor} stroke="#002048" strokeWidth="2" /><circle cx="35.5" cy="14" r="4" fill={hairColor} stroke="#002048" strokeWidth="2" /><path d="M14 18c1-6 5-9 10-9s9 3 10 9c-6-3-14-3-20 0Z" fill={hairColor} stroke="#002048" strokeWidth="2" strokeLinejoin="round" /></>}
      <circle cx="20" cy="23" r="1.7" fill="#002048" />
      <circle cx="28" cy="23" r="1.7" fill="#002048" />
      <path d="M20.5 27q3.5 3 7 0" fill="none" stroke="#002048" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const ICONS: Readonly<Record<string, ReactNode>> = {
  class: <><path d="M3 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" /><circle cx="10" cy="7" r="4" /><path d="M17 3.3a4 4 0 0 1 0 7.4M21 21v-2a5 5 0 0 0-3-4.5" /></>,
  radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12 18.4 5.6" /></>,
  plans: <><path d="M6 3v12a4 4 0 0 0 4 4h8" /><path d="m15 16 3 3-3 3" /><path d="M18 3v6a4 4 0 0 1-4 4h-3" /></>,
  activities: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M7 9h6M7 12.5h10" /></>,
  evidence: <><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>,
  student: <><path d="M2 9 12 4l10 5-10 5Z" /><path d="M6 11.5V16c3 2.5 9 2.5 12 0v-4.5" /><path d="M22 9v6" /></>,
  practice: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
  hint: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6.5 6.5 0 0 0-4 11.6c.700.6 1 1.4 1 2.4h6c0-1 .300-1.8 1-2.4A6.5 6.5 0 0 0 12 3Z" /></>,
  sound: <><path d="M4 9.5v5h4l5 4v-13l-5 4Z" /><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" /></>,
  access: <><circle cx="12" cy="4.5" r="2" /><path d="M4 8.5c5 1.5 11 1.5 16 0M12 10v5m0 0-3.5 6.5M12 15l3.5 6.5" /></>,
  check: <path d="m4 12.5 5.5 5.5L20 7" />,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.100" /></>,
  alert: <><path d="M12 3.5 2.5 20.5h19Z" /><path d="M12 10v5M12 17.5v.100" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M20 12H5m6-6-6 6 6 6" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.900 2.900l-.1-.1a1.7 1.7 0 0 0-2.800 1.200V21a2 2 0 1 1-4 0v-.100a1.7 1.7 0 0 0-2.800-1.200l-.1.1a2 2 0 1 1-2.900-2.900l.1-.1a1.7 1.700 0 0 0-1.200-2.800H3a2 2 0 1 1 0-4h.100a1.700 1.700 0 0 0 1.200-2.800l-.1-.1a2 2 0 1 1 2.900-2.900l.1.1a1.700 1.700 0 0 0 2.800-1.200V3a2 2 0 1 1 4 0v.100a1.700 1.700 0 0 0 2.800 1.200l.1-.1a2 2 0 1 1 2.900 2.900l-.1.1a1.700 1.700 0 0 0 1.200 2.800h.100a2 2 0 1 1 0 4h-.100a1.700 1.700 0 0 0-1.500 1Z" /></>,
  exit: <><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M16 16l4-4-4-4M20 12H10" /></>,
  erase: <><path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" /><path d="m12 9 6 6m0-6-6 6" /></>,
  star: <path d="m12 3 2.700 5.800 6.300.800-4.600 4.300 1.200 6.300L12 17l-5.600 3.200 1.200-6.300L3 9.600l6.300-.800Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="icon">
      {ICONS[name]}
    </svg>
  );
}
