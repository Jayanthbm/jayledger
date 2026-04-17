import type { ThemeColors } from '../../models/types';
import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { common } from '../../styles/common';

interface PayeeAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, logo: string) => Promise<void>;
  colors: ThemeColors;
}

export const PayeeAddModal: React.FC<PayeeAddModalProps> = ({
  visible,
  onClose,
  onAdd,
  colors,
}) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await onAdd(name, logo);
      setName('');
      setLogo('');
      onClose();
    } catch (error) {
      console.error('Add payee error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add New Payee">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={[common.inputLabel, { color: colors.textSecondary }]}>Payee Name</Text>
        <TextInput
          style={[
            common.inputField50,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="e.g. Starbucks, Amazon"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus={visible}
        />

        <Text style={[common.inputLabel, common.mt16, { color: colors.textSecondary }]}>
          Logo URL (Optional)
        </Text>
        <TextInput
          style={[
            common.inputField50,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="https://..."
          placeholderTextColor={colors.textSecondary}
          value={logo}
          onChangeText={setLogo}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity
          style={[
            common.saveButton54R12Mt32,
            { backgroundColor: colors.primary },
            (!name.trim() || isSaving) && common.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={common.saveButtonText}>Save Payee</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};
