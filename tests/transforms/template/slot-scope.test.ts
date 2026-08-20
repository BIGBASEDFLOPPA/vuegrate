import { describe, it, expect } from 'vitest';
import { convertSlotScope } from '../../../src/transforms/template/slot-scope.js';

describe('convertSlotScope', () => {
    it('converts named slot with scope to v-slot:name', () => {
        const input = '<template slot="header" slot-scope="props"><span>{{ props.label }}</span></template>';
        expect(convertSlotScope(input)).toBe(
            '<template v-slot:header="props"><span>{{ props.label }}</span></template>',
        );
    });

    it('converts default slot-scope (no name) to v-slot', () => {
        const input = '<template slot-scope="props">{{ props.value }}</template>';
        expect(convertSlotScope(input)).toBe('<template v-slot="props">{{ props.value }}</template>');
    });

    it('converts a named slot with no scope to v-slot:name', () => {
        const input = '<template slot="footer">Footer content</template>';
        expect(convertSlotScope(input)).toBe('<template v-slot:footer>Footer content</template>');
    });

    it('leaves a <template> tag without slot/slot-scope untouched', () => {
        const input = '<template v-if="show">Content</template>';
        expect(convertSlotScope(input)).toBe(input);
    });
});