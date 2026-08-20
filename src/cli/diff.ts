import { diffLines } from 'diff';
import pc from 'picocolors';

export function renderDiff(originalSource: string, transformedSource: string): string {
    const changes = diffLines(originalSource, transformedSource);
    const lines: string[] = [];

    for (const change of changes) {
        const color = change.added ? pc.green : change.removed ? pc.red : pc.dim;
        const prefix = change.added ? '+' : change.removed ? '-' : ' ';

        for (const line of change.value.replace(/\n$/, '').split('\n')) {
            lines.push(color(`${prefix} ${line}`));
        }
    }

    return lines.join('\n');
}