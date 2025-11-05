// src/components/app/ViewModeToggle.jsx

import { Animated, Pressable, StyleSheet, View } from "react-native";
import React, { useEffect, useRef } from "react";

import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { useTheme } from "../../context/ThemeContext";

const ViewModeToggle = ({ viewMode, setViewMode }) => {
   const { theme } = useTheme();
   const anim = useRef(new Animated.Value(viewMode === "list" ? 0 : 1)).current;

   // Animate pill on mode change
   useEffect(() => {
      Animated.spring(anim, {
         toValue: viewMode === "list" ? 0 : 1,
         useNativeDriver: true,
         friction: 8,
         tension: 80,
      }).start();
   }, [viewMode]);

   const tabWidth = 48; // width per icon segment
   const translateX = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, tabWidth], // move pill between two icons
   });

   return (
      <View
         style={[
            styles.container,
            { backgroundColor: theme.colors.surfaceVariant },
         ]}
      >
         {/* Animated pill behind icons */}
         <Animated.View
            style={[
               styles.activePill,
               {
                  backgroundColor: theme.colors.activeIndicator,
                  transform: [{ translateX }],
               },
            ]}
         />

         {/* List Icon */}
         <Pressable
            onPress={() => setViewMode("list")}
            style={styles.iconWrapper}
            android_ripple={
               {
                  color: theme.colors.onSurfaceVariant + "22",
                  borderless: false,
                  foreground: true,
               }
            }
         >
            <MaterialDesignIcons
               name="format-list-bulleted"
               size={22}
               color={theme.colors.onSurfaceVariant}
            />
         </Pressable>

         {/* Grid Icon */}
         <Pressable
            onPress={() => setViewMode("grid")}
            style={styles.iconWrapper}
            android_ripple={
               {
                  color: theme.colors.onSurfaceVariant + "22",
                  borderless: false,
                  foreground: true,
               }
            }
         >
            <MaterialDesignIcons
               name="view-grid"
               size={22}
               color={theme.colors.onSurfaceVariant}
            />
         </Pressable>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flexDirection: "row",
      borderRadius: 18,
      overflow: "hidden",
      padding: 2,
      position: "relative",
      elevation: 1,
   },
   activePill: {
      position: "absolute",
      height: 50,
      width: 50,
      borderRadius: 18,
   },
   iconWrapper: {
      width: 48,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
   },
});

export default ViewModeToggle;
