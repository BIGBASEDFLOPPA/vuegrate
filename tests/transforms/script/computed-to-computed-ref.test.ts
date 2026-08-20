import { describe, it, expect } from 'vitest';
import { convertComputedToComputedRef } from '../../../src/transforms/script/computed-to-computed-ref.js';

describe('convertComputedToComputedRef', () => {
    it('converts a computed property to computed()', () => {
        const input = `
      export default {
        computed: {
          fullName() { return this.firstName + ' ' + this.lastName }
        }
      }
    `;
        const output = convertComputedToComputedRef(input);

        expect(output).toContain('const fullName = computed(()');
        expect(output).not.toContain('computed:');
    });

    it('converts multiple computed properties', () => {
        const input = `
      export default {
        computed: {
          fullName() { return this.firstName },
          initials() { return this.firstName[0] }
        }
      }
    `;
        const output = convertComputedToComputedRef(input);

        expect(output).toContain('const fullName = computed(()');
        expect(output).toContain('const initials = computed(()');
    });

    it('preserves the getter body content', () => {
        const input = `
      export default {
        computed: {
          total() { return this.price * this.quantity }
        }
      }
    `;
        expect(convertComputedToComputedRef(input)).toContain('this.price * this.quantity');
    });

    it('leaves code without a computed block untouched', () => {
        const input = `
      export default {
        methods: {
          greet() { console.log('hi') }
        }
      }
    `;
        expect(convertComputedToComputedRef(input)).toBe(input);
    });
});