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

    const transformedSource = rebuildSource(originalSource, {
        scriptBlock,
        newScriptCode,
        templateBlock,
        newTemplateMarkup,
    });

    return {
        filePath,
        originalSource,
        transformedSource,
        changed: transformedSource !== originalSource,
    };
}

// Vue's parser gives us exact character offsets for each block, so we
// cut out the old block content and paste in the new content at the
// same spot instead of regenerating the whole file. Everything outside
// the blocks (tags, whitespace, <style>) stays untouched.
function rebuildSource(
    originalSource: string,
    blocks: {
        scriptBlock: ParsedSFC['descriptor']['script'];
        newScriptCode: string | null;
        templateBlock: ParsedSFC['descriptor']['template'];
        newTemplateMarkup: string | null;
    },
): string {
    const edits: { start: number; end: number; replacement: string }[] = [];

    if (blocks.scriptBlock && blocks.newScriptCode !== null) {
        edits.push({
            start: blocks.scriptBlock.loc.start.offset,
            end: blocks.scriptBlock.loc.end.offset,
            replacement: blocks.newScriptCode,
        });
    }

    if (blocks.templateBlock && blocks.newTemplateMarkup !== null) {
        edits.push({
            start: blocks.templateBlock.loc.start.offset,
            end: blocks.templateBlock.loc.end.offset,
            replacement: blocks.newTemplateMarkup,
        });
    }

    // Go from the end of the file backward so earlier offsets don't shift.
    edits.sort((a, b) => b.start - a.start);

    let result = originalSource;
    for (const edit of edits) {
        result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
    }

    return result;
}