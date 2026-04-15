import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  StatusBar,
  ScrollView
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import appConfig from '../../app.json';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      setErrorMsg(e.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const appVersion = appConfig.expo.version;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121417' : colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: isDark ? '#121417' : colors.background }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>

              <View style={styles.headerArea}>
                <Text style={[styles.titleText, { color: colors.text }]}>JayLedger</Text>
                <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
                  Manage your finances effortlessly
                </Text>
                <Text style={[styles.versionHeader, { color: colors.textSecondary }]}>
                  v{appVersion}
                </Text>
              </View>

              <View style={styles.formArea}>
                 <View style={[styles.inputBox, { backgroundColor: isDark ? '#1A1D21' : colors.card }]}>
                    <Icon name="mail-outline" size={22} color="#A0AEC0" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="Email"
                      placeholderTextColor="#718096"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                 </View>

                 <View style={[styles.inputBox, { backgroundColor: isDark ? '#1A1D21' : colors.card }]}>
                    <Icon name="lock-outline" size={22} color="#A0AEC0" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="Password"
                      placeholderTextColor="#718096"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={22} color="#A0AEC0" />
                    </TouchableOpacity>
                 </View>

                 {errorMsg && (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
                    </View>
                 )}

                 <TouchableOpacity
                    style={[styles.loginBtn, { backgroundColor: '#A0C4FF' }]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                 >
                    {loading ? (
                      <ActivityIndicator color="#121417" />
                    ) : (
                      <Text style={styles.loginBtnText}>Login</Text>
                    )}
                 </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 50,
  },
  titleText: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    fontWeight: '500',
    marginBottom: 4,
  },
  versionHeader: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    letterSpacing: 1,
  },
  formArea: {
    width: '100%',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: height * 0.09, // Dynamic height relative to screen
    minHeight: 64,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 10,
  },
  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#002B5B',
    fontSize: 19,
    fontWeight: '700',
  },
});
