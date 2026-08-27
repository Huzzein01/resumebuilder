import { useEffect, useRef, useState } from "react";

export interface SectionNavItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  disabledHint?: string;
}

interface SectionNavProps {
  items: SectionNavItem[];
}

/**
 * Left sidebar section nav, scoped to whatever scrollable container the page
 * renders (`.shell-main`). Clicking scrolls the target section into view;
 * an IntersectionObserver keeps the active item in sync with actual scroll
 * position so it still works if the user scrolls manually instead of clicking.
 */
export default function SectionNav({ items }: SectionNavProps) {
  const [activeId, setActiveId] = useState(items.find((i) => !i.disabled)?.id ?? items[0]?.id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const visible = new Map<string, number>();
    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.set(id, entry.intersectionRatio);
          else visible.delete(id);
        }
        if (visible.size === 0) return;
        const [topId] = [...visible.entries()].sort((a, b) => b[1] - a[1])[0];
        setActiveId(topId);
      },
      { root: document.querySelector(".shell-main"), threshold: [0.1, 0.3, 0.6] }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [items]);

  function handleClick(item: SectionNavItem) {
    if (item.disabled) return;
    const el = document.getElementById(item.id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(item.id);
  }

  return (
    <nav className="section-nav" aria-label="Sections">
      {items.map((item) => (
        <button
          key={item.id}
          className={`section-nav-item${activeId === item.id ? " active" : ""}${item.disabled ? " disabled" : ""}`}
          onClick={() => handleClick(item)}
          disabled={item.disabled}
          title={item.disabled ? item.disabledHint : undefined}
          type="button"
        >
          {item.icon && (
            <span className="section-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
