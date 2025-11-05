import {
   Alert,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import React, { useEffect, useState } from "react";

import AppBar from "../components/app/AppBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../components/core/Button";
import Card from "../components/core/Card";
import Divider from "../components/core/Divider";
import IconList from "../components/app/IconList";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import MaterialSwitch from "../components/core/MaterialSwitch";
import PageHeader from "../components/app/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import BottomSheetModal from "../components/app/BottomSheetModal";

export default function SettingsScreen({ navigation }) {
   const { logout, user } = useAuth();
   const { theme, toggleTheme } = useTheme();

   const [themeMode, setThemeMode] = useState("system");
   const [showThemeModal, setShowThemeModal] = useState(false);
   const [screenLock, setScreenLock] = useState(false);

   useEffect(() => {
      (async () => {
         const savedTheme = await AsyncStorage.getItem("themeMode");
         const savedLock = await AsyncStorage.getItem("screenLock");
         if (savedTheme) setThemeMode(savedTheme);
         if (savedLock) setScreenLock(JSON.parse(savedLock));
      })();
   }, []);

   const handleThemeSelect = async (mode) => {
      setThemeMode(mode);
      toggleTheme(mode);
      setShowThemeModal(false);
   };

   const handleScreenLockToggle = async () => {
      const newValue = !screenLock;
      setScreenLock(newValue);
      await AsyncStorage.setItem("screenLock", JSON.stringify(newValue));
   };

   const handleLogout = () =>
      Alert.alert("Logout", "Are you sure you want to log out?", [
         { text: "Cancel", style: "cancel" },
         { text: "Logout", onPress: logout, style: "destructive" },
      ]);

   return (
      <>
         <AppBar />
         <Animated.ScrollView
            entering={FadeIn.duration(300)}
            contentContainerStyle={{ paddingBottom: 100 }}
            style={{ backgroundColor: theme.colors.background }}
            showsVerticalScrollIndicator={false}
         >
            {/* 🎨 Appearance */}
            <PageHeader title={"Appearance"} />
            <IconList
               keyName={`mode`}
               onPress={() => setShowThemeModal(true)}
               leftIcon={'palette-outline'}
               title="Theme"
               subtitle={themeMode === "system"
                  ? "System default"
                  : themeMode === "light"
                     ? "Light"
                     : "Dark"}
               rightContent={<MaterialDesignIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
               />}
            />

            {/* 🗂️ App Shortcuts */}
            <PageHeader title={"Shortcuts"} />
            {['Categories', 'Payees'].map((item, i) => {
               let icon = i === 0 ? 'shape-outline' : 'account-multiple-outline'
               return (
                  <IconList
                     key={i}
                     keyName={item}
                     onPress={() => navigation.navigate(item, {
                        activeTab: 'Settings'
                     })}
                     leftIcon={icon}
                     title={item}
                     subtitle={`Naviagate to ${item}`}
                     rightContent={<MaterialDesignIcons
                        name="chevron-right"
                        size={22}
                        color={theme.colors.onSurfaceVariant}
                     />}
                  />
               )
            })}

            {/* 🔒 Screen Lock */}
            <PageHeader title={"Security"} />
            <IconList
               keyName={"fingerprint"}
               onPress={handleScreenLockToggle}
               leftIcon="fingerprint"
               title="Screen Lock"
               subtitle="Enable Disable biometric"
               rightContent={
                  <MaterialSwitch
                     value={screenLock}
                     onValueChange={handleScreenLockToggle}
                     theme={theme}
                  />
               }
            />

            {/* 👤 Account */}
            <PageHeader title={"Account"} />
            <Card disabled={true}>
               <IconList
                  keyName={"loggedin"}
                  leftIcon="account-circle-outline"
                  title="Logged in as"
                  subtitle={user.email}
                  disabled={true}
               />
               <Button
                  title="Resync Data"
                  iconName="cached"
                  onPress={() => Alert.alert("Coming soon")}
                  style={{ marginTop: 10 }}

               />
               <Button
                  title="Logout"
                  onPress={handleLogout}
                  style={{
                     marginTop: 8,
                  }}
                  iconName="logout-variant"
                  type="danger"
               />
            </Card>

            {/* ℹ️ About */}
            <PageHeader title={"About"} />
            <Card disabled={true}>
               <IconList
                  keyName={"app-version"}
                  leftIcon="information-outline"
                  title="App Version"
                  subtitle="v1.0.0"
                  disabled={true}
               />
               <Divider />
               <IconList
                  keyName={"app-contact"}
                  leftIcon="email-outline"
                  title="Contact"
                  subtitle="support@jayledger.app"
                  disabled={true}
               />
            </Card>
         </Animated.ScrollView>

         {/* 🎨 Theme Selector Modal */}
         <BottomSheetModal
            visible={showThemeModal}
            closeModal={() => setShowThemeModal(false)}
            title={"Choose Theme"}
         >
            {["system", "light", "dark"].map((mode) => (
               <IconList
                  key={mode}
                  keyName={mode}
                  onPress={() => handleThemeSelect(mode)}
                  leftIcon={
                     mode === "system"
                        ? "theme-light-dark"
                        : mode === "light"
                           ? "white-balance-sunny"
                           : "weather-night"
                  }
                  title={mode === "system"
                     ? "System default"
                     : mode.charAt(0).toUpperCase() + mode.slice(1)}
               />
            ))}
         </BottomSheetModal>
      </>
   );
}