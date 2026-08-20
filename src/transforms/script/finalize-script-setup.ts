import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// If nothing is left inside `export default {...}`, drop it — <script setup>
// doesn't need it. If some options couldn't be converted (components,
// mixins, name, etc.), keep them via defineOptions(), the <script setup>
// equivalent for leftover component-level options.
//
// Vue 2:  export default { name: 'MyComponent', mixins: [someMixin] }
// Vue 3:  defineOptions({ name: 'MyComponent', mixins: [someMixin] })

export const finalizeScriptSetup: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            if (!t.isObjectExpression(path.node.declaration)) return;

            const remainingProperties = path.node.declaration.properties;

            if (remainingProperties.length === 0) {
                path.remove();
                return;
            }

            const defineOptionsCall = t.expressionStatement(
                t.callExpression(t.identifier('defineOptions'), [t.objectExpression(remainingProperties)]),
            );
            path.replaceWith(defineOptionsCall);
        },
    });

    return generate(ast).code;
};