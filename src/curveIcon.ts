import { range } from 'es-toolkit';
import { type CurveName, evaluate } from './curves';

const SVG = 'http://www.w3.org/2000/svg';
const SEGMENTS = 32;

/** The curve in the unit square: position to the right, value up. Drawn in `currentColor`. */
export function curveIcon(name: CurveName): SVGSVGElement {
  const icon = document.createElementNS(SVG, 'svg');
  const line = document.createElementNS(SVG, 'polyline');
  const points = range(SEGMENTS + 1).map((i) => `${i / SEGMENTS},${1 - evaluate(name, i / SEGMENTS)}`);
  line.setAttribute('points', points.join(' '));
  icon.setAttribute('viewBox', '-0.1 -0.1 1.2 1.2');
  icon.classList.add('little-curve-icon');
  icon.append(line);
  return icon;
}
