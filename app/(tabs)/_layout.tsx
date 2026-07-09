import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '../../src/store/ThemeContext';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  const selectedIconColor = isDark ? '#000000' : colors.primary;
  const indicatorColor = isDark ? '#FFFFFF' : colors.primary + '18';
  const selectedLabelColor = isDark ? '#FFFFFF' : colors.primary;

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={colors.card}
      tintColor={colors.primary}
      iconColor={{
        default: colors.textSecondary,
        selected: selectedIconColor,
      }}
      labelStyle={{
        color: colors.textSecondary,
      }}
    >
      <NativeTabs.Trigger
        name="dashboard"
        indicatorColor={indicatorColor}
        rippleColor={colors.primary + '10'}
      >
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedLabelColor }}>
          Dashboard
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="transactions"
        indicatorColor={indicatorColor}
        rippleColor={colors.primary + '10'}
      >
        <NativeTabs.Trigger.Icon sf="arrow.up.arrow.down" md="swap_vert" />
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedLabelColor }}>
          Transactions
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="budgets"
        indicatorColor={indicatorColor}
        rippleColor={colors.primary + '10'}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: 'wallet.bifold', selected: 'wallet.bifold.fill' }}
          md="wallet"
        />
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedLabelColor }}>
          Budgets
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="reports"
        indicatorColor={indicatorColor}
        rippleColor={colors.primary + '10'}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedLabelColor }}>
          Reports
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="settings"
        indicatorColor={indicatorColor}
        rippleColor={colors.primary + '10'}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="tune"
        />
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedLabelColor }}>
          Settings
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
