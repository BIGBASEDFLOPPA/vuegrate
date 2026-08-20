import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import type { Node } from '@babel/types';

// @babel/traverse and @babel/generator are written for CommonJS. When
// imported into an ESM project, the default export sometimes ends up
// one level deeper than expected (on `.default`) depending on how the
// bundler/runtime resolves the interop. This normalizes both cases so
// the rest of the codebase can just import `traverse` and `generateCode`
// and have them work.
type TraverseFn = typeof traverseModule;
type GenerateFn = typeof generateModule;

export const traverse: TraverseFn =
    (traverseModule as unknown as { default?: TraverseFn }).default ?? traverseModule;

const generateRaw: GenerateFn =
    (generateModule as unknown as { default?: GenerateFn }).default ?? generateModule;

export function generateCode(ast: Node): string {
    return generateRaw(ast, { jsescOption: { quotes: 'single' } }).code;
}