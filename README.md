# K-Collusion Index

K-Collusion Index는 대한민국의 물가 지수를 100으로 두고 G20 주요 국가의 상대 물가 수준을 비교하는 정적 대시보드입니다. Next.js 정적 export와 Cloudflare Pages 배포를 기준으로 동작하며, 브라우저는 `public/data/k-collusion-index.json` 파일을 직접 읽습니다.

## 주요 기능

- 한국 기준 상대 물가 지수 계산: `indexValue = (countryValue / koreaValue) * 100`
- G20 국가별 물가 지수 막대 차트
- 순위표와 한국 대비 차이 표시
- CSV 다운로드와 JSON 다운로드
- 빌드 시점 데이터 생성 및 정적 산출물 검증

## 기술 스택

- Frontend: Next.js App Router, React, TypeScript
- Chart: Recharts
- Data generation: Python 표준 라이브러리
- Hosting: Cloudflare Pages
- Test: Playwright

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

스크립트는 OECD SDMX CSV 엔드포인트에서 G20 CPI annual rate 데이터를 가져옵니다. 현재 대시보드 데이터는 샘플 fallback 없이 20개 전체 행을 OECD 응답으로 생성하며, 일부 국가 또는 한국 기준값이 누락되면 생성이 실패합니다. 생성된 JSON은 `isFallback: false`, `sampleBackedCountryCount: 0` 메타데이터를 기록합니다.

생성 파일:

```text
public/data/k-collusion-index.json
```

## 빌드

```bash
npm run build
```

`prebuild` 단계에서 데이터 파일을 생성한 뒤, Next.js가 `out` 디렉터리에 정적 사이트를 export합니다.

## 테스트

```bash
npx playwright test
```

Playwright 테스트는 정적 데이터 파일(`/data/k-collusion-index.json`)과 실제 대시보드 UI를 검증합니다.

## CI/CD

- `.github/workflows/prebuild.yml`: 데이터 생성, Next.js 빌드, `out` 산출물 검증
- `.github/workflows/cloudflare-pages.yml`: Cloudflare Pages 배포
- `.github/workflows/weekly-data-update.yml`: 주간 데이터 재생성 및 변경 시 커밋

## 배포 설정

Cloudflare Pages 산출물 경로는 `wrangler.toml`에서 `out`으로 지정합니다.

```toml
pages_build_output_dir = "out"
```
