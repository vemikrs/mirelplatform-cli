import { cosmiconfig } from 'cosmiconfig';
import { MirelConfigSchema, MirelConfig } from './schema.js';

export async function loadConfig(cwd: string = process.cwd()): Promise<MirelConfig> {
  const explorer = cosmiconfig('mirel');
  const result = await explorer.search(cwd);
  const raw = result?.config ?? {};
  const parsed = MirelConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('mirel config invalid: ' + JSON.stringify(parsed.error.issues, null, 2));
  }
  return parsed.data;
}
