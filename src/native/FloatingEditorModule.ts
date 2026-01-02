import {NativeModules, DeviceEventEmitter} from 'react-native';

interface FloatingEditorModuleType {
  show(scriptId?: string): Promise<void>;
  hide(): Promise<void>;
}

const {FloatingEditorModule} = NativeModules;

export default FloatingEditorModule as FloatingEditorModuleType;

// Event types
export interface FloatingEditorPointAddedEvent {
  x: number;
  y: number;
  scriptId: string;
}

export interface FloatingEditorDoneEvent {
  scriptId: string;
}

export interface FloatingEditorCancelEvent {
  scriptId: string;
}

export interface FloatingEditorUndoEvent {
  scriptId: string;
}

export interface FloatingEditorClearEvent {
  scriptId: string;
}

// Event listeners
export const addFloatingEditorPointAddedListener = (
  callback: (event: FloatingEditorPointAddedEvent) => void,
) => {
  return DeviceEventEmitter.addListener('onFloatingEditorPointAdded', callback);
};

export const addFloatingEditorDoneListener = (
  callback: (event: FloatingEditorDoneEvent) => void,
) => {
  return DeviceEventEmitter.addListener('onFloatingEditorDone', callback);
};

export const addFloatingEditorCancelListener = (
  callback: (event: FloatingEditorCancelEvent) => void,
) => {
  return DeviceEventEmitter.addListener('onFloatingEditorCancel', callback);
};

export const addFloatingEditorUndoListener = (
  callback: (event: FloatingEditorUndoEvent) => void,
) => {
  return DeviceEventEmitter.addListener('onFloatingEditorUndo', callback);
};

export const addFloatingEditorClearListener = (
  callback: (event: FloatingEditorClearEvent) => void,
) => {
  return DeviceEventEmitter.addListener('onFloatingEditorClear', callback);
};
