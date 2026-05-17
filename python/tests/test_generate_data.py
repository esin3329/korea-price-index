import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_data


def _oecd_rows(missing: set[str] | None = None) -> list[dict[str, str]]:
    missing = missing or set()
    rows = []
    for index, country_code in enumerate(generate_data.G20_COUNTRIES, start=1):
        if country_code in missing:
            continue

        rows.append(
            {
                "REF_AREA": country_code,
                "TIME_PERIOD": "2023",
                "OBS_VALUE": "100" if country_code == "KOR" else str(100 + index),
            }
        )
    return rows


def test_partial_oecd_response_marks_missing_rows_as_sample_backed(monkeypatch):
    missing = {"GBR", "DEU", "FRA"}
    monkeypatch.setattr(
        generate_data,
        "_read_oecd_csv",
        lambda _url: _oecd_rows(missing),
    )

    data, missing_countries = generate_data.fetch_oecd_cpi_index(base_year=2023)

    assert missing_countries == ["FRA", "DEU", "GBR"]
    sample_rows = {
        item["countryCode"]: item for item in data if item["isSampleBacked"] is True
    }
    assert set(sample_rows) == missing
    assert all(item["source"] == "sample" for item in sample_rows.values())
    assert all(
        item["sourceDetail"] == generate_data.SOURCE_DETAIL_MISSING
        for item in sample_rows.values()
    )


def test_full_oecd_response_has_no_fallback_metadata(monkeypatch, tmp_path):
    monkeypatch.setattr(generate_data, "_read_oecd_csv", lambda _url: _oecd_rows())
    data, missing_countries = generate_data.fetch_oecd_cpi_index(base_year=2023)

    filename = generate_data.save_to_json(
        data,
        output_dir=str(tmp_path),
        base_year=2023,
        source="OECD SDMX API",
        dataset_type="CPI_INDEX",
        missing_oecd_countries=missing_countries,
    )

    payload = json.loads(filename.read_text(encoding="utf-8"))
    assert payload["expectedCountryCount"] == len(generate_data.G20_COUNTRIES)
    assert payload["oecdCountryCount"] == len(generate_data.G20_COUNTRIES)
    assert payload["sampleBackedCountryCount"] == 0
    assert payload["missingOecdCountries"] == []
    assert payload["hasIncompleteOecdPull"] is False
    assert payload["isFallback"] is False
    assert all(item["isSampleBacked"] is False for item in payload["data"])


def test_full_sample_fallback_marks_every_row(tmp_path):
    data = generate_data.generate_sample_data(base_year=2023)
    filename = generate_data.save_to_json(
        data,
        output_dir=str(tmp_path),
        base_year=2023,
        source="sample",
        dataset_type="SAMPLE",
        missing_oecd_countries=generate_data.G20_COUNTRIES.copy(),
    )

    payload = json.loads(filename.read_text(encoding="utf-8"))
    assert payload["oecdCountryCount"] == 0
    assert payload["sampleBackedCountryCount"] == len(generate_data.G20_COUNTRIES)
    assert payload["missingOecdCountries"] == generate_data.G20_COUNTRIES
    assert payload["hasIncompleteOecdPull"] is True
    assert payload["isFallback"] is True
    assert all(item["source"] == "sample" for item in payload["data"])
    assert all(item["isSampleBacked"] is True for item in payload["data"])
    assert all(
        item["sourceDetail"] == generate_data.SOURCE_DETAIL_FULL_SAMPLE
        for item in payload["data"]
    )
