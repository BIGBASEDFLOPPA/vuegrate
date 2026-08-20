import { describe, it, expect } from 'vitest';
import { convertWatchToWatchFn } from '../../../src/transforms/script/watch-to-watch-fn.js';

describe('convertWatchToWatchFn', () => {
    it('converts the shorthand method form', () => {
        const input = `
      export default {
        watch: {
          count(newVal, oldVal) { console.log(newVal, oldVal) }
        }
      }
    `;
        const output = convertWatchToWatchFn(input);

        expect(output).toContain('watch(count, (newVal, oldVal)');
        expect(output).not.toContain('watch:');
    });

    it('converts the long form with handler + options', () => {
        const input = `
      export default {
        watch: {
          count: {
            handler(newVal) { console.log(newVal) },
            deep: true,
            immediate: true
          }
        }
      }
    `;
        const output = convertWatchToWatchFn(input);

        expect(output).toMatch(/watch\(count, \(?newVal\)? =>/);
        expect(output).toContain('deep: true');
        expect(output).toContain('immediate: true');
    });

    it('converts a dotted path watcher into a getter function', () => {
        const input = `
      export default {
        watch: {
          'user.name'(newVal) { console.log(newVal) }
        }
      }
    `;
        const output = convertWatchToWatchFn(input);

        expect(output).toMatch(/watch\(\(\) => user\.name, \(?newVal\)? =>/);
    });

    it('converts multiple watchers', () => {
        const input = `
      export default {
        watch: {
          count(newVal) { console.log(newVal) },
          name(newVal) { console.log(newVal) }
        }
      }
    `;
        const output = convertWatchToWatchFn(input);

        expect(output).toContain('watch(count,');
        expect(output).toContain('watch(name,');
    });

    it('leaves code without a watch block untouched', () => {
        const input = `
      export default {
        methods: {
          greet() { console.log('hi') }
        }
      }
    `;
        expect(convertWatchToWatchFn(input)).toBe(input);
    });
});