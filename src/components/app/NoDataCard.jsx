import { Pressable, StyleSheet, View } from "react-native";

import { Ionicons } from '@react-native-vector-icons/ionicons';
// src/components/app/NoDataCard.js
import React from "react";
import Text from "../core/Text";
import { useTheme } from "../../context/ThemeContext";

const NoDataCard = ({
   title = "No data available",
   icon = "alert-circle-outline",
   actionLabel = "Clear",
   onActionPress,
}) => {
   const { theme } = useTheme();

   return (
      <View
         style={[
            styles.container,
            {
               backgroundColor: theme.colors.surface,
               borderColor: theme.colors.outlineVariant,
               shadowColor: theme.colors.shadow,
            },
         ]}
      >
         <Ionicons
            name={icon}
            size={48}
            color={theme.colors.onSurfaceVariant}
            style={{ marginBottom: 8 }}
         />
         <Text
            style={[
               styles.title,
               { color: theme.colors.onSurfaceVariant },
            ]}
         >
            {title}
         </Text>

         {onActionPress && (
            <Pressable
               onPress={onActionPress}
               style={({ pressed }) => [
                  styles.button,
                  {
                     backgroundColor: pressed
                        ? theme.colors.surfaceVariant
                        : "transparent",
                  },
               ]}
            >
               <Text
                  style={[
                     styles.actionLabel,
                     { color: theme.colors.primary },
                  ]}
               >
                  {actionLabel}
               </Text>
            </Pressable>
         )}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 40,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 60,
      elevation: 1,
   },
   title: {
      fontSize: 16,
      fontWeight: "500",
      textAlign: "center",
      marginBottom: 8,
   },
   button: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginTop: 4,
   },
   actionLabel: {
      fontSize: 14,
      fontWeight: "600",
   },
});

export default NoDataCard;
