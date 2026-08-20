import { describe, it, expect } from 'vitest';
import { removeNativeModifier } from '../../../src/transforms/template/native-modifier.js';

describe('removeNativeModifier', () => {
    it('removes .native from the @event shorthand', () => {
        const input = '<my-button @click.native="onClick">Click</my-button>';
        expect(removeNativeModifier(input)).toBe('<my-button @click="onClick">Click</my-button>');
    });

    it('removes .native from the v-on: long form', () => {
        const input = '<my-input v-on:input.native="onInput" />';
        expect(removeNativeModifier(input)).toBe('<my-input v-on:input="onInput" />');
    });

    it('leaves markup without .native untouched', () => {
        const input = '<my-button @click="onClick">Click</my-button>';
        expect(removeNativeModifier(input)).toBe(input);
    });

    it('handles multiple .native modifiers in the same file', () => {
        const input = '<div @click.native="a" @mouseover.native="b"></div>';
        expect(removeNativeModifier(input)).toBe('<div @click="a" @mouseover="b"></div>');
    });
});