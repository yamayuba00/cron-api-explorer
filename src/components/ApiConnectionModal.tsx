
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (url: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  currentUrl: string;
}

const ApiConnectionModal: React.FC<ApiConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  isConnected,
  currentUrl
}) => {
  const [apiUrl, setApiUrl] = useState(currentUrl || '');
  const { toast } = useToast();

  const handleConnect = () => {
    if (!apiUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API URL",
        variant: "destructive",
      });
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('api_url', apiUrl);
    onConnect(apiUrl);
    toast({
      title: "Connected",
      description: `Connected to: ${apiUrl}`,
    });
    onClose();
  };

  const handleDisconnect = () => {
    localStorage.removeItem('api_url');
    onDisconnect();
    toast({
      title: "Disconnected",
      description: "Switched back to mock data",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Connection Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API Endpoint URL</Label>
            <Input
              id="api-url"
              placeholder="https://api.example.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
          
          {isConnected && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Currently connected to: {currentUrl}
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
              <Button onClick={handleDisconnect} variant="outline" className="flex-1 flex items-center gap-2">
                <X className="h-4 w-4" />
                Disconnect
              </Button>
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
