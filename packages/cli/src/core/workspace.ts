import { existsSync } from 'fs';
import { join } from 'path';

export function detectWorkspaceRoot(cwd = process.cwd()) {
  const pnpm = join(cwd, 'pnpm-workspace.yaml');
  const npm = join(cwd, 'package.json');
  return existsSync(pnpm) || existsSync(npm) ? cwd : null;
}
