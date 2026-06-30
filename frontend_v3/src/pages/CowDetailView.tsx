import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Scale, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Layers, 
  FileIcon,
  Tag,
  Clock
} from 'lucide-react';
import { Cow, WeightRecord } from '../types';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  Paper, 
  Chip,
  List,
  ListItem,
  Avatar,
  Divider
} from '@mui/material';

interface CowDetailProps {
  cowId: string;
  cows: Cow[];
  weights: WeightRecord[];
  onBack: () => void;
}

export default function CowDetailView({
  cowId,
  cows,
  weights,
  onBack
}: CowDetailProps) {
  const { t } = useTranslation();

  // Find the exact cow (either by UUID 'id' or Label 'cowId')
  const cow = cows.find(c => c.cowId === cowId);
  if (!cow) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium', mb: 3 }}>
          Cattle profile not found or deleted.
        </Typography>
        <Button 
          onClick={onBack} 
          variant="outlined" 
          startIcon={<ArrowLeft size={16} />}
          sx={{ borderRadius: 2.5, textTransform: 'none' }}
        >
          Go Back
        </Button>
      </Paper>
    );
  }

  // Get chronological records for this cow
  const cowWeights = [...weights.filter(w => w.cowId === cow.cowId)]
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // oldest to newest

  const latestWeight = cowWeights.length > 0 ? cowWeights[cowWeights.length - 1] : null;
  const previousWeight = cowWeights.length > 1 ? cowWeights[cowWeights.length - 2] : null;

  // Weight Deltas
  const totalGained = cowWeights.length > 1 
    ? (latestWeight!.weight - cowWeights[0].weight) 
    : 0;

  const currentGainFromPrev = previousWeight 
    ? latestWeight!.weight - previousWeight.weight 
    : 0;

  const growthPercentage = cowWeights.length > 1 && cowWeights[0].weight > 0
    ? Math.round((totalGained / cowWeights[0].weight) * 1000) / 10
    : 0;

  // Average Daily Gain (ADG)
  let adg = 0;
  let daysCycle = 0;
  if (cowWeights.length > 1) {
    const elapsedMs = new Date(latestWeight!.timestamp).getTime() - new Date(cowWeights[0].timestamp).getTime();
    daysCycle = Math.round(elapsedMs / (1000 * 3600 * 24));
    if (daysCycle > 0) {
      adg = Math.round((totalGained / daysCycle) * 100) / 100; // kg per day
    }
  }

  // Health assessment
  let healthStatus = "Normal growth pattern";
  let healthBg = 'rgba(76, 175, 80, 0.06)';
  let healthColor = 'success.main';
  let healthBorder = '1px solid rgba(76, 175, 80, 0.15)';
  let healthHeartColor = "text-[#2E7D32] animate-pulse";

  if (currentGainFromPrev < -1.5) {
    healthStatus = "WARNING: Significant weight loss detected!";
    healthBg = 'rgba(211, 47, 47, 0.06)';
    healthColor = 'error.main';
    healthBorder = '1px solid rgba(211, 47, 47, 0.15)';
    healthHeartColor = "text-red-500";
  } else if (adg > 0.6) {
    healthStatus = "Excellent: High Performance growth rate";
    healthBg = 'rgba(2, 136, 209, 0.06)';
    healthColor = 'info.main';
    healthBorder = '1px solid rgba(2, 136, 209, 0.15)';
  } else if (cowWeights.length <= 1) {
    healthStatus = "Observations pending (additional check-ins required)";
    healthBg = 'rgba(237, 108, 2, 0.06)';
    healthColor = 'warning.main';
    healthBorder = '1px solid rgba(237, 108, 2, 0.15)';
  }

  // BUILD DYNAMIC SVG GRAPH DATA POINTS
  const renderGrowthSvgChart = () => {
    if (cowWeights.length < 2) {
      return (
        <Box sx={{ 
          height: 250, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 3, 
          border: '1.5px dashed', 
          borderColor: 'divider', 
          borderRadius: 4, 
          bgcolor: 'action.hover' 
        }}>
          <Scale size={40} className="text-gray-400" style={{ marginBottom: 12, opacity: 0.6 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
            Insure at least 2 stable weighing events to render growth trajectory graphs.
          </Typography>
        </Box>
      );
    }

    const margin = { top: 25, right: 35, bottom: 40, left: 55 };
    const width = 600;
    const hGraph = 230;

    const weightsArr = cowWeights.map(w => w.weight);
    const minWeight = Math.min(...weightsArr) * 0.95; // 5% padding
    const maxWeight = Math.max(...weightsArr) * 1.05; // 5% padding
    const weightRange = maxWeight - minWeight;

    const timestamps = cowWeights.map(w => new Date(w.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime || 1;

    // Project points onto our SVG viewport coordinates
    const points = cowWeights.map(w => {
      const rx = margin.left + ((new Date(w.timestamp).getTime() - minTime) / timeRange) * (width - margin.left - margin.right);
      const ry = hGraph - margin.bottom - ((w.weight - minWeight) / weightRange) * (hGraph - margin.top - margin.bottom);
      return { x: rx, y: ry, weight: w.weight, date: new Date(w.timestamp).toLocaleDateString() };
    });

    const pathData = points.reduce((acc, p, i) => {
      return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }, '');

    // Area filling payload
    const areaData = pathData + ` L ${points[points.length - 1].x} ${hGraph - margin.bottom} L ${points[0].x} ${hGraph - margin.bottom} Z`;

    return (
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <svg viewBox={`0 0 ${width} ${hGraph}`} className="w-full min-w-[500px]" style={{ maxHeight: '230px' }}>
          
          {/* Chart Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const yValue = margin.top + ratio * (hGraph - margin.top - margin.bottom);
            const labelValue = Math.round(maxWeight - ratio * weightRange);
            return (
              <g key={ratio} className="opacity-40">
                <line 
                  x1={margin.left} 
                  y1={yValue} 
                  x2={width - margin.right} 
                  y2={yValue} 
                  stroke="var(--border-ui)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={margin.left - 8} 
                  y={yValue + 4} 
                  className="fill-[var(--text-secondary)] text-[10px] font-mono font-medium text-right"
                  textAnchor="end"
                  style={{ fill: 'currentColor' }}
                >
                  {labelValue} kg
                </text>
              </g>
            );
          })}

          {/* Render Area Fill under weight trend */}
          <path 
            d={areaData} 
            fill="url(#farmGradient)" 
            opacity="0.12"
          />

          {/* Render Line */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="var(--primary-brand)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Draggable Circle nodes */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-help z-20">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                fill="var(--bg-card)" 
                stroke="var(--primary-brand)" 
                strokeWidth="3.5" 
              />
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="10" 
                fill="transparent"
              >
                <title>{`${p.weight} kg on ${p.date}`}</title>
              </circle>
              {/* Floating label */}
              <text 
                x={p.x} 
                y={p.y - 12} 
                className="fill-[var(--text-primary)] text-[10px] font-bold text-center" 
                textAnchor="middle"
                style={{ fill: 'currentColor', fontWeight: 'bold' }}
              >
                {p.weight.toFixed(0)} kg
              </text>
              <text 
                x={p.x} 
                y={hGraph - margin.bottom + 15} 
                className="fill-[var(--text-secondary)] text-[8px] font-mono uppercase text-center"
                textAnchor="middle"
                style={{ fill: 'currentColor' }}
              >
                {p.date}
              </text>
            </g>
          ))}

          {/* Defining color gradient helper */}
          <defs>
            <linearGradient id="farmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-brand)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

        </svg>
      </Box>
    );
  };

  return (
    <Box className="flex flex-col gap-4 p-6">
      
      {/* Header element */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <IconButton 
          onClick={onBack}
          sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ArrowLeft size={18} />
        </IconButton>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Cattle Profile Inspection Card
            </Typography>
            <Chip 
              label={cow.cowId} 
              size="small" 
              sx={{ fontWeight: 900, fontSize: '0.625rem', bgcolor: 'rgba(46, 125, 50, 0.08)', color: 'primary.main', borderRadius: 1.5 }} 
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Explore genealogical charts, clinical statistics, and comprehensive weight dynamics.
          </Typography>
        </Box>
      </Box>

      {/* Row 1: Top info row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cow Profile Card */}
        <Card className="h-full" sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ width: '100%', height: 180, bgcolor: 'rgba(46, 125, 50, 0.04)', position: 'relative', borderBottom: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {cow.image ? (
              <Box 
                component="img"
                src={cow.image} 
                alt={cow.name} 
                sx={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.04)' }
                }} 
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5rem' }}>🐂</Box>
            )}
          </Box>
          <CardContent sx={{ p: 4, textAlign: 'center', flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5 }}>
              {cow.name}
            </Typography>
            <Chip 
              label={`Registry ID: ${cow.cowId}`}
              size="small"
              sx={{ borderRadius: 1.5, fontSize: '0.625rem', fontWeight: 800, bgcolor: 'action.hover', color: 'text.secondary', border: '1px solid', borderColor: 'divider' }}
            />
            <div className="grid grid-cols-2 gap-4 mt-6 text-left">
              <Box sx={{ p: 1.75, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.5625rem', textTransform: 'uppercase', display: 'block' }}>Breed</Typography>
                <Typography variant="body2" noWrap sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                  {cow.breed}
                </Typography>
              </Box>
              <Box sx={{ p: 1.75, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.5625rem', textTransform: 'uppercase', display: 'block' }}>Gender</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'info.main', mt: 0.5 }}>
                  {cow.gender === 'Female' ? '♀ Female' : '♂ Male'}
                </Typography>
              </Box>
              <Box className="col-span-2" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.5625rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={12} className="text-[#2E7D32]" /> Birth Registration
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {new Date(cow.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </Box>
            </div>
          </CardContent>
        </Card>

        {/* Metabolic Assessment Card */}
        <Card className="h-full" sx={{ p: 4, borderRadius: 4, border: healthBorder, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: healthBg, color: healthColor }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Heart className={`${healthHeartColor} shrink-0`} size={40} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                Metabolic Assessment Score
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, mt: 1, display: 'block' }}>
                {healthStatus}
              </Typography>
            </Box>
          </Box>
        </Card>
      </div>

      {/* Row 2: Cattle Performance Metrics */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Activity className="text-[#2E7D32]" size={20} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {t('reports.performanceTable') || 'Cattle Performance Metrics'}
          </Typography>
        </Box>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Weight Lock (Current)', value: latestWeight ? latestWeight.weight.toFixed(1) : '—', sub: latestWeight ? new Date(latestWeight.timestamp).toLocaleDateString() : 'Pending Weigh', unit: t('common.kg'), isLarge: true },
            { label: 'Previous Weigh', value: previousWeight ? previousWeight.weight.toFixed(1) : '—', sub: previousWeight ? new Date(previousWeight.timestamp).toLocaleDateString() : 'N/A', unit: t('common.kg') },
            { 
              label: 'Total Weight Gain', 
              value: totalGained >= 0 ? `+${totalGained.toFixed(1)}` : totalGained.toFixed(1), 
              sub: `${growthPercentage >= 0 ? `+${growthPercentage.toFixed(1)}%` : `${growthPercentage.toFixed(1)}%`} Overall Growth`,
              unit: t('common.kg'),
              isDelta: true,
              isPositive: totalGained >= 0
            },
            { label: 'Avg Daily Gain (ADG)', value: `+${adg.toFixed(2)}`, sub: `kg/day over past ${daysCycle} days`, unit: '', isADG: true }
          ].map((item, idx) => (
            <Box key={idx} className="h-[100px]" sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.5625rem', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                {item.label}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                {item.isDelta ? (
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 900, 
                      color: item.isPositive ? 'success.main' : 'error.main', 
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      lineHeight: 1
                    }}
                  >
                    {item.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {item.value}
                  </Typography>
                ) : (
                  <Typography variant="h6" sx={{ fontWeight: 900, color: item.isADG ? 'primary.main' : 'text.primary', fontFamily: 'monospace', lineHeight: 1 }}>
                    {item.value}
                  </Typography>
                )}
                {item.unit && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                    {item.unit}
                  </Typography>
                )}
              </Box>

              <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block', fontSize: '0.625rem', fontWeight: 600 }}>
                {item.sub}
              </Typography>
            </Box>
          ))}
        </div>
      </Box>

      {/* Row 3: Growth Log & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Historical Growth Log */}
        <Card className="h-[280px]" sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.08em', mb: 2 }}>
            Historical Growth Log Representation Curve
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderGrowthSvgChart()}
          </Box>
        </Card>

        {/* Historic Weight Check-ins Timeline */}
        <Card className="h-[280px]" sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, shrink: 0 }}>
            <Clock className="text-[#2E7D32]" size={20} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Historic Weight Check-ins Timeline
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, shrink: 0 }}>
            Full chronological ledger tracing stable loads associated with {cow.name}.
          </Typography>

          <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 4 } }}>
            <Box sx={{ position: 'relative', pl: 3.5, ml: 1, borderLeft: '2px solid', borderColor: 'divider', py: 1.5, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {cowWeights.length === 0 ? (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', py: 1 }}>
                  No weights reported on this animal registry file yet.
                </Typography>
              ) : (
                [...cowWeights].reverse().map((rec, i) => (
                  <Box key={rec.id || i} sx={{ position: 'relative' }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      left: -33, 
                      top: 4, 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main',
                      border: '2px solid',
                      borderColor: 'background.paper',
                      boxShadow: '0 0 0 2px var(--mui-palette-divider)'
                    }} />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 950, color: 'text.primary', fontFamily: 'monospace' }}>
                          {rec.weight.toFixed(1)} {t('common.kg')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, fontFamily: 'monospace', fontSize: '0.625rem' }}>
                          Device: {rec.deviceId} • Stable: {rec.stable ? 'YES' : 'NO'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        fontSize: '0.625rem', 
                        fontWeight: 700, 
                        color: 'text.secondary', 
                        bgcolor: 'action.hover', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 1.5, 
                        border: '1px solid',
                        borderColor: 'divider',
                        textTransform: 'uppercase'
                      }}>
                        {new Date(rec.timestamp).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Card>

      </div>

    </Box>
  );
}
