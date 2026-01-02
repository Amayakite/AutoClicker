import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ClickPoint, GlobalConfig, ExecutionState, Script, ScriptConfig} from '../types';
import {generateId} from '../utils/helpers';
import {APP_CONFIG} from '../constants/config';

interface ClickStore {
  // 脚本管理
  scripts: Script[];
  activeScriptId: string | null;

  // 全局配置
  globalConfig: GlobalConfig;
  execution: ExecutionState;

  // 脚本操作
  addScript: (name: string, description?: string) => string;
  updateScript: (id: string, updates: Partial<Script>) => void;
  deleteScript: (id: string) => void;
  setActiveScript: (id: string | null) => void;
  duplicateScript: (id: string) => void;
  toggleScript: (id: string) => void;

  // 点击点操作（基于脚本）
  addPointToScript: (scriptId: string, x: number, y: number) => void;
  updatePointInScript: (scriptId: string, pointId: string, updates: Partial<ClickPoint>) => void;
  deletePointFromScript: (scriptId: string, pointId: string) => void;
  reorderPointsInScript: (scriptId: string, newOrder: ClickPoint[]) => void;
  togglePointInScript: (scriptId: string, pointId: string) => void;
  clearPointsInScript: (scriptId: string) => void;

  // 全局配置操作
  updateGlobalConfig: (updates: Partial<GlobalConfig>) => void;

  // 执行状态操作
  startExecution: (scriptId: string) => void;
  stopExecution: () => void;
  updateExecutionState: (updates: Partial<ExecutionState>) => void;

  // 便捷方法：获取当前活跃脚本
  getActiveScript: () => Script | null;
  getScriptById: (id: string) => Script | null;
}

const createDefaultScriptConfig = (): ScriptConfig => ({
  startDelay: 0,
  loopEnabled: false,
  loopCount: 1,
});

const createDefaultPoint = (order: number, x: number, y: number): ClickPoint => ({
  id: generateId(),
  order,
  x,
  y,
  delay: APP_CONFIG.DEFAULT_DELAY,
  jitter: false,
  jitterRange: APP_CONFIG.DEFAULT_JITTER_RANGE,
  drift: false,
  driftSpeed: APP_CONFIG.DEFAULT_DRIFT_SPEED,
  enabled: true,
  name: `点 ${order + 1}`,
});

export const useClickStore = create<ClickStore>()(
  persist(
    (set, get) => ({
      scripts: [],
      activeScriptId: null,

      globalConfig: {
        startDelay: 0,
        loopEnabled: false,
        loopCount: 1,
        vibrationEnabled: true,
        debugMode: false,
      },

      execution: {
        isRunning: false,
        currentIndex: 0,
        loopIteration: 0,
        startTime: 0,
        activeScriptId: null,
      },

      // 脚本操作
      addScript: (name: string, description?: string) => {
        const id = generateId();
        const now = Date.now();
        const newScript: Script = {
          id,
          name,
          description,
          points: [],
          config: createDefaultScriptConfig(),
          createdAt: now,
          updatedAt: now,
          enabled: true,
        };

        set(state => ({
          scripts: [...state.scripts, newScript],
          activeScriptId: id,
        }));

        return id;
      },

      updateScript: (id: string, updates: Partial<Script>) =>
        set(state => ({
          scripts: state.scripts.map(s =>
            s.id === id ? {...s, ...updates, updatedAt: Date.now()} : s,
          ),
        })),

      deleteScript: (id: string) =>
        set(state => ({
          scripts: state.scripts.filter(s => s.id !== id),
          activeScriptId: state.activeScriptId === id ? null : state.activeScriptId,
        })),

      setActiveScript: (id: string | null) =>
        set({activeScriptId: id}),

      duplicateScript: (id: string) => {
        const currentState = get();
        const script = currentState.scripts.find(s => s.id === id);
        if (!script) return;

        const newId = generateId();
        const now = Date.now();
        const newScript: Script = {
          ...script,
          id: newId,
          name: `${script.name} (副本)`,
          points: script.points.map(p => ({...p, id: generateId()})),
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          scripts: [...state.scripts, newScript],
        }));
      },

      toggleScript: (id: string) =>
        set(state => ({
          scripts: state.scripts.map(s =>
            s.id === id ? {...s, enabled: !s.enabled, updatedAt: Date.now()} : s,
          ),
        })),

      // 点击点操作
      addPointToScript: (scriptId: string, x: number, y: number) =>
        set(state => ({
          scripts: state.scripts.map(s => {
            if (s.id !== scriptId) return s;
            if (s.points.length >= APP_CONFIG.MAX_POINTS) return s;

            const newPoint = createDefaultPoint(s.points.length, x, y);
            return {
              ...s,
              points: [...s.points, newPoint],
              updatedAt: Date.now(),
            };
          }),
        })),

      updatePointInScript: (scriptId: string, pointId: string, updates: Partial<ClickPoint>) =>
        set(state => ({
          scripts: state.scripts.map(s => {
            if (s.id !== scriptId) return s;
            return {
              ...s,
              points: s.points.map(p =>
                p.id === pointId ? {...p, ...updates} : p,
              ),
              updatedAt: Date.now(),
            };
          }),
        })),

      deletePointFromScript: (scriptId: string, pointId: string) =>
        set(state => ({
          scripts: state.scripts.map(s => {
            if (s.id !== scriptId) return s;
            return {
              ...s,
              points: s.points
                .filter(p => p.id !== pointId)
                .map((p, index) => ({...p, order: index})),
              updatedAt: Date.now(),
            };
          }),
        })),

      reorderPointsInScript: (scriptId: string, newOrder: ClickPoint[]) =>
        set(state => ({
          scripts: state.scripts.map(s => {
            if (s.id !== scriptId) return s;
            return {
              ...s,
              points: newOrder.map((p, index) => ({...p, order: index})),
              updatedAt: Date.now(),
            };
          }),
        })),

      togglePointInScript: (scriptId: string, pointId: string) =>
        set(state => ({
          scripts: state.scripts.map(s => {
            if (s.id !== scriptId) return s;
            return {
              ...s,
              points: s.points.map(p =>
                p.id === pointId ? {...p, enabled: !p.enabled} : p,
              ),
              updatedAt: Date.now(),
            };
          }),
        })),

      clearPointsInScript: (scriptId: string) =>
        set(state => ({
          scripts: state.scripts.map(s => {
            if (s.id !== scriptId) return s;
            return {
              ...s,
              points: [],
              updatedAt: Date.now(),
            };
          }),
        })),

      // 全局配置操作
      updateGlobalConfig: (updates: Partial<GlobalConfig>) =>
        set(state => ({
          globalConfig: {...state.globalConfig, ...updates},
        })),

      // 执行状态操作
      startExecution: (scriptId: string) =>
        set(state => ({
          execution: {
            ...state.execution,
            isRunning: true,
            currentIndex: 0,
            loopIteration: 0,
            startTime: Date.now(),
            activeScriptId: scriptId,
          },
        })),

      stopExecution: () =>
        set(state => ({
          execution: {
            ...state.execution,
            isRunning: false,
            activeScriptId: null,
          },
        })),

      updateExecutionState: (updates: Partial<ExecutionState>) =>
        set(state => ({
          execution: {...state.execution, ...updates},
        })),

      // 便捷方法
      getActiveScript: () => {
        const state = get();
        if (!state.activeScriptId) return null;
        return state.scripts.find(s => s.id === state.activeScriptId) || null;
      },

      getScriptById: (id: string) => {
        const state = get();
        return state.scripts.find(s => s.id === id) || null;
      },
    }),
    {
      name: 'click-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
      // 仅持久化必要数据
      partialize: (state) => ({
        scripts: state.scripts,
        activeScriptId: state.activeScriptId,
        globalConfig: state.globalConfig,
      }),
    },
  ),
);
