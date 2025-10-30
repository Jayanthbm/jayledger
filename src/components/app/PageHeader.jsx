import { Pressable, StyleSheet, View } from "react-native";

import { Ionicons } from "@react-native-vector-icons/ionicons";
import React from "react";
import Text from "../core/Text";
import { useTheme } from "../../context/ThemeContext";

const PageHeader = ({ title, actions = [] }) => {
   const { theme } = useTheme();

   return (
      <View
         style={[
            styles.container,
            { borderColor: theme.colors.outlineVariant },
         ]}
      >
         <Text
            style={[
               styles.title,
               { color: theme.colors.onSurfaceVariant },
            ]}
            numberOfLines={1}
         >
            {title}
         </Text>

         <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
               <Pressable
                  key={index}
                  onPress={action.onPress}
                  style={({ pressed }) => [
                     styles.iconButton,
                     {
                        backgroundColor: pressed
                           ? theme.colors.surfaceVariant
                           : theme.colors.surface,
                        shadowColor: theme.colors.shadow,
                     },
                  ]}
               >
                  <Ionicons
                     name={action.icon}
                     size={22}
                     color={
                        action.color
                           ? action.color
                           : theme.dark
                              ? theme.colors.onSurface
                              : theme.colors.onSurfaceVariant
                     }
                  />
               </Pressable>
            ))}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      marginTop: 8,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
   },
   title: {
      fontWeight: "600",
      fontSize: 18,
      flex: 1,
   },
   actionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
   },
   iconButton: {
      padding: 8,
      borderRadius: 10,
      marginLeft: 8,
      justifyContent: "center",
      alignItems: "center",
      elevation: 1, // subtle Material elevation
   },
});

export default React.memo(PageHeader);
