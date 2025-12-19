/**
 * Monitoring and Analytics Service
 * Tracks API usage, performance metrics, and errors
 */

import { supabase } from './supabase';

export interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  userId?: string;
}

/**
 * Track API metric
 */
export async function trackApiMetric(metric: ApiMetric): Promise<void> {
  try {
    // Only track in production
    if (__DEV__) {
      return;
    }

    await supabase.from('api_metrics').insert({
      endpoint: metric.endpoint,
      method: metric.method,
      status_code: metric.statusCode,
      response_time_ms: metric.responseTimeMs,
      user_id: metric.userId || null,
    });
  } catch (error) {
    // Silently fail - don't break the app if monitoring fails
    console.error('Failed to track API metric:', error);
  }
}

/**
 * Track error
 */
export async function trackError(
  error: Error,
  context?: {
    userId?: string;
    endpoint?: string;
    additionalData?: Record<string, any>;
  }
): Promise<void> {
  try {
    if (__DEV__) {
      console.error('Error tracked:', error, context);
      return;
    }

    // Log to console in production (can be collected by logging service)
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      ...context,
    });

    // Optionally send to error tracking service (Sentry, etc.)
  } catch (trackingError) {
    console.error('Failed to track error:', trackingError);
  }
}

/**
 * Measure function execution time
 */
export async function measureExecution<T>(
  fn: () => Promise<T>,
  metricName: string,
  userId?: string
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    await trackApiMetric({
      endpoint: metricName,
      method: 'EXECUTION',
      statusCode: 200,
      responseTimeMs: duration,
      userId,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    await trackApiMetric({
      endpoint: metricName,
      method: 'EXECUTION',
      statusCode: 500,
      responseTimeMs: duration,
      userId,
    });
    
    throw error;
  }
}

/**
 * Get performance stats
 */
export async function getPerformanceStats(
  startDate: Date,
  endDate: Date
): Promise<{
  avgResponseTime: number;
  totalRequests: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}> {
  try {
    const { data, error } = await supabase
      .from('api_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      throw error;
    }

    const metrics = data || [];
    const totalRequests = metrics.length;
    const errors = metrics.filter(m => m.status_code >= 400).length;
    const avgResponseTime =
      metrics.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / totalRequests || 0;

    // Group by endpoint
    const endpointCounts = metrics.reduce((acc, m) => {
      acc[m.endpoint] = (acc[m.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      avgResponseTime,
      totalRequests,
      errorRate: totalRequests > 0 ? errors / totalRequests : 0,
      topEndpoints,
    };
  } catch (error) {
    console.error('Failed to get performance stats:', error);
    return {
      avgResponseTime: 0,
      totalRequests: 0,
      errorRate: 0,
      topEndpoints: [],
    };
  }
}

















