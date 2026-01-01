# AutoClicker - AI Agent Instructions

## Project Overview

React Native **Android-only** app that automates screen clicks via Android Accessibility Service.

**Tech Stack:** React Native 0.83.1, TypeScript, Zustand, React Native Paper, Kotlin  
**Requirements:** Node.js 22+, pnpm 10+, JDK 17, Android SDK (min API 26)

> 📖 Full specs: [AUTO_CLICKER_PROJECT_SPEC.md](../AUTO_CLICKER_PROJECT_SPEC.md) | Quick start: [QUICK_START_GUIDE.md](../QUICK_START_GUIDE.md)

## Architecture

```
ConfigScreen.tsx → ExecutionEngine → AccessibilityModule.ts
                                           ↓
                              AccessibilityModule.kt (Native bridge)
                                           ↓
                              AutoClickerService.kt (dispatchGesture)
```

**Key constraint:** Accessibility Service must be enabled in Android Settings before clicks work.

> 📖 Details: [CLAUDE.md](../CLAUDE.md) | [docs/02-core-implementation.md](../docs/02-core-implementation.md)

## Commands

```bash
pnpm install && pnpm start    # Install & run Metro
pnpm android                  # Run on device/emulator
pnpm test && pnpm lint        # Test & lint
cd android && ./gradlew assembleDebug   # Build APK
```

> 📖 Build guide: [docs/07-complete-build-guide.md](../docs/07-complete-build-guide.md) | CI/CD: [docs/04-github-actions-guide.md](../docs/04-github-actions-guide.md)

## Key Files

| Purpose | File |
|---------|------|
| State store | [src/store/clickStore.ts](../src/store/clickStore.ts) |
| Types | [src/types/index.ts](../src/types/index.ts) |
| Execution | [src/services/executionEngine.ts](../src/services/executionEngine.ts) |
| Native bridge (TS) | [src/native/AccessibilityModule.ts](../src/native/AccessibilityModule.ts) |
| Native bridge (Kotlin) | [android/.../AccessibilityModule.kt](../android/app/src/main/java/com/autoclicker/AccessibilityModule.kt) |
| Accessibility Service | [android/.../AutoClickerService.kt](../android/app/src/main/java/com/autoclicker/accessibility/AutoClickerService.kt) |

## Conventions

- **Naming:** Components `PascalCase`, functions `camelCase`, constants `UPPER_SNAKE_CASE`
- **Commits:** `<type>(<scope>): <subject>` (feat, fix, docs, refactor, test, chore)
- **Drift feature:** Fields exist in `ClickPoint` but logic NOT YET IMPLEMENTED

## Common Tasks

**Add native method:** TS interface → `AccessibilityModule.kt` → `AutoClickerService.kt` (if gesture)

**Add click point property:** `src/types/index.ts` → `clickStore.ts` → `ClickPointList.tsx` → `executionEngine.ts`

> 📖 Project structure: [docs/00-project-summary.md](../docs/00-project-summary.md)
