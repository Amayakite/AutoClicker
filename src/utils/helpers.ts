import {ClickPoint} from '../types';

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 将坐标值精确到小数点后三位
 */
export const roundCoordinate = (value: number): number => {
  return Math.round(value * 1000) / 1000;
};

export const calculateJitteredPosition = (
  x: number,
  y: number,
  jitterRange: number,
): {x: number; y: number} => {
  const jitterX = (Math.random() * 2 - 1) * jitterRange;
  const jitterY = (Math.random() * 2 - 1) * jitterRange;
  return {
    x: Math.round(x + jitterX),
    y: Math.round(y + jitterY),
  };
};

export const sortPointsByOrder = (points: ClickPoint[]): ClickPoint[] => {
  return [...points].sort((a, b) => a.order - b.order);
};
