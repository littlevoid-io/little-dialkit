import 'dialkit/vanilla/styles.css';
import '../src/styles.css';
import type { DialConfig, DialPosition } from 'dialkit/vanilla';
import { curve, Panel } from '../src';
import { animate } from './canvas';

const ID = 'little-dialkit-demo';
const CORNERS: DialPosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

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
  file: {
    export: { type: 'action', label: 'Export versions' },
    import: { type: 'action', label: 'Import versions' },
  },
  reset: { type: 'action' },
} satisfies DialConfig;

function exportFile(): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(panel.exportVersions(), null, 2)], { type: 'application/json' }));
  link.download = 'versions.json';
  link.click();
}

function importFile(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async () => {
    const [file] = input.files ?? [];
    if (file) panel.importVersions(JSON.parse(await file.text()));
  });
  input.click();
}

const ACTIONS: Record<string, () => void> = {
  'reset': () => panel.kit.resetValues(),
  'file.export': exportFile,
  'file.import': importFile,
};

const target = document.querySelector<HTMLElement>('#panel');
const output = document.querySelector<HTMLElement>('#values');
const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
if (!target || !output || !canvas) throw new Error('Demo page is missing #panel, #values or #canvas');
animate(canvas);

// `?docked` docks the panel into #panel; `?position=<corner>` starts the floating panel there and forgets a saved position.
const params = new URLSearchParams(location.search);
const docked = params.has('docked');
const position = CORNERS.find((corner) => corner === params.get('position'));
if (position) localStorage.removeItem(`little-dialkit:${ID}:shell`);
target.hidden = !docked;

const shared = {
  id: ID,
  theme: 'dark',
  persist: true,
  onAction: (action: string) => ACTIONS[action](),
} as const;

const panel = new Panel('Demo', config, docked
  ? { ...shared, target }
  : { ...shared, mode: 'popover', position });

panel.kit.subscribe((values) => {
  output.textContent = JSON.stringify(values, null, 2);
});
