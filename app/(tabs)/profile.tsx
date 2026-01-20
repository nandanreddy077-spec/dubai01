import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
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
  Star,
  Sparkles,
  Heart,
  Gift,
  Edit3,
  X,
  Crown,
  Zap,
} from "lucide-react-native";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import GlassCard from "@/components/GlassCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { getPalette, getGradient, shadow, radii } from "@/constants/theme";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

const formatAnalysisTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  return `${Math.floor(diffInHours / 24)}d ago`;
};

export default function ProfileScreen() {
  const { user, setUser } = useUser();
  const { user: authUser, signOut } = useAuth();
  const { theme } = useTheme();
  const { analysisHistory } = useAnalysis();
  const { state: subscriptionState, inTrial, daysLeft, scansLeft, setSubscriptionData } = useSubscription();
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isRestoringPurchases, setIsRestoringPurchases] = useState<boolean>(false);
  const [showNameEditModal, setShowNameEditModal] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  
  const palette = getPalette(theme);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("settings_notifications_enabled");
        if (stored !== null) setNotificationsEnabled(stored === "true");
      } catch (e) {
        console.log("Failed to load notifications pref", e);
      }
    };
    load();
    
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scaleAnim]);

  const toggleNotifications = useCallback(async () => {
    try {
      const next = !notificationsEnabled;
      setNotificationsEnabled(next);
      await AsyncStorage.setItem("settings_notifications_enabled", String(next));
    } catch (e) {
      Alert.alert("Error", "Could not update notifications setting.");
    }
  }, [notificationsEnabled]);

  const handleAvatarPress = useCallback(() => {
    setShowPhotoPicker(true);
  }, []);

  const handlePhotoPickerClose = useCallback(() => {
    setShowPhotoPicker(false);
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('@onboarding_completed');
          } catch (error) {
            console.error('Error clearing onboarding flag:', error);
          }
          await signOut();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const handleHelpSupport = useCallback(async () => {
    const subject = encodeURIComponent("Help & Support - GlowCheck");
    const body = encodeURIComponent("Hi GlowCheck Team,\n\nI need help with...");
    const url = `mailto:anixagency7@gmail.com?subject=${subject}&body=${body}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else if (Platform.OS === "web") {
        (globalThis as unknown as { location: { href: string } }).location.href = url;
      } else {
        Alert.alert("Error", "Email app is not available.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not open email composer.");
    }
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Restore purchases is only available in the mobile app.');
      return;
    }

    setIsRestoringPurchases(true);
    try {
      const { paymentService } = await import('@/lib/payments');
      const restored = await paymentService.restorePurchases();
      
      if (restored && restored.length > 0) {
        const activeSubscription = restored[0];
        await setSubscriptionData({
          isPremium: true,
          subscriptionType: activeSubscription.productId?.includes('annual') ? 'yearly' : 'monthly',
          subscriptionPrice: activeSubscription.productId?.includes('annual') ? 99 : 8.99,
          nextBillingDate: activeSubscription.expiryDate,
          purchaseToken: activeSubscription.purchaseToken,
          originalTransactionId: activeSubscription.originalTransactionId,
        });
        Alert.alert('Success!', 'Your subscription has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any purchases for this account.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsRestoringPurchases(false);
    }
  }, [setSubscriptionData]);

  const displayName = useMemo(() => {
    const nameFromAuth = authUser?.user_metadata && typeof authUser.user_metadata === 'object' 
      ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name ?? (authUser.user_metadata as { full_name?: string; name?: string }).name 
      : undefined;
    return nameFromAuth ?? user?.name ?? 'Beautiful Soul';
  }, [authUser?.user_metadata, user?.name]);

  const displayEmail = useMemo(() => {
    return authUser?.email ?? user?.email ?? '';
  }, [authUser?.email, user?.email]);

  const recentActivities = useMemo(() => {
    return analysisHistory.slice(0, 3).map((analysis) => ({
      id: analysis.timestamp,
      title: 'Glow Analysis',
      time: formatAnalysisTime(analysis.timestamp),
      score: Math.round(analysis.overallScore),
      rating: analysis.rating,
    }));
  }, [analysisHistory]);

  const styles = useMemo(() => createStyles(palette), [palette]);

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid name.');
      return;
    }
    
    try {
      const newName = editedName.trim();
      if (user) {
        await setUser({ ...user, name: newName });
      }
      
      if (authUser) {
        await supabase.auth.updateUser({ data: { full_name: newName, name: newName } });
        await supabase.auth.refreshSession();
      }
      
      setShowNameEditModal(false);
      Alert.alert('Success', 'Name updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update name.');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FAFBFC', '#F5F7FA']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FAFBFC', '#F5F7FA']} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Animated.View style={[styles.avatarSection, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity 
              onPress={handleAvatarPress} 
              activeOpacity={0.8} 
              style={styles.avatarContainer}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#E8DDD5', '#D4C4B8']} style={styles.avatarPlaceholder}>
                  <UserIcon color="#6B7280" size={40} strokeWidth={1.5} />
                </LinearGradient>
              )}
              <View style={styles.cameraButton}>
                <Camera color="#FFFFFF" size={14} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity 
            style={styles.nameRow}
            onPress={() => { setEditedName(displayName); setShowNameEditModal(true); }}
            activeOpacity={0.7}
          >
            <Text style={styles.displayName}>{displayName}</Text>
            <Edit3 color={palette.textSecondary} size={16} />
          </TouchableOpacity>
          
          {displayEmail ? <Text style={styles.email}>{displayEmail}</Text> : null}
          
          <View style={styles.memberBadge}>
            <Crown color="#C9A961" size={14} />
            <Text style={styles.memberBadgeText}>
              {subscriptionState.isPremium ? 'Premium Member' : inTrial ? 'Trial Member' : 'Free Member'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <GlassCard variant="elevated" borderRadius={20}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: 'rgba(201,169,97,0.12)' }]}>
                  <Camera color="#C9A961" size={18} strokeWidth={2.5} />
                </View>
                <Text style={styles.statNumber}>{user.stats.analyses}</Text>
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <Zap color="#EF4444" size={18} fill="#EF4444" />
                </View>
                <Text style={styles.statNumber}>{user.stats.dayStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statBox}>
                <View style={[styles.statIconBg, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <Star color="#10B981" size={18} fill="#10B981" />
                </View>
                <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {recentActivities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <GlassCard variant="elevated" borderRadius={20} padding={0}>
              {recentActivities.map((activity, index) => (
                <View 
                  key={activity.id} 
                  style={[
                    styles.activityRow,
                    index < recentActivities.length - 1 && styles.activityRowBorder
                  ]}
                >
                  <View style={styles.activityIcon}>
                    <Sparkles color="#C9A961" size={18} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <View style={styles.activityScore}>
                    <Text style={styles.scoreValue}>{activity.score}</Text>
                    <Text style={styles.scoreLabel}>score</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <GlassCard variant="elevated" borderRadius={20} padding={0}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(232,221,213,0.4)' }]}>
                <Bell color="#8B7355" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#E5E7EB', true: '#C9A961' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/start-trial')} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(201,169,97,0.15)' }]}>
                <Heart color="#C9A961" size={20} fill="#C9A961" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingText}>Subscription</Text>
                <Text style={styles.settingSubtext}>
                  {subscriptionState.isPremium 
                    ? `Premium ${subscriptionState.subscriptionType}` 
                    : inTrial 
                      ? `Trial • ${daysLeft}d left` 
                      : 'Free plan'}
                </Text>
              </View>
              <ChevronRight color="#C9A961" size={20} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={handleRestorePurchases} 
              activeOpacity={0.7}
              disabled={isRestoringPurchases}
            >
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(107,114,128,0.1)' }]}>
                <Shield color="#6B7280" size={20} />
              </View>
              <Text style={styles.settingText}>Restore Purchases</Text>
              {isRestoringPurchases ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <ChevronRight color="#9CA3AF" size={20} />
              )}
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/promo-code')} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                <Gift color="#10B981" size={20} />
              </View>
              <Text style={styles.settingText}>Promo Code</Text>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/privacy-care')} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
                <Shield color="#6366F1" size={20} />
              </View>
              <Text style={styles.settingText}>Privacy & Terms</Text>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleHelpSupport} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <HelpCircle color="#3B82F6" size={20} />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut color="#EF4444" size={20} strokeWidth={2} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {showPhotoPicker && (
        <PhotoPickerModal visible={showPhotoPicker} onClose={handlePhotoPickerClose} />
      )}

      <Modal visible={showNameEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TouchableOpacity onPress={() => setShowNameEditModal(false)}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your name"
              value={editedName}
              onChangeText={setEditedName}
              placeholderTextColor="#9CA3AF"
              autoFocus
              maxLength={50}
            />
            
            <TouchableOpacity 
              style={[styles.modalSaveButton, { opacity: editedName.trim() ? 1 : 0.5 }]}
              onPress={handleSaveName}
              disabled={!editedName.trim()}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatarSection: {
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 12,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,169,97,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#C9A961',
    letterSpacing: 0.3,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginBottom: 2,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(201,169,97,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  activityScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#C9A961',
  },
  scoreLabel: {
    fontSize: 10,
    color: palette.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.textPrimary,
  },
  settingSubtext: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 20,
  },
  modalSaveButton: {
    backgroundColor: '#0A0A0A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
