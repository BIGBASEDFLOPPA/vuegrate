import { describe, it, expect } from 'vitest';
import { finalizeScriptSetup } from '../../../src/transforms/script/finalize-script-setup.js';

describe('finalizeScriptSetup', () => {
    it('removes an empty export default entirely', () => {
        const input = `
      const count = ref(0)
      export default {}
    `;
        const output = finalizeScriptSetup(input);

        expect(output).not.toContain('export default');
        expect(output).toContain('const count = ref(0)');
    });

    it('converts leftover export default properties into defineOptions()', () => {
        const input = `
      const count = ref(0)
      export default { name: 'MyComponent' }
    `;
        const output = finalizeScriptSetup(input);

        expect(output).toContain('defineOptions({');
        expect(output).toContain("name: 'MyComponent'");
        expect(output).not.toContain('export default');
    });

    it('moves defineProps, defineEmits, and defineOptions to the top', () => {
        const input = `
      function handleClick() { console.log('click') }
      const count = ref(0)
      const props = defineProps(['title'])
      const emit = defineEmits(['submit'])
      export default { name: 'MyComponent' }
    `;
        const output = finalizeScriptSetup(input);

        const propsIndex = output.indexOf('defineProps');
        const emitIndex = output.indexOf('defineEmits');
        const optionsIndex = output.indexOf('defineOptions');
        const functionIndex = output.indexOf('function handleClick');

        expect(propsIndex).toBeGreaterThanOrEqual(0);
        expect(propsIndex).toBeLessThan(emitIndex);
        expect(emitIndex).toBeLessThan(optionsIndex);
        expect(optionsIndex).toBeLessThan(functionIndex);
    });

    it('leaves code without export default untouched', () => {
        const input = `
      const count = ref(0)
      function increment() { count.value++ }
    `;
        expect(finalizeScriptSetup(input)).toBe(input);
    });
});