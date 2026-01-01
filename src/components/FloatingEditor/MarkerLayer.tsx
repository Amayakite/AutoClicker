import React, {useRef} from 'react';
import {View, StyleSheet, Dimensions, PanResponder} from 'react-native';
import {ClickPoint} from '../../types';
import {EDITOR_CONFIG} from '../../constants/config';
import TargetMarker from './TargetMarker';

interface DraggableMarkerProps {
  point: ClickPoint;
  selected: boolean;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
}

/**
 * 可拖动的瞄准镜标记
 */
const DraggableMarker: React.FC<DraggableMarkerProps> = ({
  point,
  selected,
  onSelect,
  onPositionChange,
}) => {
  const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
  const positionRef = useRef({x: point.x, y: point.y});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
        positionRef.current = {x: point.x, y: point.y};
      },
      onPanResponderMove: (_, gestureState) => {
        const halfSize = EDITOR_CONFIG.MARKER_SIZE / 2;
        const newX = Math.max(
          halfSize,
          Math.min(screenWidth - halfSize, positionRef.current.x + gestureState.dx),
        );
        const newY = Math.max(
          halfSize,
          Math.min(screenHeight - halfSize, positionRef.current.y + gestureState.dy),
        );
        onPositionChange(newX, newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const halfSize = EDITOR_CONFIG.MARKER_SIZE / 2;
        const newX = Math.max(
          halfSize,
          Math.min(screenWidth - halfSize, positionRef.current.x + gestureState.dx),
        );
        const newY = Math.max(
          halfSize,
          Math.min(screenHeight - halfSize, positionRef.current.y + gestureState.dy),
        );
        onPositionChange(newX, newY);
      },
    }),
  ).current;

  return (
    <View
      style={[
        styles.draggableContainer,
        {
          left: point.x - EDITOR_CONFIG.MARKER_SIZE / 2,
          top: point.y - EDITOR_CONFIG.MARKER_SIZE / 2,
          width: EDITOR_CONFIG.MARKER_SIZE,
          height: EDITOR_CONFIG.MARKER_SIZE,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TargetMarker
        number={point.order + 1}
        x={EDITOR_CONFIG.MARKER_SIZE / 2}
        y={EDITOR_CONFIG.MARKER_SIZE / 2}
        selected={selected}
        enabled={point.enabled}
        onSelect={onSelect}
      />
    </View>
  );
};

interface MarkerLayerProps {
  points: ClickPoint[];
  selectedPointId: string | null;
  onSelectPoint: (pointId: string) => void;
  onUpdatePointPosition: (pointId: string, x: number, y: number) => void;
}

/**
 * 标记层：管理所有可拖动的点位标记
 */
const MarkerLayer: React.FC<MarkerLayerProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  onUpdatePointPosition,
}) => {
  return (
    <View style={styles.layer} pointerEvents="box-none">
      {points.map(point => (
        <DraggableMarker
          key={point.id}
          point={point}
          selected={selectedPointId === point.id}
          onSelect={() => onSelectPoint(point.id)}
          onPositionChange={(x, y) => onUpdatePointPosition(point.id, x, y)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  draggableContainer: {
    position: 'absolute',
  },
});

export default MarkerLayer;
