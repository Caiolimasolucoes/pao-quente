'use client';

import { createContext, useContext, useState } from 'react';

interface SidebarCtxValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarCtx = createContext<SidebarCtxValue>({ open: false, toggle: () => {}, close: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarCtx.Provider value={{ open, toggle: () => setOpen(p => !p), close: () => setOpen(false) }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebar() { return useContext(SidebarCtx); }
