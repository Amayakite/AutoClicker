import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

interface AccessibilityModuleInterface {
  checkPermission(): Promise<boolean>;
  requestPermission(): Promise<void>;
  simulateClick(x: number, y: number): Promise<void>;
  isServiceEnabled(): Promise<boolean>;
  isServiceRunning(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const {AccessibilityModule} = NativeModules;

export const AccessibilityEvents = Platform.OS === 'android' 
  ? new NativeEventEmitter(AccessibilityModule)
  : null;

export default AccessibilityModule as AccessibilityModuleInterface;
