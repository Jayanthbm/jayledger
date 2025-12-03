import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ToastAndroid,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      ToastAndroid.show('Please enter email and password', ToastAndroid.SHORT);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      ToastAndroid.show(error?.message || 'Login failed', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ backgroundColor: theme.colors.background, marginLeft: 20, marginRight: 10 }}
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
              fontWeight: '700',
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
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialDesignIcons
            name="email-outline"
            size={22}
            color={theme.colors.onSurfaceVariant}
            style={styles.icon}
          />
          <Input
            placeholder="Email"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: theme.colors.onSurface }]}
          />
        </View>

        {/* Password Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialDesignIcons
            name="lock-outline"
            size={22}
            color={theme.colors.onSurfaceVariant}
            style={styles.icon}
          />
          <Input
            placeholder="Password"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            secureTextEntry={secureText}
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { color: theme.colors.onSurface }]}
          />
          <Pressable onPress={() => setSecureText(!secureText)}>
            <MaterialDesignIcons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
        <Button mode="filled" onPress={handleLogin} loading={loading} style={styles.button}>
          Login
        </Button>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 16,
  },
  linkButton: {
    marginTop: 8,
  },
});

export default LoginScreen;
