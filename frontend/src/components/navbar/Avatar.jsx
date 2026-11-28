// Shows the first letter of the email. A photo can be added here later.
const Avatar = ({ email = "", className = "h-9 w-9 text-sm" }) => {
  const letter = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center rounded-full bg-emerald-100 font-semibold text-emerald-700 ${className}`}
    >
      {letter}
    </span>
  );
};

export default Avatar;
