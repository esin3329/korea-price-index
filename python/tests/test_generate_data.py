import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_data


def _oecd_rows(missing: set[str] | None = None) -> list[dict[str, str]]:
    missing = missing or set()
    rows = []
    for index, country_code in enumerate(generate_data.G20_COUNTRIES, start=1):
        if country_code in missing:
            continue

        api_country_code = generate_data.OECD_COUNTRY_ALIASES.get(
            country_code,
            country_code,
        )
        value = "2.5" if country_code == "KOR" else str(2 + index / 10)
        rows.append(
            {
                "REF_AREA": api_country_code,
                "TIME_PERIOD": "2021",
                "OBS_VALUE": value,
            }
        )
    return rows


def test_partial_oecd_response_raises_instead_of_using_sample(monkeypatch):
    monkeypatch.setattr(
        generate_data,
        "_read_oecd_csv",
        lambda _url: _oecd_rows({"GBR", "DEU", "FRA"}),
    )

    with pytest.raises(ValueError, match="OECD response missing required countries"):
        generate_data.fetch_oecd_cpi_index(base_year=2021)


def test_full_oecd_response_has_no_fallback_metadata(monkeypatch, tmp_path):
    monkeypatch.setattr(generate_data, "_read_oecd_csv", lambda _url: _oecd_rows())
    data, missing_countries = generate_data.fetch_oecd_cpi_index(base_year=2021)

    filename = generate_data.save_to_json(
        data,
        output_dir=str(tmp_path),
        base_year=2021,
        source="OECD SDMX API",
        dataset_type="CPI_ANNUAL_RATE",
        missing_oecd_countries=missing_countries,
    )

    payload = json.loads(filename.read_text(encoding="utf-8"))
    assert payload["expectedCountryCount"] == len(generate_data.G20_COUNTRIES)
    assert payload["oecdCountryCount"] == len(generate_data.G20_COUNTRIES)
    assert payload["sampleBackedCountryCount"] == 0
    assert payload["missingOecdCountries"] == []
    assert payload["hasIncompleteOecdPull"] is False
    assert payload["isFallback"] is False
    assert payload["baseYear"] == 2021
    assert payload["datasetType"] == "CPI_ANNUAL_RATE"
    assert all(item["source"] == "OECD" for item in payload["data"])
    assert all(item["isSampleBacked"] is False for item in payload["data"])
    assert all(
        item["sourceDetail"] == generate_data.SOURCE_DETAIL_OECD
        for item in payload["data"]
    )


def test_oecd_country_aliases_are_mapped_back_to_dashboard_codes(monkeypatch):
    monkeypatch.setattr(generate_data, "_read_oecd_csv", lambda _url: _oecd_rows())

    data, _missing_countries = generate_data.fetch_oecd_cpi_index(base_year=2021)

    country_codes = {item["countryCode"] for item in data}
    assert "EU27" in country_codes
    assert "EU27_2020" not in country_codes
