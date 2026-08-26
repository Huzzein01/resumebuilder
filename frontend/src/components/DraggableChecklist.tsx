import { useState, type ReactNode } from "react";

export interface ChecklistItem {
  id: string;
  label: string;
  sublabel?: string;
  selected: boolean;
}

interface Props {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onReorder: (newOrderedIds: string[]) => void;
  renderExtra?: (item: ChecklistItem) => ReactNode;
}

export default function DraggableChecklist({ items, onToggle, onReorder, renderExtra }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
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
    <ul className="draggable-checklist">
      {items.map((item) => (
        <li
          key={item.id}
          className={draggingId === item.id ? "dragging" : ""}
          draggable
          onDragStart={() => setDraggingId(item.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(item.id)}
          onDragEnd={() => setDraggingId(null)}
        >
          <div className="checklist-row">
            <span className="drag-handle" aria-hidden="true">
              ⠿
            </span>
            <input type="checkbox" checked={item.selected} onChange={() => onToggle(item.id)} />
            <span className="checklist-label">{item.label}</span>
            {item.sublabel && <span className="checklist-sublabel">{item.sublabel}</span>}
          </div>
          {renderExtra?.(item)}
        </li>
      ))}
    </ul>
  );
}
