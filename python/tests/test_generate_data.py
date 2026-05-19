import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_data


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
        generate_data,
        "_read_world_bank_json",
        lambda _url: _world_bank_rows({"GBR", "DEU", "FRA"}),
    )

    with pytest.raises(generate_data.DataUnavailableError, match="No complete G20"):
        generate_data.fetch_world_bank_price_levels(end_year=2024)


def test_full_world_bank_response_has_official_metadata(monkeypatch, tmp_path):
    monkeypatch.setattr(
        generate_data,
        "_read_world_bank_json",
        lambda _url: _world_bank_rows(),
    )
    data, base_year = generate_data.fetch_world_bank_price_levels(end_year=2024)

    filename = generate_data.save_to_json(
        data,
        output_dir=str(tmp_path),
        base_year=base_year,
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
    assert all(item["source"] == generate_data.SOURCE for item in payload["data"])
    assert all(
        item["sourceDetail"] == generate_data.SOURCE_DETAIL
        for item in payload["data"]
    )

    korea = next(item for item in payload["data"] if item["countryCode"] == "KOR")
    assert korea["indexValue"] == 100.0


def test_snapshot_builds_latest_official_price_level_data():
    data, base_year = generate_data.build_snapshot_price_levels()

    assert base_year == 2024
    assert len(data) == len(generate_data.G20_COUNTRIES)
    assert {item["countryCode"] for item in data} == set(generate_data.G20_COUNTRIES)
    assert next(item for item in data if item["countryCode"] == "KOR")[
        "indexValue"
    ] == 100.0
