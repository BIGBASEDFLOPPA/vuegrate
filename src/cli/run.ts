import { readFile, writeFile } from 'node:fs/promises';
import { cac } from 'cac';
import pc from 'picocolors';
import { scanFiles } from '../core/file-scanner.js';
import { runTransforms } from '../core/transform-runner.js';
import { transformRegistry } from '../transforms/registry.js';
import { renderDiff } from './diff.js';

const cli = cac('vuegrate');

cli
    .command('[path]', 'Path to the directory or file to migrate')
    .option('--dry-run', 'Show a diff of changes without writing to disk')
    .option('--only <transforms>', 'Apply only the specified transforms (comma-separated)')
    .option('--ext <extensions>', 'File extensions to process', {
        default: '.vue',
    })
    .example('vuegrate ./src')
    .example('vuegrate ./src --dry-run')
    .example('vuegrate ./src --only=data,methods,props')
    .action(async (path: string | undefined, options) => {
        if (!path) {
            console.error(pc.red('Error: please provide a path to a directory or file.'));
            console.log('Example: vuegrate ./src');
            process.exit(1);
        }

        const extensions: string[] = String(options.ext)
            .split(',')
            .map((ext) => ext.trim());

        let files: string[];
        try {
            files = await scanFiles(path, { extensions });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(pc.red(`Scan failed: ${message}`));
            process.exit(1);
        }

        if (files.length === 0) {
            console.log(pc.yellow('No files found.'));
            return;
        }

        const only: string[] | undefined = options.only
            ? String(options.only).split(',').map((name) => name.trim())
            : undefined;

        let changedCount = 0;
        let unchangedCount = 0;

        for (const file of files) {
            const source = await readFile(file, 'utf-8');

            let result;
            try {
                result = runTransforms(file, source, transformRegistry, { only });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(pc.red(`Failed to transform ${file}: ${message}`));
                continue;
            }

            if (!result.changed) {
                unchangedCount++;
                continue;
            }

            changedCount++;

            if (options.dryRun) {
                console.log(pc.bold(file));
                console.log(renderDiff(result.originalSource, result.transformedSource));
                console.log();
            } else {
                await writeFile(file, result.transformedSource, 'utf-8');
                console.log(pc.green(`Updated ${file}`));
            }
        }

        console.log(pc.cyan(`\n${changedCount} file(s) changed, ${unchangedCount} unchanged.`));

        if (options.dryRun && changedCount > 0) {
            console.log(pc.dim('Run without --dry-run to write these changes.'));
        }
    });

cli.help();
cli.version('0.1.0');

cli.parse();