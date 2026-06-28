import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  Printer, 
  FileSpreadsheet, 
  Award, 
  ArrowUpRight,
  TrendingUp as GainIcon,
  TrendingDown as LossIcon
} from 'lucide-react';
import { ReportData } from '../../types.js';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  List,
  ListItem,
  Chip
} from '@mui/material';

interface ReportsViewProps {
  reportType: 'daily' | 'weekly' | 'monthly';
  onSetReportType: (type: 'daily' | 'weekly' | 'monthly') => void;
  reportData: ReportData | null;
}

export default function ReportsView({
  reportType,
  onSetReportType,
  reportData
}: ReportsViewProps) {
  const { t } = useTranslation();

  if (!reportData) {
    return (
      <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid', borderColor: 'primary.main', borderTopColor: 'transparent', animation: 'spin 1s infinite', mb: 2, '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
          Aggregating comprehensive weights, please wait...
        </Typography>
      </Paper>
    );
  }

  const { summary, chartData, details } = reportData;

  // BUILD THE REPORT HISTOGRAM / AREA CHART
  const renderReportChart = () => {
    if (chartData.length === 0) return null;

    const margin = { top: 20, right: 25, bottom: 30, left: 45 };
    const width = 500;
    const hGraph = 180;

    const values = chartData.map(c => c.avgWeight);
    const maxVal = Math.max(...values, 100) * 1.05;
    const minVal = Math.min(...values, 0) * 0.95;
    const valRange = maxVal - minVal || 1;

    // Build bar/line coordinates
    const barWidth = ((width - margin.left - margin.right) / chartData.length) * 0.7;
    const spacing = ((width - margin.left - margin.right) / chartData.length) * 0.3;

    return (
      <Box sx={{ overflowX: 'auto', width: '100%', pt: 2 }}>
        <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full min-w-[400px]" style={{ maxHeight: '180px' }}>
          
          {/* Horizontal Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = margin.top + ratio * (hGraph - margin.top - margin.bottom);
            const val = Math.round(maxVal - ratio * valRange);
            return (
              <g key={ratio} className="opacity-30">
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="var(--border-ui)" strokeWidth="1" strokeDasharray="3 3"/>
                <text x={margin.left - 6} y={y + 3} className="fill-[var(--text-secondary)] text-[8px] font-mono" textAnchor="end" style={{ fill: 'currentColor' }}>{val} kg</text>
              </g>
            );
          })}

          {/* Render Bars for counts, and overlapping trend curve for weight */}
          {chartData.map((pt, idx) => {
            const x = margin.left + idx * ((width - margin.left - margin.right) / chartData.length);
            
            // Weight Line projection
            const yLine = hGraph - margin.bottom - ((pt.avgWeight - minVal) / valRange) * (hGraph - margin.top - margin.bottom);
            
            // Head count bar projection (on smaller ratio)
            const maxCount = Math.max(...chartData.map(c => c.count), 1);
            const barH = (pt.count / maxCount) * (hGraph - margin.top - margin.bottom) * 0.4;
            const yBar = hGraph - margin.bottom - barH;

            return (
              <g key={idx}>
                {/* Weighing Event counts (transparent structural columns) */}
                <rect 
                  x={x + spacing} 
                  y={yBar} 
                  width={barWidth} 
                  height={Math.max(barH, 0)} 
                  fill="var(--primary-brand)" 
                  opacity="0.15" 
                  rx="2"
                />

                {/* Draw connecting lines for weight curve of indexers */}
                {idx > 0 && (
                  <line
                    x1={margin.left + (idx - 1) * ((width - margin.left - margin.right) / chartData.length) + (barWidth / 2) + spacing}
                    y1={hGraph - margin.bottom - ((chartData[idx - 1].avgWeight - minVal) / valRange) * (hGraph - margin.top - margin.bottom)}
                    x2={x + (barWidth / 2) + spacing}
                    y2={yLine}
                    stroke="var(--primary-brand)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Little dot on each point node */}
                <circle 
                  cx={x + (barWidth / 2) + spacing} 
                  cy={yLine} 
                  r="3.5" 
                  fill="var(--bg-card)" 
                  stroke="var(--primary-brand)" 
                  strokeWidth="2" 
                />

                {/* X Axis labels */}
                <text 
                  x={x + (barWidth / 2) + spacing} 
                  y={hGraph - margin.bottom + 12} 
                  className="fill-[var(--text-secondary)] text-[7px] font-mono tracking-wider text-center" 
                  textAnchor="middle"
                  style={{ fill: 'currentColor' }}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}

        </svg>
      </Box>
    );
  };

  const handleDownloadReport = () => {
    alert("Compiling report statement... Download started successfully.");
    window.print();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }} className="px-6 w-full">
      
      {/* Header section & Print handles */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, sm: 'alignItems: center', justifyContent: 'space-between', gap: 2.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {t('reports.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Review detailed animal diagnostics, weight gains, and livestock performance matrices.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            onClick={handleDownloadReport}
            variant="outlined"
            color="error"
            startIcon={<Printer size={16} />}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 800, py: 1, px: 2, bgcolor: 'rgba(211,47,47,0.04)' }}
          >
            {t('reports.generatePDF')}
          </Button>
          
          <Button
            onClick={() => alert("Downloading spreadsheet statements...")}
            variant="outlined"
            color="success"
            startIcon={<FileSpreadsheet size={16} />}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', fontWeight: 800, py: 1, px: 2, bgcolor: 'rgba(46,125,50,0.04)' }}
          >
            {t('reports.generateExcel')}
          </Button>
        </Box>
      </Box>

      {/* Tabs Filter (Daily / Weekly / Monthly) */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 0.5, maxWidth: 360, width: '100%' }}>
        <Tabs 
          value={reportType} 
          onChange={(_, val) => onSetReportType(val)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              borderRadius: 3.5,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.75rem',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.contrastText',
                bgcolor: 'primary.main',
                boxShadow: '0 2px 8px rgba(46,125,50,0.2)'
              }
            },
            '& .MuiTabs-indicator': { display: 'none' }
          }}
        >
          <Tab value="daily" label={t('reports.dailyReport')} />
          <Tab value="weekly" label={t('reports.weeklyReport')} />
          <Tab value="monthly" label={t('reports.monthlyReport')} />
        </Tabs>
      </Box>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
        
        {/* Report Average weight */}
        <div className="w-full">
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', display: 'block' }}>
                {t('reports.averageWeight')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 950, color: 'text.primary', fontFamily: 'monospace' }}>
                  {summary.averageWeight.toFixed(1)}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {t('common.kg')}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem', fontWeight: 600 }}>
                Calculated over the active report set
              </Typography>
            </CardContent>
          </Card>
        </div>

        {/* Performance rates */}
        <div className="w-full">
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', display: 'block' }}>
                Weighed Performance Rates
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, my: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GainIcon size={16} /> {summary.cowsGainedRate}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem', fontWeight: 600 }}>Gained</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'error.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LossIcon size={16} /> {summary.cowsLostRate}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem', fontWeight: 600 }}>Lost</Typography>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem', fontWeight: 600 }}>
                Ratios of cows gaining vs losing weights
              </Typography>
            </CardContent>
          </Card>
        </div>

        {/* Leaders card */}
        <div className="w-full">
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                Leaderboard Metrics
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 0.5 }}>
                {summary.mostImproved ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.6875rem' }}>🥇 Most Improved:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>{summary.mostImproved.name} (+{summary.mostImproved.gain.toFixed(1)}kg)</Typography>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Pending log data</Typography>
                )}

                {summary.leastImproved && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.6875rem' }}>⚠️ Lowest Gainer:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>{summary.leastImproved.name} ({summary.leastImproved.gain.toFixed(1)}kg)</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Trajectory histogram & ledger details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full mt-4">
        
        {/* Histograms (Left 5 Columns) */}
        <div className="w-full flex flex-col">
          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justify: 'space-between', height: '100%' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.04em' }}>
                {reportType === 'daily' ? 'Daily Weigh Count & Averages' : reportType === 'weekly' ? 'Weekly Growth Curve' : 'Monthly Aggregated Trajectory'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Visualizes dynamic checks and count aggregates executed in the period.
              </Typography>
            </Box>

            {renderReportChart()}

            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem', pt: 2, borderTop: '1px solid', borderColor: 'divider', mt: 3, display: 'block', fontStyle: 'italic' }}>
              *Dotted columns represent event count, line represents average weights.
            </Typography>
          </Card>
        </div>

        {/* Registry Ledger (Right 7 Columns) */}
        <div className="w-full">
          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.04em', mb: 3 }}>
              {t('reports.performanceTable')}
            </Typography>

            <TableContainer sx={{ maxHeight: 295, overflowY: 'auto' }}>
              <Table sx={{ minWidth: 400 }} size="small">
                <TableHead sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', color: 'text.secondary', py: 1.5 }}>Cattle</TableCell>
                    <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', color: 'text.secondary', py: 1.5 }}>Breed</TableCell>
                    <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', color: 'text.secondary', py: 1.5 }}>Stable Weight</TableCell>
                    <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', color: 'text.secondary', py: 1.5 }}>ADG Ratio</TableCell>
                    <TableCell sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', color: 'text.secondary', py: 1.5, textAlign: 'right' }}>Net Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.map((row) => (
                    <TableRow key={row.cowId} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.primary' }}>{row.cowId}</Typography>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block', fontSize: '0.6875rem' }}>{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: '0.75rem' }}>{row.breed}</TableCell>
                      <TableCell sx={{ py: 1.5, fontWeight: 800, fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.primary' }}>
                        {row.currentWeight.toFixed(1)} {t('common.kg')}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        {row.adg > 0 ? (
                          <Chip 
                            label={`+${row.adg.toFixed(2)} ADG`} 
                            size="small" 
                            sx={{ fontSize: '0.5625rem', fontWeight: 900, bgcolor: 'rgba(76,175,80,0.08)', color: 'success.main', borderRadius: 1 }} 
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>No progress</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.5, textAlign: 'right', fontWeight: 800, fontSize: '0.75rem', fontFamily: 'monospace', color: row.gainFromPrev >= 0 ? 'success.main' : 'error.main' }}>
                        {row.gainFromPrev >= 0 ? `+${row.gainFromPrev.toFixed(1)} kg` : `${row.gainFromPrev.toFixed(1)} kg`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>

      </div>

    </Box>
  );
}
