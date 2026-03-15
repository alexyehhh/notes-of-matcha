export interface MatchaEntry {
  id: string;
  name: string;
  brand: string;
  prefecture: string;
  flavorProfile: {
    grassy: boolean;
    nutty: boolean;
    floral: boolean;
  };
  tasteAnalysis: {
    sweetness: number;
    bitterness: number;
    green: number;
    umami: number;
    astringency: number;
  };
  notes: string;
  color: string;
  image?: string;
  favorite: boolean;
}

export type ViewType = "landing" | "editable" | "grid" | "list" | "secret" | "profile";
