// src/components/core/Loader.jsx

import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { M3eLoader } from "material-loader-react-native";
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SIZE_MAP = { small: 24, medium: 36, large: 48, xlarge: 60 };

const Loader = ({
   loading = true,
   inline = false,
   position = 'left', // 'left' | 'center' | 'right'
   text = '',
   size = 'medium', // 'small' | 'medium' | 'large'
   color,
   style,
   overlayOpacity = 0.4,
}) => {
   const { theme } = useTheme();
   const spinnerSize = SIZE_MAP[size] || SIZE_MAP.medium;
   const spinnerColor = color || theme.colors.spinnerColor;

   if (!loading) return null;

   // ---- Inline Layout ----
   if (inline) {
      let justifyContent = 'flex-start';
      if (position === 'center') justifyContent = 'center';
      else if (position === 'right') justifyContent = 'flex-end';

      return (
         <View style={[styles.inlineWrapper, { justifyContent }, style]}>
            <M3eLoader color={spinnerColor} size={spinnerSize} duration={1500} />
            {text ? (
               <Text style={[styles.inlineText, { color: theme.colors.onSurface }]}>{text}</Text>
            ) : null}
         </View>
      );
   }

   // ---- Full-screen Modal Layout ----
   return (
      <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]}>
         <View style={[styles.loaderBox, { backgroundColor: theme.colors.surface, borderRadius: 16 }]}>
            <M3eLoader color={spinnerColor} size={spinnerSize} />
            {text ? (
               <Text style={[styles.text, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>
                  {text}
               </Text>
            ) : null}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   inlineWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
   inlineText: { fontSize: 14, fontWeight: '500', marginLeft: 8 },
   overlay: { position: 'absolute', top: 0, left: 0, width, height, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
   loaderBox: { padding: 20, alignItems: 'center', justifyContent: 'center', minWidth: 120 },
   text: { fontSize: 16, fontWeight: '500' },
});

export default Loader;
