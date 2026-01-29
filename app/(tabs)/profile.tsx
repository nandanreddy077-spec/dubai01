import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  HelpCircle,
  User as UserIcon,
  Crown,
  Gift,
} from "lucide-react-native";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { shadow } from "@/constants/theme";

export default function ProfileScreen() {
  const { user } = useUser();
  const { user: authUser, signOut } = useAuth();
  const { state: subscriptionState, inTrial, daysLeft, scansLeft } = useSubscription();
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  const toggleNotifications = useCallback(async () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    await AsyncStorage.setItem("settings_notifications_enabled", String(next));
  }, [notificationsEnabled]);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('@onboarding_completed');
          await signOut();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const handleHelp = useCallback(async () => {
    const url = `mailto:anixagency7@gmail.com?subject=Help%20Request`;
    try {
      if (Platform.OS === "web") {
        (globalThis as unknown as { location: { href: string } }).location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (e) {
      Alert.alert("Error", "Could not open email.");
    }
  }, []);

  const displayName = useMemo(() => {
    if (authUser?.user_metadata && typeof authUser.user_metadata === 'object') {
      const meta = authUser.user_metadata as { full_name?: string; name?: string };
      return meta.full_name ?? meta.name ?? user?.name ?? 'User';
    }
    return user?.name ?? 'User';
  }, [authUser?.user_metadata, user?.name]);

  const displayEmail = useMemo(() => {
    return authUser?.email ?? user?.email ?? '';
  }, [authUser?.email, user?.email]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setShowPhotoPicker(true)} 
            activeOpacity={0.8}
            style={styles.avatarContainer}
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon color="#9CA3AF" size={40} />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera color="#FFFFFF" size={16} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📸</Text>
            <Text style={styles.statNumber}>{user.stats.analyses}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{user.stats.dayStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✨</Text>
            <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.subscriptionCard}
          onPress={() => router.push('/start-trial')}
          activeOpacity={0.8}
        >
          <View style={styles.subscriptionIcon}>
            <Crown color="#D97706" size={24} />
          </View>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionTitle}>
              {subscriptionState.isPremium ? 'Premium Member' : inTrial ? 'Free Trial' : 'Free Plan'}
            </Text>
            <Text style={styles.subscriptionDesc}>
              {subscriptionState.isPremium 
                ? `${subscriptionState.subscriptionType} • $${subscriptionState.subscriptionPrice}` 
                : inTrial 
                  ? `${daysLeft} days, ${scansLeft} scans left` 
                  : 'Upgrade for unlimited scans'}
            </Text>
          </View>
          <ChevronRight color="#D97706" size={22} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FEF3C7' }]}>
                <Bell color="#D97706" size={20} />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#E5E7EB', true: '#FDE68A' }}
              thumbColor={notificationsEnabled ? '#D97706' : '#9CA3AF'}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/promo-code')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#ECFDF5' }]}>
                <Gift color="#059669" size={20} />
              </View>
              <Text style={styles.settingText}>Promo Code</Text>
            </View>
            <ChevronRight color="#9CA3AF" size={22} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/privacy-care')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#EDE9FE' }]}>
                <Shield color="#7C3AED" size={20} />
              </View>
              <Text style={styles.settingText}>Privacy</Text>
            </View>
            <ChevronRight color="#9CA3AF" size={22} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleHelp}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#DBEAFE' }]}>
                <HelpCircle color="#2563EB" size={20} />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <ChevronRight color="#9CA3AF" size={22} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {showPhotoPicker && (
        <PhotoPickerModal 
          visible={showPhotoPicker} 
          onClose={() => setShowPhotoPicker(false)} 
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 18,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    marginBottom: 28,
    ...shadow.soft,
  },
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subscriptionDesc: {
    fontSize: 14,
    color: '#92400E',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 100,
  },
});
