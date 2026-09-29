import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getAdminDashboardStats } from "../../services/api";

const AdminRealtimeContext = createContext(null);

export function AdminRealtimeProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevSubmissionsRef = useRef(null);
  const prevOrdersRef = useRef(null);

  // Play subtle audio alert on new items
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (_err) {
      // AudioContext might be muted or not allowed without interaction
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getAdminDashboardStats();
      const data = res.data?.data;
      if (data) {
        setStats(data);
        const newSubs = data.newSubmissionsCount || 0;
        const newOrders = data.ordersNeedingAction || 0;
        const totalBadges = newSubs + newOrders;
        setUnreadCount(totalBadges);

        // Update document title badge
        if (totalBadges > 0) {
          document.title = `(${totalBadges}) Decor Joy Admin`;
        } else {
          document.title = "Decor Joy Admin";
        }

        // Detect if count increased
        if (
          prevSubmissionsRef.current !== null &&
          (newSubs > prevSubmissionsRef.current || newOrders > (prevOrdersRef.current || 0))
        ) {
          playAlertSound();
        }

        prevSubmissionsRef.current = newSubs;
        prevOrdersRef.current = newOrders;
      }
    } catch (_err) {
      // Silently retry on next poll interval
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminRealtimeContext.Provider value={{ stats, unreadCount, refreshStats: fetchStats }}>
      {children}
    </AdminRealtimeContext.Provider>
  );
}

export function useAdminRealtime() {
  const ctx = useContext(AdminRealtimeContext);
  return ctx || { stats: null, unreadCount: 0, refreshStats: () => {} };
}
