
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface AutoSummaryProps {
  data: CronjobData[];
  timeRange: string;
}

const AutoSummary: React.FC<AutoSummaryProps> = ({ data, timeRange }) => {
  const summary = useMemo(() => {
    if (data.length === 0) return null;

    const now = new Date();
    const timeRangeHours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }[timeRange] || 24;

    // Basic metrics
    const totalRequests = data.length;
    const successCount = data.filter(item => ['200', '201'].includes(item.status)).length;
    const errorCount = data.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
    const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
    const avgDuration = data.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / totalRequests;

    // Pattern recognition
    const patterns = {
      commonErrors: data
        .filter(item => ['400', '404', '500', '502', '503'].includes(item.status))
        .reduce((acc, item) => {
          const pattern = `${item.status} on ${item.feature}`;
          acc[pattern] = (acc[pattern] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      
      slowFeatures: [...new Set(data.map(item => item.feature))]
        .map(feature => {
          const featureData = data.filter(item => item.feature === feature);
          const avgDur = featureData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / featureData.length;
          return { feature, avgDuration: avgDur, requests: featureData.length };
        })
        .filter(f => f.avgDuration > 3)
        .sort((a, b) => b.avgDuration - a.avgDuration),

      topIPs: [...new Set(data.map(item => item.ip))]
        .map(ip => {
          const ipData = data.filter(item => item.ip === ip);
          return { ip, requests: ipData.length };
        })
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5)
    };

    // Health assessment
    const healthStatus = {
      level: successRate >= 95 ? 'excellent' : successRate >= 90 ? 'good' : successRate >= 80 ? 'fair' : 'poor',
      color: successRate >= 95 ? 'green' : successRate >= 90 ? 'blue' : successRate >= 80 ? 'yellow' : 'red'
    };

    // Time-based insights
    const timeLabel = timeRange === '1h' ? 'the last hour' : 
                     timeRange === '6h' ? 'the last 6 hours' :
                     timeRange === '24h' ? 'the last 24 hours' :
                     timeRange === '7d' ? 'the last 7 days' : 'the last 30 days';

    return {
      totalRequests,
      successCount,
      errorCount,
      successRate,
      avgDuration,
      patterns,
      healthStatus,
      timeLabel,
      timeRangeHours
    };
  }, [data, timeRange]);

  if (!summary) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-8 text-center text-white/70">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available for summary generation</p>
        </CardContent>
      </Card>
    );
  }

  const generateNarrativeSummary = () => {
    const { totalRequests, successRate, avgDuration, patterns, healthStatus, timeLabel } = summary;
    
    let narrative = `## System Performance Summary\n\n`;
    
    // Overall health
    narrative += `**Health Status:** `;
    switch (healthStatus.level) {
      case 'excellent':
        narrative += `🟢 Excellent - Your system is performing exceptionally well `;
        break;
      case 'good':
        narrative += `🔵 Good - System performance is stable with minor issues `;
        break;
      case 'fair':
        narrative += `🟡 Fair - System showing some performance concerns `;
        break;
      case 'poor':
        narrative += `🔴 Poor - System requires immediate attention `;
        break;
    }
    narrative += `with a ${successRate.toFixed(1)}% success rate.\n\n`;

    // Traffic overview
    narrative += `**Traffic Overview:** During ${timeLabel}, your system processed ${totalRequests.toLocaleString()} requests `;
    if (totalRequests > 1000) {
      narrative += `(high volume) `;
    } else if (totalRequests > 100) {
      narrative += `(moderate volume) `;
    } else {
      narrative += `(low volume) `;
    }
    narrative += `with an average response time of ${avgDuration.toFixed(2)} seconds.\n\n`;

    // Performance insights
    if (avgDuration > 5) {
      narrative += `⚠️ **Performance Alert:** Response times are above optimal levels (>5s average). `;
    } else if (avgDuration < 1) {
      narrative += `⚡ **Performance Highlight:** Excellent response times (<1s average). `;
    } else {
      narrative += `✅ **Performance Status:** Response times are within acceptable ranges. `;
    }

    // Error analysis
    if (summary.errorCount > 0) {
      narrative += `\n\n**Error Analysis:** Detected ${summary.errorCount} error(s) representing ${((summary.errorCount / totalRequests) * 100).toFixed(1)}% of all requests. `;
      
      const topError = Object.entries(patterns.commonErrors)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topError) {
        narrative += `The most common issue is "${topError[0]}" occurring ${topError[1]} time(s). `;
      }
    } else {
      narrative += `\n\n✅ **Error Status:** No errors detected during this period - excellent! `;
    }

    // Slow features
    if (patterns.slowFeatures.length > 0) {
      narrative += `\n\n**Performance Concerns:** `;
      const slowestFeature = patterns.slowFeatures[0];
      narrative += `The "${slowestFeature.feature}" feature is experiencing slower response times (${slowestFeature.avgDuration.toFixed(2)}s average) and may need optimization. `;
    }

    // Traffic patterns
    if (patterns.topIPs.length > 0) {
      narrative += `\n\n**Traffic Patterns:** `;
      const topIP = patterns.topIPs[0];
      narrative += `Most active source: ${topIP.ip} with ${topIP.requests} requests. `;
      
      if (patterns.topIPs.length > 1) {
        narrative += `Top 3 sources account for ${patterns.topIPs.slice(0, 3).reduce((sum, ip) => sum + ip.requests, 0)} requests total. `;
      }
    }

    // Recommendations
    narrative += `\n\n**Recommendations:** `;
    if (healthStatus.level === 'poor') {
      narrative += `Immediate investigation required. Focus on error resolution and performance optimization. `;
    } else if (patterns.slowFeatures.length > 0) {
      narrative += `Consider optimizing slow-performing features to improve user experience. `;
    } else if (successRate < 98) {
      narrative += `Monitor error patterns and implement preventive measures. `;
    } else {
      narrative += `Continue current monitoring practices. System is performing well. `;
    }

    return narrative;
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <FileText className="h-4 w-4" />
            Executive Summary
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Auto-Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg bg-${summary.healthStatus.color}-500/10 border border-${summary.healthStatus.color}-500/20`}>
              <div className="flex items-center gap-2">
                {summary.healthStatus.level === 'excellent' && <CheckCircle className="h-4 w-4 text-green-400" />}
                {summary.healthStatus.level === 'good' && <CheckCircle className="h-4 w-4 text-blue-400" />}
                {summary.healthStatus.level === 'fair' && <AlertTriangle className="h-4 w-4 text-yellow-400" />}
                {summary.healthStatus.level === 'poor' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                <span className="text-sm text-white/70">Health</span>
              </div>
              <div className={`text-lg font-bold text-${summary.healthStatus.color}-400 capitalize`}>
                {summary.healthStatus.level}
              </div>
              <div className="text-xs text-white/60">{summary.successRate.toFixed(1)}% success</div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white/70">Requests</span>
              </div>
              <div className="text-lg font-bold text-blue-400">
                {summary.totalRequests.toLocaleString()}
              </div>
              <div className="text-xs text-white/60">{summary.timeLabel}</div>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-white/70">Avg Response</span>
              </div>
              <div className="text-lg font-bold text-purple-400">
                {summary.avgDuration.toFixed(2)}s
              </div>
              <div className="text-xs text-white/60">
                {summary.avgDuration > 5 ? 'Needs attention' : 'Good performance'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-sm text-white/70">Errors</span>
              </div>
              <div className="text-lg font-bold text-red-400">
                {summary.errorCount}
              </div>
              <div className="text-xs text-white/60">
                {((summary.errorCount / summary.totalRequests) * 100).toFixed(1)}% error rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Narrative Summary */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <FileText className="h-4 w-4" />
            AI-Generated Narrative Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">
              {generateNarrativeSummary()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Recognition */}
      {(Object.keys(summary.patterns.commonErrors).length > 0 || summary.patterns.slowFeatures.length > 0) && (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <AlertTriangle className="h-4 w-4" />
              Detected Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(summary.patterns.commonErrors).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Common Error Patterns</h4>
                <div className="space-y-1">
                  {Object.entries(summary.patterns.commonErrors)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([pattern, count]) => (
                      <div key={pattern} className="flex justify-between items-center text-xs">
                        <span className="text-white/70">{pattern}</span>
                        <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">
                          {count}x
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {summary.patterns.slowFeatures.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Slow Performing Features</h4>
                <div className="space-y-1">
                  {summary.patterns.slowFeatures.slice(0, 3).map((feature) => (
                    <div key={feature.feature} className="flex justify-between items-center text-xs">
                      <span className="text-white/70">{feature.feature}</span>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        {feature.avgDuration.toFixed(2)}s avg
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoSummary;
