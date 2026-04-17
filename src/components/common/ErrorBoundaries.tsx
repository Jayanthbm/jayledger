import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeColors } from '../../models/types';
import Icon from '@expo/vector-icons/MaterialIcons';

interface Props {
  children: ReactNode;
  colors: ThemeColors;
  onReset?: () => void;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic Error Boundary to catch UI rendering errors and provide a fallback UI.
 */
export class DataErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DataErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      const { colors, fallbackTitle = 'Something went wrong' } = this.props;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.danger + '15' }]}>
            <Icon name="error-outline" size={48} color={colors.danger} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{fallbackTitle}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            The data layer encountered an unexpected issue while rendering this section.
          </Text>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.primary }]}
            onPress={this.handleReset}
          >
            <Text style={styles.resetButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderRadius: 16,
    margin: 16,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
