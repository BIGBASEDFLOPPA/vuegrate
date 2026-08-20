import { describe, it, expect } from 'vitest';
import { convertEmitsToDefineEmits } from '../../../src/transforms/script/emits-to-define-emits.js';

describe('convertEmitsToDefineEmits', () => {
    it('converts an explicit emits array', () => {
        const input = `
      export default {
        emits: ['submit', 'cancel']
      }
    `;
        const output = convertEmitsToDefineEmits(input);

        expect(output).toContain("const emit = defineEmits(['submit', 'cancel'])");
    });

    it('rewrites this.$emit(...) calls to emit(...)', () => {
        const input = `
      export default {
        methods: {
          save() { this.$emit('submit', this.value) }
        }
      }
    `;
        const output = convertEmitsToDefineEmits(input);

        expect(output).toContain("emit('submit', this.value)");
        expect(output).not.toContain('this.$emit');
    });

    it('infers event names from this.$emit(...) calls when emits is not declared', () => {
        const input = `
      export default {
        methods: {
          save() { this.$emit('submit') }
        }
      }
    `;
        const output = convertEmitsToDefineEmits(input);

        expect(output).toContain("const emit = defineEmits(['submit'])");
    });

    it('collects multiple inferred event names without duplicates', () => {
        const input = `
      export default {
        methods: {
          save() { this.$emit('submit') },
          close() { this.$emit('cancel') },
          retry() { this.$emit('submit') }
        }
      }
    `;
        const output = convertEmitsToDefineEmits(input);

        expect(output).toContain("defineEmits(['submit', 'cancel'])");
    });

    it('leaves code with no emits and no this.$emit calls untouched', () => {
        const input = `
      export default {
        methods: {
          greet() { console.log('hi') }
        }
      }
    `;
        expect(convertEmitsToDefineEmits(input)).toBe(input);
    });
});