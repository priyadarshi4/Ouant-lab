import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-lab flex flex-col items-center justify-center text-center gap-4">
      <span className="font-mono text-cyan text-sm">ERR_404</span>
      <h1 className="font-display text-3xl font-semibold">Page not found in the lab</h1>
      <Link to="/dashboard" className="text-cyan hover:underline text-sm">Return to Mission Control</Link>
    </div>
  );
}
