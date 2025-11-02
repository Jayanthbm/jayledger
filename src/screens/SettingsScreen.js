import {
   Alert,
   Modal,
   Pressable,
   StyleSheet,
   Switch,
   TouchableWithoutFeedback,
   View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import React, { useEffect, useState } from "react";

import AppBar from "../components/app/AppBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../components/core/Button";
import Card from "../components/core/Card";
import Divider from "../components/core/Divider";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import PageHeader from "../components/app/PageHeader";
import Text from "../components/core/Text";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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
      await AsyncStorage.setItem("themeMode", mode);
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

   const SettingsList = ({ title, subtitle, leftIcon, rightContent, keyName, onPress }) => {
      return (
         <Pressable
            key={keyName}
            style={[styles.row, { backgroundColor: theme.colors.surface }]}
            android_ripple={{ color: theme.colors.surfaceVariant }}
            onPress={onPress}
         >
            <MaterialDesignIcons
               name={leftIcon}
               size={22}
               color={theme.colors.primary}
               style={styles.icon}
            />
            <View style={{ flex: 1 }}>
               <Text variant="subtitle" style={{
                  fontSize: 18
               }}>
                  {title}
               </Text>
               {subtitle && (
                  <Text variant="caption"
                     style={{
                        fontSize: 15,
                     }}
                  >
                     {subtitle}
                  </Text>
               )}
            </View>
            {rightContent}
         </Pressable>
      )
   }
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
            <SettingsList
               keyName={`mode-${theme.mode}`}
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
            <SettingsList
               keyName={"categories"}
               onPress={() => navigation.navigate("Categories")}
               leftIcon="shape-outline"
               title="Categories"
               subtitle="Naviagate to Categories"
               rightContent={<MaterialDesignIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
               />}
            />
            <SettingsList
               keyName={"payees"}
               onPress={() => navigation.navigate("Payees")}
               leftIcon="account-multiple-outline"
               title="Payees"
               subtitle="Naviagate to Payees"
               rightContent={<MaterialDesignIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
               />}
            />

            {/* 🔒 Screen Lock */}
            <PageHeader title={"Security"} />
            <SettingsList
               keyName={"fingerprint"}
               onPress={() => null}
               leftIcon="fingerprint"
               title="Screen Lock"
               subtitle="Enable Disable biometric"
               rightContent={<Switch
                  value={screenLock}
                  onValueChange={handleScreenLockToggle}
                  trackColor={{
                     false: theme.colors.surfaceVariant,
                     true: theme.colors.primaryContainer,
                  }}
                  thumbColor={theme.colors.primary}
               />}
            />

            {/* 👤 Account */}
            <PageHeader title={"Account"} />
            <Card>
               <View style={styles.row}>
                  <MaterialDesignIcons
                     name="account-circle-outline"
                     size={22}
                     color={theme.colors.primary}
                     style={styles.icon}
                  />
                  <View>
                     <Text variant="label">
                        Logged in as
                     </Text>

                     {user?.email && (
                        <Text style={{ color: theme.colors.onSurfaceVariant }}>
                           {user.email}
                        </Text>
                     )}
                  </View>
               </View>
               <Button
                  title="Resync Data"
                  onPress={() => Alert.alert("Coming soon")}
                  style={{ marginTop: 10 }}

               />
               <Button
                  title="Logout"
                  onPress={handleLogout}
                  style={{
                     marginTop: 8,
                     backgroundColor: theme.colors.expense,
                  }}
               />
            </Card>


            {/* ℹ️ About */}
            <PageHeader title={"About"} />
            <Card>
               <View style={styles.row}>
                  <MaterialDesignIcons
                     name="information-outline"
                     size={22}
                     color={theme.colors.primary}
                     style={styles.icon}
                  />
                  <View>
                     <Text variant="label">
                        App Version
                     </Text>

                     <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        v1.0.0
                     </Text>
                  </View>
               </View>
               <Divider />
               <View style={[styles.row, { marginTop: 6 }]}>
                  <MaterialDesignIcons
                     name="email-outline"
                     size={22}
                     color={theme.colors.primary}
                     style={styles.icon}
                  />
                  <View>
                     <Text variant="label">
                        Contact
                     </Text>

                     <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        support@jayledger.app
                     </Text>
                  </View>
               </View>
            </Card>
         </Animated.ScrollView>

         {/* 🎨 Theme Selector Modal */}
         <Modal visible={showThemeModal} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowThemeModal(false)}>
               <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View
               style={[
                  styles.modalContainer,
                  { backgroundColor: theme.colors.surface },
               ]}
            >
               {["system", "light", "dark"].map((mode) => (
                  <Pressable
                     key={mode}
                     onPress={() => handleThemeSelect(mode)}
                     style={styles.modalItem}
                  >
                     <MaterialDesignIcons
                        name={
                           mode === "system"
                              ? "theme-light-dark"
                              : mode === "light"
                                 ? "white-balance-sunny"
                                 : "weather-night"
                        }
                        color={
                           themeMode === mode
                              ? theme.colors.primary
                              : theme.colors.onSurfaceVariant
                        }
                        size={22}
                        style={styles.icon}
                     />
                     <Text
                        style={{
                           color:
                              themeMode === mode
                                 ? theme.colors.primary
                                 : theme.colors.onSurface,
                           fontWeight: themeMode === mode ? "600" : "400",
                        }}
                     >
                        {mode === "system"
                           ? "System default"
                           : mode.charAt(0).toUpperCase() + mode.slice(1)}
                     </Text>
                  </Pressable>
               ))}
            </View>
         </Modal>
      </>
   );
}

const styles = StyleSheet.create({
   row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 16,
      marginVertical: 4,
   },
   icon: {
      marginRight: 14,
   },
   modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
   },
   modalContainer: {
      position: "absolute",
      bottom: 0,
      width: "100%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
   },
   modalItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
   },
});
