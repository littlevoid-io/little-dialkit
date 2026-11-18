import type { ControlMeta, SelectConfig } from 'dialkit/vanilla';
import { CURVE_NAMES, type CurveName } from './curves';

/** DialKit's slider notation: [default, min, max, step?]. */
export type SliderRange = [number, number, number, number?];

/** A DialKit folder holding the value and its curve; resolves to `{ value: number, curve: string }`. */
export type CurveConfig = {
  value: SliderRange;
  curve: SelectConfig;
};

/** A slider whose position maps to its value through a selectable curve. The value stays in value units. */
export function curve(value: SliderRange, name: CurveName = 'linear'): CurveConfig {
  return { value, curve: { type: 'select', options: CURVE_NAMES, default: name } };
}

/** Whether a folder is the pair written by `curve()`. */
export function isCurve(meta: ControlMeta): boolean {
  const [value, selected] = meta.children ?? [];
  return meta.type === 'folder' && meta.children?.length === 2
    && value.type === 'slider' && value.path === `${meta.path}.value`
    && selected.type === 'select' && selected.path === `${meta.path}.curve`;
}
