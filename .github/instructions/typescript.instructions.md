---
applyTo: "**/*.ts"
---

## TypeScript File Guidelines

### Import Requirements

**CRITICAL**: Always use `.js` extension for relative imports (ESM requirement):

```typescript
// ✅ Correct - Will resolve to .ts during compilation
import { MyType } from './types.js';
import { helper } from '../utils/helper.js';

// ❌ Wrong - Will fail at runtime
import { MyType } from './types';
import { helper } from '../utils/helper';
```

### Import Order

1. Node.js built-ins
2. External packages
3. Workspace packages (`@vemijp/*`)
4. Relative imports (with `.js` extension)

```typescript
// Node.js built-ins
import { resolve } from 'path';
import { readFileSync } from 'fs';

// External packages
import { Command, Flags } from '@oclif/core';
import { z } from 'zod';

// Workspace packages
import { logger } from '@vemijp/mirel-shared';

// Relative imports (note .js extension)
import { loadConfig } from '../config/loadConfig.js';
import type { Config } from '../types/config.js';
```

### Type Definitions

- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and primitives
- Export types that are part of public API
- Use `import type` for type-only imports when possible

```typescript
// ✅ Prefer interface for objects
export interface CommandConfig {
  name: string;
  description: string;
}

// ✅ Use type for unions
export type LogLevel = 'info' | 'warn' | 'error';

// ✅ Type-only import
import type { CommandConfig } from './types.js';
```

### Async/Await

- Always use `async/await` over `.then()/.catch()`
- Prefer top-level `await` (supported in ESM)
- Handle errors appropriately

```typescript
// ✅ Good
async function loadData() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    logger.error('Failed to load data:', error);
    throw error;
  }
}

// ✅ Top-level await (in entry files)
await run(process.argv.slice(2), import.meta.url).catch(handle);
```

### Function Declarations

- Use `function` for top-level functions
- Use arrow functions for callbacks and inline functions
- Prefer explicit return types for public APIs

```typescript
// ✅ Top-level function with return type
export function parseConfig(raw: unknown): Config {
  return schema.parse(raw);
}

// ✅ Arrow function for callback
const items = data.filter((item) => item.active);
```

### oclif Command Files

```typescript
import { Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

export default class MyCommand extends Command {
  static description = 'Brief description of what this command does';

  static examples = [
    '<%= config.bin %> <%= command.id %> --flag value',
  ];

  static flags = {
    flag: Flags.string({
      char: 'f',
      description: 'Description of flag',
      required: false,
    }),
  };

  static args = {
    name: Args.string({
      description: 'Argument description',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MyCommand);
    
    // Command logic here
    this.log('Output message');
  }
}
```

### Error Handling in Commands

```typescript
// ✅ Use this.error() for user-facing errors
if (!validInput) {
  this.error('Invalid input provided', { exit: 1 });
}

// ✅ Use this.warn() for warnings
this.warn('This feature is experimental');

// ✅ Catch and handle async errors
async run() {
  try {
    await this.doSomething();
  } catch (error) {
    this.error(error instanceof Error ? error.message : 'Unknown error');
  }
}
```

### Configuration Files

```typescript
import { z } from 'zod';

// ✅ Define schema first
export const ConfigSchema = z.object({
  setting: z.string().default('value'),
  optional: z.number().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// ✅ Validate with descriptive errors
export function validateConfig(raw: unknown): Config {
  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid configuration: ${JSON.stringify(result.error.issues, null, 2)}`
    );
  }
  return result.data;
}
```

### File Organization

- One default export per file (for oclif commands)
- Named exports for utilities and types
- Keep files focused and single-purpose
- Group related functionality in directories

### Comments and Documentation

```typescript
/**
 * Brief description of function
 *
 * @param param - Description of parameter
 * @returns Description of return value
 * @throws {Error} When validation fails
 */
export function myFunction(param: string): Result {
  // Implementation comments for complex logic
  return result;
}
```

### ESM-Specific Patterns

```typescript
// ✅ Use import.meta.url instead of __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Top-level await
const config = await loadConfig();

// ✅ Dynamic imports
const module = await import('./dynamic-module.js');
```

### Avoid

- ❌ Omitting `.js` in relative imports
- ❌ Using `require()` (use `import` instead)
- ❌ Using `module.exports` (use `export` instead)
- ❌ Using `__dirname` without ESM conversion
- ❌ Mixing CommonJS and ESM patterns
- ❌ Ignoring TypeScript errors with `@ts-ignore`
