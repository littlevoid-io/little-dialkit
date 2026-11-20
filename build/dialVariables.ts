import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const OWN = fileURLToPath(new URL('../src/styles.css', import.meta.url));
const DIALKIT = createRequire(import.meta.url).resolve('dialkit/vanilla/styles.css');

/** The `--dial-*` names a stylesheet holds: the first group of each match. */
function names(file: string, pattern: RegExp): Set<string> {
  return new Set(Array.from(readFileSync(file, 'utf8').matchAll(pattern), (match) => match[1]));
}

/** DialKit's variables named in the own stylesheet that DialKit's stylesheet no longer declares. */
export function missingVariables(): string[] {
  const declared = names(DIALKIT, /(--dial-[\w-]+)\s*:/g);
  return [...names(OWN, /(--dial-[\w-]+)/g)].filter((name) => !declared.has(name));
}

/** Warns on dev server start and on build: DialKit's variables are undocumented and can go without notice. */
export function dialVariables(): Plugin {
  return {
    name: 'little-dial-variables',
    buildStart() {
      for (const name of missingVariables()) this.warn(`DialKit's stylesheet no longer declares ${name}, which src/styles.css names`);
    },
  };
}
