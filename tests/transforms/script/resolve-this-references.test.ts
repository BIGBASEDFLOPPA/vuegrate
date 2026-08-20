import { describe, it, expect } from 'vitest';
import { resolveThisReferences } from '../../../src/transforms/script/resolve-this-references.js';

describe('resolveThisReferences', () => {
    it('converts this.count to count.value when count is a ref', () => {
        const input = `
      const count = ref(0)
      function increment() { this.count++ }
      export default {}
    `;
        const output = resolveThisReferences(input);

        expect(output).toContain('count.value++');
        expect(output).not.toContain('this.count');
    });

    it('converts this.title to props.title when title is a declared prop', () => {
        const input = `
      const props = defineProps(['title'])
      function logTitle() { console.log(this.title) }
      export default {}
    `;
        const output = resolveThisReferences(input);

        expect(output).toContain('console.log(props.title)');
    });

    it('converts this.save() to save() when save is a top-level function', () => {
        const input = `
      function save() { console.log('saving') }
      function trigger() { this.save() }
      export default {}
    `;
        const output = resolveThisReferences(input);

        expect(output).toContain('save();');
        expect(output).not.toContain('this.save');
    });

    it('leaves this.$refs and other unknown this.xxx references untouched', () => {
        const input = `
      const count = ref(0)
      function focusInput() { this.$refs.input.focus() }
      export default {}
    `;
        const output = resolveThisReferences(input);

        expect(output).toContain('this.$refs.input.focus()');
    });

    it('resolves nested member access on a ref (this.user.name -> user.value.name)', () => {
        const input = `
      const user = ref({ name: 'Alex' })
      function logName() { console.log(this.user.name) }
      export default {}
    `;
        const output = resolveThisReferences(input);

        expect(output).toContain('console.log(user.value.name)');
    });

    it('leaves code with no known refs, props, or functions untouched', () => {
        const input = `
      export default {}
    `;
        expect(resolveThisReferences(input)).toBe(input);
    });
});