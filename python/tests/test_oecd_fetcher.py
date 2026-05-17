import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import oecd_fetcher


class FakeResponse:
    def __init__(self, text: str):
        self.text = text

    def raise_for_status(self):
        return None


def test_fetch_cpi_data_normalizes_oecd_csv(monkeypatch):
    csv_text = "\n".join(
        [
            "REF_AREA,Reference area,TIME_PERIOD,Time period,OBS_VALUE,Observation value",
            "KOR,Korea,2023,2023,100.0,100.0",
            "USA,United States,2023,2023,109.28,109.28",
            "USA,United States,2022,2022,106.5,106.5",
        ]
    )
    captured: dict[str, object] = {}

    def fake_get(url, timeout, headers):
        captured["url"] = url
        captured["timeout"] = timeout
        captured["headers"] = headers
        return FakeResponse(csv_text)

    monkeypatch.setattr(oecd_fetcher.requests, "get", fake_get)

    df = oecd_fetcher.fetch_cpi_data(["KOR", "USA"], 2023, 2023)

    assert "OECD.SDD.TPS,DSD_G20_PRICES@DF_G20_PRICES,1.0" in captured["url"]
    assert "KOR%2BUSA" not in captured["url"]
    assert "KOR+USA.A.N.CPI.IX._T.N._Z" in captured["url"]
    assert captured["timeout"] == 30
    assert captured["headers"]["User-Agent"] == "k-collusion-index/1.0"
    assert list(df.columns) == [
        "country_code",
        "country_name",
        "year",
        "value",
        "dataset_type",
    ]
    assert df.to_dict("records") == [
        {
            "country_code": "KOR",
            "country_name": "대한민국",
            "year": 2023,
            "value": 100.0,
            "dataset_type": "CPI",
        },
        {
            "country_code": "USA",
            "country_name": "미국",
            "year": 2023,
            "value": 109.28,
            "dataset_type": "CPI",
        },
    ]


def test_fetch_ppp_data_uses_oecd_ppp_endpoint(monkeypatch):
    csv_text = "\n".join(
        [
            "REF_AREA,Reference area,TIME_PERIOD,Time period,OBS_VALUE,Observation value",
            "KOR,Korea,2020,2020,969,969",
            "USA,United States,2020,2020,1.8,1.8",
        ]
    )
    captured: dict[str, str] = {}

    def fake_get(url, timeout, headers):
        captured["url"] = url
        return FakeResponse(csv_text)

    monkeypatch.setattr(oecd_fetcher.requests, "get", fake_get)

    df = oecd_fetcher.fetch_ppp_data(["KOR", "USA"], 2020, 2020)

    assert "OECD.SDD.TPS,DSD_PPP@DF_PPP,1.0" in captured["url"]
    assert "KOR+USA.A.PPP.E0122..OECD" in captured["url"]
    assert set(df["dataset_type"]) == {"PPP"}
    assert set(df["country_code"]) == {"KOR", "USA"}
    assert df.loc[df["country_code"] == "KOR", "value"].iloc[0] == 969


def test_rows_to_dataframe_skips_invalid_and_out_of_scope_rows():
    rows = [
        {"REF_AREA": "KOR", "TIME_PERIOD": "2023", "OBS_VALUE": "100"},
        {"REF_AREA": "USA", "TIME_PERIOD": "2023", "OBS_VALUE": ""},
        {"REF_AREA": "JPN", "TIME_PERIOD": "2022", "OBS_VALUE": "105"},
        {"REF_AREA": "BRA", "TIME_PERIOD": "2023", "OBS_VALUE": "not-number"},
        {"REF_AREA": "CAN", "TIME_PERIOD": "2023", "OBS_VALUE": "104.5"},
    ]

    df = oecd_fetcher._rows_to_dataframe(
        rows,
        countries=["KOR", "USA", "CAN"],
        start_year=2023,
        end_year=2023,
        dataset_type="CPI",
    )

    assert df.to_dict("records") == [
        {
            "country_code": "CAN",
            "country_name": "캐나다",
            "year": 2023,
            "value": 104.5,
            "dataset_type": "CPI",
        },
        {
            "country_code": "KOR",
            "country_name": "대한민국",
            "year": 2023,
            "value": 100.0,
            "dataset_type": "CPI",
        },
    ]
