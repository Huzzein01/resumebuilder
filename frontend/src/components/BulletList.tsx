import type { Bullet } from "@resumebuilder/shared";
import { v4 as uuid } from "uuid";
import RichTextField from "./RichTextField.js";

interface Props {
  bullets: Bullet[];
  onChange: (bullets: Bullet[]) => void;
}

export default function BulletList({ bullets, onChange }: Props) {
  function updateBullet(index: number, text: string) {
    const next = [...bullets];
    next[index] = { ...next[index], text };
    onChange(next);
  }

  function addBullet() {
    onChange([...bullets, { id: uuid(), text: "" }]);
  }

  function removeBullet(index: number) {
    onChange(bullets.filter((_, i) => i !== index));
  }

  return (
    <div>
      {bullets.map((bullet, i) => (
        <div className="bullet-row" key={bullet.id}>
          <RichTextField
            value={bullet.text}
            onChange={(text) => updateBullet(i, text)}
            placeholder="Bullet point"
            className="richtext-bullet"
          />
          <button className="entry-remove-btn" onClick={() => removeBullet(i)} aria-label="Remove bullet" title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button onClick={addBullet}>+ Add Bullet</button>
    </div>
  );
}
