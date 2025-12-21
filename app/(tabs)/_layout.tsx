import { Tabs } from "expo-router";
import { Heart, Wand2, Users, User } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { View, Platform } from "react-native";
import AuthGuard from "@/components/AuthGuard";
import { palette } from "@/constants/theme";
import ProfilePicturePopup from "@/components/ProfilePicturePopup";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { user, hasProfilePicture } = useUser();
  const { session } = useAuth();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  useEffect(() => {
    // Show popup only once after login if user doesn't have profile picture
    if (session && user && !hasProfilePicture && !hasShownPopup) {
      const timer = setTimeout(() => {
        setShowProfilePopup(true);
        setHasShownPopup(true);
      }, 1000); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [session, user, hasProfilePicture, hasShownPopup]);

  const handleCloseProfilePopup = () => {
    setShowProfilePopup(false);
  };

  return (
    <AuthGuard>
      <ProfilePicturePopup 
        visible={showProfilePopup} 
        onClose={handleCloseProfilePopup} 
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textMuted,
          tabBarStyle: {
            backgroundColor: palette.surface,
            borderTopWidth: 0.5,
            borderTopColor: palette.divider,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 24 : 16,
            height: Platform.OS === 'ios' ? 88 : 72,
            shadowColor: palette.shadow,
            shadowOpacity: 0.08,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -8 },
            elevation: 12,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            marginTop: 4,
            letterSpacing: 0.8,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                padding: 6, 
                borderRadius: 12, 
                backgroundColor: focused ? palette.overlayGold : 'transparent' 
              }}>
                <Heart 
                  color={focused ? palette.primary : color} 
                  size={focused ? 24 : 22}
                  strokeWidth={focused ? 2 : 1.5}
                  fill={focused ? palette.overlayGold : "transparent"}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="glow-coach"
          options={{
            title: "Coach",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                padding: 6, 
                borderRadius: 12, 
                backgroundColor: focused ? palette.overlaySage : 'transparent' 
              }}>
                <Wand2 
                  color={focused ? palette.primary : color} 
                  size={focused ? 24 : 22}
                  strokeWidth={focused ? 2 : 1.5}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: "Community",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                padding: 6, 
                borderRadius: 12, 
                backgroundColor: focused ? palette.overlayGold : 'transparent' 
              }}>
                <Users 
                  color={focused ? palette.primary : color} 
                  size={focused ? 24 : 22}
                  strokeWidth={focused ? 2 : 1.5}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                padding: 6, 
                borderRadius: 12, 
                backgroundColor: focused ? palette.overlayGold : 'transparent' 
              }}>
                <User 
                  color={focused ? palette.primary : color} 
                  size={focused ? 24 : 22}
                  strokeWidth={focused ? 2 : 1.5}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}