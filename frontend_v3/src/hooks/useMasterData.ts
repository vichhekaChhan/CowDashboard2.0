import { useState, useEffect, useCallback } from 'react';
import { Cow, WeightRecord, Device, DashboardStats, ReportData } from '../types';
import * as api from '../api';

export const useMasterData = (backendUrl: string) => {
  const [cows, setCows] = useState<Cow[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const triggerMasterDataGrab = useCallback(async () => {
    try {
      const stats = await api.fetchDashboardStats();
      setDashboardStats(stats);
      
      const cowsData = await api.fetchCows();
      setCows(cowsData);

      const devicesData = await api.fetchDevices();
      setDevices(devicesData);

      const allWeights = await api.fetchWeights(); 
      setWeights(allWeights);

      // Generate basic report data from weights
      if (allWeights.length > 0) {
        const reportDetails = cowsData.map((cow: Cow) => {
          const cowWeights = allWeights.filter((w: WeightRecord) => w.cowId === cow.cowId);
          const current = cowWeights[0]?.weight || 0;
          const prev = cowWeights[1]?.weight || 0;
          return {
            cowId: cow.cowId,
            name: cow.name,
            breed: cow.breed,
            currentWeight: current,
            previousWeight: prev,
            gainFromPrev: current - prev,
            gainOverall: cowWeights.length > 0 ? current - cowWeights[cowWeights.length-1].weight : 0,
            adg: 0,
            lastWeighed: cowWeights[0]?.timestamp || '',
            recordsCount: cowWeights.length
          };
        });
        setReportData({
          summary: { 
            averageWeight: stats.averageWeight, 
            cowsGainedRate: 0, 
            cowsLostRate: 0, 
            mostImproved: { cowId: '', name: '', gain: 0 }, 
            leastImproved: { cowId: '', name: '', gain: 0 } 
          },
          chartData: [],
          details: reportDetails
        });
      }

    } catch (e) {
      console.error("Backend fetch failed. Ensure server is running on port 3002", e);
    }
  }, []);

  useEffect(() => {
    triggerMasterDataGrab();
  }, [backendUrl, triggerMasterDataGrab]);

  return {
    cows,
    weights,
    devices,
    dashboardStats,
    reportData,
    triggerMasterDataGrab
  };
};
