import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { ScriptTransform } from '../../core/transform-runner.js';

// Vue 2:
//   watch: {
//     count(newVal, oldVal) { /* ... */ }
//   }
//
// Vue 3:
//   watch(count, (newVal, oldVal) => { /* ... */ })
//
// Vue 2 (with options):
//   watch: {
//     count: { handler(newVal) { /* ... */ }, deep: true, immediate: true }
//   }
//
// Vue 3:
//   watch(count, (newVal) => { /* ... */ }, { deep: true, immediate: true })

export const convertWatchToWatchFn: ScriptTransform = (scriptCode) => {
    const ast = parse(scriptCode, { sourceType: 'module', plugins: ['typescript'] });

    const newWatchStatements: t.Statement[] = [];

    traverse(ast, {
        ObjectProperty(path) {
            const isWatchProperty = t.isIdentifier(path.node.key, { name: 'watch' });
            if (!isWatchProperty || !t.isObjectExpression(path.node.value)) return;

            for (const watcher of path.node.value.properties) {
                const watchCall = buildWatchCall(watcher);
                if (watchCall) newWatchStatements.push(t.expressionStatement(watchCall));
            }

            path.remove();
        },
    });

    if (newWatchStatements.length === 0) return scriptCode;

    traverse(ast, {
        ExportDefaultDeclaration(path) {
            path.insertBefore(newWatchStatements);
        },
    });

    return generate(ast).code;
};

function buildWatchCall(watcher: t.ObjectExpression['properties'][number]): t.CallExpression | null {
    if (!t.isObjectMethod(watcher) && !t.isObjectProperty(watcher)) return null;
    if (!t.isIdentifier(watcher.key) && !t.isStringLiteral(watcher.key)) return null;

    const watchedName = t.isIdentifier(watcher.key) ? watcher.key.name : watcher.key.value;
    const source = buildWatchSource(watchedName);

    // Shorthand: `count(newVal, oldVal) { ... }`
    if (t.isObjectMethod(watcher)) {
        const handler = t.arrowFunctionExpression(watcher.params, watcher.body);
        return t.callExpression(t.identifier('watch'), [source, handler]);
    }

    const value = watcher.value;

    // `count: function(newVal) { ... }` or `count: (newVal) => { ... }`
    if (t.isFunctionExpression(value) || t.isArrowFunctionExpression(value)) {
        const handler = t.arrowFunctionExpression(value.params, value.body);
        return t.callExpression(t.identifier('watch'), [source, handler]);
    }

    // Long form: `count: { handler(newVal) {...}, deep: true, immediate: true }`
    if (t.isObjectExpression(value)) {
        const handlerProperty = value.properties.find(
            (property) =>
                (t.isObjectMethod(property) || t.isObjectProperty(property)) &&
                t.isIdentifier(property.key, { name: 'handler' }),
        );
        if (!handlerProperty) return null;

        let handler: t.ArrowFunctionExpression;
        if (t.isObjectMethod(handlerProperty)) {
            handler = t.arrowFunctionExpression(handlerProperty.params, handlerProperty.body);
        } else if (
            t.isObjectProperty(handlerProperty) &&
            (t.isFunctionExpression(handlerProperty.value) || t.isArrowFunctionExpression(handlerProperty.value))
        ) {
            handler = t.arrowFunctionExpression(handlerProperty.value.params, handlerProperty.value.body);
        } else {
            return null;
        }

        const remainingOptions = value.properties.filter((property) => property !== handlerProperty);
        const args: t.Expression[] = [source, handler];
        if (remainingOptions.length > 0) {
            args.push(t.objectExpression(remainingOptions));
        }

        return t.callExpression(t.identifier('watch'), args);
    }

    return null;
}

function buildWatchSource(watchedName: string): t.Expression {
    if (!watchedName.includes('.')) {
        return t.identifier(watchedName);
    }

    const pathParts = watchedName.split('.');
    let expression: t.Expression = t.identifier(pathParts[0]);
    for (const part of pathParts.slice(1)) {
        expression = t.memberExpression(expression, t.identifier(part));
    }

    return t.arrowFunctionExpression([], expression);
}