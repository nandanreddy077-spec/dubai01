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
            borderTopWidth: 0,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 24 : 16,
            height: Platform.OS === 'ios' ? 88 : 72,
            shadowColor: palette.shadow,
            shadowOpacity: 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 4,
            letterSpacing: 0.5,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Glow",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                padding: 8, 
                borderRadius: 16, 
                backgroundColor: focused ? palette.overlayBlush : 'transparent' 
              }}>
                <Heart 
                  color={focused ? palette.primary : color} 
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.5 : 2}
                  fill={focused ? palette.blush : "transparent"}
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
                padding: 8, 
                borderRadius: 16, 
                backgroundColor: focused ? palette.overlayLavender : 'transparent' 
              }}>
                <Wand2 
                  color={focused ? palette.lavender : color} 
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: "Circle",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                padding: 8, 
                borderRadius: 16, 
                backgroundColor: focused ? palette.overlayGold : 'transparent' 
              }}>
                <Users 
                  color={focused ? palette.gold : color} 
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "You",
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                padding: 8, 
                borderRadius: 16, 
                backgroundColor: focused ? palette.overlayGold : 'transparent' 
              }}>
                <User 
                  color={focused ? palette.secondary : color} 
                  size={focused ? 22 : 20}
                  strokeWidth={focused ? 2.5 : 2}
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