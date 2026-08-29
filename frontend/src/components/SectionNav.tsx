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
  /**
   * Controlled mode: the parent owns which item is active and what
   * clicking does (e.g. a wizard where each section is its own page, not a
   * scroll anchor). Pass both to switch out of the default scroll-to-anchor
   * + IntersectionObserver behavior below.
   */
  activeId?: string;
  onSelect?: (id: string) => void;
  /**
   * Enables drag-to-reorder (native HTML5 DnD, same pattern as
   * DraggableChecklist) -- called with the full reordered id list on drop.
   * Only meaningful in controlled mode; omit to leave items non-draggable
   * (e.g. JobDescriptionPage's scroll-anchor usage, where reordering
   * wouldn't mean anything).
   */
  onReorder?: (newOrderIds: string[]) => void;
}

/**
 * Left sidebar section nav. In the default (uncontrolled) mode it's scoped
 * to whatever scrollable container the page renders (`.shell-main`):
 * clicking scrolls the target section into view, and an IntersectionObserver
 * keeps the active item in sync with actual scroll position so it still
 * works if the user scrolls manually instead of clicking. In controlled
 * mode (activeId/onSelect both passed) it's a plain page switcher --
 * there's nothing to scroll to since only one section renders at a time.
 */
export default function SectionNav({ items, activeId: controlledActiveId, onSelect, onReorder }: SectionNavProps) {
  const isControlled = controlledActiveId !== undefined && onSelect !== undefined;
  const [internalActiveId, setInternalActiveId] = useState(items.find((i) => !i.disabled)?.id ?? items[0]?.id);
  const activeId = isControlled ? controlledActiveId : internalActiveId;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (isControlled) return;
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
        setInternalActiveId(topId);
      },
      { root: document.querySelector(".shell-main"), threshold: [0.1, 0.3, 0.6] }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [items, isControlled]);

  function handleClick(item: SectionNavItem) {
    if (item.disabled) return;
    if (isControlled) {
      onSelect!(item.id);
      return;
    }
    const el = document.getElementById(item.id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setInternalActiveId(item.id);
  }

  function handleDrop(targetId: string) {
    if (!onReorder || !draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }
    const ids = items.map((i) => i.id);
    const withoutSource = ids.filter((id) => id !== draggingId);
    const targetIndex = withoutSource.indexOf(targetId);
    withoutSource.splice(targetIndex, 0, draggingId);
    onReorder(withoutSource);
    setDraggingId(null);
  }

  return (
    <nav className="section-nav" aria-label="Sections">
      {items.map((item) => (
        <button
          key={item.id}
          className={`section-nav-item${activeId === item.id ? " active" : ""}${item.disabled ? " disabled" : ""}${draggingId === item.id ? " dragging" : ""}`}
          onClick={() => handleClick(item)}
          disabled={item.disabled}
          title={item.disabled ? item.disabledHint : undefined}
          type="button"
          draggable={!!onReorder}
          onDragStart={onReorder ? () => setDraggingId(item.id) : undefined}
          onDragOver={onReorder ? (e) => e.preventDefault() : undefined}
          onDrop={onReorder ? () => handleDrop(item.id) : undefined}
          onDragEnd={onReorder ? () => setDraggingId(null) : undefined}
        >
          {onReorder && (
            <span className="section-nav-drag-handle" aria-hidden="true">
              ⠿
            </span>
          )}
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
