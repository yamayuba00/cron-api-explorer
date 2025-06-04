
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingDown, Globe, Zap, AlertCircle } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface SmartFiltersProps {
  data: CronjobData[];
  onApplyFilter: (filterType: string, value: string) => void;
  currentFilters: {
    statusFilter: string;
    featureFilter: string;
    methodFilter: string;
  };
}

const SmartFilters: React.FC<SmartFiltersProps> = ({ data, onApplyFilter, currentFilters }) => {
  const suggestions = useMemo(() => {
    if (data.length === 0) return null;

    // IPs with high error rates
    const ipErrorRates = [...new Set(data.map(item => item.ip))].map(ip => {
      const ipData = data.filter(item => item.ip === ip);
      const errorCount = ipData.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
      const errorRate = ipData.length > 0 ? (errorCount / ipData.length) * 100 : 0;
      
      return {
        ip,
        requests: ipData.length,
        errors: errorCount,
        errorRate,
        avgDuration: ipData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / ipData.length
      };
    }).sort((a, b) => b.errorRate - a.errorRate);

    // Popular endpoints
    const endpointStats = [...new Set(data.map(item => item.endpoint))].map(endpoint => {
      const endpointData = data.filter(item => item.endpoint === endpoint);
      const errorCount = endpointData.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
      
      return {
        endpoint,
        requests: endpointData.length,
        errors: errorCount,
        errorRate: endpointData.length > 0 ? (errorCount / endpointData.length) * 100 : 0,
        avgDuration: endpointData.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / endpointData.length
      };
    }).sort((a, b) => b.requests - a.requests);

    // Features with most 500 errors
    const featureErrors = [...new Set(data.map(item => item.feature))].map(feature => {
      const featureData = data.filter(item => item.feature === feature);
      const serverErrors = featureData.filter(item => ['500', '502', '503'].includes(item.status)).length;
      
      return {
        feature,
        requests: featureData.length,
        serverErrors,
        errorRate: featureData.length > 0 ? (serverErrors / featureData.length) * 100 : 0
      };
    }).sort((a, b) => b.serverErrors - a.serverErrors);

    // Slow response patterns
    const slowEndpoints = endpointStats
      .filter(endpoint => endpoint.avgDuration > 3)
      .sort((a, b) => b.avgDuration - a.avgDuration);

    // Recent error patterns (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = data
      .filter(item => new Date(item.created_at) > oneHourAgo && ['400', '404', '500', '502', '503'].includes(item.status))
      .reduce((acc, item) => {
        const key = `${item.status}-${item.feature}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      problematicIPs: ipErrorRates.filter(ip => ip.errorRate > 10 && ip.requests > 5).slice(0, 5),
      popularEndpoints: endpointStats.slice(0, 5),
      errorProneFeatures: featureErrors.filter(f => f.serverErrors > 0).slice(0, 5),
      slowEndpoints: slowEndpoints.slice(0, 3),
      recentErrorPatterns: Object.entries(recentErrors)
        .map(([key, count]) => {
          const [status, feature] = key.split('-');
          return { status, feature, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    };
  }, [data]);

  if (!suggestions) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-8 text-center text-white/70">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available for smart filter suggestions</p>
        </CardContent>
      </Card>
    );
  }

  const SuggestionCard = ({ 
    title, 
    icon: Icon, 
    items, 
    onItemClick, 
    renderItem 
  }: {
    title: string;
    icon: any;
    items: any[];
    onItemClick: (item: any) => void;
    renderItem: (item: any) => React.ReactNode;
  }) => (
    <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-white/50">No issues found</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => onItemClick(item)}
            >
              {renderItem(item)}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Lightbulb className="h-4 w-4" />
            Smart Filter Suggestions
            <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Problematic IPs */}
            <SuggestionCard
              title="High Error IPs"
              icon={AlertCircle}
              items={suggestions.problematicIPs}
              onItemClick={(item) => {
                // In a real implementation, you'd filter by IP
                console.log('Filter by IP:', item.ip);
              }}
              renderItem={(item) => (
                <div className="text-xs">
                  <div className="font-medium text-red-300 truncate">{item.ip}</div>
                  <div className="text-white/70">
                    {item.errorRate.toFixed(1)}% errors ({item.errors}/{item.requests})
                  </div>
                </div>
              )}
            />

            {/* Popular Endpoints */}
            <SuggestionCard
              title="Popular Endpoints"
              icon={Globe}
              items={suggestions.popularEndpoints}
              onItemClick={(item) => {
                console.log('Filter by endpoint:', item.endpoint);
              }}
              renderItem={(item) => (
                <div className="text-xs">
                  <div className="font-medium text-blue-300 truncate">{item.endpoint}</div>
                  <div className="text-white/70">
                    {item.requests} requests • {item.errorRate.toFixed(1)}% errors
                  </div>
                </div>
              )}
            />

            {/* Error-prone Features */}
            <SuggestionCard
              title="Features with 5xx Errors"
              icon={TrendingDown}
              items={suggestions.errorProneFeatures}
              onItemClick={(item) => onApplyFilter('feature', item.feature)}
              renderItem={(item) => (
                <div className="text-xs">
                  <div className="font-medium text-orange-300">{item.feature}</div>
                  <div className="text-white/70">
                    {item.serverErrors} server errors ({item.errorRate.toFixed(1)}%)
                  </div>
                </div>
              )}
            />

            {/* Slow Endpoints */}
            <SuggestionCard
              title="Slow Responses"
              icon={Zap}
              items={suggestions.slowEndpoints}
              onItemClick={(item) => {
                console.log('Filter slow endpoint:', item.endpoint);
              }}
              renderItem={(item) => (
                <div className="text-xs">
                  <div className="font-medium text-yellow-300 truncate">{item.endpoint}</div>
                  <div className="text-white/70">
                    Avg: {item.avgDuration.toFixed(2)}s
                  </div>
                </div>
              )}
            />
          </div>

          {/* Recent Error Patterns */}
          {suggestions.recentErrorPatterns.length > 0 && (
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <AlertCircle className="h-4 w-4" />
                  Recent Error Patterns (Last Hour)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {suggestions.recentErrorPatterns.map((pattern, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                      onClick={() => {
                        onApplyFilter('status', pattern.status);
                        onApplyFilter('feature', pattern.feature);
                      }}
                    >
                      {pattern.status} in {pattern.feature} ({pattern.count}x)
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-300 hover:bg-red-500/20"
              onClick={() => onApplyFilter('status', '500')}
            >
              Show 500 Errors
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
              onClick={() => onApplyFilter('status', '404')}
            >
              Show 404 Errors
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/30 text-green-300 hover:bg-green-500/20"
              onClick={() => onApplyFilter('status', '200')}
            >
              Show Success Only
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartFilters;
