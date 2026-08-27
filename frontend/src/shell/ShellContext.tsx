import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ShellSlots {
  sidebar: ReactNode;
  topBarExtra: ReactNode;
}

interface ShellContextValue extends ShellSlots {
  setSidebar: (node: ReactNode) => void;
  setTopBarExtra: (node: ReactNode) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<ReactNode>(null);
  const [topBarExtra, setTopBarExtra] = useState<ReactNode>(null);

  return (
    <ShellContext.Provider value={{ sidebar, topBarExtra, setSidebar, setTopBarExtra }}>
      {children}
    </ShellContext.Provider>
  );
}

function useShellContext(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShellContext must be used within a ShellProvider");
  return ctx;
}

export function useShellSlots(): ShellSlots {
  const { sidebar, topBarExtra } = useShellContext();
  return { sidebar, topBarExtra };
}

/** Pages call this to register their sidebar content; cleared automatically on unmount. */
export function useSetSidebar(node: ReactNode): void {
  const { setSidebar } = useShellContext();
  useEffect(() => {
    setSidebar(node);
    return () => setSidebar(null);
  });
}

/** Pages call this to register content shown on the right side of the top bar (e.g. a promoted action). */
export function useSetTopBarExtra(node: ReactNode): void {
  const { setTopBarExtra } = useShellContext();
  useEffect(() => {
    setTopBarExtra(node);
    return () => setTopBarExtra(null);
  });
}
