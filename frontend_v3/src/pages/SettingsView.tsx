import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  Globe, 
  Palette, 
  Volume2, 
  VolumeX, 
  Check, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Signal, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Terminal, 
  Trash2,
  Sliders,
  Server,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Device } from '../types';
import { changeLanguage } from '../i18n';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  Switch, 
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  Chip
} from '@mui/material';

interface SettingsProps {
  devices: Device[];
  onClearDeviceData: (deviceId: string) => Promise<boolean>;
  theme: 'light' | 'dark' | 'farm';
  onChangeTheme: (theme: 'light' | 'dark' | 'farm') => void;
}

export default function SettingsView({
  devices,
  onClearDeviceData,
  theme,
  onChangeTheme
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  
  // Audio state
  const [soundOnStable, setSoundOnStable] = useState(true);
  const [vibrationOnWarning, setVibrationOnWarning] = useState(true);

  // WiFi configurator state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    devices.length > 0 ? devices[0].deviceId : 'esp32-scale-01'
  );
  const [ssidField, setSsidField] = useState<string>('');
  const [passwordField, setPasswordField] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [networks, setNetworks] = useState<Array<{ ssid: string; signal: number; secure: boolean; connected: boolean }>>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Set default SSID from device status if connected
  const activeDevice = devices.find(d => d.deviceId === selectedDeviceId);

  // Connect socket for real-time WiFi configuration terminal stream
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] WLAN channel ready. Selected node: ${selectedDeviceId}`,
      `[${new Date().toLocaleTimeString()}] Interface current status: ${activeDevice?.wifiStatus || (activeDevice?.status === 'online' ? 'connected' : 'disconnected')}`
    ]);

    socket.on('wifi_provision_status', (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] [OTA-AGENT] ${data.message}`
        ]);
        
        if (data.status === 'connecting') {
          setIsProvisioning(true);
        } else if (data.status === 'connected') {
          setIsProvisioning(false);
          setSsidField('');
          setPasswordField('');
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDeviceId]);

  // Handle scanned network selection
  const handleSelectNetwork = (ssid: string) => {
    setSsidField(ssid);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Selected wireless SSID target: "${ssid}"`
    ]);
  };

  // Run simulated WiFi scans
  const handleScanNetworks = async () => {
    setScanning(true);
    setNetworks([]);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] RF channel sweep initiated on scale module: ${selectedDeviceId}`
    ]);
    
    try {
      const res = await axios.get(`/api/devices/${selectedDeviceId}/networks`);
      setTimeout(() => {
        setNetworks(res.data);
        setScanning(false);
        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Sweep completed. Detected ${res.data.length} wireless base stations nearby.`
        ]);
      }, 1500);
    } catch (e) {
      setScanning(false);
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] WiFi controller reported error: failed to initiate scan probe.`
      ]);
    }
  };

  // Dispatch connection parameters to hardware
  const handleConnectWiFi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssidField) return;
    
    setIsProvisioning(true);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Preparing credentials payload...`,
      `[${new Date().toLocaleTimeString()}] Target SSID: "${ssidField}" (Security: WPA2-PSK)`
    ]);

    try {
      await axios.post(`/api/devices/${selectedDeviceId}/wifi`, {
        ssid: ssidField,
        password: passwordField
      });
    } catch (e) {
      setIsProvisioning(false);
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Error: OTA dispatcher reported fail to transmit WiFi settings.`
      ]);
    }
  };

  const handleClearHistory = async (deviceId: string) => {
    const isConfirmed = window.confirm(`CRITICAL WARNING: Are you sure you want to delete all historical logs for scale device ${deviceId}? This is irreversible.`);
    if (isConfirmed) {
      const success = await onClearDeviceData(deviceId);
      if (success) {
        alert(`Successfully deleted historical log buffers for scale ${deviceId}`);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
      
      {/* Header block */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
          {t('settings.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Provision wireless hardware nodes, select workspace language preferences, and audit system diagnostics.
        </Typography>
      </Box>

      <div className="flex flex-col gap-4 w-full">
        {/* Top row */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-[2] flex flex-col">
          
          {/* Wi-Fi configurator */}
          <Card sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                <Wifi className="text-[#2E7D32] animate-pulse" size={20} />
                <span>Wi-Fi Configurator (WiFi Manager)</span>
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Target Scale:</Typography>
                <FormControl size="small">
                  <Select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    sx={{ borderRadius: 2, fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace' }}
                  >
                    {devices.map(d => (
                      <option key={d.deviceId} value={d.deviceId} style={{ fontFamily: 'monospace', fontWeight: 'bold', padding: 8 }}>
                        {d.deviceId}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Status bar details */}
            <Box sx={{ mb: 4, p: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 2 }}>
              {[
                { label: 'Wi-Fi Connection', value: activeDevice?.wifiStatus || (activeDevice?.status === 'online' ? 'connected' : 'disconnected'), isStatus: true },
                { label: 'SSID Network', value: activeDevice?.wifiSSID || 'Not Configured', isMono: true },
                { label: 'Node IP Address', value: activeDevice?.wifiIP || 'N/A', isMono: true },
                { label: 'Signal Strength', value: activeDevice?.wifiSignal ? `${activeDevice.wifiSignal}%` : 'N/A', isSignal: true }
              ].map((item, idx) => (
                <Box key={idx}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.5625rem', textTransform: 'uppercase', tracking: 1, display: 'block' }}>
                    {item.label}
                  </Typography>
                  
                  {item.isStatus ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                      <Box sx={{ 
                        w: 8, 
                        h: 8, 
                        borderRadius: '50%', 
                        bgcolor: item.value === 'connected' ? 'success.main' : item.value === 'connecting' ? 'warning.main' : 'text.disabled',
                        animation: item.value === 'connecting' ? 'pulse 1s infinite' : 'none'
                      }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'capitalize', fontSize: '0.75rem' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ) : item.isSignal ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                      <Signal size={14} className="text-[#2E7D32]" />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.75rem' }}>{item.value}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" noWrap sx={{ fontWeight: 800, color: 'text.primary', fontFamily: item.isMono ? 'monospace' : 'inherit', fontSize: '0.75rem', mt: 0.75, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.value}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {/* Scanning and Forms */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>Configure Scale WLAN Credentials</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>ESP32 loads credentials OTA. Scan nearby routers or specify SSID directly.</Typography>
                </Box>
                
                <Button
                  onClick={handleScanNetworks}
                  disabled={scanning || isProvisioning}
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<RefreshCw size={14} className={scanning ? 'animate-spin text-[#2E7D32]' : ''} />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', fontWeight: 800 }}
                >
                  {scanning ? 'Scanning...' : 'Scan Networks'}
                </Button>
              </Box>

              {/* Network sweep status */}
              {scanning && (
                <Box sx={{ py: 4, px: 3, border: '1.5px dashed', borderColor: 'divider', borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, bgcolor: 'action.hover' }}>
                  <Box sx={{ position: 'relative' }}>
                    <Wifi className="text-[#2E7D32] animate-bounce" size={32} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                    Scanning RF bands (2.4GHz) for scale-visible APs...
                  </Typography>
                </Box>
              )}

              {/* Scanned networks list */}
              {!scanning && networks.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em' }}>Nearby Networks Detected:</Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {networks.map((net) => (
                      <div key={net.ssid}>
                        <Button
                          onClick={() => handleSelectNetwork(net.ssid)}
                          variant="outlined"
                          color="inherit"
                          fullWidth
                          sx={{
                            p: 1.75,
                            borderRadius: 3,
                            justifyContent: 'space-between',
                            textTransform: 'none',
                            bgcolor: ssidField === net.ssid ? 'rgba(46,125,50,0.06)' : 'transparent',
                            borderColor: ssidField === net.ssid ? 'primary.main' : 'divider',
                            color: ssidField === net.ssid ? 'primary.main' : 'text.primary',
                            '&:hover': {
                              borderColor: ssidField === net.ssid ? 'primary.main' : 'text.secondary',
                              bgcolor: ssidField === net.ssid ? 'rgba(46,125,50,0.08)' : 'action.hover'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                            <Wifi size={16} style={{ flexShrink: 0 }} />
                            <Typography variant="caption" noWrap sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{net.ssid}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', shrink: 0, fontFamily: 'monospace', fontSize: '0.625rem' }}>
                            {net.secure ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} className="text-emerald-500" />}
                            <span>{net.signal}%</span>
                          </Box>
                        </Button>
                      </div>
                    ))}
                  </div>
                </Box>
              )}

              {/* Wi-Fi provisioning Form details */}
              <Box component="form" onSubmit={handleConnectWiFi} sx={{ display: 'flex', flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, minWidth: 200 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em' }}>Wi-Fi SSID</Typography>
                  <TextField
                    required
                    disabled={isProvisioning}
                    placeholder="Enter SSID network"
                    value={ssidField}
                    onChange={(e) => setSsidField(e.target.value)}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontFamily: 'monospace', fontSize: '0.875rem' } }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, minWidth: 200 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em' }}>WPA2 Password</Typography>
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ textTransform: 'none', fontSize: '0.625rem', fontWeight: 800, py: 0 }}
                    >
                      {showPassword ? 'Hide Secret' : 'Show Secret'}
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                      type={showPassword ? 'text' : 'password'}
                      disabled={isProvisioning}
                      placeholder="Security passphrase"
                      value={passwordField}
                      onChange={(e) => setPasswordField(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontFamily: 'monospace', fontSize: '0.875rem' } }}
                    />
                    
                    <Button
                      type="submit"
                      disabled={!ssidField || isProvisioning}
                      variant="contained"
                      color="primary"
                      sx={{ borderRadius: 2.5, fontWeight: 'bold', textTransform: 'none', px: 3, boxShadow: 'none' }}
                    >
                      {isProvisioning ? <RefreshCw size={16} className="animate-spin" /> : 'Connect'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>
          </div>

          {/* Telemetry Devices & Systems specs */}
          <div className="flex-[1] flex flex-col">
          <Card sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 1.5, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                <Cpu className="text-[#2E7D32]" size={20} />
                <span>{t('settings.sysInfo')}</span>
              </Typography>

              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
                Traces metrics of scales active on pasture stations. You can purge telemetry buffer logs of offline modules and issue remote tare calibration vectors.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                {devices.length === 0 ? (
                  <Typography variant="caption" sx={{ display: 'block', py: 2, color: 'text.secondary', textAlign: 'center' }}>
                    No devices detected by API server yet.
                  </Typography>
                ) : (
                  devices.map((d) => (
                    <Box key={d.deviceId} sx={{ p: 2.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'text.primary' }}>{d.deviceId}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem', display: 'block', mt: 0.25 }}>
                            Last check-in: {new Date(d.lastSeen).toLocaleString()}
                          </Typography>
                        </Box>

                        <Chip
                          label={d.status === 'online' ? t('common.online') : t('common.offline')}
                          size="small"
                          color={d.status === 'online' ? 'success' : 'default'}
                          sx={{ fontWeight: 800, fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, borderTop: '1px solid', borderColor: 'divider', pt: 2, fontFamily: 'monospace', fontSize: '0.6875rem', color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Wi-Fi Network:</span>
                          <Typography sx={{ fontSize: '0.6875rem', color: 'text.primary', fontWeight: 'bold', fontFamily: 'monospace' }}>{d.wifiSSID || 'None'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Signal Level:</span>
                          <Typography sx={{ fontSize: '0.6875rem', color: 'text.primary', fontWeight: 'bold', fontFamily: 'monospace' }}>{d.wifiSignal ? `${d.wifiSignal}%` : 'N/A'}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        <Button
                          onClick={() => handleClearHistory(d.deviceId)}
                          variant="outlined"
                          color="error"
                          size="small"
                          sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', fontSize: '0.6875rem', py: 0.75, bgcolor: 'rgba(211,47,47,0.04)' }}
                        >
                          Purge Records
                        </Button>
                        
                        <Button
                          onClick={() => alert(`Triggering Virtual Tare command on scale ${d.deviceId}`)}
                          variant="outlined"
                          color="info"
                          size="small"
                          sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', fontSize: '0.6875rem', py: 0.75, bgcolor: 'rgba(2,136,209,0.04)' }}
                        >
                          Tare Sensor
                        </Button>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5, fontFamily: 'monospace', fontSize: '0.625rem', color: 'text.secondary' }}>
              <p>Database Engine: Self-Containing JSON Document Store</p>
              <p>Sensor Driver: hx711.cpp (24-bit dual conversion)</p>
              <p>WebSocket Mode: server-side dynamic upgrade (socket.io)</p>
            </Box>

          </Card>
          </div>
        </div>

        {/* Bottom full width */}
        <div className="w-full flex flex-col">
          {/* Sound Notification Cards */}
          <Card sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.primary', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Volume2 className="text-[#2E7D32]" size={20} />
              <span>{t('settings.notifications')}</span>
            </Typography>

            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <ListItem 
                sx={{ p: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.8125rem' }}>Capture beep feedback sound</Typography>}
                  secondary={<Typography variant="caption" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Plays confirmation chime on client browser as soon as stable loads are locked.</Typography>}
                />
                
                <Button
                  onClick={() => setSoundOnStable(!soundOnStable)}
                  variant="contained"
                  color={soundOnStable ? 'success' : 'inherit'}
                  size="small"
                  sx={{ borderRadius: 2, fontSize: '0.625rem', fontWeight: 900, px: 2, boxShadow: 'none' }}
                >
                  {soundOnStable ? 'ENABLED' : 'DISABLED'}
                </Button>
              </ListItem>

              <ListItem 
                sx={{ p: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.8125rem' }}>Warning notifications trigger</Typography>}
                  secondary={<Typography variant="caption" sx={{ fontSize: '0.6875rem', color: 'text.secondary' }}>Push notification banner visual indicators immediately on drastic weight drops.</Typography>}
                />
                
                <Button
                  onClick={() => setVibrationOnWarning(!vibrationOnWarning)}
                  variant="contained"
                  color={vibrationOnWarning ? 'success' : 'inherit'}
                  size="small"
                  sx={{ borderRadius: 2, fontSize: '0.625rem', fontWeight: 900, px: 2, boxShadow: 'none' }}
                >
                  {vibrationOnWarning ? 'ENABLED' : 'DISABLED'}
                </Button>
              </ListItem>
            </List>
          </Card>
        </div>
      </div>

    </Box>
  );
}
