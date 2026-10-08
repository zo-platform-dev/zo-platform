import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const Monitoring = () => {
  const [stats, setStats] = useState({
    tasks: { total: 0, running: 0, completed: 0, failed: 0 },
    performance: { avgDuration: 0, successRate: 0 },
    resources: { browsers: 0, proxies: 0, queueSize: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/monitoring/stats`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">System Monitoring</h1>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tasks"
          value={stats.tasks.total}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Running"
          value={stats.tasks.running}
          icon="⚡"
          color="yellow"
        />
        <StatCard
          title="Completed"
          value={stats.tasks.completed}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Failed"
          value={stats.tasks.failed}
          icon="❌"
          color="red"
        />
      </div>

      {/* Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border-2 border-black p-6">
          <h2 className="text-xl font-bold mb-4">Performance</h2>
          <div className="space-y-4">
            <MetricRow
              label="Average Duration"
              value={`${stats.performance.avgDuration}s`}
            />
            <MetricRow
              label="Success Rate"
              value={`${stats.performance.successRate}%`}
            />
          </div>
        </div>

        <div className="bg-white border-2 border-black p-6">
          <h2 className="text-xl font-bold mb-4">Resources</h2>
          <div className="space-y-4">
            <MetricRow
              label="Active Browsers"
              value={stats.resources.browsers}
            />
            <MetricRow
              label="Active Proxies"
              value={stats.resources.proxies}
            />
            <MetricRow
              label="Queue Size"
              value={stats.resources.queueSize}
            />
          </div>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="text-center text-sm text-gray-600">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        Real-time monitoring (updates every 5s)
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'border-blue-500',
    yellow: 'border-yellow-500',
    green: 'border-green-500',
    red: 'border-red-500'
  };

  return (
    <div className={`bg-white border-2 ${colorClasses[color]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-700">{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

export default Monitoring;