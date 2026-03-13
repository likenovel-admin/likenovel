"use client";
import { getAdminDetail } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthenticate";
import { useProfileStore } from "@/store/useProfileStore";
import { IUserAdmin } from "@/types/user";
import * as React from "react";

export function useProfile() {
  const { isAuthenticated } = useAuthStore();
  const { profile } = useProfileStore();
  const [userProfile, setUserProfile] = React.useState<IUserAdmin | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminDetail(profile?.id || 0);
      setUserProfile(response && response.length > 0 ? response[0] : null);
    } catch (error) {
      setUserProfile(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated && profile?.id) {
      fetchUserProfile();
    } else if (!isAuthenticated) {
      setUserProfile(null);
      setIsInitialized(true);
    }
  }, [isAuthenticated, profile?.id]);

  return {
    userProfile,
    roleType: isInitialized ? userProfile?.role_type : undefined,
    isAdmin: isInitialized ? userProfile?.role_type === "admin" : undefined,
    isPartner: isInitialized ? userProfile?.role_type === "CP" : undefined,
    isAuthor: isInitialized ? userProfile?.role_type === "author" : undefined,
    isLoading,
    isInitialized,
  };
}
