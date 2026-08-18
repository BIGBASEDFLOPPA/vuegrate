import { cac } from 'cac';
import pc from 'picocolors';
import { scanFiles } from '../core/file-scanner.js';

const cli = cac('vuegrate');

cli
    .command('[path]', 'Path to the directory or file to migrate')
    .option('--dry-run', 'Show a diff of changes without writing to disk')
    .option('--only <transforms>', 'Apply only the specified transforms (comma-separated)')
    .option('--ext <extensions>', 'File extensions to process', {
        default: '.vue,.js,.ts',
    })
    .example('vuegrate ./src')
    .example('vuegrate ./src --dry-run')
    .example('vuegrate ./src --only=options-api,v-model')
    .action(async (path: string | undefined, options) => {
        if (!path) {
            console.error(pc.red('Error: please provide a path to a directory or file.'));
            console.log('Example: vuegrate ./src');
            process.exit(1);
        }

        console.log(pc.cyan(`vuegrate: scanning ${path}`));

        if (options.dryRun) {
            console.log(pc.yellow('Dry-run mode: no files will be modified.'));
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

        console.log(pc.green(`Found ${files.length} file(s):`));
        for (const file of files) {
            console.log(pc.dim(`  ${file}`));
        }

        // TODO: transform-runner → diff/write
    });

cli.help();
cli.version('0.1.0');

cli.parse();