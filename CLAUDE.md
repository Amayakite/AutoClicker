# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoClicker is a React Native Android app that automates screen clicks using Android's Accessibility Service. Users can create **multiple scripts**, each containing a sequence of click points with coordinates, delays, jitter, and drift settings. The app features **cross-app overlay support** with:
- **Cross-app floating editor**: Transparent overlay for adding click points while using other apps
- **Execution control overlay**: Draggable control panel showing real-time execution status
- **Debug mode**: Visual indicators showing where clicks occur
- **In-app visual editor**: Modal-based editor with draggable crosshair markers (fallback mode)

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
  - `globalConfig`: Global settings (vibrationEnabled, debugMode)
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

The app uses native modules to communicate between React Native and Android services:

#### Accessibility Service Bridge
1. **React Native Layer** (`src/native/AccessibilityModule.ts`): TypeScript interface to native methods
2. **Bridge Module** (`android/app/src/main/java/com/autoclicker/AccessibilityModule.kt`): Exposes native methods to JS
3. **Accessibility Service** (`android/app/src/main/java/com/autoclicker/accessibility/AutoClickerService.kt`): Performs gesture dispatch using `dispatchGesture()` API

#### Overlay Service Bridge (Unified Architecture)
1. **UnifiedOverlayService** (`android/app/src/main/java/com/autoclicker/overlay/UnifiedOverlayService.kt`): Foreground service managing all overlays
2. **Overlay Managers**:
   - `DebugOverlayManager`: Canvas-based rendering for click point visualization
   - `ExecutionControlManager`: Draggable control panel for execution status
   - `FloatingEditorManager`: Transparent overlay for cross-app point editing
3. **Bridge Modules**:
   - `OverlayPermissionModule`: Check/request SYSTEM_ALERT_WINDOW permission
   - `DebugOverlayModule`: Show debug click points
   - `ExecutionControlModule`: Control execution overlay
   - `FloatingEditorModule`: Control cross-app editor with event emitters

**Critical Permissions**:
- Accessibility Service must be enabled in Android Settings > Accessibility
- SYSTEM_ALERT_WINDOW permission required for cross-app overlays (API 23+)

### Key Files

#### React Native Layer
- `src/store/clickStore.ts`: Multi-script state management with Zustand
- `src/services/executionEngine.ts`: Click sequence execution with jitter and debug mode
- `src/components/ScriptList.tsx`: Script management UI
- `src/components/FloatingEditor/`: In-app visual point editor (Modal-based)
  - `FloatingEditor.tsx`: Modal container
  - `EditorPanel.tsx`: Draggable control panel
  - `MarkerLayer.tsx`: Manages draggable markers
  - `TargetMarker.tsx`: Crosshair-style point marker
- `src/screens/ConfigScreen.tsx`: Main UI screen with cross-app editor integration
- `src/native/`: TypeScript interfaces for native modules
  - `AccessibilityModule.ts`
  - `OverlayPermissionModule.ts`
  - `DebugOverlayModule.ts`
  - `ExecutionControlModule.ts`
  - `FloatingEditorModule.ts` (with event emitters)

#### Android Native Layer
- `android/app/src/main/java/com/autoclicker/accessibility/AutoClickerService.kt`: Accessibility service
- `android/app/src/main/java/com/autoclicker/overlay/`:
  - `UnifiedOverlayService.kt`: Foreground service managing all overlays
  - `DebugOverlayManager.kt`: Canvas-based debug visualization
  - `DebugCanvasView.kt`: Custom view for drawing click points
  - `ExecutionControlManager.kt`: Execution control overlay
  - `FloatingEditorManager.kt`: Cross-app editor overlay
  - `OverlayPackage.kt`: Registers all overlay modules
  - Bridge modules: `OverlayPermissionModule.kt`, `DebugOverlayModule.kt`, `ExecutionControlModule.kt`, `FloatingEditorModule.kt`
- `android/app/src/main/java/com/autoclicker/MainApplication.kt`: Registers native packages

## Important Constraints

- **Minimum Android Version**: API 24 (Android 7.0)
- **Required Permissions**:
  - Accessibility Service (manual enable in Settings)
  - SYSTEM_ALERT_WINDOW (for cross-app overlays, API 23+)
- **Max Click Points per Script**: 50 (defined in `APP_CONFIG.MAX_POINTS`)
- **Coordinate System**: Uses absolute screen coordinates (pixels, rounded to 3 decimal places)
- **Coordinate Precision**: All coordinates are rounded to 3 decimal places using `roundCoordinate()` helper

## Development Notes

- **Testing Accessibility**: Must test on physical device or emulator with accessibility service enabled
- **Testing Overlays**: Requires SYSTEM_ALERT_WINDOW permission; test cross-app functionality by switching to other apps
- **Debugging Native**: Use `adb logcat` to see Kotlin logs from native modules
- **State Persistence**: Changes to store are automatically persisted; clear app data to reset
- **Editor Modes**:
  - In-app editor: Modal-based with full UI controls (fallback when overlay permission denied)
  - Cross-app editor: Transparent overlay with simplified controls (primary mode)
- **Event Communication**: FloatingEditorModule uses DeviceEventEmitter for native-to-JS events
- **Foreground Service**: UnifiedOverlayService runs as foreground service with notification for stability

## Common Issues

1. **"Accessibility service not enabled" error**: User must enable service in Android Settings > Accessibility > AutoClicker
2. **"Overlay permission required" error**: User must grant SYSTEM_ALERT_WINDOW permission in Settings > Apps > Special access > Display over other apps
3. **Clicks not working**: Verify accessibility service is running via `AutoClickerService.getInstance() != null`
4. **Cross-app editor not showing**: Check overlay permission and ensure UnifiedOverlayService is running
5. **Metro bundler issues**: Clear cache with `pnpm start -- --reset-cache`
6. **Android build failures**: Run `cd android && ./gradlew clean` then rebuild
7. **Debug points not showing**: Enable debug mode in settings and ensure overlay permission is granted
