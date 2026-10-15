export const RELATIONSHIP_CHECKLIST = [
  { key: "sop", field: "sopCompletedAt", label: "SOP - Completed" },
  { key: "contractCreated", field: "contractCreatedAt", label: "Contract created" },
  { key: "contractSigned", field: "contractSignedAt", label: "Contract signed and stored" },
  { key: "dropZoneCredentials", field: "dropZoneCredentialsAt", label: "Drop Zone credentials acquired" },
  { key: "contractorApp", field: "contractorAppOnboardedAt", label: "Contractor App onboarded" },
] as const;

export type RelationshipChecklistKey = (typeof RELATIONSHIP_CHECKLIST)[number]["key"];
export type RelationshipChecklistField = (typeof RELATIONSHIP_CHECKLIST)[number]["field"];

export type RelationshipChecklistDates = {
  [K in RelationshipChecklistField]: Date | string | null;
};
