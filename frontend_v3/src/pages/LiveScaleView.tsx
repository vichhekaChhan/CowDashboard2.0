import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Scale, 
  Search, 
  Check, 
  HelpCircle, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  History,
  Sparkles
} from 'lucide-react';
import { Cow, LiveScaleState, Device } from '../types';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  TextField, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Avatar, 
  Alert,
  InputAdornment,
  ListItemIcon
} from '@mui/material';

interface LiveScaleProps {
  liveScale: LiveScaleState;
  cows: Cow[];
  devices: Device[];
  onSaveWeight: (cowId: string, weight: number, deviceId: string) => Promise<boolean>;
}

export default function LiveScaleView({
  liveScale,
  cows,
  devices,
  onSaveWeight
}: LiveScaleProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCowId, setSelectedCowId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Track state transitions to trigger chime once per stabilization
  const lastStableRef = useRef(false);
  const lastWeightRef = useRef(0);

  // Play a beautiful synthetic chime when stable weight is captured
  const playStableChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Dual-tone high fidelity chime
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(830.61, audioCtx.currentTime); // G#5
        gain2.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 100);

    } catch (err) {
      console.warn("Audio context failed or blocked by autoplay permissions:", err);
    }
  };

  // Watch for stability changes to trigger the chime
  useEffect(() => {
    if (liveScale.stable && !lastStableRef.current && liveScale.weight > 10) {
      playStableChime();
    }
    lastStableRef.current = liveScale.stable;
    lastWeightRef.current = liveScale.weight;
  }, [liveScale.stable, liveScale.weight]);

  // Determine farmer-facing process stage
  let stageText = t('liveScale.readyToWeigh');
  let stageBg = 'action.hover';
  let stageColor = 'text.secondary';
  let stageBorder = '1px dashed';
  let stageIndicatorColor = '#9e9e9e';
  let isWeighing = false;

  if (liveScale.weight >= 10) {
    isWeighing = true;
    if (liveScale.stable) {
      stageText = t('liveScale.stableCaptured');
      stageBg = 'rgba(46, 125, 50, 0.08)';
      stageColor = 'success.main';
      stageBorder = '1px solid';
      stageIndicatorColor = '#2E7D32';
    } else {
      stageText = t('liveScale.weighing');
      stageBg = 'rgba(237, 108, 2, 0.08)';
      stageColor = 'warning.main';
      stageBorder = '1px solid';
      stageIndicatorColor = '#ed6c02';
    }
  }

  // Filter cows for dropdown selection
  const filteredCows = cows.filter(cow => 
    cow.cowId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cow.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCow = cows.find(c => c.cowId === selectedCowId);

  const handleBindAndLog = async () => {
    if (!selectedCowId) {
      setErrorMsg(t('liveScale.noCowSelectedErr'));
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const success = await onSaveWeight(selectedCowId, liveScale.weight, liveScale.deviceId);
      if (success) {
        setSuccessMsg(t('liveScale.successSave'));
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch(e) {}

        setSelectedCowId('');
        setSearchQuery('');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to log weight session properly');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch (e) {
      setErrorMsg('Error communicating with backend database');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualUnboundWeight = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const success = await onSaveWeight('UNBOUND', liveScale.weight, liveScale.deviceId);
      if (success) {
        setSuccessMsg("Successfully logged weight unbound to any profile!");
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch(e) {
      setErrorMsg("Failed to store manual weight log");
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* Header section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, sm: 'alignItems: center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {t('liveScale.mainTitle')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Observe realtime load-cell readings and associate them with cattle files.
          </Typography>
        </Box>

        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="outlined"
          color={soundEnabled ? 'success' : 'error'}
          startIcon={soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 800,
            py: 1,
            px: 2.5,
            bgcolor: soundEnabled ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)'
          }}
        >
          {soundEnabled ? "Chime Audio: On (Beeps on Stable)" : "Chime Audio: Muted"}
        </Button>
      </Box>

      {/* Grid containing Weighing Card and Binds panel */}
      <Grid container spacing={2}>
        
        {/* Weighing Card (Left 7 Columns) */}
        <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <Card sx={{ 
            p: { xs: 3, md: 4 }, 
            borderRadius: 4, 
            border: '1px solid', 
            borderColor: 'divider', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              position: 'absolute', 
              inset: 0, 
              opacity: 0.02, 
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box sx={{ 
                width: 380, 
                height: 380, 
                borderRadius: '50%', 
                border: '12px solid',
                borderColor: 'primary.main',
                animation: !liveScale.stable && liveScale.weight > 10 ? 'ping 4s infinite' : 'none'
              }} />
            </Box>

            <Box sx={{ width: '100%', mb: 4 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                Telemetry Module 01
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  HX711 Digital Channel
                </Typography>
              </Box>
            </Box>

            {/* Scale Value */}
            <Box sx={{ py: 3, position: 'relative' }}>
              {!liveScale.stable && liveScale.weight > 10 && (
                <Box sx={{ position: 'absolute', inset: -16, bgcolor: 'rgba(237, 108, 2, 0.04)', borderRadius: 4, filter: 'blur(8px)', animation: 'pulse 1.5s infinite' }} />
              )}
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', position: 'relative' }}>
                <Typography variant="h1" sx={{ fontWeight: 950, letterSpacing: '-0.04em', fontSize: { xs: '5rem', md: '6.5rem' }, fontFamily: 'monospace', color: 'text.primary', lineHeight: 1 }}>
                  {liveScale.weight.toFixed(1)}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, ml: 1.5, color: 'text.secondary', textTransform: 'uppercase' }}>
                  {t('common.kg')}
                </Typography>
              </Box>
            </Box>

            {/* Stage Indicator Badge */}
            <Box sx={{ 
              mt: 3, 
              width: '100%', 
              maxWidth: 360, 
              px: 3, 
              py: 1.5, 
              borderRadius: 3, 
              bgcolor: stageBg, 
              color: stageColor,
              border: stageBorder,
              borderColor: stageColor,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1.5,
              fontWeight: 800,
              fontSize: '0.8125rem'
            }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: stageIndicatorColor,
                animation: isWeighing && !liveScale.stable ? 'ping 1s infinite' : 'none'
              }} />
              <span>{stageText}</span>
            </Box>

            {/* Extra Load Cell Telemetry Grid */}
            <Box sx={{ 
              width: '100%', 
              mt: 4, 
              pt: 3, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              display: 'flex', 
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <Box sx={{ px: 2 }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', display: 'block', fontWeight: 600, fontSize: '0.625rem' }}>
                  Stability Check
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: liveScale.stable ? 'success.main' : 'warning.main' }}>
                  {liveScale.stable ? 'LOCKED' : 'STABILIZING...'}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Scale Diagnostic Settings Card */}
          <Card sx={{ p: 2, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
              Scale Hardware Settings & Calibration
            </Typography>
            
            <Grid container spacing={2}>
              {[
                { label: 'Zero Offset', value: '42,109 raw' },
                { label: 'Scale Factor', value: '231.85 kg/mV' },
                { label: 'Lpf Alpha coeff', value: '0.12 (Dynamic)' },
                { label: 'Median Width', value: '5 samples' }
              ].map((item) => (
                <Grid item xs={6} sm={3} key={item.label}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.5625rem', textTransform: 'uppercase', display: 'block' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace', mt: 0.5 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>

        {/* Cow Binding Panel (Right 5 Columns) */}
        <Grid item xs={12} lg={5} sx={{ minWidth: 0 }}>
          <Card sx={{ 
            p: 3, 
            borderRadius: 4, 
            border: '1px solid', 
            borderColor: 'divider', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bookmark className="text-[#2E7D32]" size={20} />
                  <span>{t('liveScale.selectCowPrompt')}</span>
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  Link current weight measurement data directly into the database files of a cow.
                </Typography>
              </Box>

              {/* Success / Error Messages */}
              {successMsg && (
                <Alert severity="success" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                  {successMsg}
                </Alert>
              )}

              {errorMsg && (
                <Alert severity="error" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                  {errorMsg}
                </Alert>
              )}

              {/* Cow Auto-complete Search input */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.08em' }}>
                  1. Select Cattle Profile
                </Typography>

                <TextField
                  fullWidth
                  placeholder={t('cattleRecords.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                        <Search size={16} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />

                {/* List Box of Filtered Cattle */}
                <Box sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 3, 
                  maxHeight: 180, 
                  overflowY: 'auto', 
                  bgcolor: 'action.hover' 
                }}>
                  {filteredCows.length === 0 ? (
                    <Typography variant="caption" sx={{ display: 'block', p: 3, color: 'text.secondary', textAlign: 'center' }}>
                      No cattle matches your keywords.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {filteredCows.map((cow) => {
                        const isSelected = selectedCowId === cow.cowId;
                        return (
                          <ListItem key={cow.cowId} disablePadding>
                            <ListItemButton
                              onClick={() => setSelectedCowId(cow.cowId)}
                              sx={{
                                py: 1.25,
                                px: 2,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 0 },
                                bgcolor: isSelected ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                color: isSelected ? 'primary.main' : 'text.primary',
                                '&:hover': {
                                  bgcolor: isSelected ? 'rgba(46, 125, 50, 0.12)' : 'rgba(0,0,0,0.02)'
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {cow.image ? (
                                  <Avatar src={cow.image} sx={{ width: 24, height: 24 }} />
                                ) : (
                                  <Typography sx={{ fontSize: '1rem' }}>🐂</Typography>
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={<Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.8125rem' }}>{cow.name}</Typography>}
                                secondary={<Typography variant="caption" sx={{ fontSize: '0.625rem', color: 'text.secondary' }}>{cow.cowId} • {cow.breed}</Typography>}
                              />
                              {isSelected && <Check size={16} className="text-[#2E7D32]" />}
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </Box>
              </Box>

              {/* Confirmation preview box */}
              {selectedCow && (
                <Box sx={{ p: 2.5, bgcolor: 'rgba(46, 125, 50, 0.04)', border: '1px solid rgba(46, 125, 50, 0.15)', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Cattle Target:</Typography>
                    <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 800 }}>{selectedCow.name} ({selectedCow.cowId})</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Weighing Value:</Typography>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 900, fontFamily: 'monospace' }}>
                      {liveScale.weight.toFixed(1)} {t('common.kg')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Stability Ratio:</Typography>
                    <Typography variant="caption" sx={{ color: liveScale.stable ? 'success.main' : 'warning.main', fontWeight: 800 }}>
                      {liveScale.stable ? 'Excellent (Locked)' : 'Fluctuating'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 3, borderTop: '1px solid', borderColor: 'divider', mt: 3 }}>
              <Button
                onClick={handleBindAndLog}
                disabled={isSaving || liveScale.weight < 1}
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<Check size={16} />}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 'bold',
                  fontSize: '0.8125rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)'
                }}
              >
                {isSaving ? "Saving session..." : t('liveScale.bindButton')}
              </Button>

              <Button
                onClick={handleManualUnboundWeight}
                disabled={isSaving || liveScale.weight < 1}
                variant="outlined"
                color="inherit"
                fullWidth
                sx={{
                  py: 1.25,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderStyle: 'dashed',
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'text.secondary',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {t('liveScale.unidentifiedCattle')}
              </Button>
            </Box>
          </Card>
        </Grid>

      </Grid>

    </Box>
  );
}
