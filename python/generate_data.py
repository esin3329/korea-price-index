"""Generate the static K-Collusion Index data file.

The dashboard compares cross-country price levels, not inflation rates. It uses
World Bank WDI's PPP-based price level ratio indicator and rebases every country
against Korea so that KOR is always 100. CPI values are included only as
supplementary trend context because they are change rates, not cross-country
price-level measures.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError

from data_config import (
    DATASET_TYPE,
    G20_COUNTRIES,
    IMF_2026_CONSUMER_INFLATION_SNAPSHOT,
    IMF_CONSUMER_INFLATION_INDICATOR,
    IMF_CONSUMER_INFLATION_NAME,
    IMF_CONSUMER_INFLATION_PUBLICATION_DATE,
    IMF_CONSUMER_INFLATION_SOURCE,
    IMF_CONSUMER_INFLATION_SOURCE_DETAIL,
    IMF_CONSUMER_INFLATION_SOURCE_URL,
    IMF_CONSUMER_INFLATION_VINTAGE,
    IMF_CONSUMER_INFLATION_YEAR,
    OECD_G20_CPI_YOY_INDICATOR,
    OECD_G20_CPI_YOY_NAME,
    OECD_G20_CPI_YOY_SOURCE,
    OECD_G20_CPI_YOY_SOURCE_DETAIL,
    OECD_G20_CPI_YOY_SOURCE_URL,
    OECD_LATEST_CPI_YOY_PERIOD_SNAPSHOT,
    SOURCE,
    SOURCE_DETAIL,
    WORLD_BANK_PRICE_LEVEL_INDICATOR,
    WORLD_BANK_PRICE_LEVEL_NAME,
)
from data_errors import DataUnavailableError
from inflation_sources import (
    _build_oecd_g20_cpi_yoy_url,
    _read_imf_consumer_inflation_forecast,
    _read_oecd_latest_cpi_yoy_inflation,
    enrich_with_consumer_inflation,
)
from world_bank_source import (
    _read_world_bank_json,
    build_snapshot_price_levels,
    fetch_world_bank_price_levels,
)

# Backward-compatible test hooks for the existing test suite.
_enrich_with_consumer_inflation = enrich_with_consumer_inflation


def _refresh_metadata(
    data: list[dict[str, object]],
    *,
    is_api_fallback: bool,
    consumer_inflation_year: int,
    is_forecast_fallback: bool,
    latest_cpi_inflation_year: int,
    latest_cpi_inflation_period: str,
    is_latest_cpi_fallback: bool,
) -> dict[str, object]:
    return {
        "expectedCountryCount": len(G20_COUNTRIES),
        "officialCountryCount": len(data),
        "missingCountries": [],
        "hasIncompleteOfficialPull": len(data) != len(G20_COUNTRIES),
        "isFallback": is_api_fallback,
        "fallbackReason": "World Bank API unavailable; using latest checked-in WDI snapshot"
        if is_api_fallback
        else None,
        "consumerInflationYear": consumer_inflation_year,
        "consumerInflationSource": IMF_CONSUMER_INFLATION_SOURCE,
        "consumerInflationSourceUrl": IMF_CONSUMER_INFLATION_SOURCE_URL,
        "consumerInflationIndicatorCode": IMF_CONSUMER_INFLATION_INDICATOR,
        "consumerInflationIndicatorName": IMF_CONSUMER_INFLATION_NAME,
        "consumerInflationVintage": IMF_CONSUMER_INFLATION_VINTAGE,
        "consumerInflationPublicationDate": IMF_CONSUMER_INFLATION_PUBLICATION_DATE,
        "consumerInflationMethodology": (
            "IMF WEO April 2026 annual average consumer price inflation, "
            "percent change; used as forecast trend context and not as a "
            "price-level index"
        ),
        "consumerInflationIsForecast": True,
        "consumerInflationIsFallback": is_forecast_fallback,
        "latestCpiInflationYear": latest_cpi_inflation_year,
        "latestCpiInflationPeriod": latest_cpi_inflation_period,
        "latestCpiInflationSource": OECD_G20_CPI_YOY_SOURCE,
        "latestCpiInflationSourceUrl": OECD_G20_CPI_YOY_SOURCE_URL,
        "latestCpiInflationIndicatorCode": OECD_G20_CPI_YOY_INDICATOR,
        "latestCpiInflationIndicatorName": OECD_G20_CPI_YOY_NAME,
        "latestCpiInflationMethodology": (
            "OECD G20 monthly CPI all-items growth rate over 1 year, percent; "
            "used as latest year-on-year CPI trend context"
        ),
        "latestCpiInflationIsFallback": is_latest_cpi_fallback,
    }


def save_to_json(
    data: list[dict[str, object]],
    output_dir: str = "public/data",
    *,
    base_year: int,
    is_api_fallback: bool = False,
    consumer_inflation_year: int = IMF_CONSUMER_INFLATION_YEAR,
    is_forecast_fallback: bool = False,
    latest_cpi_inflation_year: int = int(OECD_LATEST_CPI_YOY_PERIOD_SNAPSHOT[:4]),
    latest_cpi_inflation_period: str = OECD_LATEST_CPI_YOY_PERIOD_SNAPSHOT,
    is_latest_cpi_fallback: bool = False,
) -> Path:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    filename = output_path / "k-collusion-index.json"

    payload = {
        "success": True,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "baseYear": base_year,
        "source": SOURCE,
        "sourceUrl": "https://data.worldbank.org/indicator/PA.NUS.PPPC.RF",
        "snapshotUrl": "https://macrovedia.com/series/93bfb1f66cb554dc/",
        "mirrorSourceUrl": "https://autario.com/data/price-level-ratio-of-ppp-conversion-factor-gdp-to-market-exchange-rate-world-bank",
        "indicatorCode": WORLD_BANK_PRICE_LEVEL_INDICATOR,
        "indicatorName": WORLD_BANK_PRICE_LEVEL_NAME,
        "datasetType": DATASET_TYPE,
        "methodology": (
            "World Bank GDP price level index rebased so Korea equals 100; "
            "IMF WEO CPI forecast and OECD monthly CPI year-on-year inflation are "
            "supplementary trend context"
        ),
        **_refresh_metadata(
            data,
            is_api_fallback=is_api_fallback,
            consumer_inflation_year=consumer_inflation_year,
            is_forecast_fallback=is_forecast_fallback,
            latest_cpi_inflation_year=latest_cpi_inflation_year,
            latest_cpi_inflation_period=latest_cpi_inflation_period,
            is_latest_cpi_fallback=is_latest_cpi_fallback,
        ),
    }

    with filename.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")

    return filename


def main(*, require_live: bool = False) -> None:
    print("Generating K-Collusion Index price-level data")
    try:
        data, base_year = fetch_world_bank_price_levels()
        is_api_fallback = False
    except (HTTPError, URLError, TimeoutError, DataUnavailableError, OSError) as exc:
        if require_live:
            raise SystemExit(f"World Bank API live fetch failed: {exc}") from exc
        print(f"World Bank API fetch failed, using checked-in WDI snapshot: {exc}")
        data, base_year = build_snapshot_price_levels()
        is_api_fallback = True

    (
        data,
        consumer_inflation_year,
        is_forecast_fallback,
        latest_cpi_inflation_year,
        latest_cpi_inflation_period,
        is_latest_cpi_fallback,
    ) = enrich_with_consumer_inflation(data)
    filename = save_to_json(
        data,
        base_year=base_year,
        is_api_fallback=is_api_fallback,
        consumer_inflation_year=consumer_inflation_year,
        is_forecast_fallback=is_forecast_fallback,
        latest_cpi_inflation_year=latest_cpi_inflation_year,
        latest_cpi_inflation_period=latest_cpi_inflation_period,
        is_latest_cpi_fallback=is_latest_cpi_fallback,
    )
    print(f"Wrote {filename}")
    for rank, item in enumerate(data[:5], 1):
        print(f"{rank}. {item['countryName']}: {item['indexValue']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate static K-Collusion Index price-level data."
    )
    parser.add_argument(
        "--require-live",
        action="store_true",
        help="Fail instead of using the checked-in snapshot when World Bank API is unavailable.",
    )
    args = parser.parse_args()
    main(require_live=args.require_live)
