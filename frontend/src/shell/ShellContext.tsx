import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface ShellSlots {
  sidebar: ReactNode;
  topBarExtra: ReactNode;
  subHeader: ReactNode;
}

interface ShellContextValue extends ShellSlots {
  setSidebar: (node: ReactNode) => void;
  setTopBarExtra: (node: ReactNode) => void;
  setSubHeader: (node: ReactNode) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<ReactNode>(null);
  const [topBarExtra, setTopBarExtra] = useState<ReactNode>(null);
  const [subHeader, setSubHeader] = useState<ReactNode>(null);

  // Without this memo, `value` is a fresh object literal every ShellProvider
  // render, which forces every context consumer (AppShell, and via it every
  // page calling useSetSidebar/useSetTopBarExtra) to re-render even when
  // sidebar/topBarExtra didn't actually change -- amplifying, and possibly by
  // itself sufficient to cause, an infinite render loop with those hooks.
  const value = useMemo(
    () => ({ sidebar, topBarExtra, subHeader, setSidebar, setTopBarExtra, setSubHeader }),
    [sidebar, topBarExtra, subHeader]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

function useShellContext(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShellContext must be used within a ShellProvider");
  return ctx;
}

export function useShellSlots(): ShellSlots {
  const { sidebar, topBarExtra, subHeader } = useShellContext();
  return { sidebar, topBarExtra, subHeader };
}

/**
 * Pages call this to register their sidebar content; cleared automatically on
 * unmount. `node` must be referentially stable across renders where its
 * content hasn't actually changed (wrap it in useMemo at the call site) --
 * without that, a fresh JSX element every render means this effect's
 * dependency never matches, the effect never stops firing, and this setState
 * makes every render of the page trigger another one, forever.
 */
export function useSetSidebar(node: ReactNode): void {
  const { setSidebar } = useShellContext();
  useEffect(() => {
    setSidebar(node);
    return () => setSidebar(null);
  }, [node, setSidebar]);
}

/** Pages call this to register content shown on the right side of the top bar (e.g. a promoted action). Same memoization requirement as useSetSidebar. */
export function useSetTopBarExtra(node: ReactNode): void {
  const { setTopBarExtra } = useShellContext();
  useEffect(() => {
    setTopBarExtra(node);
    return () => setTopBarExtra(null);
  }, [node, setTopBarExtra]);
}

/**
 * Pages call this to register a full-width band rendered directly under the
 * top bar and above the sidebar/content row -- e.g. the editor's formatting
 * + tools nav. Spanning the whole shell (rather than living inside the
 * page's own max-width container) is the point: it lets the two toolbar
 * groups sit hard against the left and right edges of the window instead of
 * being squeezed together in the middle of a narrow content column.
 * Same memoization requirement as useSetSidebar.
 */
export function useSetSubHeader(node: ReactNode): void {
  const { setSubHeader } = useShellContext();
  useEffect(() => {
    setSubHeader(node);
    return () => setSubHeader(null);
  }, [node, setSubHeader]);
}
