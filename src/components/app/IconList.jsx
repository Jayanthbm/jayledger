// src/components/app/IconList.jsx

import { Pressable, View } from 'react-native';

import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import Text from '../core/Text';
import { useTheme } from '../../context/ThemeContext';

const IconList = ({ leftIcon, keyName = "", title, subtitle = "", onPress, rightContent }) => {
   const { theme } = useTheme();
   return (
      <Pressable
         key={`${theme.mode}-${keyName}`}
         style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 12,
            borderRadius: 16,
            marginVertical: 4, backgroundColor: theme.colors.surface
         }}
         android_ripple={{ color: theme.colors.surfaceVariant }}
         onPress={onPress}
      >
         <MaterialDesignIcons
            name={leftIcon}
            size={22}
            color={theme.colors.primary}
            style={{
               marginRight: 14,
            }}
         />

         <View style={{ flex: 1 }}>
            <Text variant="subtitle" style={{
               fontSize: 18
            }}>
               {title}
            </Text>
            {subtitle && (
               <Text variant="caption"
                  style={{
                     fontSize: 15,
                  }}
               >
                  {subtitle}
               </Text>
            )}
         </View>
         {rightContent}
      </Pressable>
   );
};

export default IconList;