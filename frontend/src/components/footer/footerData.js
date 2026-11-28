// Everything the footer shows, in one place. Change the content here,
// not inside the components.

export const privateGroups = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Add monitor", to: "/monitors/new" },
      { label: "Incidents", to: "/incidents" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Profile", to: "/profile" },
      { label: "Settings", to: "/settings" },
    ],
  },
];

export const publicGroups = [
  {
    title: "Get started",
    links: [
      { label: "Create account", to: "/register" },
      { label: "Log in", to: "/login" },
      { label: "Log in with a code", to: "/login/code" },
    ],
  },
];

// Only things the app really does today.
// `chip` is the icon background and colour. The full class names are written
// out on purpose: Tailwind cannot find a class that is built from pieces.
export const features = [
  {
    text: "Checks your URLs on a schedule you choose",
    icon: "clock",
    chip: "bg-emerald-100 text-emerald-600",
  },
  {
    text: "Response time charts for 6 hours, 24 hours and 7 days",
    icon: "chart",
    chip: "bg-sky-100 text-sky-600",
  },
  {
    text: "Incident tracking for every monitor",
    icon: "incidents",
    chip: "bg-amber-100 text-amber-600",
  },
  {
    text: "Instant Telegram alerts",
    icon: "bell",
    chip: "bg-violet-100 text-violet-600",
  },
  {
    text: "A public status page you can share",
    icon: "globe",
    chip: "bg-teal-100 text-teal-600",
  },
  {
    text: "Log in with a password, an email code or Google",
    icon: "key",
    chip: "bg-rose-100 text-rose-600",
  },
];


// A link is shown only when its url is filled in.
// Example: url: "https://github.com/your-name"
export const socials = [
  { label: "GitHub", icon: "github", url: "" },
  { label: "LinkedIn", icon: "linkedin", url: "" },
];