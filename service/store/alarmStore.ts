import { create } from "zustand";

interface IAlarmState {
  hasNew: boolean;    
  setHasNew: (hasNew: boolean) => void;
}

const useAlarmStore = create<IAlarmState>((set) => ({
  hasNew: false,
  setHasNew: (isNew: boolean) => set({ hasNew: isNew })  
}));

export default useAlarmStore;
