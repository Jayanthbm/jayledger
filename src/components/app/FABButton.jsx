// src/components/app/FABButton.jsx

import IconButton from '../core/IconButton';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const FABButton = ({ iconName = "plus", mode = "filled", size = 22, type = "primary", keyName = "fab-add-category", onPress, hidden = false }) => {
   const { theme } = useTheme()
   return (
      <>
         {hidden ? (<></>) : (
            <IconButton
               iconName={iconName}
               mode={mode}
               size={size}
               type={type}
               keyName={keyName}
               style={{
                  position: "absolute",
                  bottom: 100,
                  right: 20,
                  backgroundColor: theme.colors.primaryContainer,
                  borderRadius: 15
               }}
               onPress={onPress}
            />
         )
         }
      </>
   );
};

export default FABButton;