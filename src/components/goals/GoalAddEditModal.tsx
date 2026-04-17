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
    if (!name.trim()) return;
    Keyboard.dismiss();
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Image URL (Logo)
            </Text>
            <TextInput
              style={[
                styles.inputField,
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Goal Name</Text>
            <TextInput
              style={[
                styles.inputField,
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
          <View style={[styles.flexHalf, styles.marginRight12]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Target Goal Amount
            </Text>
            <TextInput
              style={[
                styles.inputField,
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Currently Saved
            </Text>
            <TextInput
              style={[
                styles.inputField,
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
            styles.saveButton,
            { backgroundColor: colors.primary },
            (!name.trim() || isSaving) && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
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
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  inputField: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  saveButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { padding: 8 },
  flexHalf: { flex: 0.5 },
  marginRight12: { marginRight: 12 },
  disabledButton: { opacity: 0.5 },
});
