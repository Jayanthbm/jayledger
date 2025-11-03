import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useEffect, useRef } from "react";
import { useNavigation, useNavigationState, useRoute } from "@react-navigation/native";

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
  const state = useNavigationState((state) => state);
  let activeTab = state?.routes[0]?.state?.routes[state?.routes[0]?.state?.routes?.length - 1].params?.activeTab;

  // find nested route inside "Main"
  const mainRoute = state?.routes?.find(r => r.name === "Main");
  const nestedState = mainRoute?.state;
  const currentRoute =
    nestedState?.routes?.[nestedState.index ?? 0]?.name ?? "Overview";
  const currentIndex = TABS.findIndex(tab => tab.name === currentRoute);

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

  // Dynamic tab width (screen width ÷ tab count)
  const screenWidth = Dimensions.get("window").width;
  const tabWidth = screenWidth / TABS.length;

  // Interpolations
  const translateX = anim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth),
  });


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
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
        // Scale animation for active tab
        const scale = anim.interpolate({
          inputRange: [i - 1, i, i + 1],
          outputRange: [1, 1.15, 1],
          extrapolate: "clamp",
        });


        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Main", {
              screen: tab.name
            })}
          >
            <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
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
          </TouchableOpacity>

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