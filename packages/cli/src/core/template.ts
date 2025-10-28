import { resolve } from 'path';
import { mkdirSync } from 'fs';
import { downloadTemplate } from 'giget';

type Options = { targetDir: string, nonInteractive?: boolean };

export async function resolveTemplate(source: string, opts: Options) {
  const target = resolve(process.cwd(), opts.targetDir);
  mkdirSync(target, { recursive: true });
  await downloadTemplate(source, { dir: target });
  return target;
}
