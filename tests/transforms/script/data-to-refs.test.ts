import { describe, it, expect } from 'vitest';
import { convertDataToRefs } from '../../../src/transforms/script/data-to-refs.js';

describe('convertDataToRefs', () => {
    it('converts a single data property to a ref', () => {
        const input = `
      export default {
        data() {
          return { count: 0 }
        }
      }
    `;
        const output = convertDataToRefs(input);

        expect(output).toContain('const count = ref(0)');
        expect(output).not.toContain('data()');
    });

    it('converts multiple data properties, each to its own ref', () => {
        const input = `
      export default {
        data() {
          return { count: 0, name: 'Alex' }
        }
      }
    `;
        const output = convertDataToRefs(input);

        expect(output).toContain("const count = ref(0)");
        expect(output).toContain("const name = ref('Alex')");
    });

    it('leaves code without a data() method untouched', () => {
        const input = `
      export default {
        methods: {
          greet() { console.log('hi') }
        }
      }
    `;
        expect(convertDataToRefs(input)).toBe(input);
    });

    it('places the new ref declarations before export default', () => {
        const input = `
      export default {
        data() {
          return { count: 0 }
        }
      }
    `;
        const output = convertDataToRefs(input);
        const refIndex = output.indexOf('const count = ref(0)');
        const exportIndex = output.indexOf('export default');

        expect(refIndex).toBeGreaterThanOrEqual(0);
        expect(refIndex).toBeLessThan(exportIndex);
    });
});