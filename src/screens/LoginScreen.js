import {
   KeyboardAvoidingView,
   Platform,
   Pressable,
   ScrollView,
   StyleSheet,
   TextInput,
   ToastAndroid,
   View,
} from "react-native";
import React, { useState } from "react";

import Loader from "../components/core/Loader";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import Text from "../components/core/Text";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function LoginScreen() {
   const { login } = useAuth();
   const { theme } = useTheme();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [secureText, setSecureText] = useState(true);
   const [loading, setLoading] = useState(false);

   const handleLogin = async () => {
      if (!email || !password) {
         ToastAndroid.show("Please enter email and password", ToastAndroid.SHORT);
         return;
      }
      setLoading(true);
      try {
         await login(email, password);
         ToastAndroid.show("Login Successful", ToastAndroid.SHORT);
      } catch (error) {
         ToastAndroid.show(error?.message || "Login failed", ToastAndroid.SHORT);
      } finally {
         setLoading(false);
      }
   };

   return (
      <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
         <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
         >
            <View style={styles.headerContainer}>
               <MaterialDesignIcons
                  name="finance"
                  size={60}
                  color={theme.colors.primary}
                  style={{ marginBottom: 8 }}
               />
               <Text
                  style={{
                     fontSize: 28,
                     fontWeight: "700",
                     color: theme.colors.onBackground,
                  }}
               >
                  JayLedger
               </Text>
               <Text
                  style={{
                     fontSize: 16,
                     color: theme.colors.onSurfaceVariant,
                     marginTop: 4,
                  }}
               >
                  Manage your finances effortlessly
               </Text>
            </View>

            {/* Email Input */}
            <View
               style={[
                  styles.inputContainer,
                  { backgroundColor: theme.colors.surfaceVariant },
               ]}
            >
               <MaterialDesignIcons
                  name="email-outline"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.icon}
               />
               <TextInput
                  placeholder="Email"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                     styles.input,
                     { color: theme.colors.onSurface },
                  ]}
               />
            </View>

            {/* Password Input */}
            <View
               style={[
                  styles.inputContainer,
                  { backgroundColor: theme.colors.surfaceVariant },
               ]}
            >
               <MaterialDesignIcons
                  name="lock-outline"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.icon}
               />
               <TextInput
                  placeholder="Password"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                  style={[
                     styles.input,
                     { color: theme.colors.onSurface },
                  ]}
               />
               <Pressable onPress={() => setSecureText(!secureText)}>
                  <MaterialDesignIcons
                     name={secureText ? "eye-off-outline" : "eye-outline"}
                     size={22}
                     color={theme.colors.onSurfaceVariant}
                  />
               </Pressable>
            </View>

            {/* Login Button */}
            <Pressable
               onPress={handleLogin}
               disabled={loading}
               style={({ pressed }) => [
                  styles.button,
                  {
                     backgroundColor: pressed
                        ? theme.colors.primaryContainer
                        : theme.colors.primary,
                     opacity: loading ? 0.7 : 1,
                  },
               ]}
            >
               {loading ? (
                  <Loader inline position="center" size="small" variant="contained" />
               ) : (
                  <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
                     Login
                  </Text>
               )}
            </Pressable>
         </ScrollView>
      </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
   },
   headerContainer: {
      alignItems: "center",
      marginBottom: 40,
   },
   inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
      elevation: 1,
   },
   icon: {
      marginRight: 8,
   },
   input: {
      flex: 1,
      fontSize: 16,
   },
   button: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      elevation: 2,
      marginTop: 12,
   },
   buttonText: {
      fontSize: 16,
      fontWeight: "600",
   },
});
