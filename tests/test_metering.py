"""Metering unit tests."""

from grounds_lib.llm import estimate_cost_usd


def test_estimate_cost_gpt4o_mini_defaults():
    # 1M in + 1M out at 0.15 / 0.60
    assert estimate_cost_usd(1_000_000, 1_000_000) == 0.75
    # 1000 in / 500 out
    c = estimate_cost_usd(1000, 500)
    assert abs(c - (1000 / 1e6 * 0.15 + 500 / 1e6 * 0.60)) < 1e-9
