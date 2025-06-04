
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, TrendingUp, AlertTriangle, Users, Activity, Clock } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface DailyInsight {
  id: string;
  date: string;
  category: 'traffic' | 'performance' | 'errors' | 'patterns' | 'anomalies';
  title: string;
  description: string;
  metrics: {
    value: number;
    change: number;
    unit: string;
  };
  priority: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface InsightFeedProps {
  data: CronjobData[];
}

const InsightFeed: React.FC<InsightFeedProps> = ({ data }) => {
  const dailyInsights = useMemo(() => {
    if (data.length === 0) return [];
    
    const insights: DailyInsight[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Group data by day for analysis
    const dailyData = new Map<string, CronjobData[]>();
    data.forEach(item => {
      const day = item.created_at.split('T')[0];
      if (!dailyData.has(day)) {
        dailyData.set(day, []);
      }
      dailyData.get(day)!.push(item);
    });
    
    const sortedDays = Array.from(dailyData.keys()).sort().reverse();
    
    sortedDays.forEach((day, dayIndex) => {
      const dayData = dailyData.get(day)!;
      const previousDay = sortedDays[dayIndex + 1];
      const previousDayData = previousDay ? dailyData.get(previousDay) || [] : [];
      
      // Traffic Analysis
      const totalRequests = dayData.length;
      const previousRequests = previousDayData.length;
      const trafficChange = previousRequests > 0 ? ((totalRequests - previousRequests) / previousRequests) * 100 : 0;
      
      insights.push({
        id: `traffic-${day}`,
        date: day,
        category: 'traffic',
        title: 'Daily Traffic Summary',
        description: `Processed ${totalRequests.toLocaleString()} requests. ${
          Math.abs(trafficChange) < 5 ? 'Traffic remained stable' :
          trafficChange > 0 ? `Traffic increased by ${trafficChange.toFixed(1)}%` :
          `Traffic decreased by ${Math.abs(trafficChange).toFixed(1)}%`
        } compared to previous day.`,
        metrics: {
          value: totalRequests,
          change: trafficChange,
          unit: 'requests'
        },
        priority: Math.abs(trafficChange) > 50 ? 'high' : Math.abs(trafficChange) > 20 ? 'medium' : 'low',
        recommendations: trafficChange > 50 ? [
          'Monitor server capacity',
          'Check for bot traffic',
          'Review scaling policies'
        ] : trafficChange < -30 ? [
          'Investigate service availability',
          'Check for maintenance issues',
          'Review user communication'
        ] : [
          'Continue monitoring trends',
          'Maintain current capacity'
        ]
      });
      
      // Error Analysis
      const errorRequests = dayData.filter(item => ['400', '404', '500', '502', '503'].includes(item.status));
      const errorRate = totalRequests > 0 ? (errorRequests.length / totalRequests) * 100 : 0;
      const previousErrors = previousDayData.filter(item => ['400', '404', '500', '502', '503'].includes(item.status));
      const previousErrorRate = previousDayData.length > 0 ? (previousErrors.length / previousDayData.length) * 100 : 0;
      const errorChange = previousErrorRate > 0 ? ((errorRate - previousErrorRate) / previousErrorRate) * 100 : 0;
      
      if (errorRate > 5 || Math.abs(errorChange) > 25) {
        insights.push({
          id: `errors-${day}`,
          date: day,
          category: 'errors',
          title: 'Error Rate Analysis',
          description: `Error rate at ${errorRate.toFixed(1)}% (${errorRequests.length} errors). ${
            Math.abs(errorChange) < 10 ? 'Error rate stable' :
            errorChange > 0 ? `Errors increased by ${errorChange.toFixed(1)}%` :
            `Errors decreased by ${Math.abs(errorChange).toFixed(1)}%`
          }.`,
          metrics: {
            value: errorRate,
            change: errorChange,
            unit: '%'
          },
          priority: errorRate > 15 ? 'high' : errorRate > 8 ? 'medium' : 'low',
          recommendations: errorRate > 10 ? [
            'Review application logs immediately',
            'Check dependency health',
            'Consider rollback if recent deployment'
          ] : [
            'Monitor error patterns',
            'Update error handling',
            'Review documentation'
          ]
        });
      }
      
      // Performance Analysis
      const avgResponseTime = dayData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / dayData.length;
      const previousAvgTime = previousDayData.length > 0 ? 
        previousDayData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / previousDayData.length : 0;
      const performanceChange = previousAvgTime > 0 ? ((avgResponseTime - previousAvgTime) / previousAvgTime) * 100 : 0;
      
      if (avgResponseTime > 3 || Math.abs(performanceChange) > 20) {
        insights.push({
          id: `performance-${day}`,
          date: day,
          category: 'performance',
          title: 'Performance Summary',
          description: `Average response time: ${avgResponseTime.toFixed(2)}s. ${
            Math.abs(performanceChange) < 10 ? 'Performance stable' :
            performanceChange > 0 ? `Response time increased by ${performanceChange.toFixed(1)}%` :
            `Response time improved by ${Math.abs(performanceChange).toFixed(1)}%`
          }.`,
          metrics: {
            value: avgResponseTime,
            change: performanceChange,
            unit: 'seconds'
          },
          priority: avgResponseTime > 5 ? 'high' : avgResponseTime > 3 ? 'medium' : 'low',
          recommendations: avgResponseTime > 5 ? [
            'Optimize database queries',
            'Review application bottlenecks',
            'Consider caching strategies'
          ] : [
            'Continue performance monitoring',
            'Maintain optimization practices'
          ]
        });
      }
      
      // Pattern Analysis
      const userAgentMap = new Map<string, number>();
      const ipMap = new Map<string, number>();
      dayData.forEach(item => {
        userAgentMap.set(item.user_agent, (userAgentMap.get(item.user_agent) || 0) + 1);
        ipMap.set(item.ip, (ipMap.get(item.ip) || 0) + 1);
      });
      
      const topUserAgent = Array.from(userAgentMap.entries()).reduce((max, current) => 
        current[1] > max[1] ? current : max, ['', 0]);
      const topIP = Array.from(ipMap.entries()).reduce((max, current) => 
        current[1] > max[1] ? current : max, ['', 0]);
      
      if (topUserAgent[1] > totalRequests * 0.3 || topIP[1] > totalRequests * 0.4) {
        insights.push({
          id: `patterns-${day}`,
          date: day,
          category: 'patterns',
          title: 'Usage Pattern Analysis',
          description: `Dominant pattern detected: ${
            topUserAgent[1] > totalRequests * 0.3 ? 
            `User-Agent "${topUserAgent[0].substring(0, 30)}..." represents ${((topUserAgent[1] / totalRequests) * 100).toFixed(1)}% of traffic` :
            `IP ${topIP[0]} generated ${((topIP[1] / totalRequests) * 100).toFixed(1)}% of requests`
          }.`,
          metrics: {
            value: Math.max(topUserAgent[1], topIP[1]),
            change: 0,
            unit: 'requests'
          },
          priority: (Math.max(topUserAgent[1], topIP[1]) / totalRequests) > 0.5 ? 'high' : 'medium',
          recommendations: [
            'Investigate if pattern indicates bot traffic',
            'Consider rate limiting if necessary',
            'Monitor for security implications'
          ]
        });
      }
    });
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.date.localeCompare(a.date);
    });
  }, [data]);
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'traffic': return <Users className="h-4 w-4" />;
      case 'performance': return <Clock className="h-4 w-4" />;
      case 'errors': return <AlertTriangle className="h-4 w-4" />;
      case 'patterns': return <TrendingUp className="h-4 w-4" />;
      case 'anomalies': return <Activity className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'traffic': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'performance': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'errors': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'patterns': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'anomalies': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };
  
  return (
    <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <FileText className="h-4 w-4" />
          Daily AI Insight Feed
          <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Auto-Generated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {dailyInsights.length > 0 ? (
            <div className="space-y-4">
              {dailyInsights.slice(0, 10).map((insight) => (
                <div key={insight.id} className="bg-white/5 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-white font-medium text-sm">{insight.title}</span>
                      <Badge className={getCategoryColor(insight.category)}>
                        {insight.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <Calendar className="h-3 w-3" />
                        {new Date(insight.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-white/90">
                    {insight.description}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <span>
                      Value: {insight.metrics.value.toLocaleString()} {insight.metrics.unit}
                    </span>
                    {insight.metrics.change !== 0 && (
                      <span className={insight.metrics.change > 0 ? 'text-red-400' : 'text-green-400'}>
                        {insight.metrics.change > 0 ? '+' : ''}{insight.metrics.change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-white/80 font-medium">Recommendations:</div>
                    {insight.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="text-xs text-white/60 ml-2">
                        • {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/70 py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No insights generated yet</p>
              <p className="text-xs mt-1">Insights will appear as data accumulates</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default InsightFeed;
