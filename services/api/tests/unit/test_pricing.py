from app.core.pricing import calculate_cost_usd


def test_basic_input_output_cost():
    cost = calculate_cost_usd("claude-sonnet-4-6", input_tokens=1_000_000, output_tokens=0)
    assert cost == 3.00


def test_output_tokens_priced_higher_than_input():
    input_cost = calculate_cost_usd("claude-sonnet-4-6", input_tokens=1_000_000, output_tokens=0)
    output_cost = calculate_cost_usd("claude-sonnet-4-6", input_tokens=0, output_tokens=1_000_000)
    assert output_cost > input_cost


def test_cache_read_cheaper_than_base_input():
    base = calculate_cost_usd("claude-sonnet-4-6", input_tokens=1000, output_tokens=0)
    cached = calculate_cost_usd(
        "claude-sonnet-4-6", input_tokens=0, output_tokens=0, cache_read_input_tokens=1000
    )
    assert cached < base


def test_cache_write_more_expensive_than_base_input():
    base = calculate_cost_usd("claude-sonnet-4-6", input_tokens=1000, output_tokens=0)
    cache_write = calculate_cost_usd(
        "claude-sonnet-4-6", input_tokens=0, output_tokens=0, cache_creation_input_tokens=1000
    )
    assert cache_write > base


def test_unknown_model_falls_back_to_default_rates():
    cost = calculate_cost_usd("some-future-model-id", input_tokens=1_000_000, output_tokens=0)
    assert cost > 0


def test_zero_tokens_cost_nothing():
    assert calculate_cost_usd("claude-haiku-4-5-20251001", 0, 0) == 0
