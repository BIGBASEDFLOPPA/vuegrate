import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/cli/run.ts'],
    format: ['esm'],
    target: 'node18',
    dts: false,
    sourcemap: true,
    clean: true,
    splitting: false,
});