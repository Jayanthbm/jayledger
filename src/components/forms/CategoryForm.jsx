// src/components/forms/CategoryForm.jsx

import { KeyboardAvoidingView, Modal, StyleSheet, TextInput, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import Text from '../core/Text';
import { useTheme } from '../../context/ThemeContext';
import Button from '../core/Button';

const CategoryForm = ({ visible, onClose, onSubmit, initialData }) => {
   const { theme } = useTheme();
   const [name, setName] = useState('');
   const [type, setType] = useState('');

   useEffect(() => {
      if (initialData) {
         setName(initialData.name);
         setType(initialData.type);
      } else {
         setName('');
         setType('');
      }
   }, [initialData]);

   return (
      <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         style={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
         <View
            style={[
               styles.inputContainer,
               { backgroundColor: theme.colors.surfaceVariant },
            ]}
         >
            <TextInput
               placeholder="Category Name"
               placeholderTextColor={theme.colors.onSurfaceVariant}
               style={[styles.input, { color: theme.colors.onSurface }]}

               value={name}
               onChangeText={setName}
            />
         </View>

         <View
            style={[
               styles.inputContainer,
               { backgroundColor: theme.colors.surfaceVariant },
            ]}
         >
            <TextInput
               placeholder="Type (income / expense)"
               placeholderTextColor={theme.colors.onSurfaceVariant}
               style={[styles.input, { color: theme.colors.onSurface }]}
               value={type}
               onChangeText={setType}
            />

         </View>

         <View style={styles.btnRow}>
            <Button
               title="Cancel"
               onPress={onClose}
               type="warning"
            />
            <Button
               title="Save"
               onPress={() => {
                  onSubmit({ name, type });
                  setName('')
                  setType('');
               }} />
         </View>
      </KeyboardAvoidingView>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      marginTop: 10,
      marginBottom: 5
   },
   inputContainer: {
      flexDirection: "row",
      alignItems: "center",
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
});

export default CategoryForm;
