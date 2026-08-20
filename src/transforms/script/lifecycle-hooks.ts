import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// Vue 2:
//   mounted() { console.log('ready') }
//   beforeDestroy() { clearInterval(this.timer) }
//
// Vue 3:
//   onMounted(() => { console.log('ready') })
//   onBeforeUnmount(() => { clearInterval(timer.value) })
//
// Vue 2's beforeCreate/created have no Composition API equivalent

const hookNameMap: Record<string, string> = {
    beforeMount: 'onBeforeMount',
    mounted: 'onMounted',
    beforeUpdate: 'onBeforeUpdate',
    updated: 'onUpdated',
    beforeDestroy: 'onBeforeUnmount',
    destroyed: 'onUnmounted',
    activated: 'onActivated',
    deactivated: 'onDeactivated',
    errorCaptured: 'onErrorCaptured',
};

const inlinedHookNames = new Set(['beforeCreate', 'created']);

export const convertLifecycleHooks: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    const newStatements: t.Statement[] = [];

    traverse(ast, {
        ObjectMethod(path) {
            if (!t.isIdentifier(path.node.key)) return;
            const hookName = path.node.key.name;

            if (inlinedHookNames.has(hookName)) {
                newStatements.push(...path.node.body.body);
                path.remove();
                return;
            }

            const compositionHookName = hookNameMap[hookName];
            if (!compositionHookName) return;

            const handler = t.arrowFunctionExpression(path.node.params, path.node.body);
            const call = t.callExpression(t.identifier(compositionHookName), [handler]);
            newStatements.push(t.expressionStatement(call));
            path.remove();
        },
    });

    if (newStatements.length === 0) return scriptCode;

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            path.insertBefore(newStatements);
        },
    });

    return generate(ast).code;
};