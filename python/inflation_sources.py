"""IMF and OECD CPI trend data sources."""

from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from data_config import (
    G20_COUNTRIES,
    IMF_2026_CONSUMER_INFLATION_SNAPSHOT,
    IMF_CONSUMER_INFLATION_INDICATOR,
    IMF_CONSUMER_INFLATION_PUBLICATION_DATE,
    IMF_CONSUMER_INFLATION_SOURCE,
    IMF_CONSUMER_INFLATION_SOURCE_DETAIL,
    IMF_CONSUMER_INFLATION_VINTAGE,
    IMF_CONSUMER_INFLATION_YEAR,
    IMF_DATAMAPPER_API_BASE,
    LATEST_CPI_YOY_LOOKBACK_MONTHS,
    OECD_API_BASE,
    OECD_G20_CPI_DATAFLOW,
    OECD_G20_CPI_YOY_INDICATOR,
    OECD_G20_CPI_YOY_SOURCE,
    OECD_G20_CPI_YOY_SOURCE_DETAIL,
    OECD_LATEST_CPI_YOY_PERIOD_SNAPSHOT,
    OECD_LATEST_CPI_YOY_SNAPSHOT,
)
from data_errors import InflationDataUnavailableError


def _build_imf_datamapper_url(year: int = IMF_CONSUMER_INFLATION_YEAR) -> str:
    countries = "/".join(G20_COUNTRIES)
    return (
        f"{IMF_DATAMAPPER_API_BASE}/{IMF_CONSUMER_INFLATION_INDICATOR}/"
        f"{countries}?periods={year}"
    )


def _read_imf_consumer_inflation_forecast(
    year: int = IMF_CONSUMER_INFLATION_YEAR,
) -> dict[str, float]:
    request = Request(
        _build_imf_datamapper_url(year),
        headers={"User-Agent": "curl/8.0.0"},
    )
    with urlopen(request, timeout=20) as response:
        payload = json.loads(response.read().decode("utf-8"))

    values = payload.get("values") if isinstance(payload, dict) else None
    indicator_values = (
        values.get(IMF_CONSUMER_INFLATION_INDICATOR)
        if isinstance(values, dict)
        else None
    )
    if not isinstance(indicator_values, dict):
        raise InflationDataUnavailableError("IMF DataMapper returned no values")

    inflation: dict[str, float] = {}
    missing: list[str] = []
    for country_code in G20_COUNTRIES:
        country_values = indicator_values.get(country_code)
        raw_value = (
            country_values.get(str(year))
            if isinstance(country_values, dict)
            else None
        )
        if raw_value is None:
            missing.append(country_code)
            continue
        inflation[country_code] = round(float(raw_value), 1)

    if missing:
        raise InflationDataUnavailableError(
            f"IMF DataMapper missing {year} forecast values: {', '.join(missing)}"
        )

    return inflation


def _month_offset(period: str, months: int) -> str:
    year, month = (int(part) for part in period.split("-"))
    month_index = year * 12 + (month - 1) + months
    return f"{month_index // 12:04d}-{month_index % 12 + 1:02d}"


def _build_oecd_g20_cpi_yoy_url(
    end_period: str | None = None,
    *,
    lookback_months: int = LATEST_CPI_YOY_LOOKBACK_MONTHS,
) -> str:
    if end_period is None:
        now = datetime.now(timezone.utc)
        end_period = f"{now.year:04d}-{now.month:02d}"
    start_period = _month_offset(end_period, -lookback_months)
    countries = "+".join(G20_COUNTRIES)
    query = urlencode(
        {
            "startPeriod": start_period,
            "endPeriod": end_period,
            "dimensionAtObservation": "AllDimensions",
            "format": "csvfilewithlabels",
        }
    )
    return (
        f"{OECD_API_BASE}/{OECD_G20_CPI_DATAFLOW}/"
        f"{countries}.M..CPI.PA._T.N.{OECD_G20_CPI_YOY_INDICATOR}?{query}"
    )


def _read_oecd_latest_cpi_yoy_inflation(
    period: str | None = None,
) -> tuple[dict[str, float], str]:
    request = Request(
        _build_oecd_g20_cpi_yoy_url(period),
        headers={"User-Agent": "k-collusion-index/1.0"},
    )
    with urlopen(request, timeout=30) as response:
        text = response.read().decode("utf-8")

    values_by_period: dict[str, dict[str, float]] = {}
    reader = csv.DictReader(io.StringIO(text.lstrip("\ufeff")))
    for row in reader:
        country_code = row.get("REF_AREA")
        time_period = row.get("TIME_PERIOD")
        raw_value = row.get("OBS_VALUE")
        if country_code not in G20_COUNTRIES or not time_period or not raw_value:
            continue
        try:
            value = float(raw_value)
        except ValueError:
            continue
        values_by_period.setdefault(time_period, {})[country_code] = value

    required = set(G20_COUNTRIES)
    common_periods = [
        period
        for period, values in values_by_period.items()
        if required.issubset(values.keys())
    ]
    if not common_periods:
        raise InflationDataUnavailableError(
            "OECD G20 CPI YoY contains no common period for every country"
        )

    latest_period = max(common_periods)
    latest_values = values_by_period[latest_period]
    return {
        country_code: round(latest_values[country_code], 1)
        for country_code in G20_COUNTRIES
    }, latest_period


def enrich_with_consumer_inflation(
    data: list[dict[str, object]],
) -> tuple[list[dict[str, object]], int, bool, int, str, bool]:
    try:
        forecast = _read_imf_consumer_inflation_forecast()
        is_forecast_fallback = False
    except (
        TimeoutError,
        InflationDataUnavailableError,
        OSError,
        ValueError,
        json.JSONDecodeError,
    ):
        forecast = IMF_2026_CONSUMER_INFLATION_SNAPSHOT
        is_forecast_fallback = True

    try:
        latest_cpi, latest_cpi_period = _read_oecd_latest_cpi_yoy_inflation()
        is_inflation_fallback = False
    except (
        TimeoutError,
        InflationDataUnavailableError,
        OSError,
        ValueError,
        json.JSONDecodeError,
    ):
        latest_cpi = OECD_LATEST_CPI_YOY_SNAPSHOT
        latest_cpi_period = OECD_LATEST_CPI_YOY_PERIOD_SNAPSHOT
        is_inflation_fallback = True
    latest_cpi_year = int(latest_cpi_period[:4])

    enriched = []
    for item in data:
        country_code = str(item["countryCode"])
        enriched.append(
            {
                **item,
                "consumerInflationRate": forecast[country_code],
                "consumerInflationYear": IMF_CONSUMER_INFLATION_YEAR,
                "consumerInflationSource": IMF_CONSUMER_INFLATION_SOURCE,
                "consumerInflationSourceDetail": IMF_CONSUMER_INFLATION_SOURCE_DETAIL,
                "consumerInflationVintage": IMF_CONSUMER_INFLATION_VINTAGE,
                "consumerInflationPublicationDate": (
                    IMF_CONSUMER_INFLATION_PUBLICATION_DATE
                ),
                "consumerInflationIsForecast": True,
                "latestCpiInflationRate": latest_cpi[country_code],
                "latestCpiInflationYear": latest_cpi_year,
                "latestCpiInflationPeriod": latest_cpi_period,
                "latestCpiInflationSource": OECD_G20_CPI_YOY_SOURCE,
                "latestCpiInflationSourceDetail": (
                    OECD_G20_CPI_YOY_SOURCE_DETAIL
                ),
            }
        )

    return (
        enriched,
        IMF_CONSUMER_INFLATION_YEAR,
        is_forecast_fallback,
        latest_cpi_year,
        latest_cpi_period,
        is_inflation_fallback,
    )
