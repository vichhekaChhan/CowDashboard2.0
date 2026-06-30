import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// i18n initialization
import './i18n.js';

// MUI packages
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout
import Layout from './components/layout/Layout';

// Pages
import DashboardView from './pages/DashboardView';
import LiveScaleView from './pages/LiveScaleView';
import CattleRecordsView from './pages/CattleRecordsView';
import CowDetailView from './pages/CowDetailView';
import WeightHistoryView from './pages/WeightHistoryView';
import ReportsView from './pages/ReportsView';
import AnalyticsView from './pages/AnalyticsView';
import SettingsView from './pages/SettingsView';

// Custom Hooks & Services
import * as api from './api';
import { useMasterData } from './hooks/useMasterData';
import { useSocket } from './hooks/useSocket';

const getCustomTheme = (mode: 'light' | 'dark' | 'farm') => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#1E4A40', // Dark green from Rentful theme
        light: '#2E695B',
        dark: '#133029',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#A5D6A7', 
      },
      background: {
        default: isDark ? '#121212' : '#F9FAFB', // Very light grey background
        paper: isDark ? '#1E1E1E' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#111827',
        secondary: isDark ? '#9CA3AF' : '#6B7280',
      },
      divider: isDark ? '#2D3748' : '#F3F4F6',
      success: {
        main: '#34A853',
        light: '#E8F5E9',
      },
      error: {
        main: '#EA4335',
        light: '#FCE8E6',
      }
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 16, // Softer corners for cards
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? "#4B5563 #1E1E1E" : "#9CA3AF transparent",
            "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
              backgroundColor: isDark ? "#1E1E1E" : "transparent",
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
              borderRadius: 8,
              backgroundColor: isDark ? "#4B5563" : "#9CA3AF",
              minHeight: 24,
            },
            "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
              backgroundColor: isDark ? "#6B7280" : "#6B7280",
            },
            "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
              backgroundColor: isDark ? "#6B7280" : "#6B7280",
            },
            "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
              backgroundColor: isDark ? "#6B7280" : "#6B7280",
            },
            "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
              backgroundColor: isDark ? "#1E1E1E" : "transparent",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? 'none' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            backgroundImage: 'none',
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
          }
        }
      }
    }
  });
};

export default function App() {
  const { t } = useTranslation();
  
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedCowId, setSelectedCowId] = useState<string>('');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [backendUrl] = useState<string>(window.location.origin);
  const [appTheme, setAppTheme] = useState<'light' | 'dark' | 'farm'>('farm');

  const {
    cows,
    weights,
    devices,
    dashboardStats,
    reportData,
    triggerMasterDataGrab
  } = useMasterData(backendUrl);

  const { socketConnected, liveScale } = useSocket(backendUrl, triggerMasterDataGrab);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as any;
    setAppTheme(savedTheme || 'light');
    document.documentElement.setAttribute('data-theme', savedTheme || 'light');
  }, []);

  const handleChangeTheme = (newTheme: any) => {
    setAppTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const handleNavigateToCowProfile = (cowId: string) => {
    setSelectedCowId(cowId);
    setCurrentTab('cow-detail');
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView stats={dashboardStats} liveWeight={liveScale} onNavigateToTab={setCurrentTab} onSelectCow={handleNavigateToCowProfile} />;
      case 'livescale':
        return (
          <LiveScaleView 
            liveScale={liveScale} 
            cows={cows} 
            devices={devices} 
            onSaveWeight={async (cowId, weight, deviceId) => {
              try {
                await api.addWeight(cowId, weight, deviceId);
                triggerMasterDataGrab(); // Refresh stats/history
                return true;
              } catch (e) {
                console.error("Save failed", e);
                return false;
              }
            }} 
          />
        );
      case 'cows':
        return (
          <CattleRecordsView 
            cows={cows} 
            weights={weights} 
            onAddCow={async (cow) => {
              try {
                await api.createCow(cow);
                triggerMasterDataGrab();
                return true;
              } catch (e) { return false; }
            }} 
            onEditCow={async (id, data) => {
              try {
                await api.updateCow(id, data);
                triggerMasterDataGrab();
                return true;
              } catch (e) { return false; }
            }} 
            onDeleteCow={async (id) => {
              try {
                await api.deleteCow(id);
                triggerMasterDataGrab();
                return true;
              } catch (e) { return false; }
            }} 
            onSelectCow={handleNavigateToCowProfile} 
          />
        );
      case 'cow-detail':
        return <CowDetailView cowId={selectedCowId} cows={cows} weights={weights} onBack={() => setCurrentTab('cows')} />;
      case 'history':
        return <WeightHistoryView weights={weights} cows={cows} />;
      case 'reports':
        return <ReportsView reportType={reportType} onSetReportType={setReportType} reportData={reportData} />;
      case 'analytics':
        return <AnalyticsView cows={cows} weights={weights} onSelectCow={handleNavigateToCowProfile} />;
      case 'settings':
        return <SettingsView devices={devices} onClearDeviceData={() => Promise.resolve(true)} theme={appTheme} onChangeTheme={handleChangeTheme} />;
      default:
        return <p>Page not found</p>;
    }
  };

  const themeObj = getCustomTheme(appTheme);

  return (
    <ThemeProvider theme={themeObj}>
      <CssBaseline />
      <Layout
        currentTab={currentTab}
        onSetTab={setCurrentTab}
        socketConnected={socketConnected}
        alertCount={dashboardStats ? dashboardStats.alerts.length : 0}
        theme={appTheme}
        onChangeTheme={handleChangeTheme}
      >
        {renderTabContent()}
      </Layout>
    </ThemeProvider>
  );
}
