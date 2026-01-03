import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Profile {
  id: number;
}

interface ProfileStore {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create(
  persist<ProfileStore>(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: "profileStorage",
    }
  )
);
