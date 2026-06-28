import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  Award, 
  HelpCircle, 
  TrendingUp, 
  AlertOctagon, 
  ChevronRight, 
  Layers, 
  LineChart,
  Grid
} from 'lucide-react';
import { Cow, WeightRecord } from '../../types.js';
import { 
  Box, 
  Grid as MuiGrid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Avatar, 
  Chip,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface AnalyticsViewProps {
  cows: Cow[];
  weights: WeightRecord[];
  onSelectCow: (id: string) => void;
}

export default function AnalyticsView({
  cows,
  weights,
  onSelectCow
}: AnalyticsViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // 1. CALCULATE BREED AVERAGES
  const breeds = Array.from(new Set(cows.map(c => c.breed)));
  const breedPerformance = breeds.map(breed => {
    const breedCows = cows.filter(c => c.breed === breed);
    const latestWeights = breedCows.map(cow => {
      const cowRecs = weights.filter(w => w.cowId === cow.cowId);
      if (cowRecs.length === 0) return null;
      const sorted = [...cowRecs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return sorted[0].weight;
    }).filter(Boolean) as number[];

    const avg = latestWeights.length > 0
      ? Math.round((latestWeights.reduce((acc, w) => acc + w, 0) / latestWeights.length) * 10) / 10
      : 0;

    return { breed, averageWeight: avg, count: breedCows.length };
  });

  // 2. WEIGHT DISTRIBUTION CLASSIFICATIONS
  let distributions = { calf: 0, yearling: 0, standard: 0, heavy: 0 };
  
  cows.forEach(cow => {
    const cowRecs = weights.filter(w => w.cowId === cow.cowId);
    if (cowRecs.length > 0) {
      const sorted = [...cowRecs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const w = sorted[0].weight;
      if (w < 150) distributions.calf++;
      else if (w >= 150 && w < 250) distributions.yearling++;
      else if (w >= 250 && w < 350) distributions.standard++;
      else distributions.heavy++;
    }
  });

  // 3. OUTSTANDING GAINERS VS ACTION LISTS
  interface AnalysisRow {
    cowId: string;
    id: string;
    name: string;
    breed: string;
    netGain: number;
    adg: number;
    headUrl: string | null;
  }

  const individualStats: AnalysisRow[] = cows.map(cow => {
    const cowRecs = [...weights.filter(w => w.cowId === cow.cowId)]
      .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (cowRecs.length < 2) return null;
    const netGain = cowRecs[cowRecs.length - 1].weight - cowRecs[0].weight;
    const elapsedDays = (new Date(cowRecs[cowRecs.length - 1].timestamp).getTime() - new Date(cowRecs[0].timestamp).getTime()) / (1000 * 3600 * 24);
    const adg = elapsedDays > 0.5 ? netGain / elapsedDays : 0;

    return {
      cowId: cow.cowId,
      id: cow.cowId,
      name: cow.name,
      breed: cow.breed,
      netGain,
      adg,
      headUrl: cow.image || null
    };
  }).filter(Boolean) as AnalysisRow[];

  const topPerformers = [...individualStats].sort((a,b) => b.netGain - a.netGain).slice(0, 3);
  const underperformers = [...individualStats].sort((a,b) => a.netGain - b.netGain).slice(0, 3);

  // RENDER DYNAMIC SVG BREED AVERAGE GRAPH
  const renderBreedComparisonChart = () => {
    const margin = { top: 15, right: 25, bottom: 30, left: 75 };
    const width = 450;
    const hGraph = 160;

    const maxWeight = Math.max(...breedPerformance.map(b => b.averageWeight), 200);

    return (
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full">
          {breedPerformance.map((b, idx) => {
            const rowH = 22;
            const spacing = 10;
            const y = margin.top + idx * (rowH + spacing);
            const barWidth = ((width - margin.left - margin.right) * b.averageWeight) / maxWeight;

            return (
              <g key={b.breed}>
                {/* Row Label */}
                <text 
                  x={margin.left - 8} 
                  y={y + 15} 
                  className="fill-[var(--text-primary)] text-[10px] font-bold text-right" 
                  textAnchor="end"
                  style={{ fill: 'currentColor', fontWeight: 'bold' }}
                >
                  {b.breed}
                </text>

                {/* Bar backdrop */}
                <rect
                  x={margin.left}
                  y={y}
                  width={width - margin.left - margin.right}
                  height={rowH}
                  fill="var(--bg-app)"
                  rx="4"
                  style={{ fill: 'rgba(0,0,0,0.03)' }}
                />

                {/* Real bar */}
                <rect
                  x={margin.left}
                  y={y}
                  width={Math.max(barWidth, 6)}
                  height={rowH}
                  fill="var(--primary-brand)"
                  rx="4"
                  style={{ fill: '#2E7D32' }}
                />

                {/* Weight value tag */}
                <text
                  x={margin.left + barWidth - 30 > margin.left ? margin.left + barWidth - 6 : margin.left + barWidth + 8}
                  y={y + 14}
                  className={`text-[9px] font-mono font-bold`}
                  style={{ 
                    fill: margin.left + barWidth - 30 > margin.left ? '#ffffff' : 'currentColor',
                    fontWeight: 'bold' 
                  }}
                  textAnchor={margin.left + barWidth - 30 > margin.left ? 'end' : 'start'}
                >
                  {b.averageWeight.toFixed(0)} kg ({b.count} head)
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    );
  };

  // RENDER DYNAMIC SVG DISTRIBUTION HISTOGRAM
  const renderDistributionChart = () => {
    const margin = { top: 20, right: 20, bottom: 30, left: 35 };
    const width = 450;
    const hGraph = 160;

    const distAry = [
      { label: 'Calf (<150k)', count: distributions.calf },
      { label: 'Yearling (150-250k)', count: distributions.yearling },
      { label: 'Adult (250-350k)', count: distributions.standard },
      { label: 'Heavy (>350k)', count: distributions.heavy }
    ];

    const maxCount = Math.max(...distAry.map(d => d.count), 4);
    const colW = (width - margin.left - margin.right) / distAry.length;

    return (
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full">
          {/* Horizontal lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = margin.top + ratio * (hGraph - margin.top - margin.bottom);
            const label = Math.round((1 - ratio) * maxCount);
            return (
              <g key={ratio} className="opacity-30">
                <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="var(--border-ui)" strokeWidth="1" strokeDasharray="3 3"/>
                <text x={margin.left - 6} y={y + 3} className="fill-[var(--text-secondary)] text-[8px] font-mono text-right" textAnchor="end" style={{ fill: 'currentColor' }}>{label}</text>
              </g>
            );
          })}

          {/* Render columns */}
          {distAry.map((d, idx) => {
            const xCol = margin.left + idx * colW;
            const colH = (d.count / maxCount) * (hGraph - margin.top - margin.bottom);
            const yCol = hGraph - margin.bottom - colH;
            const barSpacedW = colW * 0.7;
            const space = colW * 0.15;

            return (
              <g key={d.label}>
                <rect
                  x={xCol + space}
                  y={yCol}
                  width={barSpacedW}
                  height={Math.max(colH, 2)}
                  fill="var(--secondary-brand)"
                  opacity="0.8"
                  rx="3"
                  style={{ fill: '#81C784' }}
                />

                <text 
                  x={xCol + (colW / 2)} 
                  y={yCol - 5} 
                  className="fill-[var(--text-primary)] text-[9px] font-bold text-center" 
                  textAnchor="middle"
                  style={{ fill: 'currentColor', fontWeight: 'bold' }}
                >
                  {d.count} Head
                </text>

                <text 
                  x={xCol + (colW / 2)} 
                  y={hGraph - margin.bottom + 14} 
                  className="fill-[var(--text-secondary)] text-[8px] font-semibold text-center" 
                  textAnchor="middle"
                  style={{ fill: 'currentColor' }}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
      
      {/* Header element */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
          {t('analytics.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Inspect advanced demographic distribution parameters and identify inefficient cattle weight performances.
        </Typography>
      </Box>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 gap-4 p-6">
        
        {/* Breed weight comparison */}
        <div className="h-[280px] min-h-[280px] max-h-[280px] overflow-hidden rounded-2xl p-5 flex flex-col" style={{ backgroundColor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Grid className="text-[#2E7D32]" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {t('analytics.breedComparison')}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Comparison of average weights categorized dynamically across registered breeds.
              </Typography>

              {renderBreedComparisonChart()}
        </div>

        {/* Distributions */}
        <div className="h-[280px] min-h-[280px] max-h-[280px] overflow-hidden rounded-2xl p-5 flex flex-col" style={{ backgroundColor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <BarChart3 className="text-[#2E7D32]" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {t('analytics.weightDistribution')}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Histogram sorting herd animals across life-cycle weight parameters.
              </Typography>

              {renderDistributionChart()}
        </div>

        {/* Gainers */}
        <div className="h-[280px] min-h-[280px] max-h-[280px] overflow-hidden rounded-2xl p-5 flex flex-col" style={{ backgroundColor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Award className="text-emerald-600 animate-bounce" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {t('analytics.topGainers')}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                Cattle displaying highest total weight increases from check-in logs.
              </Typography>

              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {topPerformers.length === 0 ? (
                  <Typography variant="caption" sx={{ display: 'block', py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Inquire additional weighing records to trigger rankings logs.
                  </Typography>
                ) : (
                  topPerformers.map((row, idx) => (
                    <ListItem 
                      key={row.cowId} 
                      disablePadding
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        bgcolor: 'rgba(76, 175, 80, 0.04)',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <ListItemButton onClick={() => onSelectCow(row.id)} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'success.main', color: 'white', fontWeight: 900, fontSize: '0.75rem' }}>
                          #{idx + 1}
                        </Avatar>
                        
                        {row.headUrl ? (
                          <Avatar src={row.headUrl} sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider' }} />
                        ) : (
                          <Typography sx={{ fontSize: '1.25rem' }}>🐂</Typography>
                        )}
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 800, color: 'text.primary' }}>
                            {row.name} ({row.cowId})
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontMono: 'monospace', display: 'block', fontSize: '0.6875rem' }}>
                            {row.breed} • ADG: +{row.adg.toFixed(2)} kg/day
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'right', shrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 950, color: 'success.main', fontFamily: 'monospace' }}>
                            +{row.netGain.toFixed(1)} kg
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.5625rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                            Net Gain
                          </Typography>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
        </div>

        {/* Underperformers */}
        <div className="h-[280px] min-h-[280px] max-h-[280px] overflow-hidden rounded-2xl p-5 flex flex-col" style={{ backgroundColor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <AlertOctagon className="text-amber-500" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {t('analytics.underperforming')}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                Cattle registering sluggish growth coefficients. May require dietary updates or vet clinics.
              </Typography>

              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {underperformers.length === 0 ? (
                  <Typography variant="caption" sx={{ display: 'block', py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    No anomalies reported. All cattle growth indices are high.
                  </Typography>
                ) : (
                  underperformers.map((row) => (
                    <ListItem 
                      key={row.cowId} 
                      disablePadding
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        bgcolor: 'rgba(237, 108, 2, 0.04)',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                        '&:hover': { borderColor: 'warning.main' }
                      }}
                    >
                      <ListItemButton onClick={() => onSelectCow(row.id)} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'warning.main', color: 'white', fontWeight: 900, fontSize: '0.75rem' }}>
                          ⚠️
                        </Avatar>
                        
                        {row.headUrl ? (
                          <Avatar src={row.headUrl} sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider' }} />
                        ) : (
                          <Typography sx={{ fontSize: '1.25rem' }}>🐂</Typography>
                        )}
                        
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 800, color: 'text.primary' }}>
                            {row.name} ({row.cowId})
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontMono: 'monospace', display: 'block', fontSize: '0.6875rem' }}>
                            {row.breed} • Gains: +{row.adg.toFixed(2)} kg/day
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'right', shrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 950, color: 'warning.main', fontFamily: 'monospace' }}>
                            +{row.netGain.toFixed(1)} kg
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.5625rem', fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                            Low Index
                          </Typography>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
        </div>

      </div>

    </Box>
  );
}
