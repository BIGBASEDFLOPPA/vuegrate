import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// Vue 2 (explicit emits declared):
//   emits: ['submit', 'cancel']
//   methods: { save() { this.$emit('submit', this.value) } }
//
// Vue 3:
//   const emit = defineEmits(['submit', 'cancel'])
//   function save() { emit('submit', value.value) }
//
// Vue 2 (emits not declared ):
//   methods: { save() { this.$emit('submit') } }
//
// Vue 3:
//   const emit = defineEmits(['submit'])
//   function save() { emit('submit') }

export const convertEmitsToDefineEmits: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    let explicitEmitsValue: t.ArrayExpression | t.ObjectExpression | null = null;
    const detectedEventNames = new Set<string>();
    let foundAnyEmitCall = false;

    traverse(ast, {
        ObjectProperty(path) {
            const isEmitsProperty = t.isIdentifier(path.node.key, { name: 'emits' });
            const hasValidValue = t.isArrayExpression(path.node.value) || t.isObjectExpression(path.node.value);
            if (!isEmitsProperty || !hasValidValue) return;

            explicitEmitsValue = path.node.value;
            path.remove();
        },

        CallExpression(path) {
            const callee = path.node.callee;
            const isThisEmitCall =
                t.isMemberExpression(callee) &&
                t.isThisExpression(callee.object) &&
                t.isIdentifier(callee.property, { name: '$emit' });

            if (!isThisEmitCall) return;

            foundAnyEmitCall = true;
            const eventNameArg = path.node.arguments[0];
            if (t.isStringLiteral(eventNameArg)) detectedEventNames.add(eventNameArg.value);

            path.get('callee').replaceWith(t.identifier('emit'));
        },
    });

    const hasEmits = explicitEmitsValue !== null || foundAnyEmitCall;
    if (!hasEmits) return scriptCode;

    const emitsSource: t.Expression =
        explicitEmitsValue ?? t.arrayExpression([...detectedEventNames].map((name) => t.stringLiteral(name)));

    const defineEmitsStatement = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier('emit'), t.callExpression(t.identifier('defineEmits'), [emitsSource])),
    ]);

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            path.insertBefore([defineEmitsStatement]);
        },
    });

    return generate(ast).code;
};