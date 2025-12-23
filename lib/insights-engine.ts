import { Product, ProductUsageEntry, ProductRoutine } from '@/types/product';

// Types matching progress.tsx
interface ProgressPhoto {
  id: string;
  uri: string;
  date: string;
  timestamp: number;
  analysis?: {
    hydration: number;
    texture: number;
    brightness: number;
    acne: number;
    improvements?: string[];
  };
  notes?: string;
}

type Mood = 'great' | 'good' | 'okay' | 'bad';

interface JournalEntry {
  id: string;
  date: string;
  timestamp: number;
  mood: Mood;
  sleepHours: number;
  waterIntake: number;
  stressLevel: number;
  notes?: string;
  skinFeeling?: string;
}

export interface ProductAnalysis {
  product: Product;
  impact: {
    hydration: number;
    texture: number;
    brightness: number;
    overall: number;
  };
  verdict: 'keep' | 'monitor' | 'replace';
  confidence: number;
  evidence: {
    daysUsed: number;
    avgRating: number;
    negativeEvents: number;
    photosAnalyzed: number;
  };
  recommendation: string;
}

export interface ThirtyDayComparison {
  day1Photo: ProgressPhoto | null;
  day30Photo: ProgressPhoto | null;
  improvement: {
    hydration: number;
    texture: number;
    brightness: number;
    acne: number;
  };
  daysBetween: number;
  hasComparison: boolean;
}

export interface InsightData {
  recentPhotos: ProgressPhoto[];
  photoTrends: {
    hydration: { current: number; change: number; trend: 'up' | 'down' | 'stable' };
    texture: { current: number; change: number; trend: 'up' | 'down' | 'stable' };
    brightness: { current: number; change: number; trend: 'up' | 'down' | 'stable' };
    acne: { current: number; change: number; trend: 'up' | 'down' | 'stable' };
  };
  recentJournal: JournalEntry[];
  habitAverages: {
    sleep: number;
    water: number;
    stress: number;
    mood: { great: number; good: number; okay: number; bad: number };
  };
  activeProducts: Product[];
  recentUsage: ProductUsageEntry[];
  currentRoutine: ProductRoutine | null;
  productAnalyses: ProductAnalysis[];
  correlations: Array<{
    factor: string;
    impact: string;
    confidence: number;
  }>;
  thirtyDayComparison: ThirtyDayComparison;
}

export interface DailyTracking {
  date: string;
  dayName: string;
  hasPhoto: boolean;
  hasJournal: boolean;
  hasProduct: boolean;
}

export interface ConsistencyData {
  photoStreak: number;
  journalStreak: number;
  currentPhotoStreak: number;
  currentJournalStreak: number;
  consistencyPercentage: number;
  last7Days: DailyTracking[];
  totalDaysTracked: number;
  totalPossibleDays: number;
}

export interface AIInsightResult {
  consistency: ConsistencyData;
  wins: string[];
  insights: string[];
  recommendations: string[];
  productReport?: {
    working: Array<{ product: string; impact: string; recommendation: string }>;
    monitoring: Array<{ product: string; impact: string; recommendation: string }>;
    replace: Array<{ product: string; reason: string; alternative?: string }>;
  };
  summary: string;
  generatedAt: string;
}

// Helper functions
function isWithinDays(timestamp: number, days: number): boolean {
  const now = Date.now();
  const daysAgo = now - (days * 24 * 60 * 60 * 1000);
  return timestamp >= daysAgo;
}

function isSameDay(timestamp1: number, timestamp2: number | string): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return date1.toDateString() === date2.toDateString();
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous;
  if (Math.abs(diff) < 2) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

// Calculate photo trends
function calculatePhotoTrends(photos: ProgressPhoto[]) {
  if (photos.length < 2) {
    const latest = photos[0]?.analysis || { hydration: 0, texture: 0, brightness: 0, acne: 0 };
    return {
      hydration: { current: latest.hydration, change: 0, trend: 'stable' as const },
      texture: { current: latest.texture, change: 0, trend: 'stable' as const },
      brightness: { current: latest.brightness, change: 0, trend: 'stable' as const },
      acne: { current: latest.acne, change: 0, trend: 'stable' as const },
    };
  }

  const latest = photos[0].analysis || { hydration: 0, texture: 0, brightness: 0, acne: 0 };
  const oldest = photos[photos.length - 1].analysis || { hydration: 0, texture: 0, brightness: 0, acne: 0 };

  const hydrationChange = latest.hydration - oldest.hydration;
  const textureChange = latest.texture - oldest.texture;
  const brightnessChange = latest.brightness - oldest.brightness;
  const acneChange = latest.acne - oldest.acne;

  return {
    hydration: {
      current: latest.hydration,
      change: Math.round(hydrationChange),
      trend: calculateTrend(latest.hydration, oldest.hydration),
    },
    texture: {
      current: latest.texture,
      change: Math.round(textureChange),
      trend: calculateTrend(latest.texture, oldest.texture),
    },
    brightness: {
      current: latest.brightness,
      change: Math.round(brightnessChange),
      trend: calculateTrend(latest.brightness, oldest.brightness),
    },
    acne: {
      current: latest.acne,
      change: Math.round(acneChange),
      trend: calculateTrend(oldest.acne, latest.acne), // Inverted - lower acne is better
    },
  };
}

// Calculate habit averages
function calculateHabitAverages(entries: JournalEntry[]) {
  if (entries.length === 0) {
    return {
      sleep: 0,
      water: 0,
      stress: 0,
      mood: { great: 0, good: 0, okay: 0, bad: 0 },
    };
  }

  const sleep = average(entries.map(e => e.sleepHours));
  const water = average(entries.map(e => e.waterIntake));
  const stress = average(entries.map(e => e.stressLevel));

  const moodCounts = entries.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {} as Record<Mood, number>);

  const total = entries.length;
  const mood = {
    great: (moodCounts.great || 0) / total * 100,
    good: (moodCounts.good || 0) / total * 100,
    okay: (moodCounts.okay || 0) / total * 100,
    bad: (moodCounts.bad || 0) / total * 100,
  };

  return { sleep, water, stress, mood };
}

// Analyze individual product performance
function analyzeProductPerformance(
  product: Product,
  usageEntries: ProductUsageEntry[],
  photos: ProgressPhoto[]
): ProductAnalysis {
  const productUsage = usageEntries.filter(u => u.productId === product.id);
  
  if (productUsage.length === 0) {
    return {
      product,
      impact: { hydration: 0, texture: 0, brightness: 0, overall: 0 },
      verdict: 'monitor',
      confidence: 0,
      evidence: { daysUsed: 0, avgRating: 0, negativeEvents: 0, photosAnalyzed: 0 },
      recommendation: 'Start using this product consistently to track its effectiveness',
    };
  }

  // Find photos taken within 24-48 hours after using this product
  const photosAfterUse: ProgressPhoto[] = [];
  const photosWithoutProduct: ProgressPhoto[] = [];

  photos.forEach(photo => {
    const photoTime = photo.timestamp;
    const hasRecentUsage = productUsage.some(usage => {
      const usageTime = new Date(usage.timestamp).getTime();
      const hoursDiff = (photoTime - usageTime) / (1000 * 60 * 60);
      return hoursDiff > 0 && hoursDiff < 48; // Within 48 hours after use
    });

    if (hasRecentUsage) {
      photosAfterUse.push(photo);
    } else {
      photosWithoutProduct.push(photo);
    }
  });

  // Calculate impact
  let impact = { hydration: 0, texture: 0, brightness: 0, overall: 0 };

  if (photosAfterUse.length > 0 && photosWithoutProduct.length > 0) {
    const withProduct = {
      hydration: average(photosAfterUse.map(p => p.analysis?.hydration || 0)),
      texture: average(photosAfterUse.map(p => p.analysis?.texture || 0)),
      brightness: average(photosAfterUse.map(p => p.analysis?.brightness || 0)),
    };

    const withoutProduct = {
      hydration: average(photosWithoutProduct.map(p => p.analysis?.hydration || 0)),
      texture: average(photosWithoutProduct.map(p => p.analysis?.texture || 0)),
      brightness: average(photosWithoutProduct.map(p => p.analysis?.brightness || 0)),
    };

    impact = {
      hydration: Math.round((withProduct.hydration - withoutProduct.hydration) * 10) / 10,
      texture: Math.round((withProduct.texture - withoutProduct.texture) * 10) / 10,
      brightness: Math.round((withProduct.brightness - withoutProduct.brightness) * 10) / 10,
      overall: 0,
    };

    impact.overall = (impact.hydration + impact.texture + impact.brightness) / 3;
  }

  // Check user feedback
  const ratings = productUsage.map(u => u.rating || product.rating || 3).filter(r => r > 0);
  const avgRating = ratings.length > 0 ? average(ratings) : 3;

  const negativeEvents = productUsage.filter(u => 
    u.skinCondition === 'poor' ||
    u.notes?.toLowerCase().includes('irritation') ||
    u.notes?.toLowerCase().includes('burning') ||
    u.notes?.toLowerCase().includes('breakout') ||
    u.notes?.toLowerCase().includes('redness') ||
    (u.rating && u.rating < 2)
  ).length;

  // Determine verdict
  let verdict: 'keep' | 'monitor' | 'replace' = 'monitor';
  let confidence = 0.5;

  if (impact.overall > 5 && avgRating >= 4 && negativeEvents === 0) {
    verdict = 'keep';
    confidence = Math.min(0.9, 0.5 + (productUsage.length / 20));
  } else if (impact.overall < -3 || negativeEvents > 2 || avgRating < 2.5) {
    verdict = 'replace';
    confidence = Math.min(0.9, 0.5 + (negativeEvents / 5));
  } else if (productUsage.length < 5) {
    verdict = 'monitor';
    confidence = 0.3;
  } else {
    verdict = 'monitor';
    confidence = 0.6;
  }

  // Generate recommendation
  let recommendation = '';
  if (verdict === 'keep') {
    recommendation = `✅ KEEP USING - ${impact.overall > 0 ? `Showing +${impact.overall.toFixed(1)}% improvement` : 'No negative effects detected'}. ${productUsage.length} days of consistent use with ${avgRating.toFixed(1)}/5 average rating.`;
  } else if (verdict === 'replace') {
    recommendation = `❌ REPLACE - ${impact.overall < 0 ? `Causing ${Math.abs(impact.overall).toFixed(1)}% decline` : 'Negative effects detected'} (${negativeEvents} issues reported). Consider alternatives.`;
  } else {
    recommendation = `⏳ MONITOR - ${productUsage.length < 5 ? 'Need more data' : 'Mixed results'}. Continue for ${Math.max(1, 7 - productUsage.length)} more days to confirm effectiveness.`;
  }

  return {
    product,
    impact,
    verdict,
    confidence,
    evidence: {
      daysUsed: productUsage.length,
      avgRating,
      negativeEvents,
      photosAnalyzed: photosAfterUse.length,
    },
    recommendation,
  };
}

// Find correlations between habits and skin
function findCorrelations(
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[],
  products: Product[]
): Array<{ factor: string; impact: string; confidence: number }> {
  const correlations: Array<{ factor: string; impact: string; confidence: number }> = [];

  if (photos.length < 3 || journalEntries.length < 5) {
    return correlations;
  }

  // Water intake correlation
  const highWaterDays = journalEntries.filter(e => e.waterIntake >= 8);
  const lowWaterDays = journalEntries.filter(e => e.waterIntake < 8);

  if (highWaterDays.length > 0 && lowWaterDays.length > 0) {
    const highWaterPhotos = photos.filter(p =>
      highWaterDays.some(e => isSameDay(p.timestamp, e.timestamp))
    );
    const lowWaterPhotos = photos.filter(p =>
      lowWaterDays.some(e => isSameDay(p.timestamp, e.timestamp))
    );

    if (highWaterPhotos.length > 0 && lowWaterPhotos.length > 0) {
      const highAvg = average(highWaterPhotos.map(p => p.analysis?.hydration || 0));
      const lowAvg = average(lowWaterPhotos.map(p => p.analysis?.hydration || 0));
      const diff = highAvg - lowAvg;

      if (Math.abs(diff) > 5) {
        correlations.push({
          factor: '8+ glasses water daily',
          impact: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% better hydration`,
          confidence: Math.min(0.9, 0.5 + (highWaterDays.length / 10)),
        });
      }
    }
  }

  // Sleep correlation
  const goodSleepDays = journalEntries.filter(e => e.sleepHours >= 7);
  const poorSleepDays = journalEntries.filter(e => e.sleepHours < 6);

  if (goodSleepDays.length > 0 && poorSleepDays.length > 0) {
    const goodSleepPhotos = photos.filter(p =>
      goodSleepDays.some(e => isSameDay(p.timestamp, e.timestamp))
    );
    const poorSleepPhotos = photos.filter(p =>
      poorSleepDays.some(e => isSameDay(p.timestamp, e.timestamp))
    );

    if (goodSleepPhotos.length > 0 && poorSleepPhotos.length > 0) {
      const goodAvg = average(goodSleepPhotos.map(p => p.analysis?.brightness || 0));
      const poorAvg = average(poorSleepPhotos.map(p => p.analysis?.brightness || 0));
      const diff = goodAvg - poorAvg;

      if (Math.abs(diff) > 5) {
        correlations.push({
          factor: '7+ hours sleep',
          impact: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% brighter skin`,
          confidence: Math.min(0.9, 0.5 + (goodSleepDays.length / 10)),
        });
      }
    }
  }

  // Stress correlation
  const lowStressDays = journalEntries.filter(e => e.stressLevel <= 2);
  const highStressDays = journalEntries.filter(e => e.stressLevel >= 4);

  if (lowStressDays.length > 0 && highStressDays.length > 0) {
    const lowStressPhotos = photos.filter(p =>
      lowStressDays.some(e => isSameDay(p.timestamp, e.timestamp))
    );
    const highStressPhotos = photos.filter(p =>
      highStressDays.some(e => isSameDay(p.timestamp, e.timestamp))
    );

    if (lowStressPhotos.length > 0 && highStressPhotos.length > 0) {
      const lowAvg = average(lowStressPhotos.map(p => p.analysis?.acne || 0));
      const highAvg = average(highStressPhotos.map(p => p.analysis?.acne || 0));
      const diff = highAvg - lowAvg; // Higher acne is worse

      if (diff > 5) {
        correlations.push({
          factor: 'Low stress (≤2/5)',
          impact: `${diff.toFixed(1)}% fewer breakouts`,
          confidence: Math.min(0.9, 0.5 + (lowStressDays.length / 10)),
        });
      }
    }
  }

  return correlations;
}

// Calculate consistency data
function calculateConsistency(
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[],
  usageHistory: ProductUsageEntry[]
): ConsistencyData {
  const now = Date.now();
  const last7Days: DailyTracking[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - (i * 24 * 60 * 60 * 1000));
    const dateStr = date.toISOString().split('T')[0];
    const dayName = dayNames[date.getDay()];
    
    const hasPhoto = photos.some(p => isSameDay(p.timestamp, date.getTime()));
    const hasJournal = journalEntries.some(e => isSameDay(e.timestamp, date.getTime()));
    
    // Check if any product was used on this day
    const hasProduct = usageHistory.some(u => {
      const usageDate = new Date(u.timestamp).toISOString().split('T')[0];
      return usageDate === dateStr;
    });
    
    last7Days.push({
      date: dateStr,
      dayName,
      hasPhoto,
      hasJournal,
      hasProduct,
    });
  }
  
  // Calculate streaks (current consecutive days)
  let currentPhotoStreak = 0;
  let currentJournalStreak = 0;
  
  // Count backwards from today
  for (let i = last7Days.length - 1; i >= 0; i--) {
    if (last7Days[i].hasPhoto) {
      currentPhotoStreak++;
    } else {
      break;
    }
  }
  
  for (let i = last7Days.length - 1; i >= 0; i--) {
    if (last7Days[i].hasJournal) {
      currentJournalStreak++;
    } else {
      break;
    }
  }
  
  // Calculate total streaks (all time)
  const allPhotos = photos.sort((a, b) => b.timestamp - a.timestamp);
  const allJournals = journalEntries.sort((a, b) => b.timestamp - a.timestamp);
  
  let photoStreak = 0;
  let journalStreak = 0;
  
  // Photo streak
  let lastPhotoDate = new Date(now);
  for (const photo of allPhotos) {
    const photoDate = new Date(photo.timestamp);
    const daysDiff = Math.floor((lastPhotoDate.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      photoStreak++;
      lastPhotoDate = photoDate;
    } else {
      break;
    }
  }
  
  // Journal streak
  let lastJournalDate = new Date(now);
  for (const journal of allJournals) {
    const journalDate = new Date(journal.timestamp);
    const daysDiff = Math.floor((lastJournalDate.getTime() - journalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      journalStreak++;
      lastJournalDate = journalDate;
    } else {
      break;
    }
  }
  
  // Calculate consistency percentage
  const totalDaysTracked = last7Days.filter(d => d.hasPhoto || d.hasJournal).length;
  const totalPossibleDays = last7Days.length * 2; // Photo + Journal per day
  const actualEntries = last7Days.filter(d => d.hasPhoto).length + last7Days.filter(d => d.hasJournal).length;
  const consistencyPercentage = Math.round((actualEntries / totalPossibleDays) * 100);
  
  return {
    photoStreak,
    journalStreak,
    currentPhotoStreak,
    currentJournalStreak,
    consistencyPercentage,
    last7Days,
    totalDaysTracked,
    totalPossibleDays: last7Days.length,
  };
}

// Calculate 30-day photo comparison
function calculate30DayComparison(photos: ProgressPhoto[]): ThirtyDayComparison {
  if (photos.length < 2) {
    return {
      day1Photo: null,
      day30Photo: null,
      improvement: { hydration: 0, texture: 0, brightness: 0, acne: 0 },
      daysBetween: 0,
      hasComparison: false,
    };
  }

  // Sort photos by timestamp (oldest first)
  const sortedPhotos = [...photos].sort((a, b) => a.timestamp - b.timestamp);
  const day1Photo = sortedPhotos[0];
  const day30Photo = sortedPhotos[sortedPhotos.length - 1];

  const daysBetween = Math.floor((day30Photo.timestamp - day1Photo.timestamp) / (1000 * 60 * 60 * 24));

  // Only do comparison if at least 20 days apart (close to 30 days)
  if (daysBetween < 20 || !day1Photo.analysis || !day30Photo.analysis) {
    return {
      day1Photo: daysBetween >= 20 ? day1Photo : null,
      day30Photo: day30Photo,
      improvement: { hydration: 0, texture: 0, brightness: 0, acne: 0 },
      daysBetween,
      hasComparison: false,
    };
  }

  const improvement = {
    hydration: Math.round((day30Photo.analysis.hydration - day1Photo.analysis.hydration) * 10) / 10,
    texture: Math.round((day30Photo.analysis.texture - day1Photo.analysis.texture) * 10) / 10,
    brightness: Math.round((day30Photo.analysis.brightness - day1Photo.analysis.brightness) * 10) / 10,
    acne: Math.round((day1Photo.analysis.acne - day30Photo.analysis.acne) * 10) / 10, // Inverted - lower is better
  };

  return {
    day1Photo,
    day30Photo,
    improvement,
    daysBetween,
    hasComparison: true,
  };
}

// Collect all insight data
export async function collectInsightData(
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[],
  products: Product[],
  usageHistory: ProductUsageEntry[],
  routines: ProductRoutine[]
): Promise<InsightData> {
  const now = Date.now();
  const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000);

  // Get last 5 days of photos
  const recentPhotos = photos
    .filter(p => p.timestamp >= fiveDaysAgo)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Calculate photo trends
  const photoTrends = calculatePhotoTrends(recentPhotos);

  // Get last 5 days of journal entries
  const recentJournal = journalEntries
    .filter(e => e.timestamp >= fiveDaysAgo)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Calculate habit averages
  const habitAverages = calculateHabitAverages(recentJournal);

  // Get products used in last 5 days
  const recentUsage = usageHistory.filter(u => {
    const usageTime = new Date(u.timestamp).getTime();
    return usageTime >= fiveDaysAgo;
  });

  const activeProductIds = [...new Set(recentUsage.map(u => u.productId))];
  const activeProducts = products.filter(p => activeProductIds.includes(p.id));

  // Get active routine
  const currentRoutine = routines.find(r => r.isActive) || null;

  // Analyze each product
  const productAnalyses = activeProducts.map(product =>
    analyzeProductPerformance(product, usageHistory, photos)
  );

  // Find correlations
  const correlations = findCorrelations(photos, journalEntries, products);

  // Calculate 30-day comparison
  const thirtyDayComparison = calculate30DayComparison(photos);

  return {
    recentPhotos,
    photoTrends,
    recentJournal,
    habitAverages,
    activeProducts,
    recentUsage,
    currentRoutine,
    productAnalyses,
    correlations,
    thirtyDayComparison,
  };
}

// Build AI prompt
function buildInsightPrompt(data: InsightData): string {
  // Calculate consistency for prompt
  const consistency = calculateConsistency(
    data.recentPhotos,
    data.recentJournal,
    data.recentUsage
  );
  
  const photoSummary = data.recentPhotos.length > 0
    ? `Photos: ${data.recentPhotos.length}
- Hydration: ${data.photoTrends.hydration.current}% (${data.photoTrends.hydration.trend} ${Math.abs(data.photoTrends.hydration.change)}%)
- Texture: ${data.photoTrends.texture.current}% (${data.photoTrends.texture.trend} ${Math.abs(data.photoTrends.texture.change)}%)
- Brightness: ${data.photoTrends.brightness.current}% (${data.photoTrends.brightness.trend} ${Math.abs(data.photoTrends.brightness.change)}%)
- Acne/Clarity: ${100 - data.photoTrends.acne.current}%`
    : 'No photos taken in last 5 days';
  
  const consistencySummary = `
### CONSISTENCY TRACKING (Last 7 Days)
- Overall Consistency: ${consistency.consistencyPercentage}%
- Photo Streak: ${consistency.currentPhotoStreak} days
- Journal Streak: ${consistency.currentJournalStreak} days
- Days Tracked: ${consistency.totalDaysTracked} of ${consistency.totalPossibleDays}

Daily Breakdown:
${consistency.last7Days.map(d => `- ${d.dayName}: Photo ${d.hasPhoto ? '✓' : '✗'}, Journal ${d.hasJournal ? '✓' : '✗'}`).join('\n')}
`;

  // 30-day comparison summary
  const thirtyDaySummary = data.thirtyDayComparison.hasComparison
    ? `
### 30-DAY TRANSFORMATION ANALYSIS
Day 1 Photo (${data.thirtyDayComparison.daysBetween} days ago):
- Hydration: ${data.thirtyDayComparison.day1Photo?.analysis?.hydration || 0}%
- Texture: ${data.thirtyDayComparison.day1Photo?.analysis?.texture || 0}%
- Brightness: ${data.thirtyDayComparison.day1Photo?.analysis?.brightness || 0}%
- Acne: ${data.thirtyDayComparison.day1Photo?.analysis?.acne || 0}%

Day ${data.thirtyDayComparison.daysBetween} Photo (Today):
- Hydration: ${data.thirtyDayComparison.day30Photo?.analysis?.hydration || 0}%
- Texture: ${data.thirtyDayComparison.day30Photo?.analysis?.texture || 0}%
- Brightness: ${data.thirtyDayComparison.day30Photo?.analysis?.brightness || 0}%
- Acne: ${data.thirtyDayComparison.day30Photo?.analysis?.acne || 0}%

30-Day Improvements:
- Hydration: ${data.thirtyDayComparison.improvement.hydration > 0 ? '+' : ''}${data.thirtyDayComparison.improvement.hydration}% ${data.thirtyDayComparison.improvement.hydration > 0 ? '✅' : data.thirtyDayComparison.improvement.hydration < 0 ? '⚠️' : '➡️'}
- Texture: ${data.thirtyDayComparison.improvement.texture > 0 ? '+' : ''}${data.thirtyDayComparison.improvement.texture}% ${data.thirtyDayComparison.improvement.texture > 0 ? '✅' : data.thirtyDayComparison.improvement.texture < 0 ? '⚠️' : '➡️'}
- Brightness: ${data.thirtyDayComparison.improvement.brightness > 0 ? '+' : ''}${data.thirtyDayComparison.improvement.brightness}% ${data.thirtyDayComparison.improvement.brightness > 0 ? '✅' : data.thirtyDayComparison.improvement.brightness < 0 ? '⚠️' : '➡️'}
- Acne Reduction: ${data.thirtyDayComparison.improvement.acne > 0 ? '+' : ''}${data.thirtyDayComparison.improvement.acne}% ${data.thirtyDayComparison.improvement.acne > 0 ? '✅' : data.thirtyDayComparison.improvement.acne < 0 ? '⚠️' : '➡️'}
`
    : '';

  const productDetails = data.productAnalyses.map(analysis => {
    const impact = analysis.impact;
    return `- ${analysis.product.brand} ${analysis.product.name}:
  * Impact: Hydration ${impact.hydration > 0 ? '+' : ''}${impact.hydration.toFixed(1)}%, Texture ${impact.texture > 0 ? '+' : ''}${impact.texture.toFixed(1)}%, Brightness ${impact.brightness > 0 ? '+' : ''}${impact.brightness.toFixed(1)}%
  * Used: ${analysis.evidence.daysUsed} days
  * Rating: ${analysis.evidence.avgRating.toFixed(1)}/5
  * Issues: ${analysis.evidence.negativeEvents}
  * Verdict: ${analysis.verdict}`;
  }).join('\n');

  return `You are a beauty and skincare advisor providing cosmetic guidance. Analyze a user's beauty journey for enhancement purposes only. This is NOT medical diagnosis. Provide personalized, actionable beauty insights.

## USER DATA

### SHORT-TERM ANALYSIS (Last 5 Days)
${photoSummary}
${consistencySummary}
${thirtyDaySummary}

### LIFESTYLE & HABITS (Last 5 Days)
Journal Entries: ${data.recentJournal.length} days
- Sleep: ${data.habitAverages.sleep.toFixed(1)} hours/night (avg)
- Water: ${data.habitAverages.water.toFixed(1)} glasses/day (avg)
- Stress: ${data.habitAverages.stress.toFixed(1)}/5 (avg)
- Mood: ${Math.round(data.habitAverages.mood.great)}% great, ${Math.round(data.habitAverages.mood.good)}% good, ${Math.round(data.habitAverages.mood.okay)}% okay, ${Math.round(data.habitAverages.mood.bad)}% bad

Recent Skin Feelings:
${data.recentJournal.map(e => `- ${new Date(e.timestamp).toLocaleDateString()}: "${e.skinFeeling || 'No notes'}"`).join('\n') || 'No notes'}

### PRODUCTS IN USE
${data.activeProducts.length > 0 ? `
${productDetails}

Active Routine: ${data.currentRoutine ? data.currentRoutine.name + ' (' + data.currentRoutine.type + ')' : 'None'}
` : 'No products tracked'}

### DETECTED PATTERNS
${data.correlations.length > 0 ? data.correlations.map(c =>
  `- ${c.factor} → ${c.impact} (${Math.round(c.confidence * 100)}% confidence)`
).join('\n') : 'Insufficient data for pattern detection'}

## YOUR TASK
Analyze BOTH short-term (5 days) and long-term (30 days) data. Generate insights in JSON format:

{
  "wins": [string, string, string] (3 specific achievements - include 30-day improvements if available),
  "insights": [string, string, string] (2-3 pattern discoveries - connect 5-day trends with 30-day transformation),
  "recommendations": [string, string, string, string, string] (3-5 actionable steps that will make REAL change),
  "productReport": {
    "working": [{"product": "name", "impact": "what it does", "recommendation": "action"}],
    "monitoring": [{"product": "name", "impact": "status", "recommendation": "action"}],
    "replace": [{"product": "name", "reason": "why", "alternative": "suggestion"}]
  },
  "summary": "one sentence summary focusing on what's working and what needs to change"
}

CRITICAL ANALYSIS REQUIRED:
1. Compare 30-day transformation with 5-day trends - are they consistent?
2. Identify which products drove the 30-day improvements
3. Tell user EXACTLY what's working (keep doing) and what needs to change
4. Connect product usage to 30-day results - which products caused the improvements?
5. Be specific: "CeraVe Moisturizer used 28/30 days = +13% hydration improvement"

IMPORTANT: Focus on insights that will make REAL CHANGE. Tell user what to KEEP, what to CHANGE, and what to ADD.`;
}

// Generate AI insights (with fallback)
export async function generateAIInsights(data: InsightData): Promise<AIInsightResult> {
  // Calculate consistency first (needed for both AI and fallback)
  const consistency = calculateConsistency(
    data.recentPhotos,
    data.recentJournal,
    data.recentUsage
  );
  
  // Try Edge Function first (secure, server-side)
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️ User not authenticated, using rule-based fallback');
      return generateRuleBasedInsights(data);
    }

    const prompt = buildInsightPrompt(data);
    
    console.log('🤖 Calling insights-generate Edge Function...');
    
    const { data: insightsData, error } = await supabase.functions.invoke('insights-generate', {
      body: {
        prompt,
        userId: user.id,
      },
    });

    if (error) {
      console.error('❌ Insights Edge Function error:', error);
      throw error;
    }

    if (insightsData?.error) {
      console.error('❌ Insights Edge Function returned error:', insightsData.error);
      throw new Error(insightsData.error);
    }

    if (insightsData) {
      console.log('✅ Insights generated via Edge Function');
      return {
        consistency,
        ...insightsData,
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (edgeError) {
    console.warn('⚠️ Insights Edge Function failed, using rule-based fallback:', edgeError);
  }

  // Fallback to rule-based insights
  return generateRuleBasedInsights(data);
}

// Rule-based fallback system
function generateRuleBasedInsights(data: InsightData): AIInsightResult {
  const wins: string[] = [];
  const insights: string[] = [];
  const recommendations: string[] = [];
  
  // Calculate consistency
  const consistency = calculateConsistency(
    data.recentPhotos,
    data.recentJournal,
    data.recentUsage
  );

  // Analyze consistency patterns
  if (consistency.currentPhotoStreak >= 3) {
    wins.push(`${consistency.currentPhotoStreak} day photo streak! 📸 Keep it up!`);
  }
  if (consistency.currentJournalStreak >= 3) {
    wins.push(`${consistency.currentJournalStreak} day journal streak! 📝 Amazing consistency!`);
  }
  if (consistency.consistencyPercentage >= 80) {
    wins.push(`${consistency.consistencyPercentage}% consistency this week - excellent tracking! 🎯`);
  }
  
  // 30-day comparison insights
  if (data.thirtyDayComparison.hasComparison) {
    const comp = data.thirtyDayComparison;
    if (comp.improvement.hydration > 5) {
      wins.push(`30-day transformation: Hydration improved ${comp.improvement.hydration}%! 🎉`);
    }
    if (comp.improvement.texture > 5) {
      wins.push(`30-day transformation: Texture improved ${comp.improvement.texture}%! ✨`);
    }
    if (comp.improvement.brightness > 5) {
      wins.push(`30-day transformation: Brightness improved ${comp.improvement.brightness}%! 🌟`);
    }
    if (comp.improvement.acne > 5) {
      wins.push(`30-day transformation: Acne reduced ${comp.improvement.acne}% - clearer skin! 🎯`);
    }
    
    // Compare 30-day vs 5-day trends
    if (comp.improvement.hydration > 0 && data.photoTrends.hydration.trend === 'up') {
      insights.push(`Your 30-day +${comp.improvement.hydration}% hydration improvement aligns with recent 5-day trends - your routine is working!`);
    } else if (comp.improvement.hydration > 0 && data.photoTrends.hydration.trend === 'down') {
      insights.push(`30-day shows +${comp.improvement.hydration}% hydration, but recent 5 days declined - check what changed`);
    }
  }

  // Analyze photo improvements (only if consistent)
  if (data.photoTrends.hydration.trend === 'up' && data.photoTrends.hydration.change > 0) {
    if (consistency.currentPhotoStreak >= 3) {
      wins.push(`Hydration improved ${data.photoTrends.hydration.change}% - your consistency is paying off! 💧`);
    } else {
      insights.push(`Hydration improved ${data.photoTrends.hydration.change}% - imagine results with daily tracking!`);
    }
  }
  if (data.photoTrends.texture.trend === 'up' && data.photoTrends.texture.change > 0) {
    insights.push(`Texture improved ${data.photoTrends.texture.change}% - ${consistency.currentPhotoStreak >= 3 ? 'consistent tracking is working!' : 'track more consistently for better results'}`);
  }
  if (data.photoTrends.brightness.trend === 'up' && data.photoTrends.brightness.change > 0) {
    insights.push(`Brightness increased ${data.photoTrends.brightness.change}% - ${consistency.currentPhotoStreak >= 3 ? 'keep logging daily!' : 'log daily to see faster improvements'}`);
  }

  // Consistency-based insights
  if (consistency.consistencyPercentage < 50) {
    insights.push(`Your consistency is ${consistency.consistencyPercentage}% - users with 80%+ consistency see 3x better results`);
    recommendations.push(`Log photo AND journal every day this week - consistency is the key to transformation`);
  } else if (consistency.consistencyPercentage >= 80) {
    insights.push(`Your ${consistency.consistencyPercentage}% consistency is excellent - this level of tracking reveals real patterns`);
  } else {
    insights.push(`Your ${consistency.consistencyPercentage}% consistency is good - aim for 80%+ to unlock deeper insights`);
  }
  
  // Streak-based recommendations
  if (consistency.currentPhotoStreak === 0) {
    recommendations.push(`Start a photo streak today - take a progress photo to begin tracking`);
  } else if (consistency.currentPhotoStreak < 3) {
    recommendations.push(`You're on a ${consistency.currentPhotoStreak} day photo streak - keep it going! Take a photo today`);
  }
  
  if (consistency.currentJournalStreak === 0) {
    recommendations.push(`Start logging daily - even 2 minutes makes a huge difference`);
  } else if (consistency.currentJournalStreak < 3) {
    recommendations.push(`You're on a ${consistency.currentJournalStreak} day journal streak - log today to keep it alive!`);
  }

  // Analyze habits (only if journaling consistently)
  if (data.recentJournal.length >= 3) {
    if (data.habitAverages.sleep >= 7) {
      wins.push(`7+ hours sleep average - great for skin recovery! 😴`);
    } else if (data.habitAverages.sleep < 6) {
      recommendations.push(`Aim for 7-8 hours sleep (currently ${data.habitAverages.sleep.toFixed(1)}h) - this will make a REAL difference`);
    }

    if (data.habitAverages.water >= 8) {
      wins.push(`8+ glasses water daily - your skin is thanking you! 💦`);
    } else {
      recommendations.push(`Increase water to 8+ glasses (currently ${data.habitAverages.water.toFixed(1)}) - you'll see results in 3-5 days`);
    }

    if (data.habitAverages.stress > 3.5) {
      recommendations.push(`High stress (${data.habitAverages.stress.toFixed(1)}/5) - try 10min meditation daily. This WILL improve your skin.`);
    }
  }

  // Product analysis
  const workingProducts: Array<{ product: string; impact: string; recommendation: string }> = [];
  const monitoringProducts: Array<{ product: string; impact: string; recommendation: string }> = [];
  const replaceProducts: Array<{ product: string; reason: string; alternative?: string }> = [];

  data.productAnalyses.forEach(analysis => {
    const productName = `${analysis.product.brand} ${analysis.product.name}`;
    const impactStr = analysis.impact.overall > 0
      ? `+${analysis.impact.overall.toFixed(1)}% improvement`
      : analysis.impact.overall < 0
      ? `${analysis.impact.overall.toFixed(1)}% decline`
      : 'Neutral effect';

    if (analysis.verdict === 'keep') {
      workingProducts.push({
        product: productName,
        impact: impactStr,
        recommendation: analysis.recommendation,
      });
      if (consistency.consistencyPercentage >= 70) {
        wins.push(`${productName} is working! ${impactStr} - your consistent tracking revealed this`);
      }
    } else if (analysis.verdict === 'monitor') {
      monitoringProducts.push({
        product: productName,
        impact: impactStr,
        recommendation: analysis.recommendation,
      });
    } else {
      replaceProducts.push({
        product: productName,
        reason: analysis.recommendation,
      });
      recommendations.push(`Stop using ${productName} - ${analysis.recommendation}`);
    }
  });

  // Correlations
  if (data.correlations.length > 0) {
    data.correlations.forEach(c => {
      if (c.confidence > 0.7) {
        insights.push(`${c.factor} shows ${c.impact}`);
      }
    });
  }

  // Default content if empty
  if (wins.length === 0) {
    if (consistency.totalDaysTracked > 0) {
      wins.push(`You've tracked ${consistency.totalDaysTracked} days - every day counts! 📝`);
    } else {
      wins.push(`Start your journey today - take a photo and log your first entry! 🚀`);
    }
  }
  if (insights.length === 0) {
    if (consistency.consistencyPercentage < 50) {
      insights.push(`Track daily for 7+ days to unlock personalized patterns - consistency reveals everything`);
    } else {
      insights.push(`Your ${consistency.consistencyPercentage}% consistency is building valuable data`);
    }
  }
  if (recommendations.length === 0) {
    recommendations.push(`Log photo AND journal every day this week - this will make a REAL difference`);
    recommendations.push(`Consistency is the #1 factor in seeing results - aim for 80%+ tracking`);
  }

  return {
    consistency,
    wins: wins.slice(0, 3),
    insights: insights.slice(0, 3),
    recommendations: recommendations.slice(0, 5),
    productReport: {
      working: workingProducts,
      monitoring: monitoringProducts,
      replace: replaceProducts,
    },
    summary: consistency.consistencyPercentage >= 80 
      ? `Your ${consistency.consistencyPercentage}% consistency is excellent - keep it up!`
      : `Track daily to unlock insights - aim for 80%+ consistency for best results`,
    generatedAt: new Date().toISOString(),
  };
}

// Check minimum requirements
export function checkMinimumRequirements(
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[]
): { met: boolean; photosCount: number; journalsCount: number; message: string } {
  const MIN_PHOTOS = 5;
  const MIN_JOURNALS = 5;
  
  const photosCount = photos.length;
  const journalsCount = journalEntries.length;
  const met = photosCount >= MIN_PHOTOS && journalsCount >= MIN_JOURNALS;
  
  let message = '';
  if (!met) {
    const missingPhotos = Math.max(0, MIN_PHOTOS - photosCount);
    const missingJournals = Math.max(0, MIN_JOURNALS - journalsCount);
    
    if (missingPhotos > 0 && missingJournals > 0) {
      message = `Need ${missingPhotos} more photo${missingPhotos > 1 ? 's' : ''} and ${missingJournals} more journal entr${missingJournals > 1 ? 'ies' : 'y'}`;
    } else if (missingPhotos > 0) {
      message = `Need ${missingPhotos} more photo${missingPhotos > 1 ? 's' : ''}`;
    } else {
      message = `Need ${missingJournals} more journal entr${missingJournals > 1 ? 'ies' : 'y'}`;
    }
  }
  
  return { met, photosCount, journalsCount, message };
}

// Main export function
export async function generateInsights(
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[],
  products: Product[],
  usageHistory: ProductUsageEntry[],
  routines: ProductRoutine[]
): Promise<AIInsightResult> {
  const data = await collectInsightData(photos, journalEntries, products, usageHistory, routines);
  return await generateAIInsights(data);
}

