// src/components/app/ListCard.jsx.jsx

import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import Text from '../core/Text';
import { useTheme } from '../../context/ThemeContext';
import TurboImage from 'react-native-turbo-image';

const ListCard = ({
  icon = null,
  image = null,
  title,
  description = '',
  onPress,
  compact = false,
  keyname = '',
}) => {
  const { theme } = useTheme();
  const isAndroid = Platform.OS === 'android';
  return (
    <Pressable
      key={`${theme.mode}-${keyname}`}
      onPress={onPress}
      android_ripple={
        isAndroid
          ? {
              color: theme.colors.onSurfaceVariant + '22',
              borderless: false,
              foreground: true,
            }
          : undefined
      }
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
          opacity: pressed && !isAndroid ? 0.9 : 1,
          padding: compact ? 12 : 16,
          transform: [{ scale: pressed && !isAndroid ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        {icon ? (
          <MaterialDesignIcons name={icon} size={24} color={theme.colors.primary} />
        ) : image ? (
          <TurboImage
            source={{ uri: image }}
            style={{ width: 36, height: 36 }}
            cachePolicy="urlCache"
          />
        ) : (
          <MaterialDesignIcons
            name={'text-box-multiple-outline'}
            size={24}
            color={theme.colors.primary}
          />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[styles.title, { color: theme.colors.onSurface, fontSize: compact ? 14 : 16 }]}
          numberOfLines={compact ? 2 : 1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {!compact && description && description !== '' ? (
          <Text
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 1,

    // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default ListCard;
