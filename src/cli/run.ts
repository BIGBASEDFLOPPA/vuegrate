import { cac } from 'cac';
import pc from 'picocolors';
import { scanFiles } from '../core/file-scanner.js';

const cli = cac('vuegrate');

cli
    .command('[path]', 'Путь к директории или файлу для миграции')
    .option('--dry-run', 'Показать diff изменений без записи на диск')
    .option('--only <transforms>', 'Применить только указанные трансформации (через запятую)')
    .option('--ext <extensions>', 'Расширения файлов для обработки', {
        default: '.vue,.js,.ts',
    })
    .example('vuegrate ./src')
    .example('vuegrate ./src --dry-run')
    .example('vuegrate ./src --only=options-api,v-model')
    .action(async (path: string | undefined, options) => {
        if (!path) {
            console.error(pc.red('Ошибка: укажи путь к директории или файлу.'));
            console.log('Пример: vuegrate ./src');
            process.exit(1);
        }

        console.log(pc.cyan(`vuegrate: сканирую ${path}`));

        if (options.dryRun) {
            console.log(pc.yellow('Режим --dry-run: файлы не будут изменены.'));
        }

        const extensions: string[] = String(options.ext)
            .split(',')
            .map((ext) => ext.trim());

        let files: string[];
        try {
            files = await scanFiles(path, { extensions });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(pc.red(`Ошибка при сканировании: ${message}`));
            process.exit(1);
        }

        if (files.length === 0) {
            console.log(pc.yellow('Файлы не найдены.'));
            return;
        }

        console.log(pc.green(`Найдено файлов: ${files.length}`));
        for (const file of files) {
            console.log(pc.dim(`  ${file}`));
        }

    });

cli.help();
cli.version('0.1.0');

cli.parse();