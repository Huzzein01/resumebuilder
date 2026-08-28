import { useMemo, useState } from "react";
import GlobalNav from "../components/GlobalNav.js";
import { useSetSidebar } from "../shell/ShellContext.js";

const STORAGE_KEY = "resumebuilder.notificationSettings";

interface NotificationSettings {
  subscriptionReminders: boolean;
  newFeatures: boolean;
}

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore -- fall through to defaults
  }
  return { subscriptionReminders: true, newFeatures: true };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings);
  const sidebarNode = useMemo(() => <GlobalNav active="apps" />, []);
  useSetSidebar(sidebarNode);

  function toggle(key: keyof NotificationSettings) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best-effort only -- a private window or blocked storage just means the toggle won't persist
    }
  }

  return (
    <div className="app">
      <h1 className="page-title">Settings</h1>

      <section className="form-section">
        <h2>Notification Settings</h2>
        <p className="status">
          Stored only in this browser (no notification backend exists yet, so nothing is actually sent).
        </p>
        <label className="settings-toggle-row">
          <span>Subscription reminders</span>
          <input
            type="checkbox"
            checked={settings.subscriptionReminders}
            onChange={() => toggle("subscriptionReminders")}
          />
        </label>
        <label className="settings-toggle-row">
          <span>Updates about new features</span>
          <input type="checkbox" checked={settings.newFeatures} onChange={() => toggle("newFeatures")} />
        </label>
      </section>

      <section className="form-section">
        <h2>Account Settings</h2>
        <p className="status">
          This app has no user accounts or passwords yet (a single shared profile, no login) -- these need a real
          auth system before they can do anything.
        </p>
        <div className="field-row">
          <button disabled title="Not available -- no auth system yet">
            Reset Password
          </button>
          <button className="danger" disabled title="Not available -- no auth system yet">
            Deactivate Account
          </button>
        </div>
      </section>
    </div>
  );
}
