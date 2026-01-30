import { Tabs } from "expo-router";
import { Home, Sparkles, TrendingUp, User } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { palette } from "@/constants/theme";
import ProfilePicturePopup from "@/components/ProfilePicturePopup";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import SimpleTabBar from "@/components/SimpleTabBar";

export default function TabLayout() {
  const { user, hasProfilePicture } = useUser();
  const { session } = useAuth();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  useEffect(() => {
    if (session && user && !hasProfilePicture && !hasShownPopup) {
      const timer = setTimeout(() => {
        setShowProfilePopup(true);
        setHasShownPopup(true);
      }, 1000);
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
        tabBar={(props) => <SimpleTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.primary,
          tabBarInactiveTintColor: palette.textSecondary,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Today",
            tabBarIcon: ({ color, focused }) => (
              <Home
                color={focused ? palette.primary : color}
                size={26}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="glow-coach"
          options={{
            title: "Routine",
            tabBarIcon: ({ color, focused }) => (
              <Sparkles
                color={focused ? palette.primary : color}
                size={26}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, focused }) => (
              <TrendingUp
                color={focused ? palette.primary : color}
                size={26}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Me",
            tabBarIcon: ({ color, focused }) => (
              <User
                color={focused ? palette.primary : color}
                size={26}
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            tabBarButton: () => null,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
