import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.vuegrate-tmp']);

export interface ScanOptions {
    /** Список расширений для поиска */
    extensions: string[];
}

/**
 * Рекурсивно находит все файлы по указанному пути, кроме ignored.
 * Принимает как путь к директории, так и путь к одному файлу.
 */
export async function scanFiles(targetPath: string, options: ScanOptions): Promise<string[]> {
    const stats = await stat(targetPath);

    if (stats.isFile()) {
        return matchesExtension(targetPath, options.extensions) ? [targetPath] : [];
    }

    if (stats.isDirectory()) {
        return scanDirectory(targetPath, options);
    }

    return [];
}

async function scanDirectory(dirPath: string, options: ScanOptions): Promise<string[]> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
            if (IGNORED_DIRS.has(entry.name)) continue;
            const nested = await scanDirectory(fullPath, options);
            results.push(...nested);
            continue;
        }

        if (entry.isFile() && matchesExtension(fullPath, options.extensions)) {
            results.push(fullPath);
        }
    }

    return results;
}

function matchesExtension(filePath: string, extensions: string[]): boolean {
    const ext = extname(filePath);
    return extensions.includes(ext);
}