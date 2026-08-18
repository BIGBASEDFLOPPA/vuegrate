import { readFile } from 'node:fs/promises';
import { parse, type SFCDescriptor } from '@vue/compiler-sfc';

export interface ParsedSFC {
    filePath: string;
    descriptor: SFCDescriptor;
}

export class SFCParseError extends Error {
    constructor(
        public filePath: string,
        public parseErrors: (string | Error)[],
    ) {
        super(`Failed to parse ${filePath}: ${parseErrors.map(String).join('; ')}`);
        this.name = 'SFCParseError';
    }
}

export async function parseSFCFile(filePath: string): Promise<ParsedSFC> {
    const source = await readFile(filePath, 'utf-8');
    return parseSFCSource(filePath, source);
}

// Takes raw source instead of a file path, mainly so tests can pass
// a string directly without touching disk.
export function parseSFCSource(filePath: string, source: string): ParsedSFC {
    const { descriptor, errors } = parse(source, { filename: filePath });

    if (errors.length > 0) {
        throw new SFCParseError(filePath, errors);
    }

    return { filePath, descriptor };
}

export function getScriptBlock(parsed: ParsedSFC): { content: string; isSetup: boolean } | null {
    const { descriptor } = parsed;

    if (descriptor.scriptSetup) {
        return { content: descriptor.scriptSetup.content, isSetup: true };
    }

    if (descriptor.script) {
        return { content: descriptor.script.content, isSetup: false };
    }

    return null;
}