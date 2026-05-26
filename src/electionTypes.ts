export type VoterProfile = "청년" | "학부모" | "소상공인" | "고령층";

export type RaceType =
  | "광역단체장"
  | "교육감"
  | "기초단체장"
  | "광역의원"
  | "기초의원";

export type Residence = {
  id: string;
  city: string;
  district: string;
  neighborhood: string;
  cacheKey: string;
  cachedAt: string;
};

export type Pledge = {
  title: string;
  detail: string;
};

export type Candidate = {
  id: string;
  residenceId: string;
  name: string;
  number: number;
  numberLabel?: string;
  party: string;
  race: RaceType;
  office: string;
  age: number;
  occupation: string;
  color: string;
  photoUrl?: string;
  criminalRecord: {
    summary: string;
    details: string;
    tone: "clean" | "notice" | "risk";
  };
  publicRecord: string[];
  focusTags: string[];
  pledgeSummary: string;
  pledgeHighlights: string[];
  comparison: string;
  comparisonDetails: string[];
  fullPledges: Pledge[];
  profileRelevance: Record<VoterProfile, string>;
  cache: {
    policyPdf: string;
    normalizedAt: string;
  };
};
