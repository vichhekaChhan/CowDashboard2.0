import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveScaleState } from '../types';

export const useSocket = (backendUrl: string, triggerMasterDataGrab: () => void) => {
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [liveScale, setLiveScale] = useState<LiveScaleState>({ 
    deviceId: 'SCALE-01', 
    weight: 0, 
    stable: false, 
    timestamp: new Date().toISOString() 
  });

  useEffect(() => {
    const socket: Socket = io(backendUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('weight_update', (data: any) => {
      setLiveScale({
        deviceId: data.deviceId,
        weight: data.display || data.weight,
        stable: data.stable,
        timestamp: data.timestamp
      });
    });

    socket.on('db_changed', () => triggerMasterDataGrab());

    return () => { socket.disconnect(); };
  }, [backendUrl, triggerMasterDataGrab]);

  return { socketConnected, liveScale };
};
