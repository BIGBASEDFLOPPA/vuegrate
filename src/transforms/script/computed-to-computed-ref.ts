import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// Vue 2:
//   export default {
//     computed: {
//       fullName() { return this.firstName + ' ' + this.lastName }
//     }
//   }
//
// Vue 3:
//   const fullName = computed(() => firstName.value + ' ' + lastName.value)
//
// Note: same as with methods — `this.xxx` inside the computed body is
// left untouched here, handled by a separate `this.` resolution pass.

export const convertComputedToComputedRef: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    const newComputedDeclarations: t.Statement[] = [];

    traverse(ast, {
        ObjectProperty(path) {
            const isComputedProperty = t.isIdentifier(path.node.key, { name: 'computed' });
            if (!isComputedProperty || !t.isObjectExpression(path.node.value)) return;

            for (const computedGetter of path.node.value.properties) {
                if (!t.isObjectMethod(computedGetter) || !t.isIdentifier(computedGetter.key)) continue;

                const arrowFunction = t.arrowFunctionExpression(
                    computedGetter.params,
                    computedGetter.body,
                );

                const computedCall = t.callExpression(t.identifier('computed'), [arrowFunction]);

                const declaration = t.variableDeclaration('const', [
                    t.variableDeclarator(t.identifier(computedGetter.key.name), computedCall),
                ]);

                newComputedDeclarations.push(declaration);
            }

            path.remove();
        },
    });

    if (newComputedDeclarations.length === 0) return scriptCode;

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            path.insertBefore(newComputedDeclarations);
        },
    });

    return generate(ast).code;
};