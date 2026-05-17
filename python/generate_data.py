"""Generate the static K-Collusion Index data file.

The app is deployed as a static Cloudflare Pages site, so the dashboard reads
public/data/k-collusion-index.json directly instead of calling a runtime API.
"""

from __future__ import annotations

import json
import csv
from datetime import datetime
from io import StringIO
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
    "EU27",
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
    "EU27": "유럽연합",
}

SAMPLE_INDICES = {
    "USA": 125.5,
    "GBR": 118.7,
    "DEU": 112.3,
    "FRA": 110.5,
    "EU27": 108.5,
    "AUS": 108.2,
    "ITA": 107.4,
    "CAN": 105.8,
    "KOR": 100.0,
    "JPN": 98.2,
    "SAU": 95.2,
    "RUS": 88.6,
    "CHN": 85.3,
    "BRA": 82.4,
    "MEX": 78.5,
    "ZAF": 75.8,
    "IND": 72.1,
    "IDN": 70.2,
    "TUR": 68.3,
    "ARG": 65.4,
}

OECD_G20_CPI_DATAFLOW = "OECD.SDD.TPS,DSD_G20_PRICES@DF_G20_PRICES,1.0"
OECD_G20_CPI_SERIES_KEY = "{countries}.A.N.CPI.IX._T.N._Z"
OECD_API_BASE = "https://sdmx.oecd.org/public/rest/data"
SOURCE_DETAIL_OECD = "oecd_sdmx_api"
SOURCE_DETAIL_MISSING = "missing_from_oecd_response"
SOURCE_DETAIL_FULL_SAMPLE = "oecd_fetch_failed_full_sample"


def generate_sample_data(
    base_year: int = 2023,
    *,
    source_detail: str = SOURCE_DETAIL_FULL_SAMPLE,
) -> list[dict[str, object]]:
    data = [
        {
            "countryCode": country_code,
            "countryName": COUNTRY_NAMES[country_code],
            "indexValue": index_value,
            "baseYear": base_year,
            "source": "sample",
            "isSampleBacked": True,
            "sourceDetail": source_detail,
        }
        for country_code, index_value in SAMPLE_INDICES.items()
    ]
    return sorted(data, key=lambda item: float(item["indexValue"]), reverse=True)


def _build_oecd_url(base_year: int, countries: list[str]) -> str:
    country_key = "+".join(countries)
    series_key = OECD_G20_CPI_SERIES_KEY.format(countries=country_key)
    query = urlencode(
        {
            "startPeriod": str(base_year),
            "endPeriod": str(base_year),
            "dimensionAtObservation": "AllDimensions",
            "format": "csvfilewithlabels",
        }
    )
    return f"{OECD_API_BASE}/{OECD_G20_CPI_DATAFLOW}/{series_key}?{query}"


def _read_oecd_csv(url: str) -> list[dict[str, str]]:
    request = Request(url, headers={"User-Agent": "k-collusion-index/1.0"})
    with urlopen(request, timeout=30) as response:
        body = response.read().decode("utf-8-sig")
    return list(csv.DictReader(StringIO(body)))


def _first_present(row: dict[str, str], keys: list[str]) -> str | None:
    for key in keys:
        value = row.get(key)
        if value not in (None, ""):
            return value
    return None


def fetch_oecd_cpi_index(base_year: int = 2023) -> tuple[list[dict[str, object]], list[str]]:
    """Fetch annual G20 CPI index values from OECD's SDMX CSV endpoint."""
    url = _build_oecd_url(base_year, G20_COUNTRIES)
    rows = _read_oecd_csv(url)
    values_by_country: dict[str, float] = {}

    for row in rows:
        country_code = _first_present(row, ["REF_AREA", "Reference area"])
        time_period = _first_present(row, ["TIME_PERIOD", "Time period"])
        raw_value = _first_present(row, ["OBS_VALUE", "Observation value"])

        if not country_code or time_period != str(base_year) or raw_value is None:
            continue

        country_code = country_code.strip()
        if country_code not in G20_COUNTRIES:
            continue

        try:
            values_by_country[country_code] = float(raw_value)
        except ValueError:
            continue

    korea_value = values_by_country.get("KOR")
    if korea_value is None:
        raise ValueError("OECD response did not include Korea CPI index data")

    sample_by_country = {
        item["countryCode"]: item
        for item in generate_sample_data(
            base_year=base_year,
            source_detail=SOURCE_DETAIL_MISSING,
        )
    }
    missing = [country for country in G20_COUNTRIES if country not in values_by_country]
    data = [
        {
            "countryCode": country_code,
            "countryName": COUNTRY_NAMES[country_code],
            "indexValue": (
                100.0
                if country_code == "KOR"
                else round((values_by_country[country_code] / korea_value) * 100, 2)
                if country_code in values_by_country
                else sample_by_country[country_code]["indexValue"]
            ),
            "baseYear": base_year,
            "source": "OECD" if country_code in values_by_country else "sample",
            "isSampleBacked": country_code not in values_by_country,
            "sourceDetail": (
                SOURCE_DETAIL_OECD
                if country_code in values_by_country
                else SOURCE_DETAIL_MISSING
            ),
        }
        for country_code in G20_COUNTRIES
    ]
    return sorted(data, key=lambda item: float(item["indexValue"]), reverse=True), missing


def _refresh_metadata(
    data: list[dict[str, object]],
    missing_oecd_countries: list[str],
) -> dict[str, object]:
    expected_country_count = len(G20_COUNTRIES)
    sample_backed_country_count = sum(
        1
        for item in data
        if item.get("isSampleBacked") is True or item.get("source") == "sample"
    )
    oecd_country_count = sum(
        1
        for item in data
        if item.get("source") == "OECD" and item.get("isSampleBacked") is not True
    )

    return {
        "expectedCountryCount": expected_country_count,
        "oecdCountryCount": oecd_country_count,
        "sampleBackedCountryCount": sample_backed_country_count,
        "missingOecdCountries": missing_oecd_countries,
        "hasIncompleteOecdPull": (
            bool(missing_oecd_countries) or oecd_country_count < expected_country_count
        ),
        "isFallback": sample_backed_country_count > 0,
    }


def save_to_json(
    data: list[dict[str, object]],
    output_dir: str = "public/data",
    *,
    base_year: int = 2023,
    source: str = "sample",
    dataset_type: str = "SAMPLE",
    missing_oecd_countries: list[str] | None = None,
) -> Path:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    filename = output_path / "k-collusion-index.json"
    refresh_metadata = _refresh_metadata(data, missing_oecd_countries or [])

    payload = {
        "success": True,
        "data": data,
        "timestamp": datetime.now().isoformat(),
        "baseYear": base_year,
        "source": source,
        "datasetType": dataset_type,
        **refresh_metadata,
    }

    with filename.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")

    return filename


def main() -> None:
    print("Generating K-Collusion Index data")
    base_year = 2023
    source = "sample"
    dataset_type = "SAMPLE"
    missing = G20_COUNTRIES.copy()

    try:
        data, missing = fetch_oecd_cpi_index(base_year=base_year)
        source = "OECD SDMX API"
        dataset_type = "CPI_INDEX"
        if missing:
            source = "OECD SDMX API with sample fallback"
            print(f"OECD response missing countries, using sample fallback: {', '.join(missing)}")
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        print(f"OECD fetch failed, using sample data: {exc}")
        data = generate_sample_data(base_year=base_year)

    filename = save_to_json(
        data,
        base_year=base_year,
        source=source,
        dataset_type=dataset_type,
        missing_oecd_countries=missing,
    )
    print(f"Wrote {filename}")
    for rank, item in enumerate(data[:5], 1):
        print(f"{rank}. {item['countryName']}: {item['indexValue']}")


if __name__ == "__main__":
    main()
