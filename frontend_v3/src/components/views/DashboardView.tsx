import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MoreVertical,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { DashboardStats, RecentActivity } from '../../types';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Select,
  MenuItem,
  Divider,
  useTheme
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface DashboardViewProps {
  stats: DashboardStats | null;
  liveWeight: { weight: number; stable: boolean; deviceId: string };
  onNavigateToTab: (tab: string) => void;
  onSelectCow: (cowId: string) => void;
}

const StatCard = ({ title, value, subtitle, trend, trendPositive }: any) => (
  <Card sx={{ 
    height: '100%', 
    borderRadius: '24px', 
    border: 'none', 
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    bgcolor: 'background.paper',
    display: 'flex',
    flexDirection: 'column'
  }}>
    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {title}
        </Typography>
        <IconButton size="small" sx={{ color: 'text.disabled', padding: 0 }}>
          <MoreVertical size={16} />
        </IconButton>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, letterSpacing: '-0.02em' }}>
        {value}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {trend && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            px: 1, 
            py: 0.25, 
            borderRadius: 1, 
            bgcolor: trendPositive ? 'success.light' : 'error.light',
            color: trendPositive ? 'success.dark' : 'error.dark'
          }}>
            {trendPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </Box>
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {subtitle}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const ResizeHandle = () => (
  <PanelResizeHandle style={{ width: '16px', position: 'relative', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'col-resize' }}>
    <Box sx={{ width: '4px', height: '40px', bgcolor: 'divider', borderRadius: '4px', transition: 'background-color 0.2s', '&:hover': { bgcolor: 'primary.main' } }} />
  </PanelResizeHandle>
);

export default function DashboardView({
  stats,
  liveWeight,
  onNavigateToTab,
  onSelectCow
}: DashboardViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (!stats) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 12 } }
      },
      y: {
        grid: { color: theme.palette.divider, drawBorder: false, borderDash: [5, 5] },
        ticks: { 
          color: '#9CA3AF', 
          font: { family: 'Inter', size: 12 },
          callback: (value: any) => value + ' kg'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        fill: true,
        label: 'Average Weight',
        data: [450, 460, 455, 480, 510, 490, 520, 530, 525, 540, 510, 550],
        borderColor: '#1E4A40',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(30, 74, 64, 0.2)');
          gradient.addColorStop(1, 'rgba(30, 74, 64, 0)');
          return gradient;
        },
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: theme.palette.background.paper,
        pointBorderColor: theme.palette.primary.main,
        pointBorderWidth: 2,
      },
      {
        fill: false,
        label: 'Target Weight',
        data: [420, 440, 450, 460, 470, 480, 490, 500, 510, 520, 530, 540],
        borderColor: '#EA4335',
        tension: 0.4,
        pointRadius: 0,
        borderDash: [5, 5],
      }
    ],
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Owner Dashboard
        </Typography>
      </Box>

      {/* Two Column Layout: Stats (Left) & Chart (Right) */}
      <Box sx={{ height: { xs: 'auto', md: 450 } }}>
        <PanelGroup direction="horizontal">
          {/* Left Side: 4 Boxes */}
          <Panel defaultSize={40} minSize={30} maxSize={60}>
            <div className="flex flex-col xl:grid xl:grid-cols-2 gap-3 p-4 min-w-0 overflow-hidden h-full">
              <StatCard 
                title="Total Herd" 
                value={stats.totalCows} 
                trend="4%" 
                trendPositive={true}
                subtitle="vs last month" 
              />
              <StatCard 
                title="Avg. Weight" 
                value={`${stats.averageWeight} kg`} 
                subtitle="Current active herd" 
              />
              <StatCard 
                title="Heaviest" 
                value={`${stats.heaviestCow?.weight || 0} kg`} 
                subtitle={`Tag: ${stats.heaviestCow?.name || 'N/A'}`} 
              />
              <StatCard 
                title="Live Units" 
                value={stats.onlineDevices} 
                subtitle="Active scale units" 
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-transparent hover:bg-gray-300 transition-colors cursor-col-resize" />

          {/* Right Side: Chart Section */}
          <Panel defaultSize={60} minSize={40} maxSize={70}>
            <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      Herd Weight Trend
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Overview of total herd weight growth over a period.
                    </Typography>
                  </Box>
                  <Select
                    size="small"
                    value="2025"
                    sx={{ 
                      borderRadius: 2, 
                      bgcolor: 'background.paper', 
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' }
                    }}
                  >
                    <MenuItem value="2025">Year 2025</MenuItem>
                    <MenuItem value="2024">Year 2024</MenuItem>
                  </Select>
                </Box>
                <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
                  <Line options={chartOptions} data={chartData} />
                </Box>
              </CardContent>
            </Card>
          </Panel>
        </PanelGroup>
      </Box>

      {/* Recent Ledger */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
          Last Weigh-ins
        </Typography>
        <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', bgcolor: 'background.paper' }}>
          <TableContainer>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid #F3F4F6', py: 2.5 }}>Cattle Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid #F3F4F6', py: 2.5 }}>Tag ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid #F3F4F6', py: 2.5 }}>Weight</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid #F3F4F6', py: 2.5 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', borderBottom: '1px solid #F3F4F6', py: 2.5 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentActivity.map((act: RecentActivity) => (
                  <TableRow 
                    key={act.id} 
                    hover
                    sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                    onClick={() => onSelectCow(act.cowId)}
                  >
                    <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6', fontWeight: 500, color: 'text.primary' }}>
                      {act.cowName}
                    </TableCell>
                    <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6', color: 'text.secondary' }}>
                      {act.cowId}
                    </TableCell>
                    <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6', fontWeight: 600, color: 'text.primary' }}>
                      {act.weight.toFixed(1)} kg
                    </TableCell>
                    <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6', color: 'text.secondary' }}>
                      {new Date(act.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Recorded
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {stats.recentActivity.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                      No recent weigh-ins found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
