// src/components/app/BottomSheetModal.jsx

import React, { useEffect, useRef } from 'react';
import {
   Animated,
   Modal,
   TouchableWithoutFeedback,
   View,
   Platform,
   StyleSheet,
} from 'react-native';
import PageHeader from './PageHeader';
import { useTheme } from '../../context/ThemeContext';

const BottomSheetModal = ({ visible = false, closeModal, title, children }) => {
   const { theme } = useTheme();

   const translateY = useRef(new Animated.Value(400)).current;
   const overlayOpacity = useRef(new Animated.Value(0)).current;

   // Animate open/close
   useEffect(() => {
      if (visible) {
         Animated.parallel([
            Animated.timing(translateY, {
               toValue: 0,
               duration: 280,
               useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
               toValue: 1,
               duration: 250,
               useNativeDriver: true,
            }),
         ]).start();
      } else {
         Animated.parallel([
            Animated.timing(translateY, {
               toValue: 400,
               duration: 240,
               useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
               toValue: 0,
               duration: 200,
               useNativeDriver: true,
            }),
         ]).start();
      }
   }, [visible]);

   return (
     <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
     >
        {/* ✅ Fix: use translucent overlay color */}
        <TouchableWithoutFeedback onPress={closeModal}>
           <Animated.View
              style={[
                 styles.overlay,
                 {
                    backgroundColor: 'rgba(0,0,0,0.4)', // ← Fixed: consistent dimming
                    opacity: overlayOpacity,
                 },
              ]}
           />
        </TouchableWithoutFeedback>

        <Animated.View
           style={[
              styles.sheet,
              {
                 backgroundColor: theme.colors.surface,
                 shadowColor: theme.colors.shadow,
                 transform: [{ translateY }],
              },
           ]}
        >
           {/* Handle bar */}
           <View
              style={[
                 styles.handle,
                 { backgroundColor: theme.colors.outlineVariant || '#999' },
              ]}
           />

           {title ? <PageHeader title={title} /> : null}

           <View style={styles.content}>{children}</View>
        </Animated.View>
     </Modal>
  );
};

const styles = StyleSheet.create({
   overlay: {
      flex: 1,
   },
   sheet: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20 + (Platform.OS === 'android' ? 16 : 0),
      elevation: 8,
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 },
   },
   handle: {
      width: 50,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 12,
      opacity: 0.4,
   },
   content: {
      marginTop: 4,
   },
});

export default BottomSheetModal;
