// src/components/app/PageTitle.jsx

import React from 'react';
import Text from '../core/Text';
import { useTheme } from '../../context/ThemeContext';

const PageTitle = ({ title }) => {
   const { theme } = useTheme()
   return (
      <Text
         style={{
            marginTop: 8,
            color: theme.colors.onSurfaceVariant,
            fontWeight: "600",
            fontSize: 18,
         }}
         numberOfLines={1}
         ellipsizeMode='tail'
      >
         {title}
      </Text>
   );
};

export default React.memo(PageTitle);