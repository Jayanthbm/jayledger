import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../store/ThemeContext';
import { MaterialIconName } from '../../models/types';

export interface FinancialListItemProps {
  title: string;
  subtitle?: string | React.ReactNode;
  icon?: MaterialIconName;
  iconColor?: string;
  leftNode?: React.ReactNode;
  amountText: string;
  amountColor?: string;
  metaText?: string;
  rightBottomNode?: React.ReactNode;
  onPress?: () => void;
  onIconPress?: () => void;
  containerStyle?: ViewStyle;
  compact?: boolean;
  children?: React.ReactNode; // For progress bars or extra rows
}

export const FinancialListItem: React.FC<FinancialListItemProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  leftNode,
  amountText,
  amountColor,
  metaText,
  rightBottomNode,
  onPress,
  onIconPress,
  containerStyle,
  compact = false,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        compact && styles.containerCompact,
        containerStyle,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.mainRow}>
        {leftNode ? (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.background },
              compact && styles.iconContainerCompact,
            ]}
          >
            {leftNode}
          </View>
        ) : (
          icon && (
            <TouchableOpacity
              style={[
                styles.iconContainer,
                { backgroundColor: colors.background },
                compact && styles.iconContainerCompact,
              ]}
              onPress={onIconPress}
              disabled={!onIconPress}
            >
              <Icon name={icon} size={compact ? 20 : 24} color={iconColor || colors.primary} />
            </TouchableOpacity>
          )
        )}

        <View style={styles.contentMiddle}>
          <Text
            style={[styles.title, { color: colors.text }, compact && styles.titleCompact]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {subtitle && (
            <View>
              {typeof subtitle === 'string' ? (
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.textSecondary },
                    compact && styles.subtitleCompact,
                  ]}
                  numberOfLines={compact ? 1 : 2}
                  ellipsizeMode="tail"
                >
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )}
            </View>
          )}

          {(metaText || rightBottomNode) && (
            <View style={[styles.footerContainer, compact && styles.footerContainerCompact]}>
              {metaText && (
                <View style={styles.footerRow}>
                  <Text style={[styles.metaText, { color: colors.textSecondary + '80' }]}>
                    {metaText}
                  </Text>
                </View>
              )}
              {rightBottomNode && <View style={styles.footerRow}>{rightBottomNode}</View>}
            </View>
          )}
        </View>

        <View style={styles.contentRight}>
          <Text
            style={[
              styles.amount,
              { color: amountColor || colors.text },
              compact && styles.amountCompact,
            ]}
          >
            {amountText}
          </Text>
        </View>
      </View>
      {children && <View style={styles.childrenContainer}>{children}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  containerCompact: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  contentMiddle: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 11,
    marginTop: 2,
  },
  contentRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  amount: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  amountCompact: {
    fontSize: 15,
  },
  footerContainer: {
    marginTop: 1,
  },
  footerContainerCompact: {
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 4,
  },
  childrenContainer: {
    marginTop: 12,
  },
});
