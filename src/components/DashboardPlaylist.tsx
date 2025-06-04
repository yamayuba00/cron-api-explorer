
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Settings, Monitor, RotateCcw } from 'lucide-react';

interface PlaylistItem {
  id: string;
  name: string;
  tab: string;
  duration: number; // seconds
}

interface DashboardPlaylistProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  currentTab: string;
}

const DashboardPlaylist: React.FC<DashboardPlaylistProps> = ({
  isOpen,
  onClose,
  onTabChange,
  currentTab
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([
    { id: '1', name: 'Overview', tab: 'overview', duration: 30 },
    { id: '2', name: 'Monitoring', tab: 'monitoring', duration: 45 },
    { id: '3', name: 'Metrics', tab: 'metrics', duration: 30 },
    { id: '4', name: 'Performance', tab: 'performance', duration: 40 },
    { id: '5', name: 'Analytics', tab: 'analytics', duration: 35 },
    { id: '6', name: 'Logs', tab: 'logs', duration: 25 }
  ]);
  const [editingItem, setEditingItem] = useState<PlaylistItem | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next item
            const nextIndex = (currentIndex + 1) % playlist.length;
            setCurrentIndex(nextIndex);
            onTabChange(playlist[nextIndex].tab);
            return playlist[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining, currentIndex, playlist, onTabChange]);

  const startPlaylist = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (timeRemaining === 0) {
        setTimeRemaining(playlist[currentIndex].duration);
      }
      onTabChange(playlist[currentIndex].tab);
    }
  };

  const pausePlaylist = () => {
    setIsPlaying(false);
  };

  const stopPlaylist = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setTimeRemaining(0);
  };

  const jumpToItem = (index: number) => {
    setCurrentIndex(index);
    setTimeRemaining(playlist[index].duration);
    onTabChange(playlist[index].tab);
  };

  const updatePlaylistItem = (updatedItem: PlaylistItem) => {
    setPlaylist(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setEditingItem(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Dashboard TV Mode / Playlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Control Panel */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Playlist Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={startPlaylist}
                  disabled={isPlaying}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
                <Button
                  onClick={pausePlaylist}
                  disabled={!isPlaying}
                  variant="outline"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  onClick={stopPlaylist}
                  variant="outline"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>

                {isPlaying && (
                  <div className="flex items-center gap-2 ml-4">
                    <Badge className="bg-green-100 text-green-800 animate-pulse">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-ping"></div>
                      LIVE
                    </Badge>
                    <span className="text-sm font-mono">
                      Next in: {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Current: <strong>{playlist[currentIndex]?.name}</strong>
                {isPlaying && (
                  <span className="ml-2">
                    ({currentIndex + 1}/{playlist.length})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Playlist Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Playlist Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {playlist.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      index === currentIndex ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                    }`}
                    onClick={() => jumpToItem(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === currentIndex ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          Duration: {formatTime(item.duration)} • Tab: {item.tab}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index === currentIndex && isPlaying && (
                        <Badge className="bg-green-100 text-green-800">
                          <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                          Playing
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Item Dialog */}
          {editingItem && (
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Edit Playlist Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tab">Dashboard Tab</Label>
                    <Select
                      value={editingItem.tab}
                      onValueChange={(value) => setEditingItem({...editingItem, tab: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="monitoring">Monitoring</SelectItem>
                        <SelectItem value="metrics">Metrics</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="logs">Logs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={editingItem.duration}
                      onChange={(e) => setEditingItem({...editingItem, duration: parseInt(e.target.value) || 30})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updatePlaylistItem(editingItem)}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingItem(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardPlaylist;
