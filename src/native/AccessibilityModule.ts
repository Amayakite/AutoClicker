import {NativeModules} from 'react-native';

interface AccessibilityModuleInterface {
  checkPermission(): Promise<boolean>;
  requestPermission(): Promise<void>;
  simulateClick(x: number, y: number): Promise<void>;
  isServiceEnabled(): Promise<boolean>;
}

const {AccessibilityModule} = NativeModules;

export default AccessibilityModule as AccessibilityModuleInterface;
