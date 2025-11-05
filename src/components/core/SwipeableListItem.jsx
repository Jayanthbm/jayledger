// src/components/core/SwipeableListItem.jsx

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import React from 'react';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useTheme } from '../../context/ThemeContext';

const SwipeableListItem = ({
   leftActions = [],
   rightActions = [],
   children,
   style,
}) => {
   const { theme } = useTheme();

   const renderActions = (actions, isLeft = true) => {
      return actions.map((action, index) => (
         <TouchableOpacity
            key={index}
            style={[
               styles.actionButton,
               {
                  backgroundColor: action.color || theme.colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
               },
               style
            ]}
            onPress={action.onPress}
         >
            <Text style={{ color: '#fff', fontWeight: '600' }}>{action.label}</Text>
         </TouchableOpacity>
      ));
   };

   return (
      <Swipeable
         renderLeftActions={() => (leftActions.length > 0 ? <View style={styles.actionsContainer}>{renderActions(leftActions)}</View> : null)}
         renderRightActions={() => (rightActions.length > 0 ? <View style={styles.actionsContainer}>{renderActions(rightActions)}</View> : null)}
      >
         {children}
      </Swipeable>
   );
};

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
   },
});

export default SwipeableListItem;
