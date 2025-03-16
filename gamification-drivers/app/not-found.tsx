"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 2 seconds
    const timeout = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>404 - Page Not Found</AlertTitle>
          <AlertDescription>
            The page you are looking for does not exist. You will be redirected to the home page in 2 seconds...
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
} 