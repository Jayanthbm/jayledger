// src/components/core/Button.jsx

import { Pressable, StyleSheet, Text, View } from "react-native";

import Loader from "./Loader";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function Button({
   title,
   onPress,
   mode = "contained", // 'contained' | 'outlined' | 'text'
   iconName,
   iconColor,
   iconSize = 20,
   type = "primary", // 'primary' | 'warning' | 'danger' | 'disabled'
   style,
   loading = false,
   disabled = false,
   keyName = "",
}) {
   const { theme } = useTheme();
   const colors = theme.colors;

   // 🎨 Palette by type
   const colorMap = {
      primary: {
         bg: colors.primaryContainer,
         onBg: colors.onPrimaryContainer,
         border: colors.primary,
      },
      warning: {
         bg: "#FFF4E5",
         onBg: "#8A6100",
         border: "#FFB300",
      },
      danger: {
         bg: colors.errorContainer,
         onBg: colors.onErrorContainer,
         border: colors.error,
      },
      disabled: {
         bg: colors.surfaceVariant,
         onBg: colors.onSurfaceVariant,
         border: colors.outline,
      },
   };
   const palette = colorMap[type] || colorMap.primary;

   // 💅 Mode colors
   let backgroundColor, textColor, borderColor, elevation;

   switch (mode) {
      case "outlined":
         backgroundColor = "transparent";
         textColor = palette.border;
         borderColor = palette.border;
         elevation = 0;
         break;
      case "text":
         backgroundColor = "transparent";
         textColor = palette.border;
         borderColor = "transparent";
         elevation = 0;
         break;
      default: // contained
         backgroundColor = palette.bg;
         textColor = palette.onBg;
         borderColor = "transparent";
         elevation = 2;
   }

   const iconDisplayColor = iconColor || textColor;

   return (
      <Pressable
            key={`${theme.mode}-${keyName}`}
            onPress={onPress}
            disabled={loading || disabled}
            android_ripple={{ color: colors.surfaceVariant }}
            style={({ pressed }) => [
               styles.button,
               {
                  backgroundColor,
                  borderColor,
                 opacity: disabled ? 0.6 : 1,
                 transform: [{ scale: pressed ? 0.97 : 1 }],
                 flexDirection: "row",
              },
              style,
           ]}
      >
            {loading ? (
               <Loader inline position="center" size="small" variant="contained" />
            ) : (
               <>
                  {iconName && (
                     <View style={styles.iconContainer}>
                        <MaterialDesignIcons
                           name={iconName}
                           color={iconDisplayColor}
                           size={iconSize}
                        />
                     </View>
                  )}
                  <Text style={[styles.text, { color: textColor }]}>{title}</Text>
               </>
            )}
      </Pressable>
   );
}

const styles = StyleSheet.create({

   button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
   },
   text: {
      fontWeight: "600",
      fontSize: 16,
   },
   iconContainer: {
      marginRight: 8,
      alignItems: "center",
      justifyContent: "center",
   },
});