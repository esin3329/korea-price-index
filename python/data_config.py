"""Shared configuration for K-Collusion Index data generation."""

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

WORLD_BANK_API_BASE = "https://api.worldbank.org/v2"
WORLD_BANK_PRICE_LEVEL_INDICATOR = "PA.NUS.PPPC.RF"
WORLD_BANK_PRICE_LEVEL_NAME = (
    "Price level ratio of PPP conversion factor (GDP) to market exchange rate"
)
DATASET_TYPE = "PRICE_LEVEL_RATIO_GDP_PPP_TO_MARKET_EXCHANGE_RATE"
SOURCE = "World Bank WDI"
SOURCE_DETAIL = f"world_bank_wdi:{WORLD_BANK_PRICE_LEVEL_INDICATOR}"
AUTARIO_WORLD_BANK_DATASET_API = (
    "https://autario.com/api/v1/public/datasets/"
    "3b933e66-0321-4ae3-adcb-ff352bfb00f0/data"
)
LATEST_LOOKBACK_YEARS = 8

IMF_CONSUMER_INFLATION_INDICATOR = "PCPIPCH"
IMF_CONSUMER_INFLATION_NAME = "Inflation, average consumer prices"
IMF_CONSUMER_INFLATION_YEAR = 2026
IMF_CONSUMER_INFLATION_VINTAGE = "April 2026"
IMF_CONSUMER_INFLATION_PUBLICATION_DATE = "2026-04-14"
IMF_CONSUMER_INFLATION_SOURCE = (
    f"IMF World Economic Outlook ({IMF_CONSUMER_INFLATION_VINTAGE})"
)
IMF_CONSUMER_INFLATION_SOURCE_DETAIL = (
    f"imf_weo:{IMF_CONSUMER_INFLATION_INDICATOR}"
)
IMF_CONSUMER_INFLATION_SOURCE_URL = (
    "https://www.imf.org/en/publications/weo/issues/2026/04/14/"
    "world-economic-outlook-april-2026"
)
IMF_DATAMAPPER_API_BASE = "https://www.imf.org/external/datamapper/api/v1"

OECD_API_BASE = "https://sdmx.oecd.org/public/rest/data"
OECD_G20_CPI_DATAFLOW = "OECD.SDD.TPS,DSD_G20_PRICES@DF_G20_PRICES,1.0"
OECD_G20_CPI_YOY_INDICATOR = "GY"
OECD_G20_CPI_YOY_NAME = "CPI all items, growth rate over 1 year"
OECD_G20_CPI_YOY_SOURCE = "OECD G20 Consumer Price Indices"
OECD_G20_CPI_YOY_SOURCE_DETAIL = f"oecd_g20_prices:{OECD_G20_CPI_YOY_INDICATOR}"
OECD_G20_CPI_YOY_SOURCE_URL = (
    "https://data-explorer.oecd.org/vis?"
    "df[ag]=OECD.SDD.TPS&df[id]=DSD_G20_PRICES%40DF_G20_PRICES"
)
LATEST_CPI_YOY_LOOKBACK_MONTHS = 72

WORLD_BANK_2024_SNAPSHOT = {
    "ARG": 0.459061319225925,
    "AUS": 0.895894112849615,
    "BRA": 0.461560073187954,
    "CAN": 0.840153207747759,
    "CHN": 0.490802871328148,
    "FRA": 0.737359788150781,
    "DEU": 0.758599340089062,
    "IND": 0.241464271880756,
    "IDN": 0.299449658545769,
    "ITA": 0.649024553335156,
    "JPN": 0.624066284421693,
    "KOR": 0.593576396809388,
    "MEX": 0.541744819872408,
    "RUS": 0.314081420115992,
    "SAU": 0.492069764351171,
    "ZAF": 0.405480468825683,
    "TUR": 0.34822649525949,
    "GBR": 0.848850489420597,
    "USA": 1.00,
}

IMF_2026_CONSUMER_INFLATION_SNAPSHOT = {
    "ARG": 30.4,
    "AUS": 4.0,
    "BRA": 4.0,
    "CAN": 2.5,
    "CHN": 1.2,
    "FRA": 1.8,
    "DEU": 2.7,
    "IND": 4.7,
    "IDN": 3.0,
    "ITA": 2.6,
    "JPN": 2.2,
    "KOR": 2.5,
    "MEX": 3.9,
    "RUS": 5.6,
    "SAU": 2.3,
    "ZAF": 3.9,
    "TUR": 28.6,
    "GBR": 3.2,
    "USA": 3.2,
}

OECD_LATEST_CPI_YOY_PERIOD_SNAPSHOT = "2026-04"
OECD_LATEST_CPI_YOY_SNAPSHOT = {
    "ARG": 32.4,
    "AUS": 4.6,
    "BRA": 4.4,
    "CAN": 2.8,
    "CHN": 1.2,
    "FRA": 0.7,
    "DEU": 2.0,
    "IND": 4.3,
    "IDN": 2.4,
    "ITA": 1.2,
    "JPN": 1.5,
    "KOR": 2.6,
    "MEX": 4.4,
    "RUS": 16.7,
    "SAU": 1.7,
    "ZAF": 3.0,
    "TUR": 30.9,
    "GBR": 3.4,
    "USA": 3.8,
}
