
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Lightbulb } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface LogAnalysisAIProps {
  data: CronjobData[];
  timeRange: string;
}

interface ErrorPattern {
  pattern: string;
  frequency: number;
  examples: string[];
  severity: 'low' | 'medium' | 'high';
}

interface AnomalyDetection {
  type: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  value: number;
  threshold: number;
}

interface LogCluster {
  id: string;
  description: string;
  count: number;
  examples: string[];
  similarity: number;
}

const LogAnalysisAI: React.FC<LogAnalysisAIProps> = ({ data, timeRange }) => {
  const analysis = useMemo(() => {
    if (data.length === 0) return null;

    // 1. Pattern Mining - Error frequency and patterns
    const errorPatterns: ErrorPattern[] = [];
    const errorDescriptions = data
      .filter(item => ['400', '404', '500', '502', '503'].includes(item.status))
      .map(item => item.desc_transaction);

    // Simple pattern detection using keyword frequency
    const keywords = ['undefined', 'null', 'timeout', 'connection', 'invalid', 'failed', 'error', 'exception'];
    keywords.forEach(keyword => {
      const matches = errorDescriptions.filter(desc => 
        desc.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        errorPatterns.push({
          pattern: keyword,
          frequency: matches.length,
          examples: matches.slice(0, 3),
          severity: matches.length > 10 ? 'high' : matches.length > 5 ? 'medium' : 'low'
        });
      }
    });

    // 2. Anomaly Detection - Statistical analysis
    const anomalies: AnomalyDetection[] = [];
    
    // Error rate anomaly
    const errorRate = (data.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length / data.length) * 100;
    const normalErrorRate = 5; // 5% threshold
    if (errorRate > normalErrorRate) {
      anomalies.push({
        type: 'High Error Rate',
        description: `Error rate of ${errorRate.toFixed(1)}% exceeds normal threshold`,
        severity: errorRate > 15 ? 'critical' : errorRate > 10 ? 'warning' : 'info',
        value: errorRate,
        threshold: normalErrorRate
      });
    }

    // Response time anomaly
    const avgResponseTime = data.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / data.length;
    const normalResponseTime = 3; // 3s threshold
    if (avgResponseTime > normalResponseTime) {
      anomalies.push({
        type: 'Slow Response Time',
        description: `Average response time of ${avgResponseTime.toFixed(2)}s exceeds normal threshold`,
        severity: avgResponseTime > 10 ? 'critical' : avgResponseTime > 5 ? 'warning' : 'info',
        value: avgResponseTime,
        threshold: normalResponseTime
      });
    }

    // 3. Log Clustering using simple similarity
    const clusters: LogCluster[] = [];
    const uniqueDescriptions = [...new Set(data.map(item => item.desc_transaction))];
    
    // Simple clustering based on similar descriptions
    const processedClusters = new Set<string>();
    uniqueDescriptions.forEach(desc => {
      if (processedClusters.has(desc)) return;
      
      const similar = uniqueDescriptions.filter(otherDesc => {
        if (desc === otherDesc) return true;
        // Simple similarity check - same first 3 words
        const words1 = desc.toLowerCase().split(' ').slice(0, 3);
        const words2 = otherDesc.toLowerCase().split(' ').slice(0, 3);
        return words1.join(' ') === words2.join(' ');
      });

      if (similar.length > 1) {
        similar.forEach(s => processedClusters.add(s));
        const clusterData = data.filter(item => similar.includes(item.desc_transaction));
        clusters.push({
          id: `cluster-${clusters.length}`,
          description: similar[0].substring(0, 50) + '...',
          count: clusterData.length,
          examples: similar.slice(0, 3),
          similarity: similar.length / uniqueDescriptions.length
        });
      }
    });

    // 4. Natural Language Summary Generation
    const generateSummary = (): string => {
      const totalRequests = data.length;
      const errorCount = data.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
      const successRate = ((totalRequests - errorCount) / totalRequests) * 100;
      
      let summary = `📊 **Log Analysis Summary**\n\n`;
      
      // Traffic overview
      summary += `During the ${timeRange}, system processed ${totalRequests.toLocaleString()} requests `;
      summary += `with ${successRate.toFixed(1)}% success rate.\n\n`;
      
      // Error analysis
      if (errorCount > 0) {
        const topErrorPattern = errorPatterns.sort((a, b) => b.frequency - a.frequency)[0];
        summary += `🚨 **Error Analysis**: Detected ${errorCount} errors. `;
        if (topErrorPattern) {
          summary += `Most common pattern: "${topErrorPattern.pattern}" (${topErrorPattern.frequency} occurrences). `;
        }
        summary += `\n\n`;
      }
      
      // Anomalies
      if (anomalies.length > 0) {
        summary += `⚠️ **Anomalies Detected**: `;
        anomalies.forEach(anomaly => {
          summary += `${anomaly.type} - ${anomaly.description}. `;
        });
        summary += `\n\n`;
      }
      
      // Recommendations
      summary += `💡 **AI Recommendations**: `;
      if (errorRate > 10) {
        summary += `High error rate detected, investigate top error patterns. `;
      }
      if (avgResponseTime > 5) {
        summary += `Response times need optimization. `;
      }
      if (clusters.length > 0) {
        summary += `${clusters.length} log clusters identified for pattern analysis. `;
      }
      
      return summary;
    };

    return {
      errorPatterns: errorPatterns.sort((a, b) => b.frequency - a.frequency),
      anomalies,
      clusters: clusters.sort((a, b) => b.count - a.count),
      summary: generateSummary(),
      insights: {
        totalPatterns: errorPatterns.length,
        criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
        logClusters: clusters.length
      }
    };
  }, [data, timeRange]);

  if (!analysis) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-8 text-center text-white/70">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available for AI analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Overview */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Brain className="h-4 w-4" />
            AI-Powered Log Analysis
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Local AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white/70">Patterns Found</span>
              </div>
              <div className="text-lg font-bold text-blue-400">
                {analysis.insights.totalPatterns}
              </div>
            </div>
            
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-white/70">Critical Issues</span>
              </div>
              <div className="text-lg font-bold text-red-400">
                {analysis.insights.criticalAnomalies}
              </div>
            </div>
            
            <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white/70">Log Clusters</span>
              </div>
              <div className="text-lg font-bold text-green-400">
                {analysis.insights.logClusters}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Generated Summary */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Lightbulb className="h-4 w-4" />
            AI-Generated Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed">
            {analysis.summary}
          </div>
        </CardContent>
      </Card>

      {/* Error Patterns */}
      {analysis.errorPatterns.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <Target className="h-4 w-4" />
              Error Pattern Mining
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.errorPatterns.slice(0, 5).map((pattern, index) => (
              <div key={index} className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{pattern.pattern}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      pattern.severity === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      pattern.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                      'bg-green-500/20 text-green-300 border-green-500/30'
                    }`}>
                      {pattern.severity}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {pattern.frequency}x
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-white/60">
                  Examples: {pattern.examples.slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Anomaly Detection */}
      {analysis.anomalies.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <AlertTriangle className="h-4 w-4" />
              Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.anomalies.map((anomaly, index) => (
              <div key={index} className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{anomaly.type}</span>
                  <Badge className={`${
                    anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    anomaly.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {anomaly.severity}
                  </Badge>
                </div>
                <div className="text-sm text-white/80">{anomaly.description}</div>
                <div className="text-xs text-white/60 mt-1">
                  Value: {anomaly.value.toFixed(2)} | Threshold: {anomaly.threshold}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Log Clustering */}
      {analysis.clusters.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <TrendingUp className="h-4 w-4" />
              Log Clustering & Similarity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.clusters.slice(0, 5).map((cluster, index) => (
              <div key={cluster.id} className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Cluster {index + 1}</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {cluster.count} logs
                  </Badge>
                </div>
                <div className="text-sm text-white/80 mb-1">{cluster.description}</div>
                <div className="text-xs text-white/60">
                  Similarity: {(cluster.similarity * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LogAnalysisAI;
