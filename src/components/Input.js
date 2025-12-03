import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  error,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant + '80'}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceVariant,
            color: colors.onSurface,
            borderColor: error ? colors.error : 'transparent',
            borderWidth: error ? 1 : 0,
          },
        ]}
        {...props}
      />
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
