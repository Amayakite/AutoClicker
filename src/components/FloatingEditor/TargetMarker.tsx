import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import {EDITOR_CONFIG} from '../../constants/config';

interface TargetMarkerProps {
  number: number;
  x: number;
  y: number;
  selected: boolean;
  enabled: boolean;
  onSelect: () => void;
}

/**
 * 瞄准镜样式的点位标记组件
 * 显示一个圆形边框 + 十字准心 + 中间数字
 */
const TargetMarker: React.FC<TargetMarkerProps> = ({
  number,
  x,
  y,
  selected,
  enabled,
  onSelect,
}) => {
  const size = EDITOR_CONFIG.MARKER_SIZE;
  const borderWidth = EDITOR_CONFIG.MARKER_BORDER_WIDTH;
  const color = !enabled
    ? EDITOR_CONFIG.MARKER_DISABLED_COLOR
    : selected
    ? EDITOR_CONFIG.MARKER_SELECTED_COLOR
    : EDITOR_CONFIG.MARKER_DEFAULT_COLOR;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          left: x - size / 2,
          top: y - size / 2,
          borderColor: color,
          borderWidth: borderWidth,
        },
      ]}
      onTouchEnd={onSelect}
    >
      {/* 水平准心线 */}
      <View style={[styles.crosshairHorizontal, {backgroundColor: color}]} />
      {/* 垂直准心线 */}
      <View style={[styles.crosshairVertical, {backgroundColor: color}]} />
      {/* 中心圆点和数字 */}
      <View style={[styles.centerCircle, {backgroundColor: color}]}>
        <Text style={styles.number}>{number}</Text>
      </View>
      {/* 坐标提示 */}
      {selected && (
        <View style={styles.coordinateTooltip}>
          <Text style={styles.coordinateText}>
            ({Math.round(x)}, {Math.round(y)})
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 2,
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: '100%',
  },
  centerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    color: '#fff',
    fontSize: EDITOR_CONFIG.MARKER_NUMBER_SIZE,
    fontWeight: 'bold',
  },
  coordinateTooltip: {
    position: 'absolute',
    bottom: -24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coordinateText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default TargetMarker;
