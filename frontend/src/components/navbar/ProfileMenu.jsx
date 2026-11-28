import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { isActivePath } from "../../utils/isActivePath.js";
import Avatar from "./Avatar.jsx";
import LogoutButton from "./LogoutButton.jsx";
import NavItem from "./NavItem.jsx";

const ProfileMenu = ({ user, links, onLogout }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const { pathname } = useLocation();

  const onAccountPage = isActivePath(
    pathname,
    links.flatMap((link) => link.paths),
  );

  // While the dropdown is open, close it on an outside press or Escape.
  useEffect(() => {
    if (!open) return;

    function handlePress(event) {
      if (!boxRef.current.contains(event.target)) setOpen(false);
    }

    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePress);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("pointerdown", handlePress);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const logoutAndClose = () => {
    close();
    onLogout();
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls="account-menu"
        className={`rounded-full ring-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
          onAccountPage
            ? "ring-emerald-500"
            : "ring-transparent hover:ring-slate-300"
        }`}
      >
        <Avatar email={user.email} />
      </button>

      {open && (
        <div
          id="account-menu"
          className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition duration-150 starting:scale-95 starting:opacity-0 motion-reduce:transition-none"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="truncate text-sm font-medium text-slate-900">
              {user.email}
            </p>
          </div>

          <div className="my-1 border-t border-slate-200" />

          {links.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              paths={link.paths}
              icon={link.icon}
              iconOnDesktop
              onClick={close}
            >
              {link.label}
            </NavItem>
          ))}

          <div className="my-1 border-t border-slate-200" />

          <LogoutButton onClick={logoutAndClose} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
