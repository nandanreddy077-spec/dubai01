import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, TrendingUp, AlertCircle, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CircularMetric from './CircularMetric';
import { getPalette, shadow, spacing, radii } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ResultsInterpretationGuideProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function ResultsInterpretationGuide({
  visible,
  onClose,
}: ResultsInterpretationGuideProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);

  const examples = [
    {
      score: 90,
      label: 'Excellent',
      color: palette.success,
      message: "You're doing great!",
      subMessage: 'Keep up the good work!',
      description: 'Scores in this range indicate excellent skin health.',
    },
    {
      score: 50,
      label: 'Moderate',
      color: palette.warning,
      message: "You're getting there!",
      subMessage: "There's room for improvement.",
      description: 'Moderate scores show potential for improvement with the right routine.',
    },
    {
      score: 6,
      label: 'Concern',
      color: palette.error,
      message: 'This is a concern area.',
      subMessage: "Don't worry, we'll improve this together!",
      description: 'Lower scores indicate areas that need focused attention.',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[palette.background, palette.surface]}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>
              Here's how to read your results
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Intro */}
            <View style={[styles.introCard, { backgroundColor: palette.surfaceElevated }]}>
              <Text style={[styles.introText, { color: palette.textSecondary }]}>
                Each circle represents a different skin metric. The number shows your score from 0-100,
                and the color indicates your performance level.
              </Text>
            </View>

            {/* Examples */}
            {examples.map((example, index) => (
              <View
                key={index}
                style={[styles.exampleCard, { backgroundColor: palette.surface }]}
              >
                <View style={styles.exampleHeader}>
                  <View style={styles.exampleMetric}>
                    <CircularMetric
                      score={example.score}
                      label={example.label}
                      isLocked={false}
                    />
                  </View>
                  <View style={styles.exampleContent}>
                    <Text style={[styles.exampleMessage, { color: palette.textPrimary }]}>
                      {example.message}
                    </Text>
                    <Text style={[styles.exampleSubMessage, { color: palette.textSecondary }]}>
                      {example.subMessage}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.exampleDescription, { color: palette.textTertiary }]}>
                  {example.description}
                </Text>
              </View>
            ))}

            {/* Score Ranges */}
            <View style={[styles.rangesCard, { backgroundColor: palette.surface }]}>
              <Text style={[styles.rangesTitle, { color: palette.textPrimary }]}>
                Score Ranges
              </Text>
              <View style={styles.rangeItems}>
                <View style={styles.rangeItem}>
                  <View
                    style={[
                      styles.rangeIndicator,
                      { backgroundColor: palette.success, opacity: 0.2 },
                    ]}
                  >
                    <View
                      style={[styles.rangeDot, { backgroundColor: palette.success }]}
                    />
                  </View>
                  <View style={styles.rangeContent}>
                    <Text style={[styles.rangeLabel, { color: palette.textPrimary }]}>
                      80-100: Excellent
                    </Text>
                    <Text style={[styles.rangeText, { color: palette.textSecondary }]}>
                      Great job! Your skin is in excellent condition.
                    </Text>
                  </View>
                </View>

                <View style={styles.rangeItem}>
                  <View
                    style={[
                      styles.rangeIndicator,
                      { backgroundColor: palette.warning, opacity: 0.2 },
                    ]}
                  >
                    <View
                      style={[styles.rangeDot, { backgroundColor: palette.warning }]}
                    />
                  </View>
                  <View style={styles.rangeContent}>
                    <Text style={[styles.rangeLabel, { color: palette.textPrimary }]}>
                      50-79: Moderate
                    </Text>
                    <Text style={[styles.rangeText, { color: palette.textSecondary }]}>
                      Room for improvement with the right skincare routine.
                    </Text>
                  </View>
                </View>

                <View style={styles.rangeItem}>
                  <View
                    style={[
                      styles.rangeIndicator,
                      { backgroundColor: palette.error, opacity: 0.2 },
                    ]}
                  >
                    <View style={[styles.rangeDot, { backgroundColor: palette.error }]} />
                  </View>
                  <View style={styles.rangeContent}>
                    <Text style={[styles.rangeLabel, { color: palette.textPrimary }]}>
                      0-49: Needs Attention
                    </Text>
                    <Text style={[styles.rangeText, { color: palette.textSecondary }]}>
                      This area needs focused care and attention.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tips */}
            <View style={[styles.tipsCard, { backgroundColor: palette.overlayLight }]}>
              <Star color={palette.warning} size={20} fill={palette.warning} />
              <View style={styles.tipsContent}>
                <Text style={[styles.tipsTitle, { color: palette.textPrimary }]}>
                  Pro Tip
                </Text>
                <Text style={[styles.tipsText, { color: palette.textSecondary }]}>
                  Tap any metric circle to see detailed information and personalized recommendations
                  for that specific area.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* CTA Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: palette.primary }, shadow.card]}
              onPress={onClose}
              activeOpacity={0.9}
            >
              <Text style={[styles.ctaButtonText, { color: palette.textLight }]}>
                See Your Results
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  exampleCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exampleMetric: {
    marginRight: spacing.lg,
  },
  exampleContent: {
    flex: 1,
  },
  exampleMessage: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  exampleSubMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  exampleDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  rangesCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  rangesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  rangeItems: {
    gap: spacing.md,
  },
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rangeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rangeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  rangeContent: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  rangeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipsCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  ctaButton: {
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

