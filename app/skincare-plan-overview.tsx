import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { 
  Calendar, 
  Target, 
  Play, 
  CheckCircle,
  Sun,
  Moon,
  Droplets
} from 'lucide-react-native';
import { useSkincare } from '@/contexts/SkincareContext';
import { palette, shadow } from '@/constants/theme';

export default function SkincarePlanOverviewScreen() {
  const { currentPlan } = useSkincare();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'shopping'>('overview');

  if (!currentPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Skincare Plan" }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No skincare plan found</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/skincare-plan-selection')}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleStartPlan = () => {
    Alert.alert(
      'Start Your Journey',
      'Ready to begin your 30-day transformation? Your plan will be tracked in the Glow Coach section.',
      [
        { text: 'Not Yet', style: 'cancel' },
        { 
          text: 'Start Now', 
          onPress: () => {
            router.push('/(tabs)/glow-coach');
          }
        }
      ]
    );
  };

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Plan Header */}
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{currentPlan.title}</Text>
        <Text style={styles.planDescription}>{currentPlan.description}</Text>
        
        <View style={styles.planStats}>
          <View style={styles.statItem}>
            <Calendar color="#D4A574" size={20} />
            <Text style={styles.statNumber}>{currentPlan.duration}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statItem}>
            <Target color="#D4A574" size={20} />
            <Text style={styles.statNumber}>{currentPlan.targetGoals.length}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle color="#D4A574" size={20} />
            <Text style={styles.statNumber}>{currentPlan.weeklyPlans.length}</Text>
            <Text style={styles.statLabel}>Phases</Text>
          </View>
        </View>
      </View>

      {/* Target Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Your Goals</Text>
        {currentPlan.targetGoals.map((goal, index) => (
          <View key={index} style={styles.goalItem}>
            <CheckCircle color="#10B981" size={16} />
            <Text style={styles.goalText}>{goal}</Text>
          </View>
        ))}
      </View>

      {/* Weekly Phases */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 4-Week Journey</Text>
        {currentPlan.weeklyPlans.map((week, index) => (
          <View key={index} style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Week {week.week}: {week.focus}</Text>
            </View>
            <Text style={styles.weekDescription}>{week.description}</Text>
            
            <View style={styles.weekStats}>
              <View style={styles.weekStat}>
                <Sun color="#F59E0B" size={16} />
                <Text style={styles.weekStatText}>
                  {week.steps.filter(s => s.timeOfDay === 'morning' || s.timeOfDay === 'both').length} Morning
                </Text>
              </View>
              <View style={styles.weekStat}>
                <Moon color="#6366F1" size={16} />
                <Text style={styles.weekStatText}>
                  {week.steps.filter(s => s.timeOfDay === 'evening' || s.timeOfDay === 'both').length} Evening
                </Text>
              </View>
              <View style={styles.weekStat}>
                <Droplets color="#06B6D4" size={16} />
                <Text style={styles.weekStatText}>
                  {week.steps.filter(s => s.frequency === 'weekly').length} Weekly
                </Text>
              </View>
            </View>
            
            <Text style={styles.expectedResults}>Expected: {week.expectedResults[0]}</Text>
          </View>
        ))}
      </View>

      {/* Custom Goal */}
      {currentPlan.customGoal && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Your Custom Goal</Text>
          <View style={styles.customGoalCard}>
            <Text style={styles.customGoalText}>{currentPlan.customGoal}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderSchedule = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>Daily Routine Preview</Text>
        <Text style={styles.scheduleSubtitle}>Week 1 Schedule</Text>
        
        {/* Morning Routine */}
        <View style={styles.routineSection}>
          <View style={styles.routineHeader}>
            <Sun color="#F59E0B" size={20} />
            <Text style={styles.routineTitle}>Morning Routine</Text>
          </View>
          
          {currentPlan.weeklyPlans[0]?.steps
            .filter(step => step.timeOfDay === 'morning' || step.timeOfDay === 'both')
            .sort((a, b) => a.order - b.order)
            .map((step, index) => (
              <View key={step.id} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepName}>{step.name}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {step.products.length > 0 && (
                    <Text style={styles.stepProducts}>Products: {step.products.join(', ')}</Text>
                  )}
                </View>
              </View>
            ))
          }
        </View>

        {/* Evening Routine */}
        <View style={styles.routineSection}>
          <View style={styles.routineHeader}>
            <Moon color="#6366F1" size={20} />
            <Text style={styles.routineTitle}>Evening Routine</Text>
          </View>
          
          {currentPlan.weeklyPlans[0]?.steps
            .filter(step => step.timeOfDay === 'evening' || step.timeOfDay === 'both')
            .sort((a, b) => a.order - b.order)
            .map((step, index) => (
              <View key={step.id} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepName}>{step.name}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  {step.products.length > 0 && (
                    <Text style={styles.stepProducts}>Products: {step.products.join(', ')}</Text>
                  )}
                </View>
              </View>
            ))
          }
        </View>
      </View>
    </ScrollView>
  );

  const renderShopping = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.shoppingContainer}>
        <Text style={styles.shoppingTitle}>Shopping List</Text>
        <Text style={styles.shoppingSubtitle}>Everything you need to get started</Text>
        
        {currentPlan.shoppingList.map((category, index) => (
          <View key={index} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.category}</Text>
            
            {category.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.brand && <Text style={styles.productBrand}>{item.brand}</Text>}
                  {item.where && <Text style={styles.productWhere}>Available at: {item.where}</Text>}
                </View>
                
                <View style={styles.productMeta}>
                  {item.price && <Text style={styles.productPrice}>{item.price}</Text>}
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: 
                      item.priority === 'essential' ? '#FEE2E2' :
                      item.priority === 'recommended' ? '#FEF3C7' : '#F3F4F6'
                    }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color:
                        item.priority === 'essential' ? '#DC2626' :
                        item.priority === 'recommended' ? '#D97706' : '#6B7280'
                      }
                    ]}>
                      {item.priority}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Your Plan",
          headerBackTitle: "Back",
        }} 
      />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          onPress={() => setActiveTab('schedule')}
        >
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shopping' && styles.activeTab]}
          onPress={() => setActiveTab('shopping')}
        >
          <Text style={[styles.tabText, activeTab === 'shopping' && styles.activeTabText]}>Shopping</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'shopping' && renderShopping()}
      </View>

      {/* Start Button */}
      <View style={styles.startSection}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartPlan}>
          <Play color="white" size={20} />
          <Text style={styles.startButtonText}>Start My 30-Day Journey</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 6,
    marginBottom: 20,
    ...shadow.card,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: palette.primary,
    ...shadow.card,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  activeTabText: {
    color: palette.textLight,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  planHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 32,
    backgroundColor: palette.surface,
    borderRadius: 24,
    ...shadow.card,
  },
  planTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  planDescription: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.primary,
  },
  statLabel: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  goalText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  weekCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weekHeader: {
    marginBottom: 8,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weekDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  weekStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  weekStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expectedResults: {
    fontSize: 14,
    color: '#059669',
    fontStyle: 'italic',
  },
  customGoalCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
  },
  customGoalText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  scheduleContainer: {
    paddingBottom: 20,
  },
  scheduleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  scheduleSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  routineSection: {
    marginBottom: 32,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4A574',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  stepProducts: {
    fontSize: 12,
    color: '#D4A574',
    fontStyle: 'italic',
  },
  shoppingContainer: {
    paddingBottom: 20,
  },
  shoppingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  shoppingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  productWhere: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  productMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  startSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...shadow.elevated,
    minHeight: 56,
  },
  startButtonText: {
    color: palette.textLight,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#D4A574',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});