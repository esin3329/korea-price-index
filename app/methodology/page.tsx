import type { Metadata } from "next";
import InfoPage from "@/app/components/InfoPage";

export const metadata: Metadata = {
  title: "방법론 | Korea Price Index",
  description: "Korea Price Index 산식, 데이터 출처, CPI 보조 지표의 해석 방식을 설명합니다.",
};

export default function MethodologyPage() {
  return (
    <InfoPage
      eyebrow="Methodology"
      title="방법론"
      lead="핵심 지표는 World Bank WDI의 PA.NUS.PPPC.RF이며, 각 국가 값을 한국 값으로 나누어 한국=100 지수로 변환합니다."
      sections={[
        {
          title: "핵심 산식",
          body: [
            "Korea Price Index = 국가별 PA.NUS.PPPC.RF 값 / 한국 PA.NUS.PPPC.RF 값 × 100 입니다.",
            "지수가 100보다 크면 한국보다 전반적인 가격수준이 높고, 100보다 작으면 낮다는 의미입니다.",
          ],
        },
        {
          title: "데이터 출처",
          body: [
            "가격수준 비교에는 World Bank WDI의 Price level ratio of PPP conversion factor (GDP) to market exchange rate 지표를 사용합니다.",
            "IMF World Economic Outlook의 소비자물가 전망과 OECD G20 Consumer Price Indices의 월간 CPI 전년동월비는 가격 흐름을 보조적으로 설명하는 지표입니다.",
          ],
        },
        {
          title: "CPI를 순위 산식에 넣지 않는 이유",
          body: [
            "CPI 상승률은 특정 기간의 변화율이고, 가격수준 지수는 국가 간 가격수준의 상대값입니다.",
            "단위와 의미가 다르기 때문에 CPI는 순위 계산에 포함하지 않고, 최신 물가 흐름을 설명하는 보조 정보로만 표시합니다.",
          ],
        },
      ]}
    />
  );
}
