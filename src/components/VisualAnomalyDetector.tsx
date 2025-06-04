
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, Zap, Eye } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface AnomalyAlert {
  id: string;
  type: 'spike' | 'drop' | 'stagnation' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  value: number;
  baseline: number;
  deviation: number;
  affectedMetric: string;
  recommendations: string[];
}

interface VisualAnomalyDetectorProps {
  data: CronjobData[];
  timeRange: string;
  onAnomalyDetected?: (anomaly: AnomalyAlert) => void;
}

const VisualAnomalyDetector: React.FC<VisualAnomalyDetectorProps> = ({ 
  data, 
  timeRange, 
  onAnomalyDetected 
}) => {
  const anomalies = useMemo(() => {
    if (data.length < 10) return [];

    const detectedAnomalies: AnomalyAlert[] = [];
    
    // Group data by hour for time-series analysis
    const hourlyData = new Map<string, { requests: number; errors: number; avgDuration: number; hour: string }>();
    
    data.forEach(item => {
      const hour = new Date(item.created_at).toISOString().slice(0, 13) + ':00';
      const current = hourlyData.get(hour) || { requests: 0, errors: 0, avgDuration: 0, hour };
      
      current.requests += 1;
      if (['400', '404', '500', '502', '503'].includes(item.status)) {
        current.errors += 1;
      }
      current.avgDuration = (current.avgDuration * (current.requests - 1) + parseFloat(item.duration_time)) / current.requests;
      
      hourlyData.set(hour, current);
    });
    
    const timeSeriesData = Array.from(hourlyData.values()).sort((a, b) => a.hour.localeCompare(b.hour));
    
    if (timeSeriesData.length < 5) return [];
    
    // Calculate baselines (moving averages)
    const calculateMovingAverage = (values: number[], window: number = 5) => {
      return values.map((_, index) => {
        const start = Math.max(0, index - window + 1);
        const subset = values.slice(start, index + 1);
        return subset.reduce((sum, val) => sum + val, 0) / subset.length;
      });
    };
    
    const calculateStandardDeviation = (values: number[], mean: number) => {
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      return Math.sqrt(variance);
    };
    
    // Analyze request volume anomalies
    const requestValues = timeSeriesData.map(d => d.requests);
    const requestMovingAvg = calculateMovingAverage(requestValues);
    const requestMean = requestValues.reduce((sum, val) => sum + val, 0) / requestValues.length;
    const requestStdDev = calculateStandardDeviation(requestValues, requestMean);
    
    timeSeriesData.forEach((dataPoint, index) => {
      const baseline = requestMovingAvg[index];
      const deviation = Math.abs(dataPoint.requests - baseline) / Math.max(requestStdDev, 1);
      
      // Spike detection (3+ standard deviations above baseline)
      if (dataPoint.requests > baseline + (3 * requestStdDev)) {
        detectedAnomalies.push({
          id: `spike-${index}`,
          type: 'spike',
          severity: deviation > 5 ? 'critical' : deviation > 3 ? 'high' : 'medium',
          message: `Unusual traffic spike detected at ${new Date(dataPoint.hour).toLocaleTimeString()}: ${dataPoint.requests} requests (${((dataPoint.requests - baseline) / baseline * 100).toFixed(1)}% above normal)`,
          timestamp: dataPoint.hour,
          value: dataPoint.requests,
          baseline: baseline,
          deviation: deviation,
          affectedMetric: 'request_volume',
          recommendations: [
            'Check for bot traffic or DDoS patterns',
            'Monitor server capacity and response times',
            'Investigate unusual user agent patterns'
          ]
        });
      }
      
      // Drop detection
      if (dataPoint.requests < baseline - (2.5 * requestStdDev) && baseline > 10) {
        detectedAnomalies.push({
          id: `drop-${index}`,
          type: 'drop',
          severity: 'medium',
          message: `Significant traffic drop at ${new Date(dataPoint.hour).toLocaleTimeString()}: ${dataPoint.requests} requests (${((baseline - dataPoint.requests) / baseline * 100).toFixed(1)}% below normal)`,
          timestamp: dataPoint.hour,
          value: dataPoint.requests,
          baseline: baseline,
          deviation: deviation,
          affectedMetric: 'request_volume',
          recommendations: [
            'Check service availability',
            'Verify network connectivity',
            'Review recent deployments'
          ]
        });
      }
    });
    
    // Analyze response time anomalies
    const durationValues = timeSeriesData.map(d => d.avgDuration);
    const durationMovingAvg = calculateMovingAverage(durationValues);
    const durationMean = durationValues.reduce((sum, val) => sum + val, 0) / durationValues.length;
    const durationStdDev = calculateStandardDeviation(durationValues, durationMean);
    
    timeSeriesData.forEach((dataPoint, index) => {
      const baseline = durationMovingAvg[index];
      const deviation = Math.abs(dataPoint.avgDuration - baseline) / Math.max(durationStdDev, 0.1);
      
      if (dataPoint.avgDuration > baseline + (2.5 * durationStdDev)) {
        detectedAnomalies.push({
          id: `slowness-${index}`,
          type: 'spike',
          severity: deviation > 4 ? 'critical' : 'high',
          message: `Performance degradation at ${new Date(dataPoint.hour).toLocaleTimeString()}: ${dataPoint.avgDuration.toFixed(2)}s avg response time (${((dataPoint.avgDuration - baseline) / baseline * 100).toFixed(1)}% slower)`,
          timestamp: dataPoint.hour,
          value: dataPoint.avgDuration,
          baseline: baseline,
          deviation: deviation,
          affectedMetric: 'response_time',
          recommendations: [
            'Check database query performance',
            'Monitor CPU and memory usage',
            'Review recent code changes'
          ]
        });
      }
    });
    
    // Stagnation detection (no requests for extended period)
    const zeroRequestHours = timeSeriesData.filter(d => d.requests === 0);
    if (zeroRequestHours.length >= 3) {
      detectedAnomalies.push({
        id: 'stagnation-period',
        type: 'stagnation',
        severity: 'high',
        message: `Service stagnation detected: No requests for ${zeroRequestHours.length} consecutive hours`,
        timestamp: zeroRequestHours[0].hour,
        value: 0,
        baseline: requestMean,
        deviation: requestMean,
        affectedMetric: 'availability',
        recommendations: [
          'Check service health and uptime',
          'Verify load balancer configuration',
          'Review maintenance schedules'
        ]
      });
    }
    
    // Error rate anomalies
    timeSeriesData.forEach((dataPoint, index) => {
      const errorRate = dataPoint.requests > 0 ? (dataPoint.errors / dataPoint.requests) * 100 : 0;
      const avgErrorRate = timeSeriesData.reduce((sum, d) => sum + (d.requests > 0 ? (d.errors / d.requests) * 100 : 0), 0) / timeSeriesData.length;
      
      if (errorRate > avgErrorRate * 2 && errorRate > 15) {
        detectedAnomalies.push({
          id: `error-spike-${index}`,
          type: 'spike',
          severity: errorRate > 50 ? 'critical' : 'high',
          message: `Error rate spike at ${new Date(dataPoint.hour).toLocaleTimeString()}: ${errorRate.toFixed(1)}% error rate (${dataPoint.errors}/${dataPoint.requests} requests)`,
          timestamp: dataPoint.hour,
          value: errorRate,
          baseline: avgErrorRate,
          deviation: (errorRate - avgErrorRate) / avgErrorRate,
          affectedMetric: 'error_rate',
          recommendations: [
            'Check application logs for error patterns',
            'Review recent deployments',
            'Monitor dependent services'
          ]
        });
      }
    });
    
    return detectedAnomalies.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [data]);
  
  React.useEffect(() => {
    if (anomalies.length > 0 && onAnomalyDetected) {
      anomalies.forEach(anomaly => onAnomalyDetected(anomaly));
    }
  }, [anomalies, onAnomalyDetected]);
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-400" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-400" />;
      default: return <Eye className="h-4 w-4 text-blue-400" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Anomaly Overview */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Eye className="h-4 w-4" />
            Visual Anomaly Detection
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-white/70">Critical</span>
              </div>
              <div className="text-lg font-bold text-red-400">
                {anomalies.filter(a => a.severity === 'critical').length}
              </div>
            </div>
            
            <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-white/70">High</span>
              </div>
              <div className="text-lg font-bold text-orange-400">
                {anomalies.filter(a => a.severity === 'high').length}
              </div>
            </div>
            
            <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white/70">Medium</span>
              </div>
              <div className="text-lg font-bold text-yellow-400">
                {anomalies.filter(a => a.severity === 'medium').length}
              </div>
            </div>
            
            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-white/70">Total</span>
              </div>
              <div className="text-lg font-bold text-blue-400">
                {anomalies.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Anomaly List */}
      {anomalies.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <AlertTriangle className="h-4 w-4" />
              Detected Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {anomalies.slice(0, 10).map((anomaly) => (
              <div key={anomaly.id} className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(anomaly.severity)}
                    <span className="text-white font-medium text-sm">{anomaly.type.replace('_', ' ').toUpperCase()}</span>
                    <Badge className={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <Clock className="h-3 w-3" />
                    {new Date(anomaly.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="text-sm text-white/90 mb-2">
                  {anomaly.message}
                </div>
                
                <div className="text-xs text-white/60 mb-2">
                  Metric: {anomaly.affectedMetric} | Deviation: {anomaly.deviation.toFixed(2)}σ
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-white/70 font-medium">AI Recommendations:</div>
                  {anomaly.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="text-xs text-white/60 ml-2">
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {anomalies.length === 0 && (
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-6 text-center text-white/70">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No anomalies detected in current data</p>
            <p className="text-xs mt-1">System is operating within normal parameters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisualAnomalyDetector;
