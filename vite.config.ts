import { defineConfig } from 'vitest/config';
import { dialVariables } from './build/dialVariables';

export default defineConfig({
  plugins: [dialVariables()],
  // zundo imports `createStore` from the zustand root, which also loads the React bindings.
  resolve: { alias: [{ find: /^zustand$/, replacement: 'zustand/vanilla' }] },
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    // zundo is bundled so the alias above applies to it; consumers resolve the rest.
    rolldownOptions: { external: [/^dialkit/, /^zustand\//, /^es-toolkit/] },
  },
  // Tests run node_modules unbundled: zundo must go through the alias.
  test: { server: { deps: { inline: ['zundo'] } } },
});
