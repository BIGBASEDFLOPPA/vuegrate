import { parse } from '@babel/parser';
import { traverse, generateCode } from '../../core/babel-interop.js';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// Vue 2:
//   export default {
//     methods: {
//       increment() { this.count++ },
//       reset(value) { this.count = value }
//     }
//   }
//
// Vue 3:
//   function increment() { count.value++ }
//   function reset(value) { count.value = value }
//
// Note: `this.count` references inside the method bodies are left
// as-is here — rewriting them to `count.value` is a separate transform

export const convertMethodsToFunctions: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    const newFunctionDeclarations: t.Statement[] = [];

    traverse(ast, {
        ObjectProperty(path) {
            const isMethodsProperty = t.isIdentifier(path.node.key, { name: 'methods' });
            if (!isMethodsProperty || !t.isObjectExpression(path.node.value)) return;

            for (const method of path.node.value.properties) {
                if (!t.isObjectMethod(method) || !t.isIdentifier(method.key)) continue;

                const functionDeclaration = t.functionDeclaration(
                    t.identifier(method.key.name),
                    method.params,
                    method.body,
                );

                newFunctionDeclarations.push(functionDeclaration);
            }

            path.remove();
        },
    });

    if (newFunctionDeclarations.length === 0) return scriptCode;

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            path.insertBefore(newFunctionDeclarations);
        },
    });

    return generateCode(ast);
};