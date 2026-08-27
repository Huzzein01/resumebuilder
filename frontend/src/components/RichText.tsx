import { parseRichText } from "@resumebuilder/shared";

interface Props {
  text: string;
}

/** Renders sanitized rich text as real React elements (never dangerouslySetInnerHTML) -- safe by construction since parseRichText only ever emits plain strings plus a fixed bold/italic/underline flag set. */
export default function RichText({ text }: Props) {
  const segments = parseRichText(text);
  return (
    <>
      {segments.map((seg, i) => {
        let node: React.ReactNode = seg.text;
        if (seg.bold) node = <strong>{node}</strong>;
        if (seg.italic) node = <em>{node}</em>;
        if (seg.underline) node = <u>{node}</u>;
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}
