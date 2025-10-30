// src/components/app/AppBar.jsx

import { TouchableOpacity, View } from "react-native";

import { Ionicons } from '@react-native-vector-icons/ionicons';
import Loader from '../core/Loader';
import React from 'react';
import Text from '../../components/core/Text';
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

   const IconButton = ({ name, onPress }) => (
      <TouchableOpacity
         onPress={onPress}
         activeOpacity={0.7}
         style={{
            width: ICON_TOUCH,
            height: ICON_TOUCH,
            borderRadius: ICON_TOUCH / 2,
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
            height: 56, // Material AppBar height
            paddingHorizontal: 4,
            elevation: 0,
            shadowOpacity: 0,
         }}>
            {/* Left */}
            <View style={{ width: ICON_TOUCH, alignItems: "flex-start" }}>
               {showBack && (
                  <IconButton name="chevron-back" onPress={onBackPress} />
               )}
            </View>

            {/* Center (SearchBar or empty) */}
            <View style={{ flex: 1, justifyContent: "center", marginHorizontal: 4 }}>
               {children}
            </View>

            {/* Right */}
            <View style={{ width: ICON_TOUCH, alignItems: "flex-end" }}>
               {!hideRightIcon && (
                  <IconButton
                     name="settings-outline"
                     // onPress={() => navigation.navigate("Settings")}
                     onPress={toggleTheme}
                  />
               )}
            </View>
         </View>

         {loading && <Loader inline position='center' size='medium' variant='contained' />}
      </>
   );
};

export default AppBar;