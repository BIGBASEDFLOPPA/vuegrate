import type { TemplateTransform } from '../../core/transform-runner.js';

// Vue 2:  {{ price | currency }}
// Vue 3:  {{ currency(price) }}
//
// Vue 2:  {{ price | currency('USD') }}
// Vue 3:  {{ currency(price, 'USD') }}
//
// Vue 2:  {{ text | trim | capitalize }}
// Vue 3:  {{ capitalize(trim(text)) }}
//
// Note: this only rewrites the template syntax. The filter's actual
// definition (the `filters: {...}` option) still needs to move into
// `methods` — that happens in the script transforms, not here.

export const convertFilters: TemplateTransform = (templateMarkup) => {
    return templateMarkup.replace(/\{\{([^}]+)\}\}/g, (fullMatch, interpolationContent) => {
        const rewritten = rewriteFilterChain(interpolationContent);
        return rewritten === null ? fullMatch : `{{ ${rewritten} }}`;
    });
};

function rewriteFilterChain(content: string): string | null {
    const parts = content.split(/(?<!\|)\|(?!\|)/);

    if (parts.length === 1) return null;

    let expression = parts[0].trim();

    for (let i = 1; i < parts.length; i++) {
        const filterCall = parts[i].trim();
        const match = filterCall.match(/^([\w$]+)(?:\((.*)\))?$/);

        if (!match) return null; // unexpected syntax, bail out and leave original

        const [, filterName, filterArgs] = match;
        expression =
            filterArgs !== undefined
                ? `${filterName}(${expression}, ${filterArgs})`
                : `${filterName}(${expression})`;
    }

    return expression;
}