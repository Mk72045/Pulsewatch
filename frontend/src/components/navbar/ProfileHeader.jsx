import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import NavIcon from "./NavIcon.jsx";

const ProfileHeader = ({ user }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="h-20 bg-linear-to-r from-emerald-100 via-emerald-50 to-slate-100 sm:h-24" />

    <div className="px-5 pb-5">
      <Avatar
        email={user.email}
        className="relative -mt-10 h-20 w-20 text-3xl ring-4 ring-white"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900">
            {user.email}
          </h2>
          <p className="text-sm text-slate-500">Pulsewatch account</p>
        </div>

        <Link
          to="/settings"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <NavIcon name="settings" className="h-4 w-4 text-slate-500" />
          Settings
        </Link>
      </div>
    </div>
  </section>
);

export default ProfileHeader;
