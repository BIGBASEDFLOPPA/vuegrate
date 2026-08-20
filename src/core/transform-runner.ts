import { parseSFCSource, type ParsedSFC } from './sfc-parser.js';

export type ScriptTransform = (scriptCode: string) => string;
export type TemplateTransform = (templateMarkup: string) => string;

export interface TransformRegistry {
    scriptTransforms: Record<string, ScriptTransform>;
    templateTransforms: Record<string, TemplateTransform>;
}

export interface RunTransformsOptions {
    only?: string[];
}

export interface TransformResult {
    filePath: string;
    originalSource: string;
    transformedSource: string;
    changed: boolean;
}

export function runTransforms(
    filePath: string,
    originalSource: string,
    registry: TransformRegistry,
    options: RunTransformsOptions = {},
): TransformResult {
    const parsed = parseSFCSource(filePath, originalSource);

    const scriptBlock = parsed.descriptor.scriptSetup ?? parsed.descriptor.script;
    let newScriptCode: string | null = null;
    if (scriptBlock) {
        newScriptCode = scriptBlock.content;
        for (const [name, transform] of Object.entries(registry.scriptTransforms)) {
            if (options.only && !options.only.includes(name)) continue;
            newScriptCode = transform(newScriptCode);
        }
    }

    const templateBlock = parsed.descriptor.template;
    let newTemplateMarkup: string | null = null;
    if (templateBlock) {
        newTemplateMarkup = templateBlock.content;
        for (const [name, transform] of Object.entries(registry.templateTransforms)) {
            if (options.only && !options.only.includes(name)) continue;
            newTemplateMarkup = transform(newTemplateMarkup);
        }
    }

    const shouldMarkAsScriptSetup =
        scriptBlock !== undefined &&
        scriptBlock !== null &&
        !parsed.descriptor.scriptSetup &&
        Object.keys(registry.scriptTransforms).length > 0 &&
        newScriptCode !== null;

    const transformedSource = rebuildSource(originalSource, {
        scriptBlock,
        newScriptCode,
        templateBlock,
        newTemplateMarkup,
        markScriptAsSetup: shouldMarkAsScriptSetup,
    });

    return {
        filePath,
        originalSource,
        transformedSource,
        changed: transformedSource !== originalSource,
    };
}

function rebuildSource(
    originalSource: string,
    blocks: {
        scriptBlock: ParsedSFC['descriptor']['script'];
        newScriptCode: string | null;
        templateBlock: ParsedSFC['descriptor']['template'];
        newTemplateMarkup: string | null;
        markScriptAsSetup: boolean;
    },
): string {
    const edits: { start: number; end: number; replacement: string }[] = [];

    if (blocks.scriptBlock && blocks.newScriptCode !== null) {
        edits.push({
            start: blocks.scriptBlock.loc.start.offset,
            end: blocks.scriptBlock.loc.end.offset,
            replacement: blocks.newScriptCode,
        });

        if (blocks.markScriptAsSetup) {
            const tagEdit = addSetupAttributeToScriptTag(originalSource, blocks.scriptBlock.loc.start.offset);
            if (tagEdit) edits.push(tagEdit);
        }
    }

    if (blocks.templateBlock && blocks.newTemplateMarkup !== null) {
        edits.push({
            start: blocks.templateBlock.loc.start.offset,
            end: blocks.templateBlock.loc.end.offset,
            replacement: blocks.newTemplateMarkup,
        });
    }

    edits.sort((a, b) => b.start - a.start);

    let result = originalSource;
    for (const edit of edits) {
        result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
    }

    return result;
}

function addSetupAttributeToScriptTag(
    originalSource: string,
    contentStartOffset: number,
): { start: number; end: number; replacement: string } | null {
    const tagStart = originalSource.lastIndexOf('<script', contentStartOffset);
    if (tagStart === -1) return null;

    const tagText = originalSource.slice(tagStart, contentStartOffset);
    if (/\bsetup\b/.test(tagText)) return null; // already marked as setup

    return {
        start: tagStart,
        end: contentStartOffset,
        replacement: tagText.replace('<script', '<script setup'),
    };
}