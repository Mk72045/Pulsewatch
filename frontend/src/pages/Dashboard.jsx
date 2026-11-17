import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <section>
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="mt-2 text-slate-600">Your monitors will appear here.</p>
    </section>
  );
}
