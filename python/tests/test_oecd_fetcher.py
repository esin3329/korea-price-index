import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import oecd_fetcher


class FakeResponse:
    def __init__(self, text: str):
        self.text = text

    def raise_for_status(self):
        return None


def test_fetch_oecd_aic_price_levels_uses_oecd_ppp_cpl_endpoint(monkeypatch):
    csv_text = "\n".join(
        [
            "REF_AREA,Reference area,TIME_PERIOD,Time period,OBS_VALUE,Observation value",
            "KOR,Korea,2024,2024,59,59",
            "USA,United States,2024,2024,100,100",
            "USA,United States,2023,2023,98,98",
        ]
    )
    captured: dict[str, object] = {}

    def fake_get(url, timeout, headers):
        captured["url"] = url
        captured["timeout"] = timeout
        captured["headers"] = headers
        return FakeResponse(csv_text)

    monkeypatch.setattr(oecd_fetcher.requests, "get", fake_get)

    df = oecd_fetcher.fetch_oecd_aic_price_levels(["KOR", "USA"], 2024, 2024)

    assert "OECD.SDD.TPS,DSD_PPP@DF_PPP_CPL,1.1" in captured["url"]
    assert "KOR+USA.A.PL.A01.IX.USA" in captured["url"]
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
            "year": 2024,
            "value": 59.0,
            "dataset_type": "OECD_AIC_PRICE_LEVEL",
        },
        {
            "country_code": "USA",
            "country_name": "미국",
            "year": 2024,
            "value": 100.0,
            "dataset_type": "OECD_AIC_PRICE_LEVEL",
        },
    ]


def test_rows_to_dataframe_skips_invalid_and_out_of_scope_rows():
    rows = [
        {"REF_AREA": "KOR", "TIME_PERIOD": "2024", "OBS_VALUE": "59"},
        {"REF_AREA": "USA", "TIME_PERIOD": "2024", "OBS_VALUE": ""},
        {"REF_AREA": "JPN", "TIME_PERIOD": "2023", "OBS_VALUE": "62"},
        {"REF_AREA": "BRA", "TIME_PERIOD": "2024", "OBS_VALUE": "not-number"},
        {"REF_AREA": "CAN", "TIME_PERIOD": "2024", "OBS_VALUE": "84.5"},
    ]

    df = oecd_fetcher._rows_to_dataframe(
        rows,
        countries=["KOR", "USA", "CAN"],
        start_year=2024,
        end_year=2024,
        dataset_type="OECD_AIC_PRICE_LEVEL",
    )

    assert df.to_dict("records") == [
        {
            "country_code": "CAN",
            "country_name": "캐나다",
            "year": 2024,
            "value": 84.5,
            "dataset_type": "OECD_AIC_PRICE_LEVEL",
        },
        {
            "country_code": "KOR",
            "country_name": "대한민국",
            "year": 2024,
            "value": 59.0,
            "dataset_type": "OECD_AIC_PRICE_LEVEL",
        },
    ]
