import { describe, it, expect } from 'vitest';
import { convertPropsToDefineProps } from '../../../src/transforms/script/props-to-define-props.js';

describe('convertPropsToDefineProps', () => {
    it('converts the array form', () => {
        const input = `
      export default {
        props: ['title', 'count']
      }
    `;
        const output = convertPropsToDefineProps(input);

        expect(output).toContain("const props = defineProps(['title', 'count'])");
        expect(output).not.toContain('props:');
    });

    it('converts the object form with type validation', () => {
        const input = `
      export default {
        props: {
          title: { type: String, required: true }
        }
      }
    `;
        const output = convertPropsToDefineProps(input);

        expect(output).toContain('const props = defineProps({');
        expect(output).toContain('type: String');
        expect(output).toContain('required: true');
    });

    it('places defineProps before export default', () => {
        const input = `
      export default {
        props: ['title']
      }
    `;
        const output = convertPropsToDefineProps(input);
        const definePropsIndex = output.indexOf('defineProps');
        const exportIndex = output.indexOf('export default');

        expect(definePropsIndex).toBeGreaterThanOrEqual(0);
        expect(definePropsIndex).toBeLessThan(exportIndex);
    });

    it('leaves code without a props declaration untouched', () => {
        const input = `
      export default {
        methods: {
          greet() { console.log('hi') }
        }
      }
    `;
        expect(convertPropsToDefineProps(input)).toBe(input);
    });
});