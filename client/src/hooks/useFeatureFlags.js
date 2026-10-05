/**
 * client/src/hooks/useFeatureFlags.js
 * Polls /api/settings/flags every 60 seconds.
 * Returns: { bookingsPaused, maintenanceBanner, isLoading }
 *
 * Used by:
 *  - App: show MaintenanceBanner when maintenanceBanner is non-empty or bookingsPaused=true
 */
import { useQuery } from "@tanstack/react-query";
import API from "../services/api";

const DEFAULT_FLAGS = {
  onlinePayments: true,
  bookingsPaused: false,
  maintenanceBanner: "",
};

export function useFeatureFlags() {
  const { data, isLoading } = useQuery({
    queryKey: ["featureFlags"],
    queryFn: async () => {
      const res = await API.get("/settings/flags");
      return res.data?.data || DEFAULT_FLAGS;
    },
    staleTime: 60_000,      // 1 minute
    refetchInterval: 60_000, // Poll every minute for live flag changes
    refetchIntervalInBackground: false,
    // On error, keep previous data (fail-open with last known good value)
    placeholderData: DEFAULT_FLAGS,
    retry: 1,
  });

  return {
    onlinePayments: data?.onlinePayments !== false,
    bookingsPaused: !!data?.bookingsPaused,
    maintenanceBanner: data?.maintenanceBanner || "",
    isLoading,
  };
}
