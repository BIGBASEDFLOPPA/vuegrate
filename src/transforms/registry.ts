import type { TransformRegistry } from '../core/transform-runner.js';

import { convertDataToRefs } from './script/data-to-refs.js';
import { convertMethodsToFunctions } from './script/methods-to-functions.js';
import { convertComputedToComputedRef } from './script/computed-to-computed-ref.js';
import { convertWatchToWatchFn } from './script/watch-to-watch-fn.js';
import { convertLifecycleHooks } from './script/lifecycle-hooks.js';
import { convertPropsToDefineProps } from './script/props-to-define-props.js';
import { convertEmitsToDefineEmits } from './script/emits-to-define-emits.js';
import { resolveThisReferences } from './script/resolve-this-references.js';
import { finalizeScriptSetup } from './script/finalize-script-setup.js';

import { removeNativeModifier } from './template/native-modifier.js';
import { convertSlotScope } from './template/slot-scope.js';
import { convertSyncModifier } from './template/sync-modifier.js';
import { convertFilters } from './template/filters.js';

// Order matters for script transforms: each one assumes the output of
// the previous ones. `resolve-this` needs `data`/`props`/`methods` to
// have already run, and `finalize` needs to be last since it cleans up
// whatever `export default` is left behind by everything before it.
export const transformRegistry: TransformRegistry = {
    scriptTransforms: {
        data: convertDataToRefs,
        methods: convertMethodsToFunctions,
        computed: convertComputedToComputedRef,
        watch: convertWatchToWatchFn,
        'lifecycle-hooks': convertLifecycleHooks,
        props: convertPropsToDefineProps,
        emits: convertEmitsToDefineEmits,
        'resolve-this': resolveThisReferences,
        'finalize-script-setup': finalizeScriptSetup,
    },
    templateTransforms: {
        'native-modifier': removeNativeModifier,
        'slot-scope': convertSlotScope,
        'sync-modifier': convertSyncModifier,
        filters: convertFilters,
    },
};