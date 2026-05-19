"""Generate the static K-Collusion Index data file.

The dashboard compares cross-country price levels, not inflation rates. It uses
World Bank WDI's PPP-based price level ratio indicator and rebases every country
against Korea so that KOR is always 100. The latest observed CPI inflation rate
is included only as supplementary trend context because it is a change rate, not
a cross-country price-level measure.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import socket
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

G20_COUNTRIES = [
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
]

COUNTRY_NAMES = {
    "ARG": "아르헨티나",
    "AUS": "호주",
    "BRA": "브라질",
    "CAN": "캐나다",
    "CHN": "중국",
    "FRA": "프랑스",
    "DEU": "독일",
    "IND": "인도",
    "IDN": "인도네시아",
    "ITA": "이탈리아",
    "JPN": "일본",
    "KOR": "대한민국",
    "MEX": "멕시코",
    "RUS": "러시아",
    "SAU": "사우디아라비아",
    "ZAF": "남아프리카공화국",
    "TUR": "튀르키예",
    "GBR": "영국",
    "USA": "미국",
}
WORLD_BANK_COUNTRY_CODES = G20_COUNTRIES
OUTPUT_COUNTRY_CODES = {
    api_code: country_code
    for country_code, api_code in zip(G20_COUNTRIES, WORLD_BANK_COUNTRY_CODES)
}

WORLD_BANK_API_BASE = "https://api.worldbank.org/v2"
WORLD_BANK_PRICE_LEVEL_INDICATOR = "PA.NUS.PPPC.RF"
WORLD_BANK_PRICE_LEVEL_NAME = (
    "Price level ratio of PPP conversion factor (GDP) to market exchange rate"
)
DATASET_TYPE = "PRICE_LEVEL_RATIO_GDP_PPP_TO_MARKET_EXCHANGE_RATE"
SOURCE = "World Bank WDI"
SOURCE_DETAIL = f"world_bank_wdi:{WORLD_BANK_PRICE_LEVEL_INDICATOR}"
WORLD_BANK_CPI_INFLATION_INDICATOR = "FP.CPI.TOTL.ZG"
WORLD_BANK_CPI_INFLATION_NAME = "Inflation, consumer prices (annual %)"
WORLD_BANK_CPI_INFLATION_YEAR = 2024
WORLD_BANK_CPI_INFLATION_SOURCE = "World Bank WDI"
WORLD_BANK_CPI_INFLATION_SOURCE_DETAIL = (
    f"world_bank_wdi:{WORLD_BANK_CPI_INFLATION_INDICATOR}"
)
DATAHUB_CPI_INFLATION_CSV_URL = (
    "https://datahub.io/world-development-indicators/"
    "fp.cpi.totl.zg/_r/-/data.csv"
)
AUTARIO_WORLD_BANK_DATASET_API = (
    "https://autario.com/api/v1/public/datasets/"
    "3b933e66-0321-4ae3-adcb-ff352bfb00f0/data"
)
LATEST_LOOKBACK_YEARS = 8

WORLD_BANK_2024_SNAPSHOT = {
    "ARG": 0.459061319225925,
    "AUS": 0.895894112849615,
    "BRA": 0.461560073187954,
    "CAN": 0.840153207747759,
    "CHN": 0.490802871328148,
    "FRA": 0.737359788150781,
    "DEU": 0.758599340089062,
    "IND": 0.241464271880756,
    "IDN": 0.299449658545769,
    "ITA": 0.649024553335156,
    "JPN": 0.624066284421693,
    "KOR": 0.593576396809388,
    "MEX": 0.541744819872408,
    "RUS": 0.314081420115992,
    "SAU": 0.492069764351171,
    "ZAF": 0.405480468825683,
    "TUR": 0.34822649525949,
    "GBR": 0.848850489420597,
    "USA": 1.00,
}

WORLD_BANK_2024_CPI_INFLATION_SNAPSHOT = {
    "ARG": 219.883929014578,
    "AUS": 3.1616142830575,
    "BRA": 4.36746407652337,
    "CAN": 2.38158383281173,
    "CHN": 0.218128938439177,
    "FRA": 1.99904942291463,
    "DEU": 2.2564981433876,
    "IND": 4.953,
    "IDN": 2.18151273615189,
    "ITA": 0.982373023061417,
    "JPN": 2.73853681635241,
    "KOR": 2.32174328643542,
    "MEX": 4.72225588452932,
    "RUS": 8.43486410496723,
    "SAU": 1.68792112375809,
    "ZAF": 4.36115246518962,
    "TUR": 58.5064507300343,
    "GBR": 3.2715729463592,
    "USA": 2.94952520485207,
}


class DataUnavailableError(RuntimeError):
    """Raised when a complete official price-level dataset is unavailable."""


class InflationDataUnavailableError(RuntimeError):
    """Raised when complete observed CPI inflation data is unavailable."""


def _build_world_bank_url(
    start_year: int,
    end_year: int,
    *,
    country_codes: list[str] | None = None,
) -> str:
    country_key = ";".join(country_codes or WORLD_BANK_COUNTRY_CODES)
    query = urlencode(
        {
            "format": "json",
            "source": "2",
            "per_page": "500",
            "date": f"{start_year}:{end_year}",
        }
    )
    return (
        f"{WORLD_BANK_API_BASE}/country/{country_key}/indicator/"
        f"{WORLD_BANK_PRICE_LEVEL_INDICATOR}?{query}"
    )


def _read_world_bank_json(url: str) -> list[dict[str, object]]:
    socket.setdefaulttimeout(20)
    request = Request(url, headers={"User-Agent": "k-collusion-index/1.0"})
    with urlopen(request, timeout=20) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if not isinstance(payload, list) or len(payload) < 2:
        raise DataUnavailableError("World Bank API returned an unexpected payload")

    metadata = payload[0]
    rows = payload[1]
    if isinstance(metadata, dict) and "message" in metadata:
        raise DataUnavailableError(str(metadata["message"]))
    if not isinstance(rows, list):
        raise DataUnavailableError("World Bank API response did not contain rows")
    return rows


def _read_autario_world_bank_rows(start_year: int, end_year: int) -> list[dict[str, object]]:
    """Read World Bank WDI rows from Autario's public source-synced mirror."""
    required = set(G20_COUNTRIES)

    for year in range(end_year, start_year - 1, -1):
        query = urlencode(
            {
                "filter": f"year:eq:{year}",
                "limit": "300",
            }
        )
        request = Request(
            f"{AUTARIO_WORLD_BANK_DATASET_API}?{query}",
            headers={"User-Agent": "k-collusion-index/1.0"},
        )
        with urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))

        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, list):
            continue

        rows: list[dict[str, object]] = []
        found: set[str] = set()
        for item in data:
            if not isinstance(item, dict):
                continue
            country_code = item.get("country_code")
            value = item.get("value")
            if country_code not in required or value is None:
                continue
            found.add(str(country_code))
            rows.append(
                {
                    "country": {
                        "id": country_code,
                        "value": item.get("country") or country_code,
                    },
                    "countryiso3code": country_code,
                    "date": str(item.get("year") or year),
                    "value": value,
                }
            )

        if required.issubset(found):
            return rows

    raise DataUnavailableError("Autario World Bank WDI mirror returned no complete G20 year")


def _read_world_bank_rows(start_year: int, end_year: int) -> list[dict[str, object]]:
    """Read rows from World Bank, retrying fallbacks if the bulk call fails."""
    try:
        return _read_world_bank_json(_build_world_bank_url(start_year, end_year))
    except (HTTPError, URLError, TimeoutError, DataUnavailableError, OSError) as bulk_error:
        rows: list[dict[str, object]] = []
        failures: list[str] = []

        for country_code in WORLD_BANK_COUNTRY_CODES:
            url = _build_world_bank_url(
                start_year,
                end_year,
                country_codes=[country_code],
            )
            try:
                rows.extend(_read_world_bank_json(url))
            except (HTTPError, URLError, TimeoutError, DataUnavailableError, OSError):
                failures.append(country_code)

        if rows:
            return rows

        try:
            return _read_autario_world_bank_rows(start_year, end_year)
        except (HTTPError, URLError, TimeoutError, DataUnavailableError, OSError) as mirror_error:
            raise DataUnavailableError(
                "World Bank API bulk, per-country, and mirror fetches failed: "
                f"{bulk_error}; mirror error: {mirror_error}; "
                f"failed countries: {', '.join(failures)}"
            ) from bulk_error

        raise DataUnavailableError("unreachable")


def _country_code_from_row(row: dict[str, object]) -> str | None:
    country = row.get("country")
    if isinstance(country, dict):
        raw_code = country.get("id") or country.get("value")
        if isinstance(raw_code, str):
            return OUTPUT_COUNTRY_CODES.get(raw_code.strip())

    raw_code = row.get("countryiso3code")
    if isinstance(raw_code, str):
        return OUTPUT_COUNTRY_CODES.get(raw_code.strip())

    return None


def _extract_price_level_rows(
    rows: list[dict[str, object]],
) -> dict[int, dict[str, float]]:
    values_by_year: dict[int, dict[str, float]] = {}

    for row in rows:
        country_code = _country_code_from_row(row)
        raw_year = row.get("date")
        raw_value = row.get("value")

        if country_code not in G20_COUNTRIES or raw_year is None or raw_value is None:
            continue

        try:
            year = int(str(raw_year))
            value = float(raw_value)
        except (TypeError, ValueError):
            continue

        values_by_year.setdefault(year, {})[country_code] = value

    return values_by_year


def _latest_complete_year(values_by_year: dict[int, dict[str, float]]) -> int:
    required = set(G20_COUNTRIES)
    for year in sorted(values_by_year.keys(), reverse=True):
        if required.issubset(values_by_year[year].keys()):
            return year

    if values_by_year:
        latest_year = max(values_by_year)
        missing = sorted(required - set(values_by_year[latest_year].keys()))
        raise DataUnavailableError(
            f"No complete G20 price-level year found. Latest year {latest_year} "
            f"is missing: {', '.join(missing)}"
        )

    raise DataUnavailableError("World Bank API returned no usable observations")


def fetch_world_bank_price_levels(
    *,
    end_year: int | None = None,
    lookback_years: int = LATEST_LOOKBACK_YEARS,
) -> tuple[list[dict[str, object]], int]:
    """Fetch latest complete G20 price-level ratios and rebase Korea to 100."""
    current_year = datetime.now(timezone.utc).year
    end_year = end_year or current_year
    start_year = end_year - lookback_years
    rows = _read_world_bank_rows(start_year, end_year)
    values_by_year = _extract_price_level_rows(rows)
    base_year = _latest_complete_year(values_by_year)
    values = values_by_year[base_year]
    korea_value = values.get("KOR")

    if korea_value is None or korea_value <= 0:
        raise DataUnavailableError(f"Korea value is missing for {base_year}")

    data = [
        {
            "countryCode": country_code,
            "countryName": COUNTRY_NAMES[country_code],
            "indexValue": 100.0
            if country_code == "KOR"
            else round((values[country_code] / korea_value) * 100, 2),
            "baseYear": base_year,
            "source": SOURCE,
            "sourceDetail": SOURCE_DETAIL,
            "rawPriceLevelRatio": round(values[country_code], 6),
        }
        for country_code in G20_COUNTRIES
    ]
    return sorted(data, key=lambda item: float(item["indexValue"]), reverse=True), base_year


def build_snapshot_price_levels() -> tuple[list[dict[str, object]], int]:
    """Build from the checked-in latest WDI snapshot when the API is unavailable."""
    base_year = 2024
    korea_value = WORLD_BANK_2024_SNAPSHOT["KOR"]
    data = [
        {
            "countryCode": country_code,
            "countryName": COUNTRY_NAMES[country_code],
            "indexValue": 100.0
            if country_code == "KOR"
            else round((WORLD_BANK_2024_SNAPSHOT[country_code] / korea_value) * 100, 2),
            "baseYear": base_year,
            "source": SOURCE,
            "sourceDetail": SOURCE_DETAIL,
            "rawPriceLevelRatio": WORLD_BANK_2024_SNAPSHOT[country_code],
        }
        for country_code in G20_COUNTRIES
    ]
    return sorted(data, key=lambda item: float(item["indexValue"]), reverse=True), base_year


def _build_world_bank_cpi_url(
    start_year: int,
    end_year: int,
    *,
    country_codes: list[str] | None = None,
) -> str:
    country_key = ";".join(country_codes or WORLD_BANK_COUNTRY_CODES)
    query = urlencode(
        {
            "format": "json",
            "source": "2",
            "per_page": "500",
            "date": f"{start_year}:{end_year}",
        }
    )
    return (
        f"{WORLD_BANK_API_BASE}/country/{country_key}/indicator/"
        f"{WORLD_BANK_CPI_INFLATION_INDICATOR}?{query}"
    )


def _read_world_bank_cpi_inflation(
    *,
    end_year: int | None = None,
    lookback_years: int = LATEST_LOOKBACK_YEARS,
) -> tuple[dict[str, float], int]:
    current_year = datetime.now(timezone.utc).year
    end_year = end_year or current_year
    start_year = end_year - lookback_years
    try:
        rows = _read_world_bank_json(_build_world_bank_cpi_url(start_year, end_year))
        values_by_year = _extract_price_level_rows(rows)
        base_year = _latest_complete_year(values_by_year)
    except (HTTPError, URLError, TimeoutError, DataUnavailableError, OSError):
        values_by_year = _read_datahub_cpi_inflation_values()
        base_year = _latest_complete_year(values_by_year)
    values = values_by_year[base_year]
    return {
        country_code: round(values[country_code], 1)
        for country_code in G20_COUNTRIES
    }, base_year


def _read_datahub_cpi_inflation_values() -> dict[int, dict[str, float]]:
    request = Request(
        DATAHUB_CPI_INFLATION_CSV_URL,
        headers={"User-Agent": "k-collusion-index/1.0"},
    )
    with urlopen(request, timeout=30) as response:
        text = response.read().decode("utf-8")

    values_by_year: dict[int, dict[str, float]] = {}
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        country_code = row.get("Country Code")
        raw_year = row.get("Year")
        raw_value = row.get("Value")
        if country_code not in G20_COUNTRIES or not raw_year or not raw_value:
            continue
        try:
            year = int(raw_year)
            value = float(raw_value)
        except ValueError:
            continue
        values_by_year.setdefault(year, {})[country_code] = value

    return values_by_year


def _enrich_with_consumer_inflation(
    data: list[dict[str, object]],
) -> tuple[list[dict[str, object]], int, bool]:
    try:
        inflation, inflation_year = _read_world_bank_cpi_inflation()
        is_inflation_fallback = False
    except (
        HTTPError,
        URLError,
        TimeoutError,
        InflationDataUnavailableError,
        DataUnavailableError,
        OSError,
        ValueError,
        json.JSONDecodeError,
    ):
        inflation = {
            country_code: round(value, 1)
            for country_code, value in WORLD_BANK_2024_CPI_INFLATION_SNAPSHOT.items()
        }
        inflation_year = WORLD_BANK_CPI_INFLATION_YEAR
        is_inflation_fallback = True

    enriched = []
    for item in data:
        country_code = str(item["countryCode"])
        enriched.append(
            {
                **item,
                "consumerInflationRate": inflation[country_code],
                "consumerInflationYear": inflation_year,
                "consumerInflationSource": WORLD_BANK_CPI_INFLATION_SOURCE,
                "consumerInflationSourceDetail": WORLD_BANK_CPI_INFLATION_SOURCE_DETAIL,
                "consumerInflationIsForecast": False,
            }
        )

    return enriched, inflation_year, is_inflation_fallback


def _refresh_metadata(
    data: list[dict[str, object]],
    *,
    is_api_fallback: bool,
    consumer_inflation_year: int,
    is_inflation_fallback: bool,
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
        "consumerInflationSource": WORLD_BANK_CPI_INFLATION_SOURCE,
        "consumerInflationSourceUrl": (
            "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG"
        ),
        "consumerInflationIndicatorCode": WORLD_BANK_CPI_INFLATION_INDICATOR,
        "consumerInflationIndicatorName": WORLD_BANK_CPI_INFLATION_NAME,
        "consumerInflationMethodology": (
            "World Bank annual consumer price inflation, percent change; used as "
            "observed trend context and not as a price-level index"
        ),
        "consumerInflationIsForecast": False,
        "consumerInflationIsFallback": is_inflation_fallback,
    }


def save_to_json(
    data: list[dict[str, object]],
    output_dir: str = "public/data",
    *,
    base_year: int,
    is_api_fallback: bool = False,
    consumer_inflation_year: int = WORLD_BANK_CPI_INFLATION_YEAR,
    is_inflation_fallback: bool = False,
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
            "World Bank observed CPI inflation is supplementary trend context"
        ),
        **_refresh_metadata(
            data,
            is_api_fallback=is_api_fallback,
            consumer_inflation_year=consumer_inflation_year,
            is_inflation_fallback=is_inflation_fallback,
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

    data, consumer_inflation_year, is_inflation_fallback = _enrich_with_consumer_inflation(data)
    filename = save_to_json(
        data,
        base_year=base_year,
        is_api_fallback=is_api_fallback,
        consumer_inflation_year=consumer_inflation_year,
        is_inflation_fallback=is_inflation_fallback,
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
