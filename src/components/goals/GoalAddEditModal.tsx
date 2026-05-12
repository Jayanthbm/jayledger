import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';
import { Goal } from '../../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { common } from '../../styles/common';
import { validateGoal } from '../../utils/validators';
import { useToast } from '../../store/ToastContext';

interface GoalAddEditModalProps {
  visible: boolean;
  onClose: () => void;
  editingGoal: Goal | null;
  onSave: (goalData: Partial<Goal>) => Promise<void>;
  onDeleteRequest?: (id: string) => void;
}

export const GoalAddEditModal: React.FC<GoalAddEditModalProps> = ({
  visible,
  onClose,
  editingGoal,
  onSave,
  onDeleteRequest,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (editingGoal) {
          setName(editingGoal.name);
          setLogo(editingGoal.logo || '');
          setGoalAmount(editingGoal.goal_amount.toString());
          setCurrentAmount(editingGoal.current_amount.toString());
        } else {
          setName('');
          setLogo('');
          setGoalAmount('');
          setCurrentAmount('');
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [visible, editingGoal]);

  const handleSave = async () => {
    Keyboard.dismiss();

    const validation = validateGoal({
      name: name.trim(),
      targetAmount: goalAmount,
      currentAmount: currentAmount,
    });

    if (!validation.valid) {
      const firstErrorKey = Object.keys(validation.errors)[0];
      showToast(validation.errors[firstErrorKey], 'error');
      return;
    }

    setIsSaving(true);
    await onSave({
      name: name.trim(),
      logo: logo.trim(),
      goal_amount: parseFloat(goalAmount) || 0,
      current_amount: parseFloat(currentAmount) || 0,
    });
    setIsSaving(false);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
      headerRight={
        editingGoal && onDeleteRequest ? (
          <TouchableOpacity
            onPress={() => onDeleteRequest(editingGoal.id)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
        ) : undefined
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.formRow}>
          <View style={common.flex1}>
            <Text style={[common.inputLabelCompact, { color: colors.textSecondary }]}>
              Image URL (Logo)
            </Text>
            <TextInput
              style={[
                common.inputField50,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              value={logo}
              onChangeText={setLogo}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={common.flex1}>
            <Text style={[common.inputLabelCompact, { color: colors.textSecondary }]}>
              Goal Name
            </Text>
            <TextInput
              style={[
                common.inputField50,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Vacation"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[common.flex0_5, common.mr12]}>
            <Text style={[common.inputLabelCompact, { color: colors.textSecondary }]}>
              Target Goal Amount
            </Text>
            <TextInput
              style={[
                common.inputField50,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="₹0"
              placeholderTextColor={colors.textSecondary}
              value={goalAmount}
              onChangeText={setGoalAmount}
              keyboardType="numeric"
            />
          </View>
          <View style={common.flex0_5}>
            <Text style={[common.inputLabelCompact, { color: colors.textSecondary }]}>
              Currently Saved
            </Text>
            <TextInput
              style={[
                common.inputField50,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="₹0"
              placeholderTextColor={colors.textSecondary}
              value={currentAmount}
              onChangeText={setCurrentAmount}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            common.saveButton54R12Mt16,
            { backgroundColor: colors.primary },
            (!name.trim() || isSaving) && common.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={common.saveButtonText}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};
GoalAddEditModal.displayName = 'GoalAddEditModal';

const styles = StyleSheet.create({
  formRow: { flexDirection: 'row', marginBottom: 16 },
  deleteButton: { padding: 8 },
});
