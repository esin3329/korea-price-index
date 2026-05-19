export const G20_COUNTRIES = [
  "ARG",
  "AUS",
  "BRA",
  "CAN",
  "CHN",
  "FRA",
  "DEU",
  "IND",
  "IDN",
  "ITA",
  "JPN",
  "KOR",
  "MEX",
  "RUS",
  "SAU",
  "ZAF",
  "TUR",
  "GBR",
  "USA",
] as const;

export type G20CountryCode = (typeof G20_COUNTRIES)[number];

export const BASE_YEAR = 2024;

export interface PriceLevelDataItem {
  countryCode: G20CountryCode;
  countryName: string;
  year: number;
  value: number;
  datasetType: "PRICE_LEVEL_RATIO";
}

export interface KCollusionIndex {
  countryCode: G20CountryCode;
  countryName: string;
  indexValue: number;
  baseYear: number;
  source: string;
  sourceDetail: string;
  rawPriceLevelRatio: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
  rank: number;
  countryCode: G20CountryCode;
  source: string;
  sourceDetail: string;
  rawPriceLevelRatio: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export const COUNTRY_NAMES: Record<G20CountryCode, string> = {
  ARG: "아르헨티나",
  AUS: "호주",
  BRA: "브라질",
  CAN: "캐나다",
  CHN: "중국",
  FRA: "프랑스",
  DEU: "독일",
  IND: "인도",
  IDN: "인도네시아",
  ITA: "이탈리아",
  JPN: "일본",
  KOR: "대한민국",
  MEX: "멕시코",
  RUS: "러시아",
  SAU: "사우디아라비아",
  ZAF: "남아프리카공화국",
  TUR: "튀르키예",
  GBR: "영국",
  USA: "미국",
};
