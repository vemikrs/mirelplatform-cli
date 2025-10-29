# mirelplatform-cli Coding Instructions

This is a TypeScript-based CLI monorepo built with oclif, managed by pnpm workspaces. The project follows a plugin-based architecture for extensibility.

## Project Overview

- **Type**: CLI tool with plugin system
- **Language**: TypeScript (ESM)
- **Build Tool**: TypeScript Compiler (tsc)
- **Package Manager**: pnpm
- **CLI Framework**: oclif v4
- **Module System**: ES Modules (NodeNext)
- **Node.js**: >=18.0.0

## Architecture

- **Monorepo Structure**: pnpm workspaces with multiple packages
- **Core CLI**: Thin core with plugin extension support
- **Shared Utilities**: Common functionality in `@vemi/mirel-shared`
- **Plugin System**: Plugins can extend commands via oclif
- **Template System**: Project scaffolding via giget

## Code Standards

### TypeScript Configuration

- Use `NodeNext` module resolution for ESM compatibility
- Always include `.js` extensions in relative imports (ESM requirement)
- Configure `outDir: "./dist"` and `rootDir: "./src"` in each package
- Enable `strict`, `resolveJsonModule`, and `skipLibCheck`

### Naming Conventions

- **Files**: kebab-case for files (`load-config.ts`, `version.ts`)
- **Classes**: PascalCase (`Init`, `PlatformDoctor`)
- **Functions**: camelCase (`loadConfig`, `resolveTemplate`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Interfaces/Types**: PascalCase with descriptive names

### Import Guidelines

1. **Always use `.js` extension for relative imports** (ESM requirement):
   ```typescript
   // ✅ Correct
   import { loadConfig } from '../config/loadConfig.js';
   
   // ❌ Wrong
   import { loadConfig } from '../config/loadConfig';
   ```

2. **Import order**:
   - External dependencies (Node.js built-ins, npm packages)
   - Internal workspace packages (`@vemi/*`)
   - Relative imports

3. **Use workspace protocol**: `workspace:*` for internal dependencies

### oclif Commands

- Extend `Command` from `@oclif/core`
- Use static `description` for help text
- Define flags with `Flags` helper
- Use `this.log()` for output, `this.error()` for errors
- Leverage `this.config` for CLI metadata

### Error Handling

- Use descriptive error messages
- Validate inputs before processing
- Use `this.error()` in oclif commands for user-facing errors
- Throw typed errors for library code

### Configuration

- Use `cosmiconfig` for configuration discovery
- Validate with `zod` schemas
- Provide sensible defaults
- Document all config options

## Development Workflow

### Required Before Each Commit

- Run `pnpm typecheck` to ensure type safety
- Run `pnpm build` to verify compilation
- Ensure all `.js` extensions are present in imports

### Build Order

Packages must be built in dependency order:
1. `@vemi/mirel-shared` (no dependencies)
2. `@vemi/mirelplatform-cli` (depends on shared)
3. `@vemi/mirel-promarker` (depends on cli)

### Commands

- **Install**: `pnpm install`
- **Build All**: `pnpm build`
- **Type Check**: `pnpm typecheck`
- **Dev CLI**: `pnpm dev:cli`
- **Build Individual**: `pnpm --filter <package-name> run build`

## Repository Structure

```
/
├── .github/              # GitHub configuration
├── .vscode/              # VS Code settings and tasks
├── packages/
│   ├── cli/             # Core CLI (@vemi/mirelplatform-cli)
│   │   ├── src/
│   │   │   ├── commands/    # oclif commands
│   │   │   ├── config/      # Configuration handling
│   │   │   ├── core/        # Core functionality (plugin, template, workspace)
│   │   │   ├── api/         # Public API exports
│   │   │   └── index.ts     # CLI entry point
│   │   └── package.json
│   ├── shared/          # Shared utilities (@vemi/mirel-shared)
│   │   ├── src/
│   │   │   └── logger.ts    # Logging utilities
│   │   └── package.json
│   └── plugin-promarker/ # Example plugin (@vemi/mirel-promarker)
│       ├── src/
│       │   └── commands/    # Plugin-specific commands
│       └── package.json
├── templates/           # Project templates
├── tsconfig.base.json   # Base TypeScript config
├── pnpm-workspace.yaml  # Workspace configuration
└── package.json         # Root package.json
```

## Key Guidelines

1. **ESM First**: This project uses ES Modules exclusively
2. **Type Safety**: Maintain strict TypeScript checks
3. **Workspace Deps**: Use `workspace:*` for internal packages
4. **Public API**: Only expose via `exports` field in package.json
5. **Plugin Architecture**: Keep core thin, extend via plugins
6. **Template-Based**: Use giget for project scaffolding
7. **Validation**: Use zod for runtime validation
8. **Logging**: Use shared logger from `@vemi/mirel-shared`

## Testing Standards (Future)

- Use Vitest for unit tests
- Test oclif commands in isolation
- Mock external dependencies (giget, execa)
- Aim for >80% coverage on core functionality
- Use descriptive test names

## Documentation

- Add JSDoc for public APIs
- Use TypeScript types as primary documentation
- Keep README.md up to date
- Document breaking changes
- Provide usage examples in command descriptions

## Plugin Development

When creating new plugins:

1. Create package in `packages/` directory
2. Add `oclif.commands` field in package.json
3. Depend on `@vemi/mirelplatform-cli` using `workspace:*`
4. Import from public API: `@vemi/mirelplatform-cli/api`
5. Follow same ESM/TypeScript conventions as core
6. Prefix plugin name with `@vemi/mirel-*`

## VS Code Integration

This project includes VS Code tasks:
- `build: all` - Build all packages (Ctrl+Shift+B)
- `typecheck: all` - Type check all packages
- `dev: cli` - Run CLI in development mode
- `watch: cli/shared` - Watch mode for development

Use tasks for consistent development experience.
