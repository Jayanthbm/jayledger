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
         <View style={[styles.itemContainer, { backgroundColor: theme.colors.surface }, style]}>
            {children}
         </View>
      </Swipeable>
   );
};

const styles = StyleSheet.create({
   itemContainer: {
      paddingVertical: 12,
      paddingHorizontal: 16,
   },
   actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   actionButton: {
      width: 80,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
   },
});

export default SwipeableListItem;
