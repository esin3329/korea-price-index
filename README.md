# Korea Price Index

Korea Price Index는 한국을 기준값 100으로 두고 G20 회원 중 19개 국가의 GDP 기준 일반 가격수준을 비교하는 정적 대시보드입니다.

이 프로젝트는 물가 상승률 자체를 국가 간 가격수준 비교 지표로 쓰지 않습니다. 소비자물가지수(CPI) 상승률은 특정 기간의 변화 속도이고, “어느 나라의 전반적인 가격 수준이 더 높은가”를 직접 말해주지는 않기 때문입니다.

## 핵심 지표

기본 비교 지표는 World Bank WDI의 `PA.NUS.PPPC.RF`입니다.

- 지표명: Price level ratio of PPP conversion factor (GDP) to market exchange rate
- 의미: PPP conversion factor와 시장환율의 비율로 계산한 국가별 가격수준 비율
- 재산정 방식: 각 국가 값을 한국 값으로 나누어 `KOR = 100`으로 변환
- 해석: 숫자가 100보다 크면 한국보다 GDP 기준 일반 가격수준이 높고, 100보다 작으면 낮습니다. 소비자 생활비나 엄격한 순위를 뜻하지 않습니다.
- 현재 기준연도: World Bank가 비교 대상 19개 국가에 대해 완전하게 제공하는 최신 공통 연도

## 보조 CPI 지표

소비자물가지수(CPI)는 GDP 기준 일반 가격수준 지수를 계산하는 데 쓰지 않고, 물가 흐름을 설명하는 보조 지표로만 표시합니다.

- `consumerInflationRate`: IMF WEO April 2026 `PCPIPCH` 기준 2026년 평균 소비자물가 상승률 전망
- `latestCpiInflationRate`: OECD G20 Consumer Price Indices `GY` 기준 19개 비교 국가가 모두 제공된 최신 공통 월의 소비자물가지수(CPI) 전년동월비

두 CPI 지표는 변화율입니다. GDP 기준 일반 가격수준 지수와 단위와 의미가 다르므로, 산식에는 포함하지 않습니다.

## 데이터 흐름

1. World Bank WDI API에서 가격수준 비율을 가져옵니다.
2. 비교 대상 19개 국가가 모두 존재하는 최신 공통 연도를 선택합니다.
3. 한국 값을 100으로 두고 모든 국가의 지수를 재계산합니다.
4. IMF 전망과 OECD CPI 전년동월비를 보조 정보로 붙입니다.
5. `public/data/k-collusion-index.json`을 생성합니다.

World Bank API가 일시적으로 실패하면 Autario의 World Bank 동기화 미러를 시도합니다. 모든 온라인 경로가 실패할 때만 체크인된 WDI 스냅샷을 사용하며, 이 경우 JSON의 `isFallback` 값이 `true`가 됩니다.

## 주요 기능

- 한국 기준 국제 가격수준 비교
- 국가별 GDP 기준 일반 가격수준 비교 차트
- 한국 대비 차이 비교표
- IMF 소비자물가지수(CPI) 전망과 OECD CPI 전년동월비 표시
- CSV, JSON 다운로드
- 데이터 출처, 기준연도, fallback 여부 메타데이터 표시

## 기술 스택

- Frontend: Next.js App Router, React, TypeScript
- Chart: Recharts
- Data generation: Python standard library
- Hosting: Cloudflare Pages
- Tests: pytest, Playwright

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000/dashboard`를 엽니다.

## 데이터 생성

```bash
python python/generate_data.py
```

온라인 데이터 소스가 반드시 성공해야 하는 환경에서는 다음 명령을 사용합니다.

```bash
python python/generate_data.py --require-live
```

## 빌드

```bash
npm run build
```

`prebuild` 단계에서 데이터 JSON을 생성하고, Next.js가 정적 사이트를 `out/`에 export합니다.

## 테스트

```bash
.\venv\Scripts\python.exe -m pytest python\tests
npm run lint
npx playwright test
```

## 배포

Cloudflare Pages 배포는 GitHub Actions에서 `npm run build` 후 생성된 `out/` 디렉터리를 사용합니다.

필요한 repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## 한계

- World Bank `PA.NUS.PPPC.RF`는 GDP 전체 가격수준 비율입니다. 소비자 장바구니만을 직접 비교하는 생활비 지수는 아닙니다.
- 비교 범위는 G20 회원 중 19개 국가이며 EU·AU 지역기구는 country-level WDI 지표와 일관되게 비교하기 어려워 제외합니다.
- 비교값이 근접한 국가 사이에서 엄격한 국가 순위를 확정하는 지표로 해석하지 않습니다.
- 소비자물가지수(CPI) 전망과 전년동월비는 물가 흐름 참고용이며 GDP 기준 일반 가격수준 지수를 대체하지 않습니다.
