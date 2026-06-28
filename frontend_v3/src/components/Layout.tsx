import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Scale,
  Users,
  History,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Radio,
  MapPin,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { changeLanguage } from '../i18n';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Badge,
  IconButton
} from '@mui/material';

interface LayoutProps {
  currentTab: string;
  onSetTab: (tab: string) => void;
  socketConnected: boolean;
  alertCount: number;
  theme?: string;
  onChangeTheme?: (theme: string) => void;
  children: React.ReactNode;
}

export default function Layout({
  currentTab,
  onSetTab,
  socketConnected,
  alertCount,
  theme,
  onChangeTheme,
  children
}: LayoutProps) {
  const { t, i18n } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'livescale', label: t('nav.liveScale'), icon: Scale },
    { id: 'cows', label: t('nav.cattleRecords'), icon: Users },
    { id: 'history', label: t('nav.weightHistory'), icon: History },
    { id: 'reports', label: t('nav.reports'), icon: FileText },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'settings', label: t('nav.settings'), icon: Settings }
  ];

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'en' ? 'km' : 'en';
    changeLanguage(nextLang);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: 260,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 260,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Brand Logo header */}
        <Box sx={{ p: 4, pb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            AgroScale
          </Typography>
        </Box>

        {/* Menu items list */}
        <Box component="nav" sx={{ flexGrow: 1, px: 2, overflowY: 'auto' }}>
          <List disablePadding>
            {menuItems.map((item) => {
              const isActive = currentTab === item.id || (item.id === 'cows' && currentTab === 'cow-detail');
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => onSetTab(item.id)}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      px: 2,
                      mx: 1,
                      mb: 0.5,
                      bgcolor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'primary.contrastText' : 'text.secondary',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isActive ? 'primary.main' : 'action.hover',
                        color: isActive ? 'primary.contrastText' : 'text.primary',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                      <item.icon size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.8125rem' }}>
                          {item.label}
                        </Typography>
                      }
                    />
                    {item.id === 'dashboard' && alertCount > 0 && (
                      <Badge
                        badgeContent={alertCount}
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.625rem',
                            height: 20,
                            minWidth: 20
                          }
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Sidebar Footer & language toggle */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={handleLanguageToggle}
            fullWidth
            variant="text"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: 'rgba(46, 125, 50, 0.06)',
              color: 'primary.main',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(46, 125, 50, 0.12)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Globe size={14} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.625rem' }}>
                {i18n.language === 'en' ? 'ENGLISH (UK)' : 'ភាសាខ្មែរ'}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontSize: '0.5625rem', opacity: 0.6 }}>
              {i18n.language === 'en' ? 'SWITCH TO KM' : 'ប្តូរជា EN'}
            </Typography>
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.5625rem' }}>
            © 2026 AGROSCALE CO.
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content Pane */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top Header App Bar */}
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end', px: { xs: 3, md: 5 }, minHeight: 64 }}>
            {/* Right side icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                sx={{ color: 'text.secondary' }}
                onClick={() => onChangeTheme?.(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <Bell size={20} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Primary Page Router Content Wrapper */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 4, md: 5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
