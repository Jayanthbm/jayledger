import { Animated, Dimensions, Platform, Pressable, StyleSheet, View } from "react-native";
import React, { useEffect, useRef } from "react";
import { useNavigation, useNavigationState } from "@react-navigation/native";

import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useTheme } from "../context/ThemeContext";

const TABS = [
  { name: "Overview", label: "Overview", icon: "badge-account-horizontal-outline", activeIcon: "badge-account-horizontal" },
  { name: "Transactions", label: "Transactions", icon: "file-document-outline", activeIcon: "file-document" },
  { name: "Budgets", label: "Budgets", icon: "wallet-outline", activeIcon: "wallet" },
  { name: "Reports", label: "Reports", icon: "chart-box-multiple-outline", activeIcon: "chart-box-multiple" },
  { name: "Settings", label: "Settings", icon: "cog-outline", activeIcon: "cog" },
];

function MainTabs() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const isAndroid = Platform.OS === "android";

  const state = useNavigationState((state) => state);
  const mainRoute = state?.routes?.find(r => r.name === "Main");
  const nestedState = mainRoute?.state;
  const currentRoute =
    nestedState?.routes?.[nestedState.index ?? 0]?.name ?? "Overview";
  const currentIndex = TABS.findIndex(tab => tab.name === currentRoute);

  let activeTab = state?.routes[0]?.state?.routes[state?.routes[0]?.state?.routes?.length - 1].params?.activeTab;

  let activeIndex = -1;
  if (activeTab) {
    activeIndex = TABS.findIndex(tab => tab.name === activeTab);
  } else {
    activeIndex = currentIndex >= 0 ? currentIndex : -1;
  }

  const anim = useRef(new Animated.Value(activeIndex)).current;

  // Animate pill movement
  useEffect(() => {
    Animated.spring(anim, {
      toValue: activeIndex,
      useNativeDriver: false,
      stiffness: 180,
      damping: 20,
    }).start();
  }, [activeIndex]);

  const screenWidth = Dimensions.get("window").width;
  const tabWidth = screenWidth / TABS.length;

  // Interpolations
  const translateX = anim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth),
  });


  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      {/* Animated pill background */}
      {activeIndex >= 0 && (
        <Animated.View style={[
          styles.activePill,
          {
            width: tabWidth * 0.7,
            backgroundColor: theme.colors.activeIndicator,
            transform: [{ translateX }],
            left: tabWidth * 0.15,
            opacity: anim.interpolate({
              inputRange: [activeIndex - 0.5, activeIndex, activeIndex + 0.5],
              outputRange: [0.4, 1, 0.4],
              extrapolate: "clamp",
            }),
        },
        ]} />
      )}


      {TABS.map((tab, i) => {
        let isFocused = false;
        if (activeTab) {
          isFocused = activeTab === tab.name
        } else {
          isFocused = currentRoute === tab.name
        }
        const scale = anim.interpolate({
          inputRange: [i - 1, i, i + 1],
          outputRange: [1, 1.15, 1],
          extrapolate: "clamp",
        });
        return (
          <Pressable
            key={tab.name}
            android_ripple={
              isAndroid
                ? {
                  color: theme.colors.onSurfaceVariant + "22",
                  borderless: true,
                  radius: 36,
                }
                : undefined
            }
            style={({ pressed }) => [
              styles.tab,
              {
                transform: [
                  { scale: pressed && !isAndroid ? 0.95 : 1 },
                ],
              },
            ]}
            onPress={() => navigation.navigate("Main", {
              screen: tab.name
            })}
          >
            <Animated.View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale }],
              }}>
              <Animated.Text>
                <MaterialDesignIcons
                  name={isFocused ? tab.activeIcon : tab.icon}
                  size={24}
                  color={isFocused ? theme.colors.onActiveIndicator : theme.colors.onSurfaceVariant}
                />
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? theme.colors.onActiveIndicator
                      : theme.colors.onSurfaceVariant,
                    transform: [{ scale }],
                  },
                ]}
              >
                {tab.label}
              </Animated.Text>
            </Animated.View>
          </Pressable>

        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 70,
    borderTopWidth: 0,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },
  activePill: {
    position: "absolute",
    height: 36,
    borderRadius: 18,
    top: 5,
    left: 12,
  },
});

export default React.memo(MainTabs);