import type { TemplateTransform } from '../../core/transform-runner.js';

// Vue 2:  <my-button @click.native="onClick">
// Vue 3:  <my-button @click="onClick">

export const removeNativeModifier: TemplateTransform = (templateMarkup) => {
    return templateMarkup.replace(/(@|v-on:)([\w-]+)\.native/g, '$1$2');
};