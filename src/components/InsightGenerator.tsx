
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, BarChart3, MessageSquare, Lightbulb } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface ChartInsight {
  id: string;
  type: 'trend' | 'comparison' | 'peak' | 'pattern' | 'forecast';
  title: string;
  description: string;
  value: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  timeframe: string;
}

interface InsightGeneratorProps {
  data: CronjobData[];
  timeRange: string;
}

const InsightGenerator: React.FC<InsightGeneratorProps> = ({ data, timeRange }) => {
  const insights = useMemo(() => {
    if (data.length === 0) return [];

    const generatedInsights: ChartInsight[] = [];
    const now = new Date();
    
    // Helper function to get time comparison data
    const getComparisonData = () => {
      const timeRangeHours = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168,
        '30d': 720
      }[timeRange] || 24;
      
      const cutoffTime = new Date(now.getTime() - (timeRangeHours * 60 * 60 * 1000));
      const previousCutoffTime = new Date(cutoffTime.getTime() - (timeRangeHours * 60 * 60 * 1000));
      
      const currentPeriod = data.filter(item => new Date(item.created_at) >= cutoffTime);
      const previousPeriod = data.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= previousCutoffTime && itemDate < cutoffTime;
      });
      
      return { currentPeriod, previousPeriod };
    };
    
    const { currentPeriod, previousPeriod } = getComparisonData();
    
    // 1. Request Volume Analysis
    if (currentPeriod.length > 0) {
      const currentRequests = currentPeriod.length;
      const previousRequests = previousPeriod.length;
      const changePercent = previousRequests > 0 ? ((currentRequests - previousRequests) / previousRequests) * 100 : 0;
      
      let trendDescription = '';
      let trend: 'up' | 'down' | 'stable' = 'stable';
      
      if (Math.abs(changePercent) < 5) {
        trendDescription = `Traffic remains stable at ${currentRequests.toLocaleString()} requests`;
        trend = 'stable';
      } else if (changePercent > 0) {
        trendDescription = `Traffic increased by ${changePercent.toFixed(1)}% to ${currentRequests.toLocaleString()} requests`;
        trend = 'up';
      } else {
        trendDescription = `Traffic decreased by ${Math.abs(changePercent).toFixed(1)}% to ${currentRequests.toLocaleString()} requests`;
        trend = 'down';
      }
      
      generatedInsights.push({
        id: 'traffic-trend',
        type: 'trend',
        title: 'Traffic Volume Analysis',
        description: trendDescription,
        value: currentRequests,
        changePercent: changePercent,
        trend,
        confidence: previousRequests > 10 ? 0.9 : 0.6,
        timeframe: timeRange
      });
    }
    
    // 2. Error Rate Analysis
    const currentErrors = currentPeriod.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
    const previousErrors = previousPeriod.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
    const currentErrorRate = currentPeriod.length > 0 ? (currentErrors / currentPeriod.length) * 100 : 0;
    const previousErrorRate = previousPeriod.length > 0 ? (previousErrors / previousPeriod.length) * 100 : 0;
    const errorRateChange = previousErrorRate > 0 ? ((currentErrorRate - previousErrorRate) / previousErrorRate) * 100 : 0;
    
    if (currentPeriod.length > 0) {
      let errorDescription = '';
      let errorTrend: 'up' | 'down' | 'stable' = 'stable';
      
      if (Math.abs(errorRateChange) < 10) {
        errorDescription = `Error rate stable at ${currentErrorRate.toFixed(1)}% (${currentErrors} errors)`;
        errorTrend = 'stable';
      } else if (errorRateChange > 0) {
        errorDescription = `Error rate increased by ${errorRateChange.toFixed(1)}% to ${currentErrorRate.toFixed(1)}% (${currentErrors} errors)`;
        errorTrend = 'up';
      } else {
        errorDescription = `Error rate improved by ${Math.abs(errorRateChange).toFixed(1)}% to ${currentErrorRate.toFixed(1)}% (${currentErrors} errors)`;
        errorTrend = 'down';
      }
      
      generatedInsights.push({
        id: 'error-rate',
        type: 'comparison',
        title: 'Error Rate Analysis',
        description: errorDescription,
        value: currentErrorRate,
        changePercent: errorRateChange,
        trend: errorTrend,
        confidence: 0.85,
        timeframe: timeRange
      });
    }
    
    // 3. Performance Analysis
    const currentAvgDuration = currentPeriod.length > 0 
      ? currentPeriod.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / currentPeriod.length 
      : 0;
    const previousAvgDuration = previousPeriod.length > 0 
      ? previousPeriod.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / previousPeriod.length 
      : 0;
    const performanceChange = previousAvgDuration > 0 ? ((currentAvgDuration - previousAvgDuration) / previousAvgDuration) * 100 : 0;
    
    if (currentPeriod.length > 0) {
      let performanceDescription = '';
      let performanceTrend: 'up' | 'down' | 'stable' = 'stable';
      
      if (Math.abs(performanceChange) < 15) {
        performanceDescription = `Response time stable at ${currentAvgDuration.toFixed(2)}s average`;
        performanceTrend = 'stable';
      } else if (performanceChange > 0) {
        performanceDescription = `Response time increased by ${performanceChange.toFixed(1)}% to ${currentAvgDuration.toFixed(2)}s average (performance degraded)`;
        performanceTrend = 'up';
      } else {
        performanceDescription = `Response time improved by ${Math.abs(performanceChange).toFixed(1)}% to ${currentAvgDuration.toFixed(2)}s average`;
        performanceTrend = 'down';
      }
      
      generatedInsights.push({
        id: 'performance',
        type: 'trend',
        title: 'Performance Analysis',
        description: performanceDescription,
        value: currentAvgDuration,
        changePercent: performanceChange,
        trend: performanceTrend,
        confidence: 0.8,
        timeframe: timeRange
      });
    }
    
    // 4. Peak Activity Analysis
    const hourlyActivity = new Map<number, number>();
    currentPeriod.forEach(item => {
      const hour = new Date(item.created_at).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    });
    
    if (hourlyActivity.size > 0) {
      const peakHour = Array.from(hourlyActivity.entries()).reduce((max, current) => 
        current[1] > max[1] ? current : max
      );
      
      const totalRequests = Array.from(hourlyActivity.values()).reduce((sum, val) => sum + val, 0);
      const peakPercentage = (peakHour[1] / totalRequests) * 100;
      
      generatedInsights.push({
        id: 'peak-activity',
        type: 'peak',
        title: 'Peak Activity Pattern',
        description: `Highest activity at ${peakHour[0]}:00 with ${peakHour[1]} requests (${peakPercentage.toFixed(1)}% of total traffic)`,
        value: peakHour[1],
        trend: 'stable',
        confidence: 0.75,
        timeframe: timeRange
      });
    }
    
    // 5. Feature Usage Analysis
    const featureUsage = new Map<string, number>();
    currentPeriod.forEach(item => {
      featureUsage.set(item.feature, (featureUsage.get(item.feature) || 0) + 1);
    });
    
    if (featureUsage.size > 0) {
      const topFeature = Array.from(featureUsage.entries()).reduce((max, current) => 
        current[1] > max[1] ? current : max
      );
      
      const featurePercentage = (topFeature[1] / currentPeriod.length) * 100;
      
      generatedInsights.push({
        id: 'feature-usage',
        type: 'pattern',
        title: 'Most Active Feature',
        description: `${topFeature[0]} dominates with ${topFeature[1]} requests (${featurePercentage.toFixed(1)}% of all traffic)`,
        value: topFeature[1],
        trend: 'stable',
        confidence: 0.85,
        timeframe: timeRange
      });
    }
    
    // 6. Simple Forecast (Linear Trend)
    if (currentPeriod.length > 10 && previousPeriod.length > 0) {
      const trendSlope = (currentPeriod.length - previousPeriod.length) / previousPeriod.length;
      const forecastValue = currentPeriod.length * (1 + trendSlope);
      
      let forecastDescription = '';
      if (Math.abs(trendSlope) < 0.1) {
        forecastDescription = `Traffic expected to remain stable around ${Math.round(forecastValue)} requests`;
      } else if (trendSlope > 0) {
        forecastDescription = `Trending upward: projected ${Math.round(forecastValue)} requests next period (+${(trendSlope * 100).toFixed(1)}%)`;
      } else {
        forecastDescription = `Trending downward: projected ${Math.round(forecastValue)} requests next period (${(trendSlope * 100).toFixed(1)}%)`;
      }
      
      generatedInsights.push({
        id: 'forecast',
        type: 'forecast',
        title: 'Traffic Forecast',
        description: forecastDescription,
        value: forecastValue,
        trend: trendSlope > 0.05 ? 'up' : trendSlope < -0.05 ? 'down' : 'stable',
        confidence: 0.6,
        timeframe: `Next ${timeRange}`
      });
    }
    
    return generatedInsights.sort((a, b) => b.confidence - a.confidence);
  }, [data, timeRange]);
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <BarChart3 className="h-4 w-4 text-blue-400" />;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'forecast': return <Lightbulb className="h-4 w-4" />;
      case 'peak': return <TrendingUp className="h-4 w-4" />;
      case 'pattern': return <BarChart3 className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Brain className="h-4 w-4" />
            Auto-Generated Chart Insights
            <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
              AI Narration
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <div key={insight.id} className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(insight.type)}
                    <span className="text-white font-medium text-sm">{insight.title}</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(insight.trend)}
                    {insight.changePercent !== undefined && (
                      <span className={`text-xs ${
                        insight.changePercent > 0 ? 'text-green-400' : 
                        insight.changePercent < 0 ? 'text-red-400' : 'text-white/60'
                      }`}>
                        {insight.changePercent > 0 ? '+' : ''}{insight.changePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-white/90 mb-1">
                  {insight.description}
                </div>
                
                <div className="text-xs text-white/60">
                  Timeframe: {insight.timeframe} | Value: {insight.value.toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/70 py-8">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Insufficient data for insight generation</p>
              <p className="text-xs mt-1">More data needed to generate meaningful insights</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightGenerator;
