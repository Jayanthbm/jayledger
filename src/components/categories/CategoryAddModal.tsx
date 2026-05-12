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
import { SegmentedControl } from '../SegmentedControl';
import { common } from '../../styles/common';
import { logger } from '../../utils/logger';

interface CategoryAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, type: 'Expense' | 'Income', appIcon: string) => Promise<void>;
  colors: ThemeColors;
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
      logger.error('Add category error:', error);
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

        <Text style={[common.inputLabel, { color: colors.textSecondary }]}>Category Name</Text>
        <TextInput
          style={[
            common.inputField50,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="e.g. Groceries"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={[common.inputLabel, common.mt16, { color: colors.textSecondary }]}>
          Material Icon Name (Optional)
        </Text>
        <TextInput
          style={[
            common.inputField50,
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
            <Text style={common.saveButtonText}>Save Category</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};
