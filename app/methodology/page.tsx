import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "방법론 | Korea Price Index",
  description: "Korea Price Index 산식, 데이터 출처, CPI 보조 지표의 해석 방식을 설명합니다.",
  alternates: {
    canonical: "/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <InfoPage
      eyebrow="Methodology"
      title="방법론"
      lead="핵심 지표는 World Bank WDI의 GDP 기준 가격수준 비율 PA.NUS.PPPC.RF이며, 각 국가 값을 한국 값으로 나누어 한국=100 지수로 변환합니다."
      sections={[
        {
          title: "핵심 산식",
          body: [
            "Korea Price Index = 국가별 가격수준 비율 / 한국 가격수준 비율 x 100 입니다. 예를 들어 어떤 국가의 값이 150이라면 한국의 GDP 기준 일반 가격수준을 100으로 볼 때 해당 국가의 값은 약 50% 높다는 의미입니다.",
            "지수가 100보다 크면 한국보다 GDP 기준 일반 가격수준이 높고, 100보다 작으면 낮다는 뜻입니다. 소비자 생활비나 체감물가를 직접 측정하거나 엄격한 국가 순위를 확정하는 용도로 해석하지 않습니다.",
          ],
        },
        {
          title: "데이터 출처",
          body: [
            "GDP 기준 일반 가격수준 비교에는 World Bank WDI의 Price level ratio of PPP conversion factor (GDP) to market exchange rate 지표를 사용합니다. 이 지표는 국가 간 구매력평가와 시장환율의 관계를 이용해 가격수준 차이를 보여줍니다.",
            "IMF World Economic Outlook의 소비자물가 전망과 OECD G20 Consumer Price Indices의 월간 CPI 전년동월비는 가격수준 지수 산식에 넣지 않습니다. 두 지표는 최근 물가 흐름을 설명하기 위한 보조 지표로만 사용합니다.",
          ],
        },
        {
          title: "CPI를 가격수준 산식에 넣지 않는 이유",
          body: [
            "CPI 상승률은 특정 기간 동안 가격이 얼마나 빨리 올랐는지를 보여주는 변화율입니다. 반면 Korea Price Index는 국가 간 GDP 기준 일반 가격수준의 상대적 높낮이를 비교하는 지표입니다.",
            "두 지표는 단위와 의미가 다르므로 하나의 가격수준 산식에 섞으면 해석이 흐려집니다. 그래서 CPI는 국가별 상세 해설과 대시보드 보조 열에서 최근 흐름을 읽는 데만 사용합니다.",
          ],
        },
        {
          title: "갱신과 검증",
          body: [
            "데이터 생성 과정은 공식 API를 우선 사용하고, 공식 API가 실패하면 확인된 스냅샷을 fallback으로 사용합니다. fallback 사용 여부는 JSON 메타데이터와 대시보드 품질 알림에 남깁니다.",
            "기준연도는 G20 회원 중 19개 비교 대상 국가에서 공통으로 사용할 수 있는 최신 연도를 선택합니다. OECD 월간 CPI도 이 19개 국가가 모두 제공된 최신 공통 월만 사용합니다.",
            "비교 범위는 G20 회원 중 국가 단위 자료가 있는 19개 국가이며, EU·AU 지역기구는 제외합니다. 값이 근접한 국가 사이에서 엄격한 국가 순위를 확정하는 용도로 해석하지 않습니다.",
          ],
        },
      ]}
    />
  );
}
