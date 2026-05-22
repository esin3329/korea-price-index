import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "Korea Price Index 소개 | Korea Price Index",
  description: "Korea Price Index의 목적, 데이터 범위, 운영 원칙을 설명합니다.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Korea Price Index 소개"
      lead="Korea Price Index는 한국을 기준값 100으로 두고 G20 주요 국가의 전반적인 가격수준을 비교하는 데이터 해설 프로젝트입니다."
      sections={[
        {
          title: "프로젝트 목적",
          body: [
            "한국에서 체감하는 가격수준을 기준선으로 삼아 주요 국가의 상대적 가격수준을 한눈에 비교할 수 있도록 돕습니다.",
            "단순한 물가상승률 비교가 아니라, 국가 간 가격수준 자체를 비교하는 데 초점을 둡니다.",
          ],
        },
        {
          title: "제공하는 정보",
          body: [
            "World Bank WDI 가격수준 비율을 한국=100으로 재산정한 지수, IMF 소비자물가 전망, OECD 월간 CPI 전년동월비를 함께 제공합니다.",
            "CSV와 JSON 다운로드를 제공해 사용자가 직접 검산하거나 다른 분석에 활용할 수 있게 했습니다.",
          ],
        },
        {
          title: "운영 원칙",
          body: [
            "데이터 출처, 기준연도, 갱신 시각, fallback 여부를 화면에 표시합니다.",
            "공식 데이터 발표 주기를 고려해 월간 단위로 갱신하며, 데이터가 불완전할 때는 화면에 경고를 표시합니다.",
          ],
        },
      ]}
    />
  );
}
