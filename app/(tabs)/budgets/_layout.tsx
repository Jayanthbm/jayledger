import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';

export default function BudgetsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    />
  );
}
