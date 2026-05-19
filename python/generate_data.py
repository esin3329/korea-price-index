"""Generate the static K-Collusion Index data file.

The dashboard compares cross-country price levels, not inflation rates. It uses
World Bank WDI's PPP-based price level ratio indicator and rebases every country
against Korea so that KOR is always 100.
"""

from __future__ import annotations

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
LATEST_LOOKBACK_YEARS = 8

WORLD_BANK_2024_SNAPSHOT = {
    "ARG": 0.46,
    "AUS": 0.90,
    "BRA": 0.46,
    "CAN": 0.84,
    "CHN": 0.49,
    "FRA": 0.74,
    "DEU": 0.76,
    "IND": 0.24,
    "IDN": 0.30,
    "ITA": 0.65,
    "JPN": 0.62,
    "KOR": 0.59,
    "MEX": 0.54,
    "RUS": 0.31,
    "SAU": 0.49,
    "ZAF": 0.41,
    "TUR": 0.35,
    "GBR": 0.85,
    "USA": 1.00,
}


class DataUnavailableError(RuntimeError):
    """Raised when a complete official price-level dataset is unavailable."""


def _build_world_bank_url(start_year: int, end_year: int) -> str:
    country_key = ";".join(WORLD_BANK_COUNTRY_CODES)
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
    rows = _read_world_bank_json(_build_world_bank_url(start_year, end_year))
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


def _refresh_metadata(data: list[dict[str, object]], *, is_api_fallback: bool) -> dict[str, object]:
    return {
        "expectedCountryCount": len(G20_COUNTRIES),
        "officialCountryCount": len(data),
        "missingCountries": [],
        "hasIncompleteOfficialPull": len(data) != len(G20_COUNTRIES),
        "isFallback": is_api_fallback,
        "fallbackReason": "World Bank API unavailable; using latest checked-in WDI snapshot"
        if is_api_fallback
        else None,
    }


def save_to_json(
    data: list[dict[str, object]],
    output_dir: str = "public/data",
    *,
    base_year: int,
    is_api_fallback: bool = False,
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
        "indicatorCode": WORLD_BANK_PRICE_LEVEL_INDICATOR,
        "indicatorName": WORLD_BANK_PRICE_LEVEL_NAME,
        "datasetType": DATASET_TYPE,
        "methodology": "World Bank price level ratio rebased so Korea equals 100",
        **_refresh_metadata(data, is_api_fallback=is_api_fallback),
    }

    with filename.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")

    return filename


def main() -> None:
    print("Generating K-Collusion Index price-level data")
    try:
        data, base_year = fetch_world_bank_price_levels()
        is_api_fallback = False
    except (HTTPError, URLError, TimeoutError, DataUnavailableError, OSError) as exc:
        print(f"World Bank API fetch failed, using checked-in WDI snapshot: {exc}")
        data, base_year = build_snapshot_price_levels()
        is_api_fallback = True

    filename = save_to_json(data, base_year=base_year, is_api_fallback=is_api_fallback)
    print(f"Wrote {filename}")
    for rank, item in enumerate(data[:5], 1):
        print(f"{rank}. {item['countryName']}: {item['indexValue']}")


if __name__ == "__main__":
    main()
