"""Official data fetch helpers for price-level comparison work.

The production dashboard uses World Bank WDI price level ratios. OECD PPP
helpers are kept for exploratory validation where OECD country coverage is
sufficient, but CPI inflation rates are not used for cross-country price-level
ranking.
"""

from __future__ import annotations

import csv
from io import StringIO
from urllib.parse import urlencode

import pandas as pd
import requests

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

OECD_API_BASE = "https://sdmx.oecd.org/public/rest/data"
OECD_PPP_CPL_DATAFLOW = "OECD.SDD.TPS,DSD_PPP@DF_PPP_CPL,1.1"
OECD_AIC_PRICE_LEVEL_KEY = "{countries}.A.PL.A01.IX.USA"


def _build_oecd_url(
    dataflow_id: str,
    series_key: str,
    start_year: int,
    end_year: int,
) -> str:
    query = urlencode(
        {
            "startPeriod": str(start_year),
            "endPeriod": str(end_year),
            "dimensionAtObservation": "AllDimensions",
            "format": "csvfilewithlabels",
        }
    )
    return f"{OECD_API_BASE}/{dataflow_id}/{series_key}?{query}"


def _read_oecd_csv(url: str) -> list[dict[str, str]]:
    response = requests.get(
        url,
        timeout=30,
        headers={"User-Agent": "k-collusion-index/1.0"},
    )
    response.raise_for_status()
    return list(csv.DictReader(StringIO(response.text.lstrip("\ufeff"))))


def _first_present(row: dict[str, str], keys: list[str]) -> str | None:
    for key in keys:
        value = row.get(key)
        if value not in (None, ""):
            return value
    return None


def _rows_to_dataframe(
    rows: list[dict[str, str]],
    *,
    countries: list[str],
    start_year: int,
    end_year: int,
    dataset_type: str,
) -> pd.DataFrame:
    records: list[dict[str, object]] = []
    country_set = set(countries)

    for row in rows:
        country_code = _first_present(row, ["REF_AREA", "Reference area"])
        time_period = _first_present(row, ["TIME_PERIOD", "Time period"])
        raw_value = _first_present(row, ["OBS_VALUE", "Observation value"])

        if not country_code or not time_period or raw_value is None:
            continue

        country_code = country_code.strip()
        if country_code not in country_set:
            continue

        try:
            year = int(time_period)
            value = float(raw_value)
        except ValueError:
            continue

        if year < start_year or year > end_year:
            continue

        records.append(
            {
                "country_code": country_code,
                "country_name": COUNTRY_NAMES.get(country_code, country_code),
                "year": year,
                "value": value,
                "dataset_type": dataset_type,
            }
        )

    columns = ["country_code", "country_name", "year", "value", "dataset_type"]
    return (
        pd.DataFrame(records, columns=columns)
        .sort_values(["year", "country_code"])
        .reset_index(drop=True)
    )


def fetch_oecd_aic_price_levels(
    countries: list[str] | None = None,
    start_year: int = 2022,
    end_year: int = 2024,
) -> pd.DataFrame:
    """Fetch OECD actual-individual-consumption price level indices.

    This is not used as the production source because OECD PPP coverage does not
    consistently include every G20 member in this project.
    """
    if countries is None:
        countries = ["AUS", "CAN", "FRA", "DEU", "ITA", "JPN", "KOR", "GBR", "USA"]

    series_key = OECD_AIC_PRICE_LEVEL_KEY.format(countries="+".join(countries))
    rows = _read_oecd_csv(
        _build_oecd_url(OECD_PPP_CPL_DATAFLOW, series_key, start_year, end_year)
    )
    return _rows_to_dataframe(
        rows,
        countries=countries,
        start_year=start_year,
        end_year=end_year,
        dataset_type="OECD_AIC_PRICE_LEVEL",
    )


if __name__ == "__main__":
    print(fetch_oecd_aic_price_levels(["KOR", "USA", "JPN"], 2024, 2024))
