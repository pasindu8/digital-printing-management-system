import { Button } from "@/components/ui/button";
import Link from "next/link"; // Changed from "react-router-dom" to "next/link"

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}
