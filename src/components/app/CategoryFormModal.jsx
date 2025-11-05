// src/components/app/CategoryFormModal.jsx

import { Button, Modal, StyleSheet, TextInput, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import Text from '../core/Text';
import { useTheme } from '../../context/ThemeContext';

const CategoryFormModal = ({ visible, onClose, onSubmit, initialData }) => {
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
      <Modal visible={visible} transparent animationType="slide">
         <View style={styles.overlay}>
            <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
               <Text style={{ color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 18 }}>
                  {initialData ? 'Edit Category' : 'New Category'}
               </Text>

               <TextInput
                  style={[styles.input, { color: theme.colors.onSurface }]}
                  placeholder="Category Name"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
               />
               <TextInput
                  style={[styles.input, { color: theme.colors.onSurface }]}
                  placeholder="Type (income / expense)"
                  placeholderTextColor="#999"
                  value={type}
                  onChangeText={setType}
               />

               <View style={styles.btnRow}>
                  <Button title="Cancel" onPress={onClose} color={theme.colors.secondary} />
                  <Button title="Save" onPress={() => {
                     onSubmit({ name, type });
                     setName('')
                     setType('');
                  }} color={theme.colors.primary} />
               </View>
            </View>
         </View>
      </Modal>
   );
};

const styles = StyleSheet.create({
   overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0009' },
   container: { width: '90%', padding: 20, borderRadius: 12, elevation: 4 },
   input: { borderBottomWidth: 1, borderColor: '#aaa', marginVertical: 12, padding: 8 },
   btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});

export default CategoryFormModal;
