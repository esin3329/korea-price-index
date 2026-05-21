from pathlib import Path


def test_cloudflare_pages_config_runs_next_static_build():
    wrangler = (Path(__file__).resolve().parents[2] / "wrangler.toml").read_text(
        encoding="utf-8"
    )

    assert 'pages_build_output_dir = "out"' in wrangler
    assert "[build]" in wrangler
    assert 'command = "npm run build"' in wrangler
