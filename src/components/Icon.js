import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const ICONS = {
  back: <Path d="M15 5l-7 7 7 7" />,
  chevron: <Path d="M9 5l7 7-7 7" />,
  bolt: <Path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  gallery: (
    <>
      <Rect x="3" y="4" width="18" height="16" rx="2" />
      <Circle cx="9" cy="10" r="2" />
      <Path d="M21 16l-5-5-9 9" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  camera: (
    <>
      <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <Circle cx="12" cy="13" r="3.5" />
    </>
  ),
  share: <Path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" />,
  bookmark: <Path d="M6 3h12v18l-6-4-6 4z" />,
  x: <Path d="M6 6l12 12M18 6L6 18" />,
  check: <Path d="M5 12l5 5 9-10" />,
  mic: (
    <>
      <Rect x="9" y="3" width="6" height="11" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  play: <Path d="M7 4l13 8-13 8z" />,
  pause: <Path d="M8 5v14M16 5v14" />,
  home: <Path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z" />,
  chat: <Path d="M4 5h16v11H9l-5 4z" />,
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
  scan: <Path d="M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3M7 12h10" />,
  arrow: <Path d="M5 12h14M13 6l6 6-6 6" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20 20l-4-4" />
    </>
  ),
};

export default function Icon({ name, size = 22, color = '#000', strokeWidth = 2, fill = 'none' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </Svg>
  );
}

export function SmileIcon({ kind, size = 30, color = '#000' }) {
  const mouth = kind === 'happy' ? 'M10 19c2 3 10 3 12 0' : kind === 'meh' ? 'M11 20h10' : 'M10 22c2-3 10-3 12 0';
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      <Circle cx="16" cy="16" r="13" />
      <Path d={mouth} />
      <Path d="M11.5 12.5v1M20.5 12.5v1" />
    </Svg>
  );
}

export function MatchRing({ score, color, track, size = 116, stroke = 11, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <Circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`}
      />
    </Svg>
  );
}
