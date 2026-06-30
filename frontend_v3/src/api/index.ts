import axios from 'axios';
import { Cow, WeightRecord, Device, DashboardStats } from '../types';

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axios.get('/api/dashboard/stats');
  return response.data;
};

export const fetchCows = async (): Promise<Cow[]> => {
  const response = await axios.get('/api/cows');
  return response.data;
};

export const createCow = async (cow: Partial<Cow>): Promise<Cow> => {
  const response = await axios.post('/api/cows', cow);
  return response.data;
};

export const updateCow = async (id: string, data: Partial<Cow>): Promise<Cow> => {
  const response = await axios.patch(`/api/cows/${id}`, data);
  return response.data;
};

export const deleteCow = async (id: string): Promise<void> => {
  await axios.delete(`/api/cows/${id}`);
};

export const fetchDevices = async (): Promise<Device[]> => {
  const response = await axios.get('/api/devices');
  return response.data;
};

export const fetchWeights = async (): Promise<WeightRecord[]> => {
  const response = await axios.get('/api/weights');
  return response.data;
};

export const addWeight = async (cowId: string, weight: number, deviceId: string): Promise<void> => {
  await axios.post(`/api/cows/${cowId}/weights`, { weight, deviceId });
};
