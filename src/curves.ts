/** Slider position (0..1) to share of the value range (0..1); rises from 0 to 1. */
export type Curve = (position: number) => number;

type Shape = (position: number, exponent: number) => number;

export const FAMILIES = { quad: 2, cubic: 3, quart: 4, quint: 5 } as const;
export const VARIANTS = ['In', 'Out', 'InOut', 'OutIn'] as const;

export type Family = keyof typeof FAMILIES;
export type Variant = (typeof VARIANTS)[number];
export type CurveName = 'linear' | `${Family}${Variant}`;

export const FAMILY_NAMES = Object.keys(FAMILIES) as Family[];

function easeIn(position: number, exponent: number): number {
  return position ** exponent;
}

function easeOut(position: number, exponent: number): number {
  return 1 - (1 - position) ** exponent;
}

function easeInOut(position: number, exponent: number): number {
  return position < 0.5 ? easeIn(position * 2, exponent) / 2 : (1 + easeOut(position * 2 - 1, exponent)) / 2;
}

/** The inverse of in-out: fast at both ends, slow through the middle. */
function easeOutIn(position: number, exponent: number): number {
  return position < 0.5 ? easeOut(position * 2, exponent) / 2 : (1 + easeIn(position * 2 - 1, exponent)) / 2;
}

const SHAPES: Record<Variant, Shape> = { In: easeIn, Out: easeOut, InOut: easeInOut, OutIn: easeOutIn };

const CURVES = new Map<string, Curve>([['linear', (position) => position]]);
for (const family of FAMILY_NAMES) {
  for (const variant of VARIANTS) CURVES.set(`${family}${variant}`, (position) => SHAPES[variant](position, FAMILIES[family]));
}

export const CURVE_NAMES = [...CURVES.keys()] as CurveName[];

const HALVINGS = 40;

/** Share of the value range (0..1) at a slider position (0..1). */
export function evaluate(name: CurveName, position: number): number {
  const curve = CURVES.get(name);
  if (!curve) throw new Error(`Unknown curve "${name}"`);
  return curve(position);
}

/** The slider position (0..1) where the curve reaches `share` (0..1). Every curve rises, so bisection finds it. */
export function invert(name: CurveName, share: number): number {
  let low = 0;
  let high = 1;
  for (let i = 0; i < HALVINGS; i++) {
    const middle = (low + high) / 2;
    if (evaluate(name, middle) < share) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
