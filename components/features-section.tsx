import { Camera, LineChart, Search, Share2 } from "lucide-react";

const features = [
  {
    name: "Product Recognition",
    description:
      "AI-powered product identification, condition assessment, and visual feature analysis.",
    icon: Camera,
  },
  {
    name: "Data Enrichment",
    description:
      "Automated MSRP research, specification gathering, and competitive analysis.",
    icon: Search,
  },
  {
    name: "Intelligent Pricing",
    description:
      "Dynamic pricing based on market data, condition, and historical trends.",
    icon: LineChart,
  },
  {
    name: "Multi-Channel Publishing",
    description:
      "Simultaneously list on multiple platforms with SEO-optimized content.",
    icon: Share2,
  },
];

export function FeaturesSection() {
  return (
    <div className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-sm sm:text-base font-semibold leading-7 text-primary">
            Faster Listing Creation
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Everything you need to create perfect listings
          </p>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
            Our AI-powered platform streamlines the entire listing creation
            process, from photo analysis to multi-channel publishing.
          </p>
        </div>
        <div className="mx-auto mt-12 sm:mt-16 lg:mt-20 max-w-2xl sm:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <feature.icon
                    className="h-5 w-5 flex-none text-primary"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-3 sm:mt-4 flex flex-auto flex-col text-sm sm:text-base leading-6 sm:leading-7 text-muted-foreground">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
