
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Activity, BarChart3, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Cronjob Monitoring
            <span className="text-blue-600"> Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Monitor dan analisis real-time untuk history data API dan cronjob dengan 
            visualisasi yang komprehensif dan detail transaksi yang mendalam
          </p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
          >
            Buka Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Fitur Utama</h2>
          <p className="text-gray-600 text-lg">
            Monitoring yang lengkap dengan berbagai tools analisis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Database className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Real-time Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitoring data API dan cronjob secara real-time dengan update otomatis
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Analytics & Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Visualisasi data dengan charts interaktif untuk analisis trend dan performa
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Activity className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Performance Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Pantau performa dengan tracking duration time dan status response
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-xl">Detailed Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Detail log transaksi dengan JSON viewer dan filtering advanced
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Database Schema Info */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Database Schema Support
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  h_cronjob Table Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`CREATE TABLE [dbo].[h_cronjob] (
    [Id]               INT            IDENTITY (1, 1) NOT NULL,
    [feature]          VARCHAR (100)  NULL,
    [endpoint]         VARCHAR (255)  NULL,
    [method]           VARCHAR (20)   NULL,
    [desc_transaction] NVARCHAR (MAX) NULL,
    [status]           VARCHAR (50)   NULL,
    [ip]               VARCHAR (100)  NULL,
    [user_agent]       VARCHAR (100)  NULL,
    [duration_time]    FLOAT (53)     NULL,
    [created_at]       DATETIME       NOT NULL,
    CONSTRAINT [PK_h_cronjob] PRIMARY KEY CLUSTERED ([Id] ASC)
);`}</pre>
                </div>
                <p className="text-gray-600 mt-4">
                  Dashboard ini support full untuk structure database h_cronjob dengan 
                  parsing JSON untuk desc_transaction dan visualisasi yang comprehensive.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap untuk Monitoring yang Lebih Baik?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Mulai monitoring cronjob Anda dengan dashboard yang powerful dan intuitive
          </p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            size="lg" 
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
          >
            Mulai Sekarang
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
