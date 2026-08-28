import type { Bullet } from "@resumebuilder/shared";
import BulletList from "./BulletList.js";

interface Props {
  title: string;
  helpText?: string;
  bullets: Bullet[];
  onChange: (bullets: Bullet[]) => void;
}

/** Publications and Publications Abstract are both just a numbered list of entries. */
export default function BulletListSection({ title, helpText, bullets, onChange }: Props) {
  return (
    <section className="form-section">
      <h2>{title}</h2>
      {helpText && <p className="status">{helpText}</p>}
      <BulletList bullets={bullets} onChange={onChange} />
    </section>
  );
}
