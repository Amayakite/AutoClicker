# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoClicker is a React Native Android app that automates screen clicks using Android's Accessibility Service. Users can create **multiple scripts**, each containing a sequence of click points with coordinates, delays, jitter, and drift settings. The app features a **floating visual editor** with draggable crosshair markers for intuitive point positioning.

## Common Commands

### Development
```bash
pnpm install              # Install dependencies
pnpm start                # Start Metro bundler
pnpm android              # Run on Android device/emulator
pnpm test                 # Run Jest tests
pnpm lint                 # Run ESLint
```

### Building
```bash
cd android && ./gradlew assembleDebug     # Build debug APK
cd android && ./gradlew assembleRelease   # Build release APK
cd android && ./gradlew bundleRelease     # Build AAB for Play Store
```

### Troubleshooting
```bash
pnpm start -- --reset-cache               # Clear Metro cache
cd android && ./gradlew clean             # Clean Android build
rm -rf node_modules && pnpm install       # Reinstall dependencies
```

## Architecture

### State Management (Zustand)
- **Store**: `src/store/clickStore.ts` - Single source of truth for all app state
- **Persistence**: Uses AsyncStorage via Zustand middleware to persist scripts and config
- **Key State**:
  - `scripts`: Array of Script objects, each containing points array and config
  - `activeScriptId`: Currently selected script
  - `globalConfig`: Global settings (vibrationEnabled)
  - `execution`: Runtime state (isRunning, currentIndex, loopIteration, activeScriptId)

### Data Models

#### Script
```typescript
{
  id: string;
  name: string;
  description?: string;
  points: ClickPoint[];
  config: ScriptConfig;      // startDelay, loopEnabled, loopCount
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
}
```

#### ClickPoint
```typescript
{
  id: string;
  order: number;
  x: number;
  y: number;
  delay: number;
  jitter: boolean;
  jitterRange: number;
  drift: boolean;
  driftSpeed: number;
  enabled: boolean;
  name?: string;
}
```

### Native Bridge Architecture
The app uses a custom native module to communicate between React Native and Android's Accessibility Service:

1. **React Native Layer** (`src/native/AccessibilityModule.ts`): TypeScript interface to native methods
2. **Bridge Module** (`android/app/src/main/java/com/autoclicker/AccessibilityModule.kt`): Exposes native methods to JS via ReactContextBaseJavaModule
3. **Accessibility Service** (`android/app/src/main/java/com/autoclicker/accessibility/AutoClickerService.kt`): Singleton service that performs gesture dispatch using `dispatchGesture()` API

**Critical**: The service must be enabled in Android Settings > Accessibility before clicks can be simulated.

### Key Files
- `src/store/clickStore.ts`: Multi-script state management
- `src/services/executionEngine.ts`: Click sequence execution with jitter
- `src/components/ScriptList.tsx`: Script management UI
- `src/components/FloatingEditor/`: Visual point editor
  - `FloatingEditor.tsx`: Modal container
  - `EditorPanel.tsx`: Draggable control panel
  - `MarkerLayer.tsx`: Manages draggable markers
  - `TargetMarker.tsx`: Crosshair-style point marker
- `src/screens/ConfigScreen.tsx`: Main UI screen
- `android/.../AutoClickerService.kt`: Accessibility service

## Important Constraints

- **Minimum Android Version**: API 24 (Android 7.0)
- **Required Permission**: Accessibility Service must be manually enabled by user
- **Max Click Points per Script**: 50 (defined in `APP_CONFIG.MAX_POINTS`)
- **Coordinate System**: Uses absolute screen coordinates (pixels)

## Development Notes

- **Testing Accessibility**: Must test on physical device or emulator with accessibility service enabled
- **Debugging Native**: Use `adb logcat` to see Kotlin logs from AccessibilityModule
- **State Persistence**: Changes to store are automatically persisted; clear app data to reset
- **Floating Editor**: Uses Modal + PanResponder for draggable UI elements

## Common Issues

1. **"Accessibility service not enabled" error**: User must enable service in Android Settings > Accessibility > AutoClicker
2. **Clicks not working**: Verify service is running via `AutoClickerService.getInstance() != null`
3. **Metro bundler issues**: Clear cache with `pnpm start -- --reset-cache`
4. **Android build failures**: Run `cd android && ./gradlew clean` then rebuild
