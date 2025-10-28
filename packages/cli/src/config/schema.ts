import { z } from 'zod';

export const TemplateRegistry = z.array(z.string());

export const MirelConfigSchema = z.object({
  workspace: z.object({
    name: z.string().default('vemi-workspace'),
    projectsDir: z.string().default('apps'),
  }).default({} as any),
  templates: z.object({
    registry: TemplateRegistry.default([]),
    defaults: z.object({
      packageManager: z.string().default('pnpm'),
      license: z.string().default('MIT'),
    }).default({} as any)
  }).default({} as any),
  plugins: z.array(z.string()).default([]),
});

export type MirelConfig = z.infer<typeof MirelConfigSchema>;
