// src/components/app/AppBar.jsx

import { Pressable, StyleSheet, Text, View } from 'react-native';

import Loader from '../core/Loader';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import SearchBar from './SearchBar';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const ICON_SIZE = 24; // Material 3 standard icon size
const ICON_TOUCH = 48; // Material 3 minimum touch target

const AppBar = ({
  showBack = true,
  loading = false,
  title = null,
  showSearch = false,
  icons = [], // Array of { name, onPress }
  onSearch,
  searchValue,
  onSearchClear,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const onBackPress = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const iconColor = theme.colors.onSurface;

  // Combine individual icons into the array for unified rendering
  const rightIcons = [...icons];

  return (
    <>
      <View style={styles.container}>
        {/* Left (Back icon if enabled) */}
        {showBack ? (
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
            android_ripple={{
              color: theme.colors.onSurfaceVariant + '22',
              borderless: true,
              foreground: true,
            }}
          >
            <MaterialDesignIcons name="arrow-left" size={ICON_SIZE} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.sideSpace} />
        )}

        {/* Center (Title or SearchBar) */}
        <View style={styles.centerContainer}>
          {title === null || showSearch ? (
            <SearchBar
              placeholder="Search..."
              onChangeText={onSearch}
              value={searchValue}
              onClear={onSearchClear}
              style={styles.searchBar}
              autoFocus={showSearch && title !== null} // Auto focus if toggled from title
            />
          ) : (
            <Text
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          )}
        </View>

        {/* Right (Action Icons) */}
        <View style={styles.rightContainer}>
          {rightIcons.map((icon, index) => (
            <Pressable
              key={index}
              onPress={icon.onPress}
              style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
              android_ripple={{
                color: theme.colors.onSurfaceVariant + '22',
                borderless: true,
                foreground: true,
              }}
            >
              <MaterialDesignIcons name={icon.name} size={ICON_SIZE} color={iconColor} />
            </Pressable>
          ))}
        </View>
      </View>

      {loading && <Loader inline position="center" size="medium" variant="contained" />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56, // Material 3 standard height (can be 56 or 64)
    paddingHorizontal: 8,
    elevation: 0, // Flat by default in M3, scroll behavior adds elevation usually
  },
  iconButton: {
    width: ICON_TOUCH,
    height: ICON_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ICON_TOUCH / 2,
  },
  sideSpace: {
    width: 16, // Standard margin if no back button
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 22, // Material 3 Title Large
    fontWeight: '400',
    fontFamily: 'System', // Use system font or custom font if available
  },
  searchBar: {
    marginVertical: 0,
    height: 48, // Adjust to fit nicely in AppBar
    borderRadius: 24,
    elevation: 0,
    backgroundColor: 'transparent', // Or slightly tinted if needed, SearchBar component handles its own bg usually but we might want to override
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
export default AppBar;
