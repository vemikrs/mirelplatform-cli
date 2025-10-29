---
applyTo: "**/*.test.ts"
---

## Test File Guidelines

### Framework: Vitest

This project will use Vitest for testing when tests are implemented.

### File Naming

- Test files: `*.test.ts`
- Test utilities: `test-utils.ts` or `fixtures.ts`
- Place tests next to source files or in `__tests__` directories

```
src/
  commands/
    init.ts
    init.test.ts          # ✅ Test next to source
  __tests__/
    integration/          # ✅ Or in __tests__ directory
      init.test.ts
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MyClass } from './my-class.js';

describe('MyClass', () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should perform expected behavior', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = instance.method(input);

    // Assert
    expect(result).toBe('expected');
  });

  it('should handle error cases', () => {
    expect(() => instance.method('')).toThrow('Invalid input');
  });
});
```

### Testing oclif Commands

```typescript
import { runCommand } from '@oclif/test';
import { expect, it, describe } from 'vitest';

describe('init command', () => {
  it('should create a new project', async () => {
    const { stdout } = await runCommand(['init', '--name', 'test-project']);
    expect(stdout).toContain('Created test-project');
  });

  it('should fail without required args', async () => {
    await expect(runCommand(['init'])).rejects.toThrow();
  });
});
```

### Mocking External Dependencies

```typescript
import { vi } from 'vitest';

// Mock external module
vi.mock('giget', () => ({
  downloadTemplate: vi.fn().mockResolvedValue('/path/to/template'),
}));

// Mock file system
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn().mockReturnValue('content'),
}));

// Use in test
import { downloadTemplate } from 'giget';

it('should download template', async () => {
  await myFunction();
  expect(downloadTemplate).toHaveBeenCalledWith(
    'template-source',
    expect.objectContaining({ dir: expect.any(String) })
  );
});
```

### Async Testing

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

it('should handle promises rejection', async () => {
  await expect(failingAsyncFunction()).rejects.toThrow('Error message');
});
```

### Snapshot Testing

```typescript
it('should generate expected config', () => {
  const config = generateConfig();
  expect(config).toMatchSnapshot();
});

// Update snapshots with: vitest -u
```

### Coverage Goals

- Aim for >80% coverage
- Focus on business logic and edge cases
- Don't test framework code (oclif internals)
- Mock external dependencies (network, file system)

### Test Utilities

```typescript
// test-utils.ts
export function createMockConfig(overrides = {}) {
  return {
    name: 'test',
    version: '1.0.0',
    ...overrides,
  };
}

export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}
```

### Integration Tests

```typescript
describe('init command integration', () => {
  it('should create complete project structure', async () => {
    const tmpDir = await createTempDir();
    
    try {
      await runCommand(['init', '--name', tmpDir, '--yes']);
      
      expect(fs.existsSync(path.join(tmpDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src'))).toBe(true);
    } finally {
      await cleanup(tmpDir);
    }
  });
});
```

### Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive names**: Test names should describe expected behavior
3. **One assertion per test**: Keep tests focused
4. **Mock external dependencies**: Don't make real network/file system calls
5. **Clean up**: Always clean up resources in afterEach
6. **Test edge cases**: Empty inputs, null, undefined, error cases
7. **Avoid test interdependence**: Each test should run independently

### Examples

```typescript
// ✅ Good: Clear, focused test
it('should validate email format', () => {
  expect(isValidEmail('user@example.com')).toBe(true);
  expect(isValidEmail('invalid')).toBe(false);
});

// ✅ Good: Tests error case
it('should throw when config is invalid', () => {
  expect(() => loadConfig({})).toThrow('Invalid configuration');
});

// ✅ Good: Mocks dependencies
it('should call template resolver with correct args', async () => {
  const mockResolver = vi.fn();
  await createProject('test', mockResolver);
  expect(mockResolver).toHaveBeenCalledWith('test', expect.any(Object));
});

// ❌ Bad: Multiple unrelated assertions
it('should work', () => {
  expect(func1()).toBe(true);
  expect(func2()).toBe(false);
  expect(func3()).toBeUndefined();
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test -- --watch

# Run with coverage
pnpm test -- --coverage

# Run specific file
pnpm test path/to/file.test.ts
```
