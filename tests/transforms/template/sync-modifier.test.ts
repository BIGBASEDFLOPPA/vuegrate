import { describe, it, expect } from 'vitest';
import { convertSyncModifier } from '../../../src/transforms/template/sync-modifier.js';

describe('convertSyncModifier', () => {
    it('converts short bind form :prop.sync to v-model:prop', () => {
        const input = '<my-input :title.sync="pageTitle" />';
        expect(convertSyncModifier(input)).toBe('<my-input v-model:title="pageTitle" />');
    });

    it('converts long bind form v-bind:prop.sync to v-model:prop', () => {
        const input = '<my-input v-bind:title.sync="pageTitle" />';
        expect(convertSyncModifier(input)).toBe('<my-input v-model:title="pageTitle" />');
    });

    it('preserves single quotes around the bound value', () => {
        const input = "<my-input :title.sync='pageTitle' />";
        expect(convertSyncModifier(input)).toBe("<my-input v-model:title='pageTitle' />");
    });

    it('leaves a plain :prop binding (without .sync) untouched', () => {
        const input = '<my-input :title="pageTitle" />';
        expect(convertSyncModifier(input)).toBe(input);
    });

    it('handles multiple .sync bindings on the same element', () => {
        const input = '<my-input :title.sync="pageTitle" :visible.sync="isVisible" />';
        expect(convertSyncModifier(input)).toBe('<my-input v-model:title="pageTitle" v-model:visible="isVisible" />');
    });
});