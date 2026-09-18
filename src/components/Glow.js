import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// Soft radial background, like the design's radial-gradient panels.
export default function Glow({ id, inner, outer, cx = 0.5, cy = 0.4, rx = 0.9, ry = 0.6, stop = 0.7 }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx={cx} cy={cy} rx={rx} ry={ry} fx={cx} fy={cy} gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor={inner} />
          <Stop offset={stop} stopColor={outer} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
