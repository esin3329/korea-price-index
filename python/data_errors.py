"""Domain-specific data generation errors."""


class DataUnavailableError(RuntimeError):
    """Raised when a complete official price-level dataset is unavailable."""


class InflationDataUnavailableError(RuntimeError):
    """Raised when complete CPI trend data is unavailable."""
