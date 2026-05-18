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

OECD_G20_CPI_DATAFLOW = "OECD.SDD.TPS,DSD_G20_PRICES@DF_G20_PRICES,1.0"
OECD_G20_CPI_SERIES_KEY = "{countries}.A..CPI.PA._T.N.GY"
OECD_API_BASE = "https://sdmx.oecd.org/public/rest/data"
SOURCE_DETAIL_OECD = "oecd_sdmx_api:cpi_annual_rate"
OECD_COUNTRY_ALIASES = {"EU27": "EU27_2020"}
OECD_COUNTRY_CODES = [
    OECD_COUNTRY_ALIASES.get(country_code, country_code)
    for country_code in G20_COUNTRIES
]
OUTPUT_COUNTRY_CODES = {
    api_code: country_code
    for country_code, api_code in zip(G20_COUNTRIES, OECD_COUNTRY_CODES)
}


def _build_oecd_url(base_year: int, countries: list[str]) -> str:
    country_key = "+".join(
        OECD_COUNTRY_ALIASES.get(country_code, country_code)
        for country_code in countries
    )
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


def fetch_oecd_cpi_index(base_year: int = 2021) -> tuple[list[dict[str, object]], list[str]]:
    """Fetch OECD annual CPI rates and normalize them with Korea fixed at 100."""
    url = _build_oecd_url(base_year, G20_COUNTRIES)
    rows = _read_oecd_csv(url)
    values_by_country: dict[str, float] = {}

    for row in rows:
        country_code = _first_present(row, ["REF_AREA", "Reference area"])
        time_period = _first_present(row, ["TIME_PERIOD", "Time period"])
        raw_value = _first_present(row, ["OBS_VALUE", "Observation value"])

        if not country_code or time_period != str(base_year) or raw_value is None:
            continue

        api_country_code = country_code.strip()
        output_country_code = OUTPUT_COUNTRY_CODES.get(api_country_code)
        if output_country_code not in G20_COUNTRIES:
            continue

        try:
            values_by_country[output_country_code] = float(raw_value)
        except ValueError:
            continue

    missing = [country for country in G20_COUNTRIES if country not in values_by_country]
    if missing:
        raise ValueError(
            "OECD response missing required countries: " + ", ".join(missing)
        )

    korea_value = values_by_country.get("KOR")
    if korea_value is None:
        raise ValueError("OECD response did not include Korea CPI data")

    korea_growth_factor = 100 + korea_value
    data = [
        {
            "countryCode": country_code,
            "countryName": COUNTRY_NAMES[country_code],
            "indexValue": (
                100.0
                if country_code == "KOR"
                else round(
                    ((100 + values_by_country[country_code]) / korea_growth_factor)
                    * 100,
                    2,
                )
            ),
            "baseYear": base_year,
            "source": "OECD",
            "isSampleBacked": False,
            "sourceDetail": SOURCE_DETAIL_OECD,
        }
        for country_code in G20_COUNTRIES
    ]
    return sorted(data, key=lambda item: float(item["indexValue"]), reverse=True), []


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
    base_year: int = 2021,
    source: str = "OECD SDMX API",
    dataset_type: str = "CPI_ANNUAL_RATE",
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
    base_year = 2021
    source = "OECD SDMX API"
    dataset_type = "CPI_ANNUAL_RATE"
    data, missing = fetch_oecd_cpi_index(base_year=base_year)

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
