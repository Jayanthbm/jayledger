// src/components/core/Divider.jsx

import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Divider({
   orientation = 'horizontal', // 'horizontal' | 'vertical'
   thickness = 1,
   margin = 8,
   style,
}) {
   const { theme } = useTheme();

   const dividerStyle =
      orientation === 'horizontal'
         ? {
            height: thickness,
            width: '100%',
            marginVertical: margin,
            backgroundColor: theme.colors.onSurfaceVariant,
         }
         : {
            width: thickness,
            height: '100%',
            marginHorizontal: margin,
            backgroundColor: theme.colors.onSurfaceVariant,
         };

   return <View style={[dividerStyle, style]} />;
}
