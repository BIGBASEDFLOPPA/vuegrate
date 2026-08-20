import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// Vue 2:
//   props: ['title', 'count']
//
// Vue 3:
//   const props = defineProps(['title', 'count'])
//
// Vue 2 (with type validation):
//   props: { title: { type: String, required: true } }
//
// Vue 3:
//   const props = defineProps({ title: { type: String, required: true } })

export const convertPropsToDefineProps: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    let definePropsStatement: t.Statement | null = null;

    traverse(ast, {
        ObjectProperty(path) {
            const isPropsProperty = t.isIdentifier(path.node.key, { name: 'props' });
            const hasValidValue = t.isArrayExpression(path.node.value) || t.isObjectExpression(path.node.value);
            if (!isPropsProperty || !hasValidValue) return;

            const definePropsCall = t.callExpression(t.identifier('defineProps'), [path.node.value]);
            definePropsStatement = t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier('props'), definePropsCall),
            ]);

            path.remove();
        },
    });

    if (!definePropsStatement) return scriptCode;

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            path.insertBefore([definePropsStatement as t.Statement]);
        },
    });

    return generate(ast).code;
};