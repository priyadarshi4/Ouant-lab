import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Spinner from "../ui/Spinner.jsx";

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useSelector((s) => s.auth);

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-lab">
        <Spinner label="Authenticating..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
