import AccountDetails from "../components/navbar/AccountDetails.jsx";
import ProfileHeader from "../components/navbar/ProfileHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Your account information.</p>

      <div className="mt-6 space-y-6">
        <ProfileHeader user={user} />
        <AccountDetails user={user} />
      </div>
    </div>
  );
};

export default Profile;
