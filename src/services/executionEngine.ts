import {ClickPoint, GlobalConfig} from '../types';
import {delay, calculateJitteredPosition, sortPointsByOrder} from '../utils/helpers';
import AccessibilityModule from '../native/AccessibilityModule';
import {Vibration} from 'react-native';

export class ExecutionEngine {
  private isRunning = false;
  private shouldStop = false;

  async execute(
    points: ClickPoint[],
    config: GlobalConfig,
    onProgress?: (index: number, iteration: number) => void,
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('Execution already in progress');
    }

    const serviceEnabled = await AccessibilityModule.isServiceEnabled();
    if (!serviceEnabled) {
      throw new Error('Accessibility service not enabled');
    }

    this.isRunning = true;
    this.shouldStop = false;

    try {
      const enabledPoints = sortPointsByOrder(points).filter(p => p.enabled);

      if (enabledPoints.length === 0) {
        throw new Error('No enabled click points');
      }

      await delay(config.startDelay);

      let iteration = 0;
      do {
        for (let i = 0; i < enabledPoints.length; i++) {
          if (this.shouldStop) {
            return;
          }

          const point = enabledPoints[i];
          onProgress?.(i, iteration);

          let x = point.x;
          let y = point.y;

          if (point.jitter) {
            const jittered = calculateJitteredPosition(x, y, point.jitterRange);
            x = jittered.x;
            y = jittered.y;
          }

          await AccessibilityModule.simulateClick(x, y);

          if (config.vibrationEnabled) {
            Vibration.vibrate(50);
          }

          await delay(point.delay);
        }

        iteration++;
      } while (
        !this.shouldStop &&
        config.loopEnabled &&
        (config.loopCount === 0 || iteration < config.loopCount)
      );
    } finally {
      this.isRunning = false;
      this.shouldStop = false;
    }
  }

  stop(): void {
    this.shouldStop = true;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const executionEngine = new ExecutionEngine();
