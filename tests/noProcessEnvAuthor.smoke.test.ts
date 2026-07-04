import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Smoke test: Verify no `process.env.AUTHOR` references remain in source files.
 *
 * Validates: Requirements 6.4
 *
 * This test uses grep to search all .ts and .tsx files (excluding node_modules
 * and .next) for any occurrence of `process.env.AUTHOR`. The codebase should
 * have zero matches after the migration to header-based author resolution.
 */

describe('Smoke: no process.env.AUTHOR in source', () => {
    it('should find zero references to process.env.AUTHOR in .ts/.tsx files', () => {
        const projectRoot = path.resolve(__dirname, '..');

        // Use grep to search for process.env.AUTHOR in .ts and .tsx files,
        // excluding node_modules, .next, and this test file itself.
        // grep exits with code 1 when no matches are found, which is what we want.
        let matches = '';
        try {
            matches = execSync(
                'grep -r "process\\.env\\.AUTHOR" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next --exclude="noProcessEnvAuthor.smoke.test.ts" .',
                { cwd: projectRoot, encoding: 'utf-8' }
            );
        } catch (error: unknown) {
            // grep exits with code 1 when no matches found — that's the success case
            const execError = error as { status?: number; stdout?: string };
            if (execError.status === 1) {
                matches = '';
            } else {
                throw error;
            }
        }

        expect(matches).toBe('');
    });
});
