// src/components/app/BottomSheetModal.jsx

import React from 'react';
import { View, Modal, TouchableWithoutFeedback } from 'react-native';
import PageHeader from './PageHeader';
import { useTheme } from '../../context/ThemeContext';

const BottomSheetModal = ({ visible = false, closeModal, title, children }) => {
   const { theme } = useTheme();
   return (
      <Modal visible={visible} transparent animationType="slide">
         <TouchableWithoutFeedback onPress={closeModal}>
            <View style={{
               flex: 1,
               backgroundColor: "rgba(0,0,0,0.4)",
            }} />
         </TouchableWithoutFeedback>
         <View
            style={
               {
                  position: "absolute",
                  bottom: 0,
                  transform: [{ translateY: visible ? 0 : 200 }],
                  transitionDuration: "300ms",
                  width: "100%",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 20,
                  backgroundColor: theme.colors.surface
               }
            }
         >
            {title && (
               <PageHeader title={title} />
            )}
            {children}
         </View>
      </Modal>
   );
};

export default BottomSheetModal;