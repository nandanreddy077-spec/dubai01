export interface SkincareStep {
  id: string;
  name: string;
  description: string;
  products: string[];
  timeOfDay: 'morning' | 'evening' | 'both';
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  order: number;
  duration?: string;
  instructions: string[];
  benefits: string[];
  warnings?: string[];
}

export interface WeeklyPlan {
  week: number;
  focus: string;
  description: string;
  steps: SkincareStep[];
  expectedResults: string[];
  tips: string[];
}

export interface SkincarePlan {
  id: string;
  title: string;
  description: string;
  duration: number; // in days
  skinType: string;
  skinConcerns: string[];
  targetGoals: string[];
  weeklyPlans: WeeklyPlan[];
  shoppingList: {
    category: string;
    items: {
      name: string;
      brand?: string;
      price?: string;
      where?: string;
      priority: 'essential' | 'recommended' | 'optional';
    }[];
  }[];
  createdAt: number;
  analysisId?: string;
  customGoal?: string;
  isActive?: boolean;
  lastAccessedAt?: number;
  progress: {
    currentDay: number;
    completedSteps: string[];
    photos: {
      day: number;
      uri: string;
      notes?: string;
    }[];
    notes: {
      day: number;
      content: string;
      mood?: 'great' | 'good' | 'okay' | 'bad';
    }[];
  };
}

export interface PlanTemplate {
  id: string;
  title: string;
  description: string;
  targetConcerns: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedCost: 'low' | 'medium' | 'high';
  preview: {
    morningSteps: number;
    eveningSteps: number;
    weeklyTreatments: number;
  };
}