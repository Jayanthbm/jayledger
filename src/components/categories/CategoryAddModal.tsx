import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { SegmentedControl } from '../SegmentedControl';
import { common } from '../../styles/common';

interface CategoryAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, type: 'Expense' | 'Income', appIcon: string) => Promise<void>;
  colors: any;
}

export const CategoryAddModal: React.FC<CategoryAddModalProps> = ({
  visible,
  onClose,
  onAdd,
  colors,
}) => {
  const [name, setName] = useState('');
  const [appIcon, setAppIcon] = useState('');
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await onAdd(name, type, appIcon);
      setName('');
      setAppIcon('');
      onClose();
    } catch (error) {
      console.error('Add category error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="New Category">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SegmentedControl
          options={[
            { label: 'Expense', value: 'Expense', activeColor: colors.danger },
            { label: 'Income', value: 'Income', activeColor: colors.success },
          ]}
          selectedValue={type}
          onValueChange={(val: 'Expense' | 'Income') => setType(val)}
          variant="small"
          containerStyle={common.mb20}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category Name</Text>
        <TextInput
          style={[
            styles.inputField,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="e.g. Groceries"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>
          Material Icon Name (Optional)
        </Text>
        <TextInput
          style={[
            styles.inputField,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="e.g. fastfood, flight"
          placeholderTextColor={colors.textSecondary}
          value={appIcon}
          onChangeText={setAppIcon}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary, opacity: !name.trim() || isSaving ? 0.5 : 1 },
          ]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Category</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputField: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  saveButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
