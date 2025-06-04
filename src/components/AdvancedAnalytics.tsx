
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart, Cell } from 'recharts';
import { TrendingUp, BarChart3, Activity, Target, Clock } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface AdvancedAnalyticsProps {
  data: CronjobData[];
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ data }) => {
  const analytics = useMemo(() => {
    if (data.length === 0) return null;

    // Moving Average calculation (7-point)
    const sortedData = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const movingAverage = sortedData.map((item, index) => {
      const windowSize = Math.min(7, index + 1);
      const windowStart = Math.max(0, index - windowSize + 1);
      const window = sortedData.slice(windowStart, index + 1);
      const avgDuration = window.reduce((sum, w) => sum + parseFloat(w.duration_time), 0) / window.length;
      
      return {
        time: new Date(item.created_at).toLocaleTimeString(),
        duration: parseFloat(item.duration_time),
        movingAvg: avgDuration,
        timestamp: new Date(item.created_at).getTime()
      };
    });

    // Percentile calculations
    const durations = data.map(item => parseFloat(item.duration_time)).sort((a, b) => a - b);
    const percentiles = {
      p50: durations[Math.floor(durations.length * 0.5)],
      p90: durations[Math.floor(durations.length * 0.9)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };

    // Histogram data (response time buckets)
    const buckets = [
      { range: '0-1s', min: 0, max: 1, count: 0, color: '#10B981' },
      { range: '1-2s', min: 1, max: 2, count: 0, color: '#3B82F6' },
      { range: '2-5s', min: 2, max: 5, count: 0, color: '#F59E0B' },
      { range: '5-10s', min: 5, max: 10, count: 0, color: '#EF4444' },
      { range: '10s+', min: 10, max: Infinity, count: 0, color: '#7C2D12' }
    ];

    durations.forEach(duration => {
      const bucket = buckets.find(b => duration >= b.min && duration < b.max);
      if (bucket) bucket.count++;
    });

    // Hourly aggregation with statistics
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourData = data.filter(item => new Date(item.created_at).getHours() === hour);
      const hourDurations = hourData.map(item => parseFloat(item.duration_time));
      
      return {
        hour: `${hour}:00`,
        requests: hourData.length,
        avgDuration: hourDurations.length > 0 ? hourDurations.reduce((a, b) => a + b, 0) / hourDurations.length : 0,
        minDuration: hourDurations.length > 0 ? Math.min(...hourDurations) : 0,
        maxDuration: hourDurations.length > 0 ? Math.max(...hourDurations) : 0,
        errors: hourData.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length
      };
    });

    // Throughput analysis (requests per minute over time)
    const throughputData = sortedData.reduce((acc, item, index) => {
      const minute = Math.floor(new Date(item.created_at).getTime() / (1000 * 60));
      const existing = acc.find(a => a.minute === minute);
      
      if (existing) {
        existing.requests++;
        existing.errors += ['400', '404', '500', '502', '503'].includes(item.status) ? 1 : 0;
      } else {
        acc.push({
          minute,
          time: new Date(minute * 60 * 1000).toLocaleTimeString(),
          requests: 1,
          errors: ['400', '404', '500', '502', '503'].includes(item.status) ? 1 : 0
        });
      }
      
      return acc;
    }, [] as any[]).slice(-50);

    return {
      movingAverage: movingAverage.slice(-50),
      percentiles,
      histogram: buckets,
      hourlyStats,
      throughputData,
      totalRequests: data.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length
    };
  }, [data]);

  if (!analytics) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-8 text-center text-white/70">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available for advanced analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Percentile Overview */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Target className="h-4 w-4" />
            Response Time Percentiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 p-3 rounded-lg text-center">
              <div className="text-sm text-white/70">P50 (Median)</div>
              <div className="text-xl font-bold text-blue-400">{analytics.percentiles.p50.toFixed(2)}s</div>
            </div>
            <div className="bg-white/10 p-3 rounded-lg text-center">
              <div className="text-sm text-white/70">P90</div>
              <div className="text-xl font-bold text-green-400">{analytics.percentiles.p90.toFixed(2)}s</div>
            </div>
            <div className="bg-white/10 p-3 rounded-lg text-center">
              <div className="text-sm text-white/70">P95</div>
              <div className="text-xl font-bold text-yellow-400">{analytics.percentiles.p95.toFixed(2)}s</div>
            </div>
            <div className="bg-white/10 p-3 rounded-lg text-center">
              <div className="text-sm text-white/70">P99</div>
              <div className="text-xl font-bold text-red-400">{analytics.percentiles.p99.toFixed(2)}s</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moving Average Chart */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <TrendingUp className="h-4 w-4" />
              Response Time Moving Average
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={analytics.movingAverage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={10} />
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
                  dataKey="duration" 
                  stroke="#94A3B8" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 2"
                />
                <Line 
                  type="monotone" 
                  dataKey="movingAvg" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Histogram */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <BarChart3 className="h-4 w-4" />
              Response Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.histogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.7)" fontSize={10} />
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
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {analytics.histogram.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Throughput Over Time */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <Activity className="h-4 w-4" />
              Throughput Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={analytics.throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={10} />
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
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Performance */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <Clock className="h-4 w-4" />
              24-Hour Performance Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={analytics.hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.7)" fontSize={10} />
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
                <Bar dataKey="requests" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <TrendingUp className="h-4 w-4" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-sm text-white/70">Peak Hour</div>
              <div className="text-lg font-bold text-yellow-400">
                {analytics.hourlyStats.reduce((max, hour) => hour.requests > max.requests ? hour : max).hour}
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-sm text-white/70">Fastest Response</div>
              <div className="text-lg font-bold text-green-400">
                {Math.min(...data.map(item => parseFloat(item.duration_time))).toFixed(2)}s
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="text-sm text-white/70">Slowest Response</div>
              <div className="text-lg font-bold text-red-400">
                {Math.max(...data.map(item => parseFloat(item.duration_time))).toFixed(2)}s
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {analytics.histogram.filter(bucket => bucket.count > 0).map((bucket) => (
              <Badge key={bucket.range} className="bg-white/10 text-white border-white/30">
                {bucket.range}: {bucket.count} requests
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
