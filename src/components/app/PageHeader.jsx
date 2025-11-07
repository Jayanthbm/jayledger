// src/components/app/PageHeader.jsx

import { StyleSheet, View } from 'react-native';

import PageTitle from './PageTitle';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const PageHeader = ({ title, children }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.outlineVariant }]}>
      <PageTitle title={title} />
      <View style={styles.rightContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default React.memo(PageHeader);
