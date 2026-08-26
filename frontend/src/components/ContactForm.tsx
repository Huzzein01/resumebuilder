import type { ContactInfo, Link } from "@resumebuilder/shared";

interface Props {
  contact: ContactInfo;
  onChange: (contact: ContactInfo) => void;
}

export default function ContactForm({ contact, onChange }: Props) {
  function set<K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) {
    onChange({ ...contact, [key]: value });
  }

  function updateLink(index: number, link: Link) {
    const links = [...contact.links];
    links[index] = link;
    set("links", links);
  }

  function addLink() {
    set("links", [...contact.links, { label: "", url: "" }]);
  }

  function removeLink(index: number) {
    set(
      "links",
      contact.links.filter((_, i) => i !== index)
    );
  }

  return (
    <section className="form-section">
      <h2>Contact Info</h2>
      <div className="field-row">
        <div className="field">
          <label>Name</label>
          <input value={contact.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={contact.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={contact.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="field">
          <label>Location</label>
          <input value={contact.location} onChange={(e) => set("location", e.target.value)} />
        </div>
      </div>
      {contact.links.map((link, i) => (
        <div className="bullet-row" key={i}>
          <input
            placeholder="Label (e.g. LinkedIn)"
            value={link.label}
            onChange={(e) => updateLink(i, { ...link, label: e.target.value })}
          />
          <input
            placeholder="URL"
            value={link.url}
            onChange={(e) => updateLink(i, { ...link, url: e.target.value })}
          />
          <button className="danger" onClick={() => removeLink(i)}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={addLink}>+ Add Link</button>
    </section>
  );
}
