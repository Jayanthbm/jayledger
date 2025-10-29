// src/components/app/AppBar.jsx

import { Platform, TouchableOpacity, View } from "react-native";

import Button from '../core/Button';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import Loader from '../core/Loader';
import { MAINSTYLE } from '../../styles/style'
import React from 'react';
import Text from '../../components/core/Text';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const ICON_SIZE = 22;

const AppBar = ({
   title = "JayLedger",
   showBack = true,
   hideRightIcons = false,
   loading = false, }) => {

   const navigation = useNavigation();
   const { logout } = useAuth();
   const { theme, toggleTheme } = useTheme();

   const backgroundColor = theme.colors.background; // 👈 blends with page background
   const iconColor = theme.colors.onBackground;

   const onBackPress = () => {
      if (navigation.canGoBack()) navigation.goBack();
   };

   const IconButton = ({ name, onPress }) => (
      <TouchableOpacity
         onPress={onPress}
         activeOpacity={0.6}
         style={{
            padding: 10,
            borderRadius: 100,
            justifyContent: "center",
            alignItems: "center",
         }}
      >
         <Ionicons name={name} size={ICON_SIZE} color={iconColor} />
      </TouchableOpacity>
   );

   return (
      <>
         <View style={{
            backgroundColor,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 14,
            borderBottomWidth: 0, // 👈 no border
            elevation: 0, // 👈 flat look
            shadowOpacity: 0, // 👈 no shadow
         }}>
            {/* Left section */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
               {showBack && (
                  <IconButton name="chevron-back" onPress={onBackPress} />
               )}
               <Text
                  variant="headingMedium"
                  style={{
                     color: iconColor,
                     fontWeight: "600",
                     flexShrink: 1,
                  }}
                  numberOfLines={1}
               >
                  {title}
               </Text>
            </View>

            {/* Right section */}
            {!hideRightIcons && (
               <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconButton
                     name={theme.mode === "dark" ? "moon" : "sunny"}
                     onPress={toggleTheme}
                  />
                  <IconButton
                     name="cog-outline"
                     onPress={() => navigation.navigate("Settings")}
                  />
                  <IconButton name="exit-outline" onPress={logout} />
               </View>
            )}
         </View>
         {loading && <Loader inline position='center' size='xlarge' variant='contained' />}
      </>
   );
};

export default AppBar;