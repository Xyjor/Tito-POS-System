# Contributing to Shop POS System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Create a feature branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes** following the guidelines below
5. **Test your changes**: `npm run test`
6. **Commit and push**: Follow commit message conventions
7. **Submit a pull request**

## Development Setup

### Prerequisites
- Node.js 16+
- Rust (for Tauri development)
- Git

### Environment Setup
```bash
# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

## Code Standards

### TypeScript
- **Strict mode enabled** - All code must pass TypeScript strict mode
- **Explicit types** - Avoid `any` types; always specify types explicitly
- **Function return types** - Always annotate function return types
- **Named exports** - Prefer named exports over default exports in components

Example:
```typescript
// ✅ Good
export function MyComponent({ title }: { title: string }): JSX.Element {
  return <div>{title}</div>;
}

// ❌ Avoid
export default function MyComponent(props: any) {
  return <div>{props.title}</div>;
}
```

### React Components
- **Functional components** - Use only functional components with hooks
- **Proper hook usage** - Follow hooks rules (don't call hooks conditionally)
- **Memoization** - Use React.memo for expensive components
- **Error boundaries** - Handle errors gracefully
- **Accessibility** - Include proper ARIA labels and semantic HTML

Example:
```typescript
import { memo, useCallback } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button = memo(function Button({
  label,
  onClick,
  disabled = false,
}: ButtonProps): JSX.Element {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {label}
    </button>
  );
});
```

### Styling
- **Tailwind CSS** - Use Tailwind for all styling
- **Consistent naming** - Use consistent class naming conventions
- **Responsive design** - Mobile-first approach with responsive classes
- **Dark mode support** - Consider dark mode in styles

### File Organization
- **One component per file** - Keep components focused and modular
- **Index files** - Use index.ts/tsx for module exports
- **Descriptive names** - Use clear, descriptive file and component names
- **Related files together** - Keep related components in the same directory

## Testing

### Unit Tests
- Write tests for utilities and custom hooks
- Use `vitest` for testing
- Aim for >70% code coverage
- Filename convention: `*.test.ts(x)`

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { roundMoney } from '@lib/currency';

describe('roundMoney', () => {
  it('should round to 2 decimal places', () => {
    expect(roundMoney(10.556)).toBe(10.56);
  });

  it('should handle negative numbers', () => {
    expect(roundMoney(-10.556)).toBe(-10.56);
  });
});
```

### Running Tests
```bash
npm run test           # Run all tests
npm run test:ui        # Run with UI
npm run test:coverage  # Generate coverage report
```

## Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring without feature change
- `test` - Test additions or modifications
- `docs` - Documentation changes
- `chore` - Dependency or tooling changes
- `style` - Formatting changes (no logic changes)
- `perf` - Performance improvements

**Examples:**
- `feat(pos): add discount input field`
- `fix(cart): prevent negative quantity in cart`
- `refactor(types): extract payment type definitions`
- `test(currency): add roundMoney unit tests`
- `docs(readme): update installation instructions`

## Pull Request Process

1. **Update tests** - Add tests for new features
2. **Update documentation** - Update README if needed
3. **Run quality checks** - Ensure all checks pass:
   ```bash
   npm run type-check
   npm run lint:fix
   npm run format
   npm run test
   ```
4. **Create descriptive PR** - Include:
   - What changes were made
   - Why they were made
   - How to test the changes
   - Any related issues (#issue-number)
5. **Address feedback** - Respond to review comments

## Code Review Guidelines

**Reviewers should check:**
- Code follows project standards
- Tests are included and pass
- No unnecessary dependencies added
- Documentation is updated
- Commit messages are clear
- No breaking changes

**Contributors should:**
- Be open to feedback
- Ask questions if unclear
- Make requested changes
- Be respectful and professional

## Performance Guidelines

- **Avoid unnecessary re-renders** - Use React.memo, useMemo, useCallback
- **Code split routes** - Use React.lazy for route components
- **Optimize images** - Compress images before committing
- **Bundle size** - Be aware of bundle size impact
- **Lazy load heavy components** - Load on demand when possible

## Accessibility Standards

- **Semantic HTML** - Use proper HTML elements
- **ARIA labels** - Add aria-label where needed
- **Keyboard navigation** - Ensure keyboard accessibility
- **Color contrast** - Maintain sufficient contrast ratios
- **Screen readers** - Test with screen readers when possible

## Documentation Standards

- **JSDoc comments** - Document complex functions
- **README updates** - Update docs for new features
- **Type definitions** - Keep types documented
- **Error messages** - Make error messages helpful

Example:
```typescript
/**
 * Rounds a monetary value to 2 decimal places
 * @param amount - The amount to round
 * @returns The rounded amount
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
```

## Security Considerations

- **No hardcoded secrets** - Use environment variables
- **Validate input** - Always validate user input
- **Sanitize output** - Escape HTML when needed
- **Dependencies** - Keep dependencies up to date
- **SQL Injection** - Use parameterized queries

## Reporting Issues

When reporting bugs:
1. Use descriptive titles
2. Include steps to reproduce
3. Include expected vs actual behavior
4. Add screenshots/videos if applicable
5. Include system information
6. Include any error messages

## Feature Requests

When requesting features:
1. Clearly describe the feature
2. Explain the use case
3. Consider existing alternatives
4. Include mockups if helpful

## Questions?

- Check existing issues and discussions
- Review documentation
- Ask in pull request comments
- Reach out respectfully

---

Thank you for contributing! Your help makes this project better for everyone.
