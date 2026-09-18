import React from 'react';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '../../src/store/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();

  const selectedColor = colors.primary;
  const indicatorColor = colors.primary + '18';

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={colors.card}
      tintColor={selectedColor}
      iconColor={{
        default: colors.textSecondary,
        selected: selectedColor,
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
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedColor }}>
          Dashboard
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="transactions"
        indicatorColor={indicatorColor}
        rippleColor={colors.primary + '10'}
      >
        <NativeTabs.Trigger.Icon sf="arrow.up.arrow.down" md="swap_vert" />
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedColor }}>
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
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedColor }}>
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
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedColor }}>
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
        <NativeTabs.Trigger.Label selectedStyle={{ color: selectedColor }}>
          Settings
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
