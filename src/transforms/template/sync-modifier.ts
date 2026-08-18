import type { TemplateTransform } from '../../core/transform-runner.js';

// Vue 2:  <my-input :title.sync="pageTitle" />
// Vue 3:  <my-input v-model:title="pageTitle" />

export const convertSyncModifier: TemplateTransform = (templateMarkup) => {
    return templateMarkup.replace(
        /(:|v-bind:)([\w-]+)\.sync=(["'])([^"']+)\3/g,
        (fullMatch, bindPrefix, propName, quote, boundValue) => {
            return `v-model:${propName}=${quote}${boundValue}${quote}`;
        },
    );
};