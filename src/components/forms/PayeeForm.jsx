// src/components/forms/PayeeForm.jsx

import { KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import { useTheme } from '../../context/ThemeContext';
import Button from '../core/Button';
import TurboImage from 'react-native-turbo-image';
const PayeeForm = ({ onClose, onSubmit, initialData }) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setLogo(initialData.logo);
    } else {
      setName('');
      setLogo('');
    }
  }, [initialData]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.logoContainer}>
        <TurboImage source={{ uri: logo }} style={{ width: 60, height: 60, borderRadius: 50 }} />
      </View>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <TextInput
          placeholder="Payee Name"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[styles.input, { color: theme.colors.onSurface }]}
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <TextInput
          placeholder="Payee Logo URL"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[styles.input, { color: theme.colors.onSurface }]}
          value={logo}
          onChangeText={setLogo}
        />
      </View>

      <View style={styles.btnRow}>
        <Button title="Cancel" onPress={onClose} type="warning" />
        <Button
          title="Save"
          onPress={() => {
            onSubmit({ name, logo });
            setName('');
            setLogo('');
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
    marginBottom: 5,
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
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  logoContainer: {
    alignItems: 'center',
    margin: 20,
  },
});

export default PayeeForm;
