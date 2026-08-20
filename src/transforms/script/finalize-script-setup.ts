import { parse } from '@babel/parser';
import { traverse, generateCode } from '../../core/babel-interop.js';
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

    moveMacrosToTop(ast);

    return generateCode(ast);
};

function moveMacrosToTop(ast: t.File): void {
    const body = ast.program.body;

    const isDefineCall = (statement: t.Statement, varName: string, macroName: string) =>
        t.isVariableDeclaration(statement) &&
        t.isVariableDeclarator(statement.declarations[0]) &&
        t.isIdentifier(statement.declarations[0].id, { name: varName }) &&
        t.isCallExpression(statement.declarations[0].init) &&
        t.isIdentifier(statement.declarations[0].init.callee, { name: macroName });

    const isDefineOptionsCall = (statement: t.Statement) =>
        t.isExpressionStatement(statement) &&
        t.isCallExpression(statement.expression) &&
        t.isIdentifier(statement.expression.callee, { name: 'defineOptions' });

    const propsStatement = body.find((statement) => isDefineCall(statement, 'props', 'defineProps'));
    const emitsStatement = body.find((statement) => isDefineCall(statement, 'emit', 'defineEmits'));
    const optionsStatement = body.find(isDefineOptionsCall);

    const macroStatements = [propsStatement, emitsStatement, optionsStatement].filter(
        (statement): statement is t.Statement => statement !== undefined,
    );

    if (macroStatements.length === 0) return;

    ast.program.body = [...macroStatements, ...body.filter((statement) => !macroStatements.includes(statement))];
}