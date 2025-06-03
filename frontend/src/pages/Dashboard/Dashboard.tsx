
import React, { memo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchDashboardData } from '@/store/slices/dashboardSlice';
import MetricCard from '@/components/molecules/MetricCard/MetricCard';
import Card from '@/components/atoms/Card/Card';
import Button from '@/components/atoms/Button/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import './Dashboard.scss';

const Dashboard: React.FC = memo(() => {
  const dispatch = useDispatch();
  const { metrics, loading } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const mockChartData = [
    { name: 'Test 1', responseTime: 120, requests: 1000 },
    { name: 'Test 2', responseTime: 150, requests: 1200 },
    { name: 'Test 3', responseTime: 90, requests: 800 },
    { name: 'Test 4', responseTime: 200, requests: 1500 },
  ];

  const mockPieData = [
    { name: 'Success', value: 95, color: '#10b981' },
    { name: 'Failed', value: 5, color: '#ef4444' },
  ];

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'danger';
      default: return 'primary';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '📊';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Performance Dashboard</h1>
        <Button variant="primary">
          Open Detailed PDF Report
        </Button>
      </div>

      <div className="dashboard__metrics">
        <MetricCard
          title="Overall Health"
          value={metrics.healthStatus}
          icon={getHealthStatusIcon(metrics.healthStatus)}
          color={getHealthStatusColor(metrics.healthStatus)}
          loading={loading}
        />
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          icon="📈"
          color="primary"
          loading={loading}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.avgResponseTime.toFixed(2)} ms`}
          icon="⏱️"
          color="primary"
          loading={loading}
        />
        <MetricCard
          title="Error Rate"
          value={`${(metrics.errorRate * 100).toFixed(3)}%`}
          icon="⚠️"
          color={metrics.errorRate > 0.05 ? 'danger' : 'success'}
          loading={loading}
        />
      </div>

      <div className="dashboard__section">
        <Card>
          <h2 className="dashboard__section-title">Selected Test Run Analysis</h2>
          <div className="dashboard__test-analysis">
            <div className="dashboard__test-info">
              <p><strong>Last Test:</strong> Sequential Run - 02.06.2025, 17:30:23</p>
              <p><strong>Tests Executed:</strong> contractors_test, invoice_test</p>
              <p><strong>Status:</strong> <span className="dashboard__status dashboard__status--success">Completed</span></p>
            </div>
            <div className="dashboard__test-actions">
              <Button variant="secondary" size="small">
                View Detailed Report
              </Button>
              <Button variant="primary" size="small">
                Generate PDF Report
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard__charts">
        <Card className="dashboard__chart">
          <h3 className="dashboard__chart-title">Response Time Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="responseTime" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard__chart">
          <h3 className="dashboard__chart-title">Request Volume by Test</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requests" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard__chart">
          <h3 className="dashboard__chart-title">Performance Metrics Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="dashboard__chart">
          <h3 className="dashboard__chart-title">Success vs Error Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {mockPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="dashboard__summary">
        <Card>
          <h2 className="dashboard__section-title">Performance Summary</h2>
          <div className="dashboard__summary-table">
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Requests</th>
                  <th>Avg Response</th>
                  <th>Max Response</th>
                  <th>Error Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>contractors_test</td>
                  <td>5761</td>
                  <td>25.57 ms</td>
                  <td>208.81 ms</td>
                  <td>0.00%</td>
                  <td><span className="dashboard__status dashboard__status--success">PASS</span></td>
                </tr>
                <tr>
                  <td>invoice_test</td>
                  <td>3240</td>
                  <td>31.24 ms</td>
                  <td>156.32 ms</td>
                  <td>0.00%</td>
                  <td><span className="dashboard__status dashboard__status--success">PASS</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="dashboard__actions">
            <Button variant="primary">
              Run New Tests
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
