# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoClicker is a React Native Android app that automates screen clicks using Android's Accessibility Service. Users configure click points with coordinates, delays, jitter, and drift settings, then execute them in sequence.

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
- **Persistence**: Uses AsyncStorage via Zustand middleware to persist points and config
- **Key State**:
  - `points`: Array of ClickPoint objects with coordinates, delays, jitter/drift settings
  - `config`: Global settings (startDelay, loopEnabled, loopCount, vibrationEnabled)
  - `execution`: Runtime state (isRunning, currentIndex, loopIteration)

### Native Bridge Architecture
The app uses a custom native module to communicate between React Native and Android's Accessibility Service:

1. **React Native Layer** (`src/native/AccessibilityModule.ts`): TypeScript interface to native methods
2. **Bridge Module** (`android/app/src/main/java/com/autoclicker/AccessibilityModule.kt`): Exposes native methods to JS via ReactContextBaseJavaModule
3. **Accessibility Service** (`android/app/src/main/java/com/autoclicker/accessibility/AutoClickerService.kt`): Singleton service that performs gesture dispatch using `dispatchGesture()` API
4. **Package Registration** (`android/app/src/main/java/com/autoclicker/AccessibilityPackage.kt`): Registers the native module with React Native in `MainApplication.kt`

**Critical**: The service must be enabled in Android Settings > Accessibility before clicks can be simulated. The singleton pattern ensures the JS layer can check service availability via `getInstance()`.

### Execution Flow
1. User configures click points in UI → saved to Zustand store → persisted to AsyncStorage
2. User presses "Run" → `ExecutionEngine.execute()` called with points and config
3. Engine checks if Accessibility Service is enabled, throws error if not
4. Engine sorts points by order, filters enabled ones
5. Applies startDelay, then loops through points:
   - Calculates jittered position if enabled (random offset within jitterRange)
   - Calls `AccessibilityModule.simulateClick(x, y)` → bridges to Kotlin
   - Kotlin calls `AutoClickerService.performClick()` → creates Path and GestureDescription
   - `dispatchGesture()` simulates the tap
   - Vibrates if enabled, delays by point.delay
6. Repeats loop if loopEnabled (loopCount times or infinite if 0)

### Key Files
- `src/store/clickStore.ts`: All state management logic
- `src/services/executionEngine.ts`: Click sequence execution with jitter/drift
- `android/app/src/main/java/com/autoclicker/accessibility/AutoClickerService.kt`: Accessibility service that performs clicks
- `android/app/src/main/java/com/autoclicker/AccessibilityModule.kt`: React Native bridge to native Android
- `android/app/src/main/java/com/autoclicker/MainApplication.kt`: Registers native modules
- `src/screens/ConfigScreen.tsx`: Main UI screen
- `src/components/ClickPointList.tsx`: Draggable list of click points

## Data Models

### ClickPoint
```typescript
{
  id: string;           // Unique identifier
  order: number;        // Execution order (0-indexed)
  x: number;            // Screen X coordinate
  y: number;            // Screen Y coordinate
  delay: number;        // Delay after click (ms)
  jitter: boolean;      // Enable random position offset
  jitterRange: number;  // Max offset in pixels (±)
  drift: boolean;       // Enable gradual position shift (not fully implemented)
  driftSpeed: number;   // Drift speed (not fully implemented)
  enabled: boolean;     // Whether to execute this point
  name?: string;        // Display name
}
```

### GlobalConfig
```typescript
{
  startDelay: number;        // Delay before first click (ms)
  loopEnabled: boolean;      // Whether to repeat sequence
  loopCount: number;         // Times to repeat (0 = infinite)
  vibrationEnabled: boolean; // Vibrate on each click
}
```

### ExecutionState
```typescript
{
  isRunning: boolean;     // Whether execution is currently active
  currentIndex: number;   // Index of currently executing point
  loopIteration: number;  // Current loop iteration number
  startTime: number;      // Timestamp when execution started
}
```

## Android Native Module

### Accessibility Service Setup
- **Manifest**: Service declared in `AndroidManifest.xml` with `BIND_ACCESSIBILITY_SERVICE` permission
- **Config**: `res/xml/accessibility_service_config.xml` defines service capabilities (`canPerformGestures="true"`)
- **Singleton Pattern**: Service stores static instance on connect, clears on unbind
- **Gesture API**: Uses `GestureDescription.Builder` + `dispatchGesture()` to simulate taps

### Bridge Methods
- `checkPermission()`: Returns whether service is enabled
- `requestPermission()`: Opens Android accessibility settings
- `simulateClick(x, y)`: Dispatches tap gesture at coordinates
- `isServiceEnabled()`: Alias for checkPermission

## Important Constraints

- **Minimum Android Version**: API 24 (Android 7.0)
- **Required Permission**: Accessibility Service must be manually enabled by user
- **Max Click Points**: 50 (defined in `APP_CONFIG.MAX_POINTS`)
- **Coordinate System**: Uses absolute screen coordinates (pixels)
- **Drift Feature**: Declared in types but not fully implemented in execution engine

## Development Notes

- **Testing Accessibility**: Must test on physical device or emulator with accessibility service enabled
- **Debugging Native**: Use `adb logcat` to see Kotlin logs from AccessibilityModule
- **State Persistence**: Changes to store are automatically persisted; clear app data to reset
- **Drag-and-Drop**: Uses `react-native-draggable-flatlist` with `react-native-gesture-handler` and `react-native-reanimated`
- **UI Library**: React Native Paper provides Material Design components
- **Project Documentation**: Spec documents (`AUTO_CLICKER_PROJECT_SPEC.md`, `QUICK_START_GUIDE.md`) are in Chinese
- **Testing**: Minimal test coverage exists (`__tests__/App.test.tsx`); tests should be added when implementing new features

## Common Issues

1. **"Accessibility service not enabled" error**: User must enable service in Android Settings > Accessibility > AutoClicker
2. **Clicks not working**: Verify service is running via `AutoClickerService.getInstance() != null`
3. **Metro bundler issues**: Clear cache with `pnpm start -- --reset-cache`
4. **Android build failures**: Run `cd android && ./gradlew clean` then rebuild
