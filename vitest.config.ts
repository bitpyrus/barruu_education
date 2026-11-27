import { defineConfig } from 'vitest/config';
import path from 'node:path';

const pkg = (name: string) => path.resolve(import.meta.dirname, `packages/${name}/src/index.ts`);

export default defineConfig({
  resolve: {
    alias: {
      '@barruu/engine': pkg('engine'),
      '@barruu/i18n': pkg('i18n'),
      '@barruu/curriculum': pkg('curriculum'),
      '@barruu/content': pkg('content'),
      '@barruu/ui': pkg('ui'),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    environment: 'node',
  },
});
