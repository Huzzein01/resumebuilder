import { useEffect, useMemo, useState } from "react";
import type { Profile } from "@resumebuilder/shared";
import { fetchProfile } from "../api/profileApi.js";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar } from "../shell/ShellContext.js";
import { useNav } from "../shell/NavContext.js";

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { navigate } = useNav();
  const sidebarNode = useMemo(() => <GlobalNav active="apps" />, []);
  useSetSidebar(sidebarNode);

  useEffect(() => {
    fetchProfile().then(setProfile);
  }, []);

  return (
    <div className="app">
      <h1 className="page-title">My Profile</h1>
      <section className="form-section">
        <h2>Personal Information</h2>
        <p className="status">
          This app runs as a single profile with no separate account system, so this mirrors your resume's Contact
          Info -- edit it from the Resume Builder.
        </p>
        <div className="account-field-list">
          <div className="account-field-row">
            <span className="account-field-label">Name</span>
            <span>{profile?.contact.name || "—"}</span>
          </div>
          <div className="account-field-row">
            <span className="account-field-label">Email</span>
            <span>{profile?.contact.email || "—"}</span>
          </div>
          <div className="account-field-row">
            <span className="account-field-label">Phone</span>
            <span>{profile?.contact.phone || "—"}</span>
          </div>
          <div className="account-field-row">
            <span className="account-field-label">Location</span>
            <span>{profile?.contact.location || "—"}</span>
          </div>
        </div>
        <button className="secondary" onClick={() => navigate({ page: "editor-profile" })}>
          Edit in Resume Builder
        </button>
      </section>
    </div>
  );
}
