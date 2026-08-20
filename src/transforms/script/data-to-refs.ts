import {parse} from '@babel/parser';
import { traverse, generateCode } from '../../core/babel-interop.js';
import * as t from '@babel/types';
import type {ScriptTransform} from '../../core/transform-runner.js';

// Vue 2:
//   export default {
//     data() {
//       return { count: 0, name: 'Alex' }
//     }
//   }
//
// Vue 3:
//   const count = ref(0)
//   const name = ref('Alex')
//
// Note: this only converts the `data()` declarations themselves.
// Any `this.count` usages elsewhere in the component still need to
// become `count.value` — that happens in a separate transform

export const convertDataToRefs: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, {sourceType: 'module', plugins: ['typescript']});

    const newRefDeclarations: t.Statement[] = [];

    traverse(ast, {
        ObjectMethod(path) {
            const isDataMethod = t.isIdentifier(path.node.key, {name: 'data'});
            if (!isDataMethod) return;

            const returnStatement = path.node.body.body.find((statement) =>
                t.isReturnStatement(statement),
            ) as t.ReturnStatement | undefined;

            if (!returnStatement || !t.isObjectExpression(returnStatement.argument)) return;

            for (const property of returnStatement.argument.properties) {
                if (!t.isObjectProperty(property) || !t.isIdentifier(property.key)) continue;

                const refCall = t.callExpression(t.identifier('ref'), [property.value as t.Expression]);
                const declaration = t.variableDeclaration('const', [
                    t.variableDeclarator(t.identifier(property.key.name), refCall),
                ]);

                newRefDeclarations.push(declaration);
            }

            path.remove();
        },
    });

    if (newRefDeclarations.length === 0) return scriptCode;

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            path.insertBefore(newRefDeclarations);
        },
    });

    return generateCode(ast);
};