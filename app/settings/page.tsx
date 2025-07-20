"use client";

import { MainLayout } from "@/components/main-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Construction } from "lucide-react";

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <Alert className="mb-6 sm:mb-8">
          <Construction className="h-4 w-4" />
          <AlertDescription>
            This page is currently under development. Settings functionality
            will be available soon.
          </AlertDescription>
        </Alert>
      </div>
    </MainLayout>
  );
}
