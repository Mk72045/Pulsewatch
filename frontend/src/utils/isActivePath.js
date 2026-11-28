// "/" is a special case: every URL starts with "/", so it must match exactly.
export function isActivePath(pathname, paths) {
  return paths.some((path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path),
  );
}
