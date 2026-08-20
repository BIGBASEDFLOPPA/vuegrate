import { parse } from '@babel/parser';
import { traverse, generateCode } from '../../core/babel-interop.js';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// After data/methods/computed/props have already been converted, the
// component still has `this.data` references scattered through method
// and computed bodies (they were left untouched on purpose). This pass
// scans the already-converted top-level declarations to figure out what
// each name is, then rewrites the remaining `this.data`:
//
//   this.count     -> count.value     (count is a ref/computed)
//   this.title     -> props.title     (title is a declared prop)
//   this.save()    -> save()          (save is a plain function)
//
// Anything not matching one of those (this.$refs, this.$nextTick, etc.) is left alone

export const resolveThisReferences: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    const refNames = new Set<string>();
    const propNames = new Set<string>();
    const functionNames = new Set<string>();

    traverse(ast, {
        Program(path) {
            for (const statement of path.node.body) {
                if (t.isFunctionDeclaration(statement) && statement.id) {
                    functionNames.add(statement.id.name);
                    continue;
                }

                if (!t.isVariableDeclaration(statement)) continue;

                for (const declarator of statement.declarations) {
                    if (!t.isIdentifier(declarator.id) || !declarator.init) continue;

                    if (
                        declarator.id.name === 'props' &&
                        t.isCallExpression(declarator.init) &&
                        t.isIdentifier(declarator.init.callee, { name: 'defineProps' })
                    ) {
                        for (const name of extractPropNames(declarator.init.arguments[0])) {
                            propNames.add(name);
                        }
                        continue;
                    }

                    const isRefOrComputed =
                        t.isCallExpression(declarator.init) &&
                        t.isIdentifier(declarator.init.callee) &&
                        (declarator.init.callee.name === 'ref' || declarator.init.callee.name === 'computed');

                    if (isRefOrComputed) refNames.add(declarator.id.name);
                }
            }
        },
    });

    if (refNames.size === 0 && propNames.size === 0 && functionNames.size === 0) {
        return scriptCode;
    }

    traverse(ast, {
        MemberExpression(path) {
            const node = path.node;
            if (!t.isThisExpression(node.object) || !t.isIdentifier(node.property)) return;

            const name = node.property.name;

            if (refNames.has(name)) {
                path.replaceWith(t.memberExpression(t.identifier(name), t.identifier('value')));
            } else if (propNames.has(name)) {
                path.replaceWith(t.memberExpression(t.identifier('props'), t.identifier(name)));
            } else if (functionNames.has(name)) {
                path.replaceWith(t.identifier(name));
            }
        },
    });

    return generateCode(ast);
};

function extractPropNames(definePropsArg: t.Node | undefined): string[] {
    if (t.isArrayExpression(definePropsArg)) {
        return definePropsArg.elements.filter(t.isStringLiteral).map((element) => element.value);
    }

    if (t.isObjectExpression(definePropsArg)) {
        return definePropsArg.properties
            .filter(t.isObjectProperty)
            .map((property) => property.key)
            .filter(t.isIdentifier)
            .map((key) => key.name);
    }

    return [];
}