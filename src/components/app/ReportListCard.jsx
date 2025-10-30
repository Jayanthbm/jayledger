import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Ionicons } from '@react-native-vector-icons/ionicons';
import React from "react";
import Text from "../core/Text";
import { useTheme } from "../../context/ThemeContext";

const ReportListCard = ({ icon, title, description, onPress, compact = false }) => {
   const { theme } = useTheme();
   const isAndroid = Platform.OS === 'android';
   return (
      <Pressable
         onPress={onPress}
         style={({ pressed }) => [
            styles.container,
            {
               backgroundColor: theme.colors.surface,
               shadowColor: theme.colors.shadow,
               opacity: pressed && !isAndroid ? 0.9 : 1,
               padding: compact ? 12 : 16,
            },
         ]}
      >
         <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={theme.colors.primary} />
         </View>
         <View style={styles.textContainer}>
            <Text
               style={[
                  styles.title,
                  { color: theme.colors.onSurface, fontSize: compact ? 14 : 16 },
               ]}
               numberOfLines={compact ? 2 : 1}
               ellipsizeMode='tail'
            >
               {title}
            </Text>
            {!compact && description ? (
               <Text
                  style={[
                     styles.description,
                     { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={2}
               >
                  {description}
               </Text>
            ) : null}
         </View>
      </Pressable>
   );
};

const styles = StyleSheet.create({
   container: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
   },
   iconContainer: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
   },
   textContainer: {
      flex: 1,
   },
   title: {
      fontSize: 16,
      fontWeight: "600",
   },
   description: {
      fontSize: 13,
      marginTop: 2,
   },
});

export default ReportListCard;
