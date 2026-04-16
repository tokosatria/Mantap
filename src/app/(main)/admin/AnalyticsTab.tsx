'use client';

import { useEffect, useState } from 'react';
import { Eye, Users, Monitor, Smartphone, Tablet, Globe, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  deviceBreakdown: Record<string, number>;
  pageVisits: Record<string, number>;
  locationBreakdown: Record<string, number>;
  recentVisits: any[];
}

export default function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/track?period=${selectedPeriod}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="p-6 text-center">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="card">
        <div className="p-6 border-b border-[var(--border-color)]">
          <h3 className="font-display font-bold text-lg mb-4">Analytics Dashboard</h3>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'today', label: 'Hari Ini' },
              { value: 'week', label: 'Minggu Ini' },
              { value: 'month', label: 'Bulan Ini' },
              { value: 'all', label: 'Semua' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === option.value
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {analyticsData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Page Views"
              value={analyticsData.pageViews}
              icon={Eye}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
              subtitle="Total halaman dilihat"
            />
            <StatCard
              title="Unique Visitors"
              value={analyticsData.uniqueVisitors}
              icon={Users}
              color="text-green-500"
              bgColor="bg-green-500/10"
              subtitle="Pengunjung unik"
            />
            <StatCard
              title="Most Popular Page"
              value={Object.keys(analyticsData.pageVisits)[0] || '-'}
              icon={TrendingUp}
              color="text-purple-500"
              bgColor="bg-purple-500/10"
              subtitle={`${
                Object.values(analyticsData.pageVisits)[0] || 0
              } kunjungan`}
            />
            <StatCard
              title="Device Breakdown"
              value={Object.keys(analyticsData.deviceBreakdown).length}
              icon={Monitor}
              color="text-orange-500"
              bgColor="bg-orange-500/10"
              subtitle="Jenis perangkat"
            />
          </div>

          {/* Device Breakdown */}
          <div className="card">
            <div className="p-6 border-b border-[var(--border-color)]">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Device Breakdown
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(analyticsData.deviceBreakdown).map(([device, count]) => {
                  const DeviceIcon = getDeviceIcon(device);
                  const percentage = ((count / analyticsData.pageViews) * 100).toFixed(1);
                  return (
                    <div
                      key={device}
                      className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)]"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <DeviceIcon className="w-6 h-6 text-[var(--text-primary)]" />
                        <div>
                          <div className="font-semibold capitalize">{device}</div>
                          <div className="text-sm text-[var(--text-muted)]">{percentage}%</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-[var(--text-muted)]">Page Views</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Page Visits Breakdown */}
          <div className="card">
            <div className="p-6 border-b border-[var(--border-color)]">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Page Visits Breakdown
              </h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Halaman</th>
                      <th>Jumlah Kunjungan</th>
                      <th>Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analyticsData.pageVisits)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([page, count]) => {
                        const percentage = ((count / analyticsData.pageViews) * 100).toFixed(1);
                        return (
                          <tr key={page}>
                            <td className="font-mono text-sm">{page}</td>
                            <td className="font-semibold">{count}</td>
                            <td>{percentage}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Location Breakdown */}
          {analyticsData.locationBreakdown && Object.keys(analyticsData.locationBreakdown).length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-[var(--border-color)]">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Location Breakdown
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analyticsData.locationBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 9)
                    .map(([location, count]) => (
                      <div
                        key={location}
                        className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)]"
                      >
                        <div className="font-semibold mb-1">{location}</div>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-[var(--text-muted)]">Visits</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Visits */}
          <div className="card">
            <div className="p-6 border-b border-[var(--border-color)]">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Recent Visits (50 Terakhir)
              </h3>
            </div>
            <div className="p-6 overflow-x-auto max-h-96 overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Halaman</th>
                    <th>Device</th>
                    <th>Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.recentVisits.map((visit: any, idx: number) => (
                    <tr key={idx}>
                      <td className="text-sm text-[var(--text-muted)]">
                        {new Date(visit.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="font-mono text-sm">{visit.pagePath}</td>
                      <td className="capitalize">{visit.deviceType}</td>
                      <td>{visit.city ? `${visit.city}, ${visit.country || ''}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  subtitle,
}: any) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <span className={`text-xs font-medium ${color}`}>{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</div>
    </div>
  );
}
