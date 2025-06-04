
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Brain, Target, AlertTriangle } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface TrendPrediction {
  metric: string;
  slope: number;
  intercept: number;
  rSquared: number;
  prediction: number;
  timeframe: string;
  confidence: 'low' | 'medium' | 'high';
  warning?: string;
}

interface TrendLearningProps {
  data: CronjobData[];
  timeRange: string;
}

const TrendLearning: React.FC<TrendLearningProps> = ({ data, timeRange }) => {
  const { trendData, predictions } = useMemo(() => {
    if (data.length < 5) return { trendData: [], predictions: [] };
    
    // Group data by hour for trend analysis
    const hourlyData = new Map<string, { 
      hour: string; 
      requests: number; 
      errors: number; 
      avgDuration: number;
      timestamp: number;
    }>();
    
    data.forEach(item => {
      const hour = new Date(item.created_at).toISOString().slice(0, 13) + ':00';
      const timestamp = new Date(hour).getTime();
      const current = hourlyData.get(hour) || { 
        hour, 
        requests: 0, 
        errors: 0, 
        avgDuration: 0,
        timestamp
      };
      
      current.requests += 1;
      if (['400', '404', '500', '502', '503'].includes(item.status)) {
        current.errors += 1;
      }
      current.avgDuration = (current.avgDuration * (current.requests - 1) + parseFloat(item.duration_time)) / current.requests;
      
      hourlyData.set(hour, current);
    });
    
    const timeSeriesData = Array.from(hourlyData.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (timeSeriesData.length < 3) return { trendData: timeSeriesData, predictions: [] };
    
    // Linear regression function
    const linearRegression = (xValues: number[], yValues: number[]) => {
      const n = xValues.length;
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = yValues.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Calculate R-squared
      const yMean = sumY / n;
      const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
      const residualSumSquares = yValues.reduce((sum, y, i) => {
        const predicted = slope * xValues[i] + intercept;
        return sum + Math.pow(y - predicted, 2);
      }, 0);
      const rSquared = 1 - (residualSumSquares / totalSumSquares);
      
      return { slope, intercept, rSquared };
    };
    
    // Prepare data for predictions
    const xValues = timeSeriesData.map((_, index) => index);
    const nextPoint = timeSeriesData.length;
    
    const generatedPredictions: TrendPrediction[] = [];
    
    // Predict requests trend
    const requestValues = timeSeriesData.map(d => d.requests);
    const requestRegression = linearRegression(xValues, requestValues);
    const requestPrediction = requestRegression.slope * nextPoint + requestRegression.intercept;
    
    generatedPredictions.push({
      metric: 'Request Volume',
      slope: requestRegression.slope,
      intercept: requestRegression.intercept,
      rSquared: requestRegression.rSquared,
      prediction: Math.max(0, requestPrediction),
      timeframe: 'next hour',
      confidence: requestRegression.rSquared > 0.7 ? 'high' : requestRegression.rSquared > 0.4 ? 'medium' : 'low',
      warning: requestRegression.slope < -5 ? 'Steep decline predicted - check service health' : 
               requestRegression.slope > 10 ? 'Significant growth predicted - ensure capacity' : undefined
    });
    
    // Predict error trend
    const errorValues = timeSeriesData.map(d => d.errors);
    const errorRegression = linearRegression(xValues, errorValues);
    const errorPrediction = errorRegression.slope * nextPoint + errorRegression.intercept;
    
    generatedPredictions.push({
      metric: 'Error Count',
      slope: errorRegression.slope,
      intercept: errorRegression.intercept,
      rSquared: errorRegression.rSquared,
      prediction: Math.max(0, errorPrediction),
      timeframe: 'next hour',
      confidence: errorRegression.rSquared > 0.6 ? 'high' : errorRegression.rSquared > 0.3 ? 'medium' : 'low',
      warning: errorRegression.slope > 1 ? 'Error rate increasing - investigate immediately' : undefined
    });
    
    // Predict response time trend
    const durationValues = timeSeriesData.map(d => d.avgDuration);
    const durationRegression = linearRegression(xValues, durationValues);
    const durationPrediction = durationRegression.slope * nextPoint + durationRegression.intercept;
    
    generatedPredictions.push({
      metric: 'Response Time',
      slope: durationRegression.slope,
      intercept: durationRegression.intercept,
      rSquared: durationRegression.rSquared,
      prediction: Math.max(0, durationPrediction),
      timeframe: 'next hour',
      confidence: durationRegression.rSquared > 0.6 ? 'high' : durationRegression.rSquared > 0.3 ? 'medium' : 'low',
      warning: durationRegression.slope > 0.5 ? 'Response time degrading - performance optimization needed' : undefined
    });
    
    // Add trend lines to data
    const dataWithTrends = timeSeriesData.map((point, index) => ({
      ...point,
      requestTrend: requestRegression.slope * index + requestRegression.intercept,
      errorTrend: errorRegression.slope * index + errorRegression.intercept,
      durationTrend: durationRegression.slope * index + durationRegression.intercept,
      timeLabel: new Date(point.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
    
    // Add prediction point
    const nextTimestamp = timeSeriesData[timeSeriesData.length - 1].timestamp + (60 * 60 * 1000);
    dataWithTrends.push({
      hour: new Date(nextTimestamp).toISOString().slice(0, 13) + ':00',
      requests: requestPrediction,
      errors: errorPrediction,
      avgDuration: durationPrediction,
      timestamp: nextTimestamp,
      requestTrend: requestPrediction,
      errorTrend: errorPrediction,
      durationTrend: durationPrediction,
      timeLabel: new Date(nextTimestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isPrediction: true
    });
    
    return { 
      trendData: dataWithTrends, 
      predictions: generatedPredictions 
    };
  }, [data]);
  
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
  };
  
  const formatTrendDirection = (slope: number) => {
    if (Math.abs(slope) < 0.1) return 'Stable';
    return slope > 0 ? `↗ +${slope.toFixed(2)}/hour` : `↘ ${slope.toFixed(2)}/hour`;
  };
  
  return (
    <div className="space-y-6">
      {/* Trend Analysis Overview */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Brain className="h-4 w-4" />
            Trend Learning & Forecasting
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Linear Regression
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictions.map((prediction) => (
              <div key={prediction.metric} className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{prediction.metric}</span>
                  </div>
                  <Badge className={getConfidenceColor(prediction.confidence)}>
                    {prediction.confidence}
                  </Badge>
                </div>
                
                <div className="text-lg font-bold text-white mb-1">
                  {prediction.prediction.toFixed(prediction.metric === 'Response Time' ? 2 : 0)}
                  {prediction.metric === 'Response Time' ? 's' : ''}
                </div>
                
                <div className="text-xs text-white/70 mb-2">
                  Predicted for {prediction.timeframe}
                </div>
                
                <div className="text-xs text-white/60 mb-2">
                  Trend: {formatTrendDirection(prediction.slope)}
                  <br />
                  R²: {prediction.rSquared.toFixed(3)} (fit quality)
                </div>
                
                {prediction.warning && (
                  <div className="flex items-start gap-1 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-yellow-300">{prediction.warning}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Trend Visualization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume Trend */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <TrendingUp className="h-4 w-4" />
              Request Volume Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="rgba(255,255,255,0.7)" 
                  fontSize={10}
                />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="requestTrend" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <ReferenceLine 
                  x={trendData.length - 1} 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeDasharray="2 2" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Response Time Trend */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <TrendingUp className="h-4 w-4" />
              Response Time Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="rgba(255,255,255,0.7)" 
                  fontSize={10}
                />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="durationTrend" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <ReferenceLine 
                  x={trendData.length - 1} 
                  stroke="rgba(255,255,255,0.3)" 
                  strokeDasharray="2 2" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrendLearning;
