import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "../services/api";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await getPublicSettings();
      return res.data?.data || {};
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });

  const business = data?.business || {};
  const phone = business.phone || "+91 7015767715";
  const whatsapp = business.whatsapp || "+91 7015767715";
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, "");

  const value = {
    settings: data,
    business,
    phone,
    whatsapp,
    cleanPhone,
    cleanWhatsapp,
    slots: data?.slots || [],
    serviceablePincodes: data?.serviceablePincodes || [],
    isLoading,
    error,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function usePublicSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    // Return graceful fallback object if rendered outside provider
    return {
      phone: "+91 7015767715",
      whatsapp: "+91 7015767715",
      cleanPhone: "917015767715",
      cleanWhatsapp: "917015767715",
      business: { name: "Decor Joy Gurgaon" },
      slots: [],
      serviceablePincodes: [],
      isLoading: false,
    };
  }
  return context;
}
