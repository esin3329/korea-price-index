from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_cloudflare_pages_config_uses_static_export_output():
    wrangler = (ROOT / "wrangler.toml").read_text(encoding="utf-8")

    assert 'pages_build_output_dir = "out"' in wrangler
    assert "[build]" not in wrangler


def test_static_export_output_is_not_gitignored():
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")

    assert "/out/" not in gitignore
