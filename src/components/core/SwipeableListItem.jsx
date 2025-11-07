// src/components/core/SwipeableListItem.jsx

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Button from './Button';
import IconButton from './IconButton';
import React, { forwardRef } from 'react';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTheme } from '../../context/ThemeContext';

const SwipeableListItem = forwardRef(
  ({ leftActions = [], rightActions = [], children, style }, ref) => {
    const { theme } = useTheme();

    const renderActions = (actions, isLeft = true) => {
      return (
        <View style={[styles.actionsContainer, { flexDirection: isLeft ? 'row' : 'row-reverse' }]}>
          {actions.map((action, index) => {
            // ✅ CASE 1: IconButton
            if (action.buttonType === 'iconButton') {
              return (
                <IconButton
                  key={index}
                  iconName={action.iconName}
                  onPress={action.onPress}
                  mode="filled"
                  type={action.type || 'primary'}
                  style={{ marginHorizontal: 4 }}
                />
              );
            }

            // ✅ CASE 2: Custom Button component
            if (action.buttonType === 'button') {
              return (
                <Button
                  key={index}
                  title={action.label}
                  onPress={action.onPress}
                  type={action.type || 'primary'}
                  mode="contained"
                  iconName={action.iconName}
                  style={{ marginHorizontal: 4, height: '100%', borderRadius: 16 }}
                />
              );
            }

            // ✅ CASE 3: Fallback TouchableOpacity
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: action.color || theme.colors.primary,
                  },
                  style,
                ]}
                onPress={action.onPress}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    };
    return (
      <Swipeable
        ref={ref}
        renderLeftActions={() => (leftActions.length > 0 ? renderActions(leftActions, true) : null)}
        renderRightActions={() =>
          rightActions.length > 0 ? renderActions(rightActions, false) : null
        }
      >
        {children}
      </Swipeable>
    );
  },
);

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 4,
  },
});

export default SwipeableListItem;
