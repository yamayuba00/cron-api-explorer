
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Save, X, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: ApiConfig) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  currentConfig: ApiConfig;
}

interface ApiConfig {
  baseUrl: string;
  endpoints: {
    transactionHistory: string;
    transactionDetail: string;
  };
  defaultParams: {
    limit: number;
    page: number;
  };
  headers: Record<string, string>;
}

const defaultConfig: ApiConfig = {
  baseUrl: '',
  endpoints: {
    transactionHistory: '/api/transaction-history',
    transactionDetail: '/api/transaction'
  },
  defaultParams: {
    limit: 20,
    page: 1
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const ApiConnectionModal: React.FC<ApiConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  isConnected,
  currentConfig
}) => {
  const [config, setConfig] = useState<ApiConfig>(currentConfig || defaultConfig);
  const [customHeaders, setCustomHeaders] = useState(
    Object.entries(config.headers || {}).map(([key, value]) => ({ key, value }))
  );
  const { toast } = useToast();

  const handleConnect = () => {
    if (!config.baseUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API Base URL",
        variant: "destructive",
      });
      return;
    }
    
    // Process custom headers
    const headers: Record<string, string> = {};
    customHeaders.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        headers[key.trim()] = value.trim();
      }
    });
    
    const finalConfig = {
      ...config,
      headers: { ...config.headers, ...headers }
    };
    
    // Save to localStorage
    localStorage.setItem('api_config', JSON.stringify(finalConfig));
    onConnect(finalConfig);
    toast({
      title: "Connected",
      description: `Connected to: ${finalConfig.baseUrl}`,
    });
    onClose();
  };

  const handleDisconnect = () => {
    localStorage.removeItem('api_config');
    onDisconnect();
    toast({
      title: "Disconnected",
      description: "API connection removed",
    });
    onClose();
  };

  const addHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL *</Label>
              <Input
                id="base-url"
                placeholder="https://api.example.com"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              />
            </div>
          </div>

          {/* Endpoints Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endpoints</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint-history">Transaction History</Label>
                <Input
                  id="endpoint-history"
                  placeholder="/api/transaction-history"
                  value={config.endpoints.transactionHistory}
                  onChange={(e) => setConfig({
                    ...config,
                    endpoints: { ...config.endpoints, transactionHistory: e.target.value }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endpoint-detail">Transaction Detail</Label>
                <Input
                  id="endpoint-detail"
                  placeholder="/api/transaction"
                  value={config.endpoints.transactionDetail}
                  onChange={(e) => setConfig({
                    ...config,
                    endpoints: { ...config.endpoints, transactionDetail: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Default Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Default Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-limit">Default Limit</Label>
                <Input
                  id="default-limit"
                  type="number"
                  min="1"
                  max="1000"
                  value={config.defaultParams.limit}
                  onChange={(e) => setConfig({
                    ...config,
                    defaultParams: { ...config.defaultParams, limit: parseInt(e.target.value) || 20 }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-page">Default Page</Label>
                <Input
                  id="default-page"
                  type="number"
                  min="1"
                  value={config.defaultParams.page}
                  onChange={(e) => setConfig({
                    ...config,
                    defaultParams: { ...config.defaultParams, page: parseInt(e.target.value) || 1 }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Custom Headers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Custom Headers</h3>
              <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                Add Header
              </Button>
            </div>
            
            <div className="space-y-2">
              {customHeaders.map((header, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Header Name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  />
                  <Input
                    placeholder="Header Value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeHeader(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          {isConnected && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Currently connected to: {currentConfig.baseUrl}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={handleConnect} className="flex-1 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Connect
              </Button>
            ) : (
              <>
                <Button onClick={handleConnect} className="flex-1 flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Update Config
                </Button>
                <Button onClick={handleDisconnect} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Disconnect
                </Button>
              </>
            )}
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiConnectionModal;
