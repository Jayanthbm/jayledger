import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { BottomSheet } from '../BottomSheet';

interface PayeeAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, logo: string) => Promise<void>;
  colors: any;
}

export const PayeeAddModal: React.FC<PayeeAddModalProps> = ({
  visible,
  onClose,
  onAdd,
  colors
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
      console.error("Add payee error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add New Payee"
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Payee Name</Text>
        <TextInput
          style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g. Starbucks, Amazon"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus={visible}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Logo URL (Optional)</Text>
        <TextInput
          style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="https://..."
          placeholderTextColor={colors.textSecondary}
          value={logo}
          onChangeText={setLogo}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: (!name.trim() || isSaving) ? 0.5 : 1 }]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Payee</Text>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputField: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  saveButton: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
