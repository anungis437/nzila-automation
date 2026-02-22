export const consentTypeValues = [
  "essential",
  "functional",
  "analytics",
  "marketing",
  "personalization",
  "third_party",
] as const;

export type ConsentType = (typeof consentTypeValues)[number];

export interface ConsentPurposeConfig {
  id: ConsentType;
  name: string;
  description: string;
  category: "essential" | "functional" | "analytics" | "marketing";
  required: boolean;
  legalBasis: string;
  processingPurpose: string;
  dataUse: string[];
  retentionPeriod: string;
  consentText: string;
  consentVersion: string;
}

export const consentPurposes: ConsentPurposeConfig[] = [
  {
    id: "essential",
    name: "Essential Services",
    description: "Required for core functionality, security, and account access.",
    category: "essential",
    required: true,
    legalBasis: "contract_performance",
    processingPurpose: "service_delivery",
    dataUse: ["Authentication", "Account security", "Service delivery"],
    retentionPeriod: "Account lifetime",
    consentText: "We process essential data to provide and secure the service.",
    consentVersion: "v1",
  },
  {
    id: "functional",
    name: "Functional Enhancements",
    description: "Improves usability and remembers your preferences.",
    category: "functional",
    required: false,
    legalBasis: "legitimate_interest",
    processingPurpose: "service_delivery",
    dataUse: ["Preferences", "UI personalization"],
    retentionPeriod: "12 months",
    consentText: "We use functional data to improve your experience.",
    consentVersion: "v1",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Helps us understand usage and improve performance.",
    category: "analytics",
    required: false,
    legalBasis: "consent",
    processingPurpose: "consent",
    dataUse: ["Usage metrics", "Performance diagnostics"],
    retentionPeriod: "24 months",
    consentText: "We collect analytics data to improve the platform.",
    consentVersion: "v1",
  },
  {
    id: "marketing",
    name: "Marketing Communications",
    description: "Lets us send updates, announcements, and offers.",
    category: "marketing",
    required: false,
    legalBasis: "consent",
    processingPurpose: "consent",
    dataUse: ["Email communications", "Product updates"],
    retentionPeriod: "Until withdrawal",
    consentText: "We send marketing communications with your consent.",
    consentVersion: "v1",
  },
];
