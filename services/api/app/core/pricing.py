from dataclasses import dataclass

# Per-model USD rates per token, derived from Anthropic's published per-MTok pricing.
# cache_write is charged at 1.25x the base input rate; cache_read at 0.1x the base input rate.
@dataclass(frozen=True)
class ModelRates:
    input: float
    output: float
    cache_write: float
    cache_read: float


def _rates(input_per_mtok: float, output_per_mtok: float) -> ModelRates:
    return ModelRates(
        input=input_per_mtok / 1_000_000,
        output=output_per_mtok / 1_000_000,
        cache_write=(input_per_mtok * 1.25) / 1_000_000,
        cache_read=(input_per_mtok * 0.1) / 1_000_000,
    )


MODEL_RATES: dict[str, ModelRates] = {
    "claude-opus-5": _rates(5.00, 25.00),
    "claude-opus-4-8": _rates(5.00, 25.00),
    "claude-opus-4-7": _rates(5.00, 25.00),
    "claude-opus-4-6": _rates(5.00, 25.00),
    "claude-sonnet-5": _rates(3.00, 15.00),
    "claude-sonnet-4-6": _rates(3.00, 15.00),
    "claude-haiku-4-5": _rates(1.00, 5.00),
    "claude-haiku-4-5-20251001": _rates(1.00, 5.00),
}

# Fallback for a model id not yet in the table above — priced at Sonnet-tier rates
# so unrecognized models don't silently report zero cost.
_DEFAULT_RATES = _rates(3.00, 15.00)


def calculate_cost_usd(
    model: str,
    input_tokens: int,
    output_tokens: int,
    cache_creation_input_tokens: int = 0,
    cache_read_input_tokens: int = 0,
) -> float:
    rates = MODEL_RATES.get(model, _DEFAULT_RATES)
    return (
        input_tokens * rates.input
        + output_tokens * rates.output
        + cache_creation_input_tokens * rates.cache_write
        + cache_read_input_tokens * rates.cache_read
    )
