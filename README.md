# K-Collusion Index

K-Collusion Index는 대한민국의 물가 수준을 100으로 두고 주요 G20 회원국의 상대적인 물가 수준을 비교하는 정적 대시보드입니다. 시간별 인플레이션률이 아니라 국가 간 가격 수준 차이를 보여주기 위해 PPP 기반 지표를 사용합니다.

## 지표 검토 결과

기존 CPI annual rate는 각국의 연간 물가 상승률을 비교하는 지표라서 “어느 나라의 전반적인 물가 수준이 더 높은가”를 직접 비교하기에는 부적합합니다.

현재 데이터는 World Bank WDI의 `PA.NUS.PPPC.RF` 지표를 사용합니다.

- 지표명: Price level ratio of PPP conversion factor (GDP) to market exchange rate
- 의미: PPP conversion factor와 시장환율의 비율로 계산되는 국가별 가격수준 비율
- 기준화: World Bank 원자료를 대한민국 값으로 나누어 `KOR = 100`으로 재산정
- 최신 반영 연도: 2024년
- 수집 경로: World Bank API를 우선 사용하고, 응답 장애 시 World Bank WDI를 동기화한 Autario 공개 API를 사용
- 범위: World Bank country-level 데이터가 제공되는 G20 회원국 19개국
- 제외: EU 집계는 같은 WDI country-level 지표로 일관되게 비교하기 어려워 제외

## 주요 기능

- 한국 기준 상대 물가 수준 지수 계산
- 국가별 가격수준 막대 차트
- 순위표와 한국 대비 차이 표시
- CSV 다운로드와 JSON 다운로드
- 데이터 출처, 기준 연도, fallback 여부 메타데이터 제공

## 기술 스택

- Frontend: Next.js App Router, React, TypeScript
- Chart: Recharts
- Data generation: Python 표준 라이브러리
- Hosting: Cloudflare Pages
- Test: Playwright, pytest

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 또는 `http://localhost:3000/dashboard`로 확인합니다.

## 데이터 생성

```bash
python python/generate_data.py
```

스크립트는 World Bank WDI API에서 최신 공통 연도의 `PA.NUS.PPPC.RF` 데이터를 가져오려고 시도합니다. World Bank API가 응답하지 않는 경우에는 World Bank WDI를 동기화한 Autario 공개 API를 사용하고, 모든 온라인 경로가 실패할 때만 체크인된 2024년 WDI 스냅샷을 사용해 동일한 JSON 구조를 생성합니다.

생성 파일:

```text
public/data/k-collusion-index.json
```

## 빌드

```bash
npm run build
```

`prebuild` 단계에서 데이터 파일을 생성한 뒤, Next.js가 `out` 디렉터리에 정적 사이트를 export합니다. Cloudflare Pages 프로젝트에 build command가 비어 있어도 배포가 가능하도록 현재 `out` 산출물도 저장소에 포함합니다.

## 테스트

```bash
.\venv\Scripts\python.exe -m pytest python\tests
npm run lint
npx playwright test
```

## CI/CD

- `.github/workflows/prebuild.yml`: 데이터 생성, Next.js 빌드, `out` 산출물 검증
- `.github/workflows/cloudflare-pages.yml`: Cloudflare Pages 배포
- `.github/workflows/weekly-data-update.yml`: 주간 데이터 재생성 및 변경 시 커밋

## 배포 설정

Cloudflare Pages 산출물 경로는 `wrangler.toml`에서 `out`으로 지정합니다.

```toml
pages_build_output_dir = "out"
```

## Consumer Inflation Context

- World Bank `PA.NUS.PPPC.RF` remains the primary cross-country price-level measure. It is GDP-wide, so it is suitable for broad relative price-level comparison, but it is not a pure consumer basket or cost-of-living index.
- `consumerInflationRate` keeps the IMF WEO April 2026 `PCPIPCH` 2026 annual average consumer price inflation forecast for every G20 country.
- `consumerInflationVintage` and `consumerInflationPublicationDate` record the IMF WEO release basis (`April 2026`, published `2026-04-14`).
- `latestCpiInflationRate` adds World Bank WDI `FP.CPI.TOTL.ZG`, the latest observed annual consumer price inflation rate available for every G20 country.
- World Bank `PA.NUS.PPPC.RF` is still checked dynamically up to the current year; as of this refresh, the latest complete G20 World Bank price-level year remains 2024, so the dataset cannot yet be rebased to 2025.
- Both CPI fields are change-rate supplements, not replacements for the World Bank price-level index.
