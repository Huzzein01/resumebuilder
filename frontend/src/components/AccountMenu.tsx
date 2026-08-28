import { useState } from "react";
import { useNav } from "../shell/NavContext.js";

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const { navigate } = useNav();

  return (
    <div className="account-menu">
      <button
        className="account-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-label="Account menu"
      >
        👤
      </button>
      {open && (
        <div className="account-menu-dropdown">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate({ page: "account-profile" });
            }}
          >
            My Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate({ page: "account-settings" });
            }}
          >
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
