import { createContext, useContext } from "react";

const SidebarContext = createContext<[boolean, (isOpen: boolean) => void]>([
  false,
  () => {},
]);

export const useSidebarContext = () => {
  return useContext(SidebarContext);
};

export const SidebarContextProvider = SidebarContext.Provider;
