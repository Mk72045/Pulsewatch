import { useState } from "react";
import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";
import LogoutButton from "./LogoutButton.jsx";
import MenuIcon from "./MenuIcon.jsx";
import NavItem from "./NavItem.jsx";
import ProfileMenu from "./ProfileMenu.jsx";

// "paths" lists every URL start that should light this link up.
// Monitor pages live under /monitors, but they belong to the Dashboard.
const privateLinks = [
  {
    label: "Dashboard",
    to: "/dashboard",
    paths: ["/dashboard", "/monitors"],
    icon: "dashboard",
  },
  {
    label: "Incidents",
    to: "/incidents",
    paths: ["/incidents"],
    icon: "incidents",
  },
];

// Shown in the profile dropdown (tablet, desktop) and in the mobile drawer.
const accountLinks = [
  { label: "Profile", to: "/profile", paths: ["/profile"], icon: "profile" },
  {
    label: "Settings",
    to: "/settings",
    paths: ["/settings"],
    icon: "settings",
  },
];

const publicLinks = [
  { label: "Log in", to: "/login", paths: ["/login"], icon: "login" },
  {
    label: "Register",
    to: "/register",
    paths: ["/register", "/verify-email"],
    icon: "register",
    barClass: "border border-slate-300",
  },
];

const NavbarHero = ({ user, handleLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const barLinks = user ? privateLinks : publicLinks;
  const drawerLinks = user ? [...privateLinks, ...accountLinks] : publicLinks;

  const closeMenu = () => setMenuOpen(false);

  const logoutAndClose = () => {
    closeMenu();
    handleLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 md:px-6">
          <Link
            to="/"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          >
            <Brand />
          </Link>

          {/* Tablet and desktop: links in a row, then the profile menu */}
          <nav
            aria-label="Main"
            className="hidden items-center gap-1 md:flex lg:gap-2"
          >
            {barLinks.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                paths={link.paths}
                icon={link.icon}
                className={link.barClass}
              >
                {link.label}
              </NavItem>
            ))}
            {user && (
              <ProfileMenu
                user={user}
                links={accountLinks}
                onLogout={handleLogout}
              />
            )}
          </nav>

          {/* Mobile: opens the drawer */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Mobile drawer. Outside <header> on purpose: the header has backdrop-blur,
          which would shrink a fixed child to the header's size. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            onClick={closeMenu}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none"
            aria-hidden="true"
          />

          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="absolute inset-y-0 left-0 isolate flex w-2/3 max-w-xs flex-col gap-1 overflow-hidden rounded-r-2xl bg-linear-to-b from-white to-slate-50 p-4 shadow-2xl transition-transform duration-300 ease-out starting:-translate-x-full motion-reduce:transition-none"
          >
            {/* Soft green glow in the corner, behind the content */}
            <div className="pointer-events-none absolute -left-16 -top-16 -z-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="mb-4 flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <MenuIcon open />
              </button>
            </div>

            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu
            </p>

            {drawerLinks.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                paths={link.paths}
                icon={link.icon}
                onClick={closeMenu}
                className="py-3 text-base"
              >
                {link.label}
              </NavItem>
            ))}

            {user ? (
              <LogoutButton
                onClick={logoutAndClose}
                className="mt-auto border-t border-slate-200 py-3 text-base"
              />
            ) : (
              <p className="mt-auto rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Know when your site goes down, before your users do.
              </p>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default NavbarHero;
