import type {TemplateTransform} from '../../core/transform-runner.js';

//     Vue 2:  <my-input :title.sync="pageTitle" />
//     Vue 3:  <my-input v-model:title="pageTitle" />

export const convertSlotScope: TemplateTransform = (templateMarkup) => {
    return templateMarkup.replace(/<template\b([^>]*)>/g, (fullTag, attrs) => {
        const slotName = attrs.match(/\sslot=["']([\w-]+)["']/)?.[1];
        const scopeVar = attrs.match(/\sslot-scope=["']([\w-]+)["']/)?.[1];

        if (!slotName && !scopeVar) return fullTag;

        const remainingAttrs = attrs
            .replace(/\sslot=["'][\w-]+["']/, '')
            .replace(/\sslot-scope=["'][\w-]+["']/, '');

        let vSlot: string;
        if (slotName && scopeVar) {
            vSlot = `v-slot:${slotName}="${scopeVar}"`;
        } else if (scopeVar) {
            vSlot = `v-slot="${scopeVar}"`;
        } else {
            vSlot = `v-slot:${slotName}`;
        }

        return `<template ${vSlot}${remainingAttrs}>`;
    });
};
