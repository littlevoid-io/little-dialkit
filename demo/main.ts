import 'dialkit/vanilla/styles.css';
import '../src/styles.css';
import type { DialConfig } from 'dialkit/vanilla';
import { curve, Panel } from '../src';

const config = {
  blur: {
    radius: curve([12, 0, 100, 0.01], 'cubicIn'),
    falloff: curve([0.3, 0, 1, 0.001]),
    samples: [16, 1, 64, 1],
  },
  color: {
    tint: '#ff8800',
    blend: { type: 'select', options: ['add', 'screen', 'multiply'] },
    invert: false,
  },
  advanced: {
    _collapsed: true,
    gain: curve([1, 0, 10, 0.01], 'quartOutIn'),
    exposure: [1, 0, 4],
  },
  reset: { type: 'action' },
} satisfies DialConfig;

const target = document.querySelector<HTMLElement>('#panel');
const output = document.querySelector<HTMLElement>('#values');
if (!target || !output) throw new Error('Demo page is missing #panel or #values');

const panel = new Panel('Demo', config, {
  id: 'little-dialkit-demo',
  target,
  theme: 'dark',
  persist: true,
  onAction: (action) => {
    if (action === 'reset') panel.kit.resetValues();
  },
});

panel.kit.subscribe((values) => {
  output.textContent = JSON.stringify(values, null, 2);
});
