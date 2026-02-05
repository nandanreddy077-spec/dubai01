import { Tabs } from "expo-router";
import { Scan, CheckCircle, User } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { palette } from "@/constants/theme";
import ProfilePicturePopup from "@/components/ProfilePicturePopup";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import GlassTabBar from "@/components/GlassTabBar";

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
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textSecondary,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Scan",
            tabBarIcon: ({ color, size, focused }) => (
              <Scan
                color={focused ? palette.primary : color}
                size={size}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="glow-coach"
          options={{
            title: "Routine",
            tabBarIcon: ({ color, size, focused }) => (
              <CheckCircle
                color={focused ? palette.gold : color}
                size={size}
                strokeWidth={focused ? 2.5 : 2}
                fill={focused ? "rgba(201,169,97,0.2)" : "transparent"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "You",
            tabBarIcon: ({ color, size, focused }) => (
              <User
                color={focused ? palette.secondary : color}
                size={size}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            href: null, // Hide from tab bar but keep accessible
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            href: null, // Hide from tab bar but keep accessible
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}