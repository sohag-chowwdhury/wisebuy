import { MainLayout } from "@/components/main-layout";
import { PhotoUpload } from "@/components/photo-upload";
import { FeaturesSection } from "@/components/features-section";

export default function Home() {
  return (
    <MainLayout>
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              FlipForge
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your product photos and let our AI help you create the
              perfect listing.
            </p>
          </div>
          <PhotoUpload />
        </div>
        <FeaturesSection />
      </main>
    </MainLayout>
  );
}
