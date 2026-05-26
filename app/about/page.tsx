import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "Korea Price Index 소개 | Korea Price Index",
  description: "Korea Price Index의 목적, 데이터 범위, 운영 원칙을 설명합니다.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Korea Price Index 소개"
      lead="Korea Price Index는 한국을 기준값 100으로 두고 G20 회원 중 19개 국가의 GDP 기준 일반 가격수준을 비교하는 공개 통계 기반 데이터 해설 프로젝트입니다."
      sections={[
        {
          title: "프로젝트 목적",
          body: [
            "World Bank의 GDP 기준 가격수준 비율을 한국=100으로 변환해 주요 국가의 상대적인 일반 가격수준을 한눈에 비교할 수 있도록 만들었습니다. 소비자 생활비나 체감물가를 직접 측정하는 지표는 아닙니다.",
            "사용자는 대시보드에서 비교값을 빠르게 확인하고, 국가별 해설 페이지에서 각 국가의 지수가 어떤 의미인지 읽을 수 있습니다. 데이터 표와 다운로드 기능은 직접 검증하거나 다른 분석에 재사용할 수 있도록 제공됩니다.",
          ],
        },
        {
          title: "제공하는 정보",
          body: [
            "핵심 지표는 World Bank WDI의 GDP 기준 가격수준 비율을 한국=100으로 재산정한 Korea Price Index입니다. 여기에 IMF 소비자물가 전망과 OECD 월간 CPI 전년동월비를 보조 정보로 붙여 일반 가격수준과 최근 물가 흐름을 함께 볼 수 있게 했습니다.",
            "비교 범위는 G20 회원 중 국가 단위 자료를 일관되게 확보할 수 있는 19개 국가이며, EU와 AU 같은 지역기구는 제외합니다.",
            "데이터에는 출처, 기준연도, 갱신 시각, 원자료 지표 코드, fallback 여부가 포함됩니다. 공식 API가 일시적으로 불안정한 경우에는 최신으로 확인된 스냅샷을 사용하고, 그 사실을 화면에 표시합니다.",
          ],
        },
        {
          title: "운영 원칙",
          body: [
            "이 사이트는 특정 국가나 정책에 대한 평가를 내리는 서비스가 아니라 공개 통계를 읽기 쉽게 재구성하는 해설 사이트입니다. 계산식과 한계를 숨기지 않고, 출처 링크와 원본 JSON을 함께 공개합니다.",
            "콘텐츠는 월간 데이터 갱신 주기에 맞춰 관리하며, 오류 제보가 들어오면 공식 출처와 대조해 반영합니다. 데이터 해석은 참고용이며 투자, 정책, 법률, 세무 판단의 근거로 사용해서는 안 됩니다.",
          ],
        },
      ]}
    />
  );
}
