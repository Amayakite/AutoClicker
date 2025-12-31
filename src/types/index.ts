export interface ClickPoint {
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

export interface GlobalConfig {
  startDelay: number;
  loopEnabled: boolean;
  loopCount: number;
  vibrationEnabled: boolean;
}

export interface ExecutionState {
  isRunning: boolean;
  currentIndex: number;
  loopIteration: number;
  startTime: number;
}
