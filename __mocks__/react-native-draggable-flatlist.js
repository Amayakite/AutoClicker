// Mock react-native-draggable-flatlist
const React = require('react');
const { FlatList } = require('react-native');

const DraggableFlatList = (props) => {
  return React.createElement(FlatList, {
    ...props,
    renderItem: (info) => props.renderItem({
      ...info,
      drag: jest.fn(),
      isActive: false,
    }),
  });
};

module.exports = {
  default: DraggableFlatList,
  __esModule: true,
};
