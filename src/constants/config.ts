export const APP_CONFIG = {
  MAX_POINTS: 50,
  MIN_DELAY: 0,
  MAX_DELAY: 60000,
  DEFAULT_DELAY: 1000,
  MAX_JITTER_RANGE: 100,
  DEFAULT_JITTER_RANGE: 10,
  MAX_DRIFT_SPEED: 10,
  DEFAULT_DRIFT_SPEED: 1,
};

export const COLORS = {
  primary: '#6200ee',
  accent: '#03dac4',
  background: '#ffffff',
  surface: '#f5f5f5',
  error: '#b00020',
  text: '#000000',
  disabled: '#9e9e9e',
};

// 悬浮编辑器相关配置
export const EDITOR_CONFIG = {
  // 操作面板尺寸
  PANEL_WIDTH: 280,
  PANEL_MIN_HEIGHT: 200,
  PANEL_MAX_HEIGHT: 500,

  // 瞄准镜标记尺寸
  MARKER_SIZE: 60,
  MARKER_BORDER_WIDTH: 3,
  MARKER_NUMBER_SIZE: 18,

  // 颜色
  MARKER_DEFAULT_COLOR: '#2196F3',
  MARKER_SELECTED_COLOR: '#FF9800',
  MARKER_DISABLED_COLOR: '#9E9E9E',
  PANEL_BACKGROUND: 'rgba(0, 0, 0, 0.9)',

  // 动画
  ANIMATION_DURATION: 200,
};
