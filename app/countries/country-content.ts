import dataFile from "@/public/data/k-collusion-index.json";
import type { KCollusionIndex } from "@/app/types/oecd";

type DataFile = typeof dataFile & {
  data: KCollusionIndex[];
  sourceUrl: string;
  consumerInflationSourceUrl: string;
  latestCpiInflationSourceUrl: string;
};

export type CountryPageInfo = {
  code: KCollusionIndex["countryCode"];
  slug: string;
  name: string;
  angle: string;
};

export type CountryDataResult = {
  info: CountryPageInfo;
  item: KCollusionIndex;
  payload: DataFile;
};

export const countryPages: CountryPageInfo[] = [
  { code: "USA", slug: "united-states", name: "미국", angle: "G20 안에서 가장 높은 가격수준 그룹에 속합니다." },
  { code: "AUS", slug: "australia", name: "호주", angle: "높은 임금과 서비스 가격이 반영되는 선진국형 가격수준을 보입니다." },
  { code: "GBR", slug: "united-kingdom", name: "영국", angle: "한국보다 높은 가격수준과 완만한 CPI 흐름을 함께 확인할 수 있습니다." },
  { code: "CAN", slug: "canada", name: "캐나다", angle: "북미권 가격수준 비교에서 미국과 함께 상위권에 놓입니다." },
  { code: "DEU", slug: "germany", name: "독일", angle: "유럽 주요 제조업 국가의 가격수준 기준점으로 읽기 좋습니다." },
  { code: "FRA", slug: "france", name: "프랑스", angle: "유럽 주요국 중 한국 대비 가격수준 차이를 비교하기 좋습니다." },
  { code: "JPN", slug: "japan", name: "일본", angle: "한국과 가까운 가격수준을 보이는 동아시아 비교 대상입니다." },
  { code: "KOR", slug: "korea", name: "대한민국", angle: "모든 국가 지수를 계산하는 기준값 100입니다." },
  { code: "MEX", slug: "mexico", name: "멕시코", angle: "한국보다 낮은 가격수준과 중간 수준의 CPI 흐름을 함께 봅니다." },
  { code: "CHN", slug: "china", name: "중국", angle: "한국보다 낮은 가격수준으로 표시되는 주요 아시아 비교 대상입니다." },
  { code: "BRA", slug: "brazil", name: "브라질", angle: "가격수준과 CPI 흐름이 서로 다르게 움직일 수 있음을 보여줍니다." },
  { code: "IND", slug: "india", name: "인도", angle: "G20 비교 대상 중 낮은 가격수준 그룹에 속합니다." },
];

export const siteUrl = "https://korea-price-index.pages.dev";

export function getCountryData(slug: string): CountryDataResult | null {
  const info = countryPages.find((item) => item.slug === slug);
  if (!info) {
    return null;
  }

  const payload = dataFile as unknown as DataFile;
  const item = payload.data.find(
    (entry) => entry.countryCode === info.code,
  ) as KCollusionIndex | undefined;
  if (!item) {
    return null;
  }

  return { info, item, payload };
}

export function getDifferenceSentence(item: KCollusionIndex) {
  const difference = item.indexValue - 100;

  if (difference === 0) {
    return "대한민국은 이 지수의 기준 국가이므로 GDP 기준 일반 가격수준 지수가 100으로 고정됩니다.";
  }

  const direction = difference > 0 ? "높다" : "낮다";
  return `${item.countryName}의 GDP 기준 일반 가격수준 지수는 한국보다 ${Math.abs(difference).toFixed(1)}포인트 ${direction}고 해석할 수 있습니다.`;
}
