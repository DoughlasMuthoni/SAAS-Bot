import pytest

from app.repositories.bot_repository import DomainRepository


def _parse_domain(domain: str, origin: str) -> bool:
    origin_host = origin.lower().split("//")[-1].split("/")[0].split(":")[0]
    pattern = domain.lower().lstrip("*.")
    return origin_host == pattern or origin_host.endswith("." + pattern)


def test_exact_match():
    assert _parse_domain("example.com", "https://example.com") is True


def test_subdomain_wildcard():
    assert _parse_domain("*.example.com", "https://shop.example.com") is True


def test_subdomain_wildcard_rejects_different():
    assert _parse_domain("*.example.com", "https://evil.com") is False


def test_exact_match_case_insensitive():
    assert _parse_domain("Example.COM", "https://example.com") is True


def test_unlisted_domain_rejected():
    assert _parse_domain("example.com", "https://notexample.com") is False


def test_empty_origin_rejected():
    assert _parse_domain("example.com", "") is False
