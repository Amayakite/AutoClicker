import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ClickPoint, GlobalConfig, ExecutionState} from '../types';
import {generateId} from '../utils/helpers';
import {APP_CONFIG} from '../constants/config';

interface ClickStore {
  points: ClickPoint[];
  config: GlobalConfig;
  execution: ExecutionState;

  addPoint: (x: number, y: number) => void;
  updatePoint: (id: string, updates: Partial<ClickPoint>) => void;
  deletePoint: (id: string) => void;
  reorderPoints: (newOrder: ClickPoint[]) => void;
  togglePoint: (id: string) => void;
  updateConfig: (updates: Partial<GlobalConfig>) => void;
  startExecution: () => void;
  stopExecution: () => void;
  updateExecutionState: (updates: Partial<ExecutionState>) => void;
  clearAllPoints: () => void;
}

export const useClickStore = create<ClickStore>()(
  persist(
    (set, get) => ({
      points: [],
      config: {
        startDelay: 0,
        loopEnabled: false,
        loopCount: 1,
        vibrationEnabled: true,
      },
      execution: {
        isRunning: false,
        currentIndex: 0,
        loopIteration: 0,
        startTime: 0,
      },

      addPoint: (x: number, y: number) => {
        const points = get().points;
        if (points.length >= APP_CONFIG.MAX_POINTS) {
          return;
        }

        const newPoint: ClickPoint = {
          id: generateId(),
          order: points.length,
          x,
          y,
          delay: APP_CONFIG.DEFAULT_DELAY,
          jitter: false,
          jitterRange: APP_CONFIG.DEFAULT_JITTER_RANGE,
          drift: false,
          driftSpeed: APP_CONFIG.DEFAULT_DRIFT_SPEED,
          enabled: true,
          name: `点 ${points.length + 1}`,
        };

        set({points: [...points, newPoint]});
      },

      updatePoint: (id: string, updates: Partial<ClickPoint>) =>
        set(state => ({
          points: state.points.map(p => (p.id === id ? {...p, ...updates} : p)),
        })),

      deletePoint: (id: string) =>
        set(state => ({
          points: state.points
            .filter(p => p.id !== id)
            .map((p, index) => ({...p, order: index})),
        })),

      reorderPoints: (newOrder: ClickPoint[]) =>
        set({
          points: newOrder.map((p, index) => ({...p, order: index})),
        }),

      togglePoint: (id: string) =>
        set(state => ({
          points: state.points.map(p =>
            p.id === id ? {...p, enabled: !p.enabled} : p,
          ),
        })),

      updateConfig: (updates: Partial<GlobalConfig>) =>
        set(state => ({
          config: {...state.config, ...updates},
        })),

      startExecution: () =>
        set(state => ({
          execution: {
            ...state.execution,
            isRunning: true,
            currentIndex: 0,
            loopIteration: 0,
            startTime: Date.now(),
          },
        })),

      stopExecution: () =>
        set(state => ({
          execution: {
            ...state.execution,
            isRunning: false,
          },
        })),

      updateExecutionState: (updates: Partial<ExecutionState>) =>
        set(state => ({
          execution: {...state.execution, ...updates},
        })),

      clearAllPoints: () => set({points: []}),
    }),
    {
      name: 'click-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
