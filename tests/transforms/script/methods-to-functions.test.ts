import { describe, it, expect } from 'vitest';
import { convertMethodsToFunctions } from '../../../src/transforms/script/methods-to-functions.js';

describe('convertMethodsToFunctions', () => {
    it('converts a single method to a top-level function', () => {
        const input = `
      export default {
        methods: {
          increment() { this.count++ }
        }
      }
    `;
        const output = convertMethodsToFunctions(input);

        expect(output).toContain('function increment()');
        expect(output).not.toContain('methods:');
    });

    it('converts multiple methods, each to its own function', () => {
        const input = `
      export default {
        methods: {
          increment() { this.count++ },
          reset(value) { this.count = value }
        }
      }
    `;
        const output = convertMethodsToFunctions(input);

        expect(output).toContain('function increment()');
        expect(output).toContain('function reset(value)');
    });

    it('preserves the method body content', () => {
        const input = `
      export default {
        methods: {
          logMessage() { console.log('hello') }
        }
      }
    `;
        expect(convertMethodsToFunctions(input)).toContain("console.log('hello')");
    });

    it('leaves code without a methods block untouched', () => {
        const input = `
      export default {
        data() {
          return { count: 0 }
        }
      }
    `;
        expect(convertMethodsToFunctions(input)).toBe(input);
    });
});