import { describe, it, expect } from 'vitest';
import { convertLifecycleHooks } from '../../../src/transforms/script/lifecycle-hooks.js';

describe('convertLifecycleHooks', () => {
    it('converts mounted to onMounted', () => {
        const input = `
      export default {
        mounted() { console.log('ready') }
      }
    `;
        const output = convertLifecycleHooks(input);

        expect(output).toContain('onMounted(()');
        expect(output).toContain("console.log('ready')");
    });

    it('converts beforeDestroy to onBeforeUnmount (renamed hook)', () => {
        const input = `
      export default {
        beforeDestroy() { clearInterval(this.timer) }
      }
    `;
        const output = convertLifecycleHooks(input);

        expect(output).toContain('onBeforeUnmount(()');
        expect(output).not.toContain('beforeDestroy');
    });

    it('converts destroyed to onUnmounted (renamed hook)', () => {
        const input = `
      export default {
        destroyed() { console.log('gone') }
      }
    `;
        expect(convertLifecycleHooks(input)).toContain('onUnmounted(()');
    });

    it('inlines created() body directly, without wrapping it in a call', () => {
        const input = `
      export default {
        created() { console.log('created') }
      }
    `;
        const output = convertLifecycleHooks(input);

        expect(output).toContain("console.log('created')");
        expect(output).not.toContain('onCreated');
        expect(output).not.toContain('created(');
    });

    it('inlines beforeCreate() body directly as well', () => {
        const input = `
      export default {
        beforeCreate() { console.log('before create') }
      }
    `;
        const output = convertLifecycleHooks(input);

        expect(output).toContain("console.log('before create')");
        expect(output).not.toContain('beforeCreate');
    });

    it('converts multiple hooks at once', () => {
        const input = `
      export default {
        mounted() { console.log('mounted') },
        beforeDestroy() { console.log('destroy') }
      }
    `;
        const output = convertLifecycleHooks(input);

        expect(output).toContain('onMounted(()');
        expect(output).toContain('onBeforeUnmount(()');
    });

    it('leaves code without lifecycle hooks untouched', () => {
        const input = `
      export default {
        methods: {
          greet() { console.log('hi') }
        }
      }
    `;
        expect(convertLifecycleHooks(input)).toBe(input);
    });
});