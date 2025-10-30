// src/components/app/AppBar.jsx

import { Pressable, StyleSheet, View } from "react-native";

import { Ionicons } from '@react-native-vector-icons/ionicons';
import Loader from '../core/Loader';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const ICON_SIZE = 22;
const ICON_TOUCH = 40;

const AppBar = ({
   showBack = true,
   hideRightIcon = false,
   loading = false,
   children, }) => {
   const navigation = useNavigation();
   const { theme, toggleTheme } = useTheme();

   const backgroundColor = theme.colors.background;
   const iconColor = theme.colors.onBackground;

   const onBackPress = () => {
      if (navigation.canGoBack()) navigation.goBack();
   };

   const IconButton = ({ name, onPress }) => {
      return (
         <Pressable
            onPress={onPress}
            style={({ pressed }) => [
               styles.iconButton,
               {
                  backgroundColor: pressed
                     ? theme.colors.surfaceVariant
                     : theme.colors.surfaceVariant,
                  shadowColor: theme.colors.shadow,
                  elevation: pressed ? 2 : 1,
               },
            ]}
      >
            <Ionicons name={name} size={ICON_SIZE} color={theme.colors.onBackground} />
         </Pressable>
      );
   };

   return (
      <>
         <View style={[
            styles.container,
            {
            backgroundColor,
            },
         ]}>
            {/* Left */}
            <View style={[styles.sideContainer, { alignItems: "flex-start" }]}>
               {showBack && <IconButton name="chevron-back" onPress={onBackPress} />}
            </View>

            {/* Center (SearchBar or custom children) */}
            <View style={styles.centerContainer}>{children}</View>

            {/* Right */}
            <View style={[styles.sideContainer, { alignItems: "flex-end" }]}>
               {!hideRightIcon && (
                  <IconButton
                     name="settings-outline"
                     // onPress={() => navigation.navigate("Settings")}
                     onPress={toggleTheme}
                  />
               )}
            </View>
         </View>

         {loading && (
            <Loader inline position="center" size="medium" variant="contained" />
         )}
      </>
   );
};

const styles = StyleSheet.create({
   container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 60,
   },
   sideContainer: {
      width: ICON_TOUCH,
      justifyContent: "center",
   },
   centerContainer: {
      flex: 1,
      justifyContent: "center",
      marginHorizontal: 6,
   },
   iconButton: {
      width: ICON_TOUCH,
      height: ICON_TOUCH,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
   },
});
export default AppBar;