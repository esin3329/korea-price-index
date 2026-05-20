import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_data
import inflation_sources
import world_bank_source


def _world_bank_rows(missing: set[str] | None = None) -> list[dict[str, object]]:
    missing = missing or set()
    rows = []
    for index, country_code in enumerate(generate_data.G20_COUNTRIES, start=1):
        if country_code in missing:
            continue

        api_country_code = country_code
        value = 0.75 if country_code == "KOR" else 0.55 + index / 100
        rows.append(
            {
                "country": {"id": api_country_code, "value": country_code},
                "countryiso3code": api_country_code,
                "date": "2024",
                "value": value,
            }
        )
    return rows


def test_partial_world_bank_response_raises(monkeypatch):
    monkeypatch.setattr(
        world_bank_source,
        "_read_world_bank_json",
        lambda _url: _world_bank_rows({"GBR", "DEU", "FRA"}),
    )

    with pytest.raises(generate_data.DataUnavailableError, match="No complete G20"):
        generate_data.fetch_world_bank_price_levels(end_year=2024)


def test_full_world_bank_response_has_official_metadata(monkeypatch, tmp_path):
    monkeypatch.setattr(
        world_bank_source,
        "_read_world_bank_json",
        lambda _url: _world_bank_rows(),
    )
    monkeypatch.setattr(
        inflation_sources,
        "_read_imf_consumer_inflation_forecast",
        lambda: generate_data.IMF_2026_CONSUMER_INFLATION_SNAPSHOT,
    )
    monkeypatch.setattr(
        inflation_sources,
        "_read_oecd_latest_cpi_yoy_inflation",
        lambda: (
            {
                code: 2.0
                for code in generate_data.G20_COUNTRIES
            },
            "2026-04",
        ),
    )
    data, base_year = generate_data.fetch_world_bank_price_levels(end_year=2024)
    (
        data,
        consumer_inflation_year,
        is_forecast_fallback,
        latest_cpi_inflation_year,
        latest_cpi_inflation_period,
        is_latest_cpi_fallback,
    ) = generate_data._enrich_with_consumer_inflation(data)

    filename = generate_data.save_to_json(
        data,
        output_dir=str(tmp_path),
        base_year=base_year,
        consumer_inflation_year=consumer_inflation_year,
        is_forecast_fallback=is_forecast_fallback,
        latest_cpi_inflation_year=latest_cpi_inflation_year,
        latest_cpi_inflation_period=latest_cpi_inflation_period,
        is_latest_cpi_fallback=is_latest_cpi_fallback,
    )

    payload = json.loads(filename.read_text(encoding="utf-8"))
    assert payload["expectedCountryCount"] == len(generate_data.G20_COUNTRIES)
    assert payload["officialCountryCount"] == len(generate_data.G20_COUNTRIES)
    assert payload["missingCountries"] == []
    assert payload["hasIncompleteOfficialPull"] is False
    assert payload["isFallback"] is False
    assert payload["baseYear"] == 2024
    assert payload["datasetType"] == generate_data.DATASET_TYPE
    assert payload["source"] == generate_data.SOURCE
    assert payload["indicatorCode"] == generate_data.WORLD_BANK_PRICE_LEVEL_INDICATOR
    assert payload["consumerInflationYear"] == 2026
    assert payload["consumerInflationIndicatorCode"] == "PCPIPCH"
    assert payload["consumerInflationVintage"] == "April 2026"
    assert payload["consumerInflationPublicationDate"] == "2026-04-14"
    assert payload["consumerInflationIsForecast"] is True
    assert payload["latestCpiInflationYear"] == 2026
    assert payload["latestCpiInflationPeriod"] == "2026-04"
    assert payload["latestCpiInflationSource"] == "OECD G20 Consumer Price Indices"
    assert payload["latestCpiInflationIndicatorCode"] == "GY"
    assert all(item["source"] == generate_data.SOURCE for item in payload["data"])
    assert all(
        item["sourceDetail"] == generate_data.SOURCE_DETAIL
        for item in payload["data"]
    )
    assert all(
        item["consumerInflationSource"] == generate_data.IMF_CONSUMER_INFLATION_SOURCE
        for item in payload["data"]
    )

    korea = next(item for item in payload["data"] if item["countryCode"] == "KOR")
    assert korea["indexValue"] == 100.0
    assert korea["consumerInflationRate"] == 2.5
    assert korea["consumerInflationVintage"] == "April 2026"
    assert korea["consumerInflationPublicationDate"] == "2026-04-14"
    assert korea["consumerInflationIsForecast"] is True
    assert korea["latestCpiInflationRate"] == 2.0
    assert korea["latestCpiInflationYear"] == 2026
    assert korea["latestCpiInflationPeriod"] == "2026-04"


def test_snapshot_builds_latest_official_price_level_data():
    data, base_year = generate_data.build_snapshot_price_levels()

    assert base_year == 2024
    assert len(data) == len(generate_data.G20_COUNTRIES)
    assert {item["countryCode"] for item in data} == set(generate_data.G20_COUNTRIES)
    assert next(item for item in data if item["countryCode"] == "KOR")[
        "indexValue"
    ] == 100.0


def test_inflation_forecast_and_latest_cpi_cover_g20():
    (
        data,
        consumer_inflation_year,
        is_forecast_fallback,
        latest_cpi_inflation_year,
        latest_cpi_inflation_period,
        is_latest_cpi_fallback,
    ) = generate_data._enrich_with_consumer_inflation(
        [{"countryCode": code} for code in generate_data.G20_COUNTRIES]
    )

    assert isinstance(is_forecast_fallback, bool)
    assert isinstance(is_latest_cpi_fallback, bool)
    assert consumer_inflation_year == 2026
    assert latest_cpi_inflation_year == 2026
    assert latest_cpi_inflation_period == "2026-04"
    assert len(data) == len(generate_data.G20_COUNTRIES)
    assert next(item for item in data if item["countryCode"] == "KOR")[
        "consumerInflationRate"
    ] == 2.5
    assert next(item for item in data if item["countryCode"] == "KOR")[
        "latestCpiInflationRate"
    ] == 2.6
    assert next(item for item in data if item["countryCode"] == "USA")[
        "consumerInflationRate"
    ] == 3.2
    assert next(item for item in data if item["countryCode"] == "USA")[
        "latestCpiInflationRate"
    ] == 3.8


def test_oecd_g20_cpi_url_requests_monthly_year_over_year_growth():
    url = generate_data._build_oecd_g20_cpi_yoy_url("2026-04", lookback_months=0)

    assert "OECD.SDD.TPS,DSD_G20_PRICES@DF_G20_PRICES,1.0" in url
    assert ".M..CPI.PA._T.N.GY" in url
    assert "startPeriod=2026-04" in url
    assert "endPeriod=2026-04" in url
    assert "format=csvfilewithlabels" in url
