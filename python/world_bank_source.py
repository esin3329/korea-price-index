"""World Bank WDI price-level data source."""

from __future__ import annotations

import json
import socket
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from data_config import (
    AUTARIO_WORLD_BANK_DATASET_API,
    COUNTRY_NAMES,
    G20_COUNTRIES,
    LATEST_LOOKBACK_YEARS,
    SOURCE,
    SOURCE_DETAIL,
    WORLD_BANK_2024_SNAPSHOT,
    WORLD_BANK_API_BASE,
    WORLD_BANK_PRICE_LEVEL_INDICATOR,
)
from data_errors import DataUnavailableError

WORLD_BANK_COUNTRY_CODES = G20_COUNTRIES
OUTPUT_COUNTRY_CODES = {
    api_code: country_code
    for country_code, api_code in zip(G20_COUNTRIES, WORLD_BANK_COUNTRY_CODES)
}


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
        query = urlencode({"filter": f"year:eq:{year}", "limit": "300"})
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


def _to_index_rows(values: dict[str, float], base_year: int) -> list[dict[str, object]]:
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
    return sorted(data, key=lambda item: float(item["indexValue"]), reverse=True)


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
    return _to_index_rows(values_by_year[base_year], base_year), base_year


def build_snapshot_price_levels() -> tuple[list[dict[str, object]], int]:
    """Build from the checked-in latest WDI snapshot when the API is unavailable."""
    base_year = 2024
    return _to_index_rows(WORLD_BANK_2024_SNAPSHOT, base_year), base_year
