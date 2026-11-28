import NavIcon from "./NavIcon.jsx";

const Brand = () => (
  <span className="flex items-center gap-3">
    <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
      <NavIcon name="pulse" />
      <span className="absolute -right-1 -top-1 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
    </span>
    <span>
      <span className="block font-semibold leading-tight text-slate-900">
        Pulsewatch
      </span>
      <span className="block text-xs text-slate-500">Uptime monitoring</span>
    </span>
  </span>
);

export default Brand;