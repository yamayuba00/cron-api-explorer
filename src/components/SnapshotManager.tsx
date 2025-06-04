
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, Download, Share2, FileText, Calendar, Eye } from 'lucide-react';
import { CronjobData } from '@/utils/apiClient';

interface SnapshotData {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  data: CronjobData[];
  metrics: {
    totalRequests: number;
    successRate: number;
    errorRate: number;
    avgDuration: number;
    uniqueIPs: number;
    uniqueFeatures: number;
  };
  filters: {
    timeRange: string;
    statusFilter: string;
    featureFilter: string;
    methodFilter: string;
  };
}

interface SnapshotManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: CronjobData[];
  currentFilters: {
    timeRange: string;
    statusFilter: string;
    featureFilter: string;
    methodFilter: string;
  };
}

const SnapshotManager: React.FC<SnapshotManagerProps> = ({
  isOpen,
  onClose,
  currentData,
  currentFilters
}) => {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>(() => {
    const saved = localStorage.getItem('dashboard_snapshots');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newSnapshot, setNewSnapshot] = useState({
    name: '',
    description: ''
  });
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotData | null>(null);

  const calculateMetrics = (data: CronjobData[]) => {
    const totalRequests = data.length;
    const successCount = data.filter(item => ['200', '201'].includes(item.status)).length;
    const errorCount = data.filter(item => ['400', '404', '500', '502', '503'].includes(item.status)).length;
    const avgDuration = data.length > 0 ? 
      data.reduce((sum, item) => sum + parseFloat(item.duration_time), 0) / data.length : 0;
    const uniqueIPs = new Set(data.map(item => item.ip)).size;
    const uniqueFeatures = new Set(data.map(item => item.feature)).size;

    return {
      totalRequests,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      avgDuration,
      uniqueIPs,
      uniqueFeatures
    };
  };

  const createSnapshot = () => {
    const snapshot: SnapshotData = {
      id: Date.now().toString(),
      name: newSnapshot.name || `Snapshot ${new Date().toLocaleString()}`,
      description: newSnapshot.description,
      timestamp: new Date().toISOString(),
      data: currentData,
      metrics: calculateMetrics(currentData),
      filters: currentFilters
    };

    const updatedSnapshots = [...snapshots, snapshot];
    setSnapshots(updatedSnapshots);
    localStorage.setItem('dashboard_snapshots', JSON.stringify(updatedSnapshots));
    
    setIsCreating(false);
    setNewSnapshot({ name: '', description: '' });
  };

  const deleteSnapshot = (id: string) => {
    const updatedSnapshots = snapshots.filter(s => s.id !== id);
    setSnapshots(updatedSnapshots);
    localStorage.setItem('dashboard_snapshots', JSON.stringify(updatedSnapshots));
  };

  const exportSnapshot = (snapshot: SnapshotData) => {
    const dataStr = JSON.stringify(snapshot, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-snapshot-${snapshot.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareSnapshot = async (snapshot: SnapshotData) => {
    const shareData = {
      title: `Dashboard Snapshot: ${snapshot.name}`,
      text: `Monitoring snapshot from ${new Date(snapshot.timestamp).toLocaleString()}\n\nMetrics:\n- Total Requests: ${snapshot.metrics.totalRequests}\n- Success Rate: ${snapshot.metrics.successRate.toFixed(1)}%\n- Error Rate: ${snapshot.metrics.errorRate.toFixed(1)}%\n- Avg Duration: ${snapshot.metrics.avgDuration.toFixed(2)}s`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Dashboard Snapshots & Reports
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Snapshot */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Create New Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="font-medium text-blue-600">Current Data</div>
                  <div>{currentData.length} records</div>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="font-medium text-green-600">Success Rate</div>
                  <div>{calculateMetrics(currentData).successRate.toFixed(1)}%</div>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="font-medium text-orange-600">Avg Duration</div>
                  <div>{calculateMetrics(currentData).avgDuration.toFixed(2)}s</div>
                </div>
              </div>
              
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture Current State
              </Button>
            </CardContent>
          </Card>

          {/* Snapshots List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Saved Snapshots
                </span>
                <Badge variant="outline">{snapshots.length} snapshots</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No snapshots yet. Create your first snapshot above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{snapshot.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {snapshot.description}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(snapshot.timestamp).toLocaleString()}
                            </span>
                            <span>{snapshot.metrics.totalRequests} records</span>
                            <span className="text-green-600">
                              {snapshot.metrics.successRate.toFixed(1)}% success
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSnapshot(snapshot)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareSnapshot(snapshot)}
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportSnapshot(snapshot)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSnapshot(snapshot.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Snapshot Dialog */}
          {isCreating && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Create Dashboard Snapshot</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="snapshot-name">Snapshot Name</Label>
                    <Input
                      id="snapshot-name"
                      value={newSnapshot.name}
                      onChange={(e) => setNewSnapshot({...newSnapshot, name: e.target.value})}
                      placeholder="e.g., Morning Peak Analysis"
                    />
                  </div>
                  <div>
                    <Label htmlFor="snapshot-desc">Description</Label>
                    <Textarea
                      id="snapshot-desc"
                      value={newSnapshot.description}
                      onChange={(e) => setNewSnapshot({...newSnapshot, description: e.target.value})}
                      placeholder="Brief description of this snapshot..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createSnapshot}>
                      Create Snapshot
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* View Snapshot Dialog */}
          {selectedSnapshot && (
            <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
              <DialogContent className="max-w-4xl bg-white">
                <DialogHeader>
                  <DialogTitle>{selectedSnapshot.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {selectedSnapshot.description}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-600">Total Requests</div>
                      <div className="text-xl font-bold">{selectedSnapshot.metrics.totalRequests}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-green-600">Success Rate</div>
                      <div className="text-xl font-bold">{selectedSnapshot.metrics.successRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="font-medium text-red-600">Error Rate</div>
                      <div className="text-xl font-bold">{selectedSnapshot.metrics.errorRate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="font-medium text-orange-600">Avg Duration</div>
                      <div className="text-xl font-bold">{selectedSnapshot.metrics.avgDuration.toFixed(2)}s</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-medium text-purple-600">Unique IPs</div>
                      <div className="text-xl font-bold">{selectedSnapshot.metrics.uniqueIPs}</div>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="font-medium text-indigo-600">Features</div>
                      <div className="text-xl font-bold">{selectedSnapshot.metrics.uniqueFeatures}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Captured: {new Date(selectedSnapshot.timestamp).toLocaleString()}
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

export default SnapshotManager;
