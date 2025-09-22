# ESLint Issues Report

*Generated on: September 22, 2025*

## Summary

- **Total Issues**: 35 (33 errors, 2 warnings)
- **Auto-fixable**: 1 warning
- **Files Affected**: 8

## Issues by Category

### TypeScript Type Safety Issues

#### `@typescript-eslint/no-explicit-any` (27 errors)
Using `any` type instead of specific TypeScript types reduces type safety.

**shared/env.ts**
- Line 1:41 - Unexpected any. Specify a different type
- Line 7:37 - Unexpected any. Specify a different type
- Line 18:53 - Unexpected any. Specify a different type
- Line 19:29 - Unexpected any. Specify a different type

**tests/api-model-selection.test.ts**
- Line 25:40 - Unexpected any. Specify a different type
- Line 36:10 - Unexpected any. Specify a different type
- Line 54:10 - Unexpected any. Specify a different type
- Line 72:10 - Unexpected any. Specify a different type
- Line 86:10 - Unexpected any. Specify a different type
- Line 101:12 - Unexpected any. Specify a different type
- Line 105:12 - Unexpected any. Specify a different type

**tests/history-delete-ui.test.tsx**
- Line 28:20 - Unexpected any. Specify a different type
- Line 29:20 - Unexpected any. Specify a different type

**tests/pdf-route.test.ts**
- Line 57:44 - Unexpected any. Specify a different type
- Line 60:37 - Unexpected any. Specify a different type
- Line 71:58 - Unexpected any. Specify a different type
- Line 74:37 - Unexpected any. Specify a different type

**tests/summary-delete.test.ts**
- Line 93:55 - Unexpected any. Specify a different type
- Line 96:46 - Unexpected any. Specify a different type
- Line 112:68 - Unexpected any. Specify a different type
- Line 115:46 - Unexpected any. Specify a different type
- Line 128:66 - Unexpected any. Specify a different type
- Line 131:46 - Unexpected any. Specify a different type
- Line 169:49 - Unexpected any. Specify a different type
- Line 172:70 - Unexpected any. Specify a different type
- Line 184:82 - Unexpected any. Specify a different type
- Line 187:80 - Unexpected any. Specify a different type
- Line 204:55 - Unexpected any. Specify a different type
- Line 207:46 - Unexpected any. Specify a different type

### React Performance & Best Practices

#### `react-refresh/only-export-components` (3 errors)
Fast refresh only works when files export only React components. Non-component exports should be moved to separate files.

**src/context/model-context.tsx**
- Line 19:17 - Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components
- Line 27:17 - Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components
- Line 31:17 - Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components

#### `react-hooks/exhaustive-deps` (1 warning)
React Hook useEffect has missing dependencies in its dependency array.

**src/components/BatchImportModal.tsx**
- Line 138:6 - React Hook useEffect has a missing dependency: 'submissionError'. Either include it or remove the dependency array

### Code Quality Issues

#### `@typescript-eslint/no-unused-vars` (1 error)
Variables are assigned values but never used.

**src/hooks/useBatchImportQueue.ts**
- Line 641:26 - '_removed' is assigned a value but never used

#### Unused ESLint Disable Directive (1 warning)
ESLint disable comments that are no longer needed.

**tests/api-model-selection.test.ts**
- Line 24:3 - Unused eslint-disable directive (no problems were reported from 'no-var')

## Priority Recommendations

### High Priority
1. **Fix React refresh issues** in `src/context/model-context.tsx` - Move non-component exports to separate utility files
2. **Remove unused variables** in `src/hooks/useBatchImportQueue.ts`

### Medium Priority
1. **Replace `any` types** with specific TypeScript types throughout the codebase
2. **Fix React hooks dependencies** in `src/components/BatchImportModal.tsx`

### Low Priority
1. **Clean up unused ESLint disable directives**

## Auto-fix Options

Some issues can be automatically fixed:

```bash
# Run ESLint with auto-fix
cd WatchLater
npm run lint -- --fix
```

This will fix the auto-fixable warning (unused eslint-disable directive).

## Files Needing Attention

| File | Errors | Warnings | Total Issues |
|------|--------|----------|--------------|
| `tests/summary-delete.test.ts` | 12 | 0 | 12 |
| `tests/api-model-selection.test.ts` | 7 | 1 | 8 |
| `shared/env.ts` | 4 | 0 | 4 |
| `src/context/model-context.tsx` | 3 | 0 | 3 |
| `tests/pdf-route.test.ts` | 4 | 0 | 4 |
| `tests/history-delete-ui.test.tsx` | 2 | 0 | 2 |
| `src/hooks/useBatchImportQueue.ts` | 1 | 0 | 1 |
| `src/components/BatchImportModal.tsx` | 0 | 1 | 1 |

## Next Steps

1. Review and fix high-priority React performance issues
2. Gradually replace `any` types with proper TypeScript types
3. Consider adding stricter ESLint rules to prevent future `any` usage
4. Run linting in CI/CD pipeline before merging code changes

