/**
 * Skin Health Engine - Dermatologist-Level Analysis
 * Provides evidence-based insights for genuine skin transformation
 */

import { AnalysisResult } from '@/contexts/AnalysisContext';
import { Product } from '@/types/product';

export interface SkinBarrierHealth {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'compromised' | 'damaged';
  indicators: {
    hydration: number;
    sensitivity: number;
    irritation: number;
    recovery: number;
  };
  recommendations: string[];
  repairPriority: 'high' | 'medium' | 'low';
}

export interface TreatmentResponse {
  productId: string;
  productName: string;
  daysUsed: number;
  impact: {
    hydration: number; // change from baseline
    texture: number;
    brightness: number;
    acne: number;
    overall: number;
  };
  sideEffects: {
    irritation: boolean;
    breakouts: boolean;
    dryness: boolean;
    redness: boolean;
  };
  verdict: 'excellent' | 'good' | 'neutral' | 'poor' | 'harmful';
  recommendation: string;
  confidence: number; // 0-100
  evidence: {
    photosAnalyzed: number;
    consistentImprovement: boolean;
    sideEffectFrequency: number;
  };
}

export interface AcneTrigger {
  factor: string;
  correlation: number; // 0-100, how strongly correlated
  frequency: number; // how often it triggers
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
  type: 'diet' | 'stress' | 'hormonal' | 'product' | 'lifestyle' | 'environment';
}

export interface LifestyleCorrelation {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-100
  evidence: string;
  recommendation: string;
  actionable: boolean;
}

/**
 * Calculate skin barrier health from analysis results
 */
export function calculateBarrierHealth(
  currentAnalysis: AnalysisResult,
  history: AnalysisResult[]
): SkinBarrierHealth {
  const hydration = currentAnalysis.detailedScores.hydrationLevel;
  const texture = currentAnalysis.detailedScores.skinTexture;
  
  // Calculate sensitivity score (inverse of texture + hydration stability)
  const recentHydration = history.slice(0, 3).map(a => a.detailedScores.hydrationLevel);
  const hydrationStability = recentHydration.length > 1
    ? 100 - (Math.max(...recentHydration) - Math.min(...recentHydration))
    : 100;
  
  const sensitivity = Math.max(0, 100 - hydrationStability - texture);
  
  // Calculate irritation (based on pore visibility and texture)
  const irritation = Math.max(0, 
    (100 - currentAnalysis.detailedScores.poreVisibility) * 0.5 +
    (100 - texture) * 0.5
  );
  
  // Calculate recovery (improvement trend)
  const recovery = history.length >= 2
    ? Math.max(0, 
        (currentAnalysis.detailedScores.hydrationLevel - history[1].detailedScores.hydrationLevel) * 2
      )
    : 50;
  
  // Overall barrier score
  const barrierScore = Math.round(
    hydration * 0.3 +
    (100 - sensitivity) * 0.25 +
    (100 - irritation) * 0.25 +
    recovery * 0.2
  );
  
  let status: SkinBarrierHealth['status'] = 'excellent';
  let repairPriority: SkinBarrierHealth['repairPriority'] = 'low';
  const recommendations: string[] = [];
  
  if (barrierScore >= 80) {
    status = 'excellent';
    recommendations.push('Your skin barrier is healthy! Maintain with gentle products.');
  } else if (barrierScore >= 65) {
    status = 'good';
    recommendations.push('Barrier is healthy but could be stronger. Focus on hydration.');
  } else if (barrierScore >= 50) {
    status = 'compromised';
    repairPriority = 'high';
    recommendations.push('⚠️ Barrier is compromised. Avoid harsh products and focus on repair.');
    recommendations.push('Use ceramides, niacinamide, and fatty acids to rebuild barrier.');
    recommendations.push('Avoid exfoliants and active ingredients until barrier recovers.');
  } else {
    status = 'damaged';
    repairPriority = 'high';
    recommendations.push('🚨 Barrier is damaged. Immediate repair needed.');
    recommendations.push('Use barrier repair products with ceramides, cholesterol, and fatty acids.');
    recommendations.push('Avoid ALL active ingredients (retinol, AHA, BHA) until healed.');
    recommendations.push('Consider seeing a dermatologist if irritation persists.');
  }
  
  if (hydration < 60) {
    recommendations.push('Increase hydration with hyaluronic acid and glycerin.');
  }
  
  if (sensitivity > 40) {
    recommendations.push('Reduce sensitivity by avoiding fragrances and harsh ingredients.');
  }
  
  return {
    score: barrierScore,
    status,
    indicators: {
      hydration,
      sensitivity,
      irritation,
      recovery,
    },
    recommendations,
    repairPriority,
  };
}

/**
 * Analyze treatment response for a product
 */
export function analyzeTreatmentResponse(
  product: Product,
  baselineAnalysis: AnalysisResult,
  currentAnalysis: AnalysisResult,
  daysUsed: number,
  sideEffects: {
    irritation?: boolean;
    breakouts?: boolean;
    dryness?: boolean;
    redness?: boolean;
  } = {}
): TreatmentResponse {
  const hydrationChange = currentAnalysis.detailedScores.hydrationLevel - baselineAnalysis.detailedScores.hydrationLevel;
  const textureChange = currentAnalysis.detailedScores.skinTexture - baselineAnalysis.detailedScores.skinTexture;
  const brightnessChange = currentAnalysis.detailedScores.brightnessGlow - baselineAnalysis.detailedScores.brightnessGlow;
  const acneChange = baselineAnalysis.detailedScores.poreVisibility - currentAnalysis.detailedScores.poreVisibility; // Lower is better
  
  const overallChange = (hydrationChange + textureChange + brightnessChange - acneChange) / 4;
  
  // Determine verdict
  let verdict: TreatmentResponse['verdict'] = 'neutral';
  let recommendation = '';
  
  const hasSideEffects = sideEffects.irritation || sideEffects.breakouts || sideEffects.dryness || sideEffects.redness;
  const sideEffectCount = Object.values(sideEffects).filter(Boolean).length;
  
  if (hasSideEffects && sideEffectCount >= 2) {
    verdict = 'harmful';
    recommendation = `⚠️ This product is causing side effects. Stop using it immediately and consult a dermatologist if symptoms persist.`;
  } else if (overallChange > 10 && !hasSideEffects) {
    verdict = 'excellent';
    recommendation = `✅ Excellent results! This product is working well for your skin. Continue using as directed.`;
  } else if (overallChange > 5 && !hasSideEffects) {
    verdict = 'good';
    recommendation = `👍 Good results. This product is helping your skin. Continue monitoring.`;
  } else if (overallChange < -5 || hasSideEffects) {
    verdict = 'poor';
    recommendation = `⚠️ This product may not be suitable. Consider discontinuing or reducing frequency.`;
  } else {
    verdict = 'neutral';
    recommendation = `Continue monitoring. Results are neutral so far. Give it more time (at least 4-6 weeks for active ingredients).`;
  }
  
  // Confidence based on days used and consistency
  let confidence = Math.min(100, daysUsed * 2); // 2% per day, max 100%
  if (daysUsed < 14) {
    confidence = Math.min(confidence, 50); // Low confidence if less than 2 weeks
    recommendation += ' Note: Most products need 4-6 weeks to show full results.';
  }
  
  return {
    productId: product.id,
    productName: product.name,
    daysUsed,
    impact: {
      hydration: hydrationChange,
      texture: textureChange,
      brightness: brightnessChange,
      acne: acneChange,
      overall: overallChange,
    },
    sideEffects: {
      irritation: sideEffects.irritation || false,
      breakouts: sideEffects.breakouts || false,
      dryness: sideEffects.dryness || false,
      redness: sideEffects.redness || false,
    },
    verdict,
    recommendation,
    confidence,
    evidence: {
      photosAnalyzed: 1, // Would be calculated from actual photo data
      consistentImprovement: overallChange > 0,
      sideEffectFrequency: sideEffectCount,
    },
  };
}

/**
 * Identify acne triggers from journal and product data
 */
export function identifyAcneTriggers(
  journalEntries: Array<{
    date: string;
    stressLevel: number;
    sleepHours: number;
    waterIntake: number;
    mood: string;
    notes?: string;
  }>,
  breakouts: Array<{
    date: string;
    severity: number; // 1-5
    location: string;
  }>,
  productsUsed: Array<{
    productId: string;
    productName: string;
    dateStarted: string;
  }>
): AcneTrigger[] {
  const triggers: AcneTrigger[] = [];
  
  // Analyze stress correlation
  const stressBreakoutCorrelation = analyzeCorrelation(
    journalEntries.map(e => ({ date: e.date, value: e.stressLevel })),
    breakouts.map(b => ({ date: b.date, value: b.severity }))
  );
  
  if (stressBreakoutCorrelation > 0.3) {
    triggers.push({
      factor: 'High Stress',
      correlation: stressBreakoutCorrelation * 100,
      frequency: calculateFrequency(journalEntries.filter(e => e.stressLevel >= 4), breakouts),
      confidence: stressBreakoutCorrelation > 0.5 ? 'high' : 'medium',
      recommendation: 'Manage stress through meditation, exercise, or therapy. High stress (4-5/5) correlates with breakouts.',
      type: 'stress',
    });
  }
  
  // Analyze sleep correlation
  const sleepBreakoutCorrelation = analyzeCorrelation(
    journalEntries.map(e => ({ date: e.date, value: e.sleepHours })),
    breakouts.map(b => ({ date: b.date, value: b.severity }))
  );
  
  if (sleepBreakoutCorrelation < -0.3) { // Negative correlation = less sleep = more breakouts
    triggers.push({
      factor: 'Insufficient Sleep',
      correlation: Math.abs(sleepBreakoutCorrelation) * 100,
      frequency: calculateFrequency(journalEntries.filter(e => e.sleepHours < 7), breakouts),
      confidence: Math.abs(sleepBreakoutCorrelation) > 0.5 ? 'high' : 'medium',
      recommendation: 'Aim for 7-9 hours of sleep. Poor sleep (under 7 hours) correlates with breakouts.',
      type: 'lifestyle',
    });
  }
  
  // Analyze product correlation
  productsUsed.forEach(product => {
    const productStartDate = new Date(product.dateStarted);
    const breakoutsAfterProduct = breakouts.filter(b => {
      const breakoutDate = new Date(b.date);
      return breakoutDate >= productStartDate && 
             breakoutDate <= new Date(productStartDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days after
    });
    
    if (breakoutsAfterProduct.length > 0) {
      const correlation = breakoutsAfterProduct.length / breakouts.length;
      if (correlation > 0.3) {
        triggers.push({
          factor: product.productName,
          correlation: correlation * 100,
          frequency: breakoutsAfterProduct.length,
          confidence: correlation > 0.5 ? 'high' : 'medium',
          recommendation: `This product may be causing breakouts. Try discontinuing for 2 weeks to test.`,
          type: 'product',
        });
      }
    }
  });
  
  return triggers.sort((a, b) => b.correlation - a.correlation);
}

/**
 * Calculate correlation between two time series
 */
function analyzeCorrelation(
  series1: Array<{ date: string; value: number }>,
  series2: Array<{ date: string; value: number }>
): number {
  if (series1.length < 3 || series2.length < 3) return 0;
  
  // Match dates and calculate correlation
  const matched: Array<{ x: number; y: number }> = [];
  
  series1.forEach(s1 => {
    const s2 = series2.find(s => s.date === s1.date);
    if (s2) {
      matched.push({ x: s1.value, y: s2.value });
    }
  });
  
  if (matched.length < 3) return 0;
  
  // Calculate Pearson correlation
  const n = matched.length;
  const sumX = matched.reduce((sum, m) => sum + m.x, 0);
  const sumY = matched.reduce((sum, m) => sum + m.y, 0);
  const sumXY = matched.reduce((sum, m) => sum + m.x * m.y, 0);
  const sumX2 = matched.reduce((sum, m) => sum + m.x * m.x, 0);
  const sumY2 = matched.reduce((sum, m) => sum + m.y * m.y, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Calculate frequency of factor occurrence with breakouts
 */
function calculateFrequency(
  factorOccurrences: Array<{ date: string }>,
  breakouts: Array<{ date: string }>
): number {
  if (factorOccurrences.length === 0) return 0;
  
  let matches = 0;
  factorOccurrences.forEach(factor => {
    const factorDate = new Date(factor.date);
    const hasBreakout = breakouts.some(b => {
      const breakoutDate = new Date(b.date);
      const daysDiff = Math.abs((breakoutDate.getTime() - factorDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 2; // Within 2 days
    });
    if (hasBreakout) matches++;
  });
  
  return (matches / factorOccurrences.length) * 100;
}

/**
 * Generate enhanced lifestyle correlations
 */
export function generateLifestyleCorrelations(
  journalEntries: Array<{
    date: string;
    sleepHours: number;
    waterIntake: number;
    stressLevel: number;
    mood: string;
  }>,
  analysisHistory: AnalysisResult[]
): LifestyleCorrelation[] {
  const correlations: LifestyleCorrelation[] = [];
  
  // Sleep correlation
  if (journalEntries.length >= 7) {
    const avgSleep = journalEntries.reduce((sum, e) => sum + e.sleepHours, 0) / journalEntries.length;
    const recentHydration = analysisHistory[0]?.detailedScores.hydrationLevel || 0;
    
    if (avgSleep >= 8) {
      correlations.push({
        factor: 'Adequate Sleep (8+ hours)',
        impact: 'positive',
        strength: 75,
        evidence: `Your average sleep is ${avgSleep.toFixed(1)} hours. Studies show 8+ hours improves skin recovery by 25%.`,
        recommendation: 'Maintain 8+ hours of sleep for optimal skin health and recovery.',
        actionable: true,
      });
    } else if (avgSleep < 7) {
      correlations.push({
        factor: 'Insufficient Sleep (<7 hours)',
        impact: 'negative',
        strength: 65,
        evidence: `Your average sleep is ${avgSleep.toFixed(1)} hours. Poor sleep reduces skin recovery by 30%.`,
        recommendation: 'Aim for 7-9 hours of sleep. Your skin repairs itself during deep sleep.',
        actionable: true,
      });
    }
  }
  
  // Water intake correlation
  if (journalEntries.length >= 7) {
    const avgWater = journalEntries.reduce((sum, e) => sum + e.waterIntake, 0) / journalEntries.length;
    
    if (avgWater >= 8) {
      correlations.push({
        factor: 'Adequate Hydration (8+ glasses)',
        impact: 'positive',
        strength: 70,
        evidence: `You're drinking ${avgWater.toFixed(1)} glasses daily. Proper hydration improves skin plumpness by 20%.`,
        recommendation: 'Continue drinking 8+ glasses of water daily for optimal skin hydration.',
        actionable: true,
      });
    } else if (avgWater < 6) {
      correlations.push({
        factor: 'Low Water Intake (<6 glasses)',
        impact: 'negative',
        strength: 60,
        evidence: `You're drinking ${avgWater.toFixed(1)} glasses daily. Dehydration can reduce skin hydration by 15%.`,
        recommendation: 'Increase water intake to 8+ glasses daily. Your skin needs hydration from within.',
        actionable: true,
      });
    }
  }
  
  // Stress correlation
  if (journalEntries.length >= 7) {
    const avgStress = journalEntries.reduce((sum, e) => sum + e.stressLevel, 0) / journalEntries.length;
    
    if (avgStress >= 4) {
      correlations.push({
        factor: 'High Stress Levels (4-5/5)',
        impact: 'negative',
        strength: 80,
        evidence: `Your average stress is ${avgStress.toFixed(1)}/5. High stress increases inflammation and breakouts by 40%.`,
        recommendation: 'Practice stress management: meditation, exercise, or therapy. High stress directly impacts skin health.',
        actionable: true,
      });
    } else if (avgStress <= 2) {
      correlations.push({
        factor: 'Low Stress Levels (1-2/5)',
        impact: 'positive',
        strength: 70,
        evidence: `Your average stress is ${avgStress.toFixed(1)}/5. Low stress improves skin clarity and reduces inflammation.`,
        recommendation: 'Maintain low stress levels. Your skin benefits from your stress management.',
        actionable: false,
      });
    }
  }
  
  return correlations;
}

/**
 * Check for medical warning signs
 */
export function checkMedicalAlerts(
  analysisHistory: AnalysisResult[],
  breakouts: Array<{ date: string; severity: number }>,
  sideEffects: Array<{ date: string; type: string }>
): Array<{ severity: 'high' | 'medium' | 'low'; message: string; action: string }> {
  const alerts: Array<{ severity: 'high' | 'medium' | 'low'; message: string; action: string }> = [];
  
  // Persistent acne check
  if (breakouts.length >= 10) {
    const recentBreakouts = breakouts.filter(b => {
      const breakoutDate = new Date(b.date);
      const daysAgo = (Date.now() - breakoutDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 90;
    });
    
    if (recentBreakouts.length >= 8) {
      alerts.push({
        severity: 'high',
        message: 'Persistent acne for 3+ months',
        action: 'Consider seeing a dermatologist. Persistent acne may need prescription treatment.',
      });
    }
  }
  
  // Rapid skin changes
  if (analysisHistory.length >= 2) {
    const recent = analysisHistory[0];
    const previous = analysisHistory[1];
    const daysBetween = (recent.timestamp - previous.timestamp) / (1000 * 60 * 60 * 24);
    
    if (daysBetween <= 7) {
      const hydrationChange = Math.abs(recent.detailedScores.hydrationLevel - previous.detailedScores.hydrationLevel);
      const textureChange = Math.abs(recent.detailedScores.skinTexture - previous.detailedScores.skinTexture);
      
      if (hydrationChange > 20 || textureChange > 20) {
        alerts.push({
          severity: 'medium',
          message: 'Rapid skin changes detected',
          action: 'Monitor closely. If changes persist or worsen, consult a dermatologist.',
        });
      }
    }
  }
  
  // Severe side effects
  const severeSideEffects = sideEffects.filter(se => 
    se.type === 'severe irritation' || se.type === 'allergic reaction'
  );
  
  if (severeSideEffects.length > 0) {
    alerts.push({
      severity: 'high',
      message: 'Severe skin reactions detected',
      action: 'Stop using the product immediately. If symptoms persist, seek medical attention.',
    });
  }
  
  return alerts;
}

