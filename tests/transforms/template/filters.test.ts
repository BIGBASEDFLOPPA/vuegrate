import { describe, it, expect } from 'vitest';
import { convertFilters } from '../../../src/transforms/template/filters.js';

describe('convertFilters', () => {
    it('converts a simple filter to a function call', () => {
        const input = '{{ price | currency }}';
        expect(convertFilters(input)).toBe('{{ currency(price) }}');
    });

    it('converts a filter with arguments', () => {
        const input = "{{ price | currency('USD') }}";
        expect(convertFilters(input)).toBe("{{ currency(price, 'USD') }}");
    });

    it('converts a chain of filters', () => {
        const input = '{{ text | trim | capitalize }}';
        expect(convertFilters(input)).toBe('{{ capitalize(trim(text)) }}');
    });

    it('leaves interpolations without filters untouched', () => {
        const input = '{{ fullName }}';
        expect(convertFilters(input)).toBe(input);
    });

    it('does not treat logical OR (||) as a filter pipe', () => {
        const input = '{{ a || b }}';
        expect(convertFilters(input)).toBe(input);
    });

    it('converts multiple separate interpolations in the same markup', () => {
        const input = '<p>{{ price | currency }}</p><span>{{ name | capitalize }}</span>';
        expect(convertFilters(input)).toBe('<p>{{ currency(price) }}</p><span>{{ capitalize(name) }}</span>');
    });
});