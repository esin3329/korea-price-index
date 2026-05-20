from pathlib import Path


def test_data_update_workflow_runs_monthly():
    workflow_path = (
        Path(__file__).resolve().parents[2]
        / ".github"
        / "workflows"
        / "monthly-data-update.yml"
    )

    workflow = workflow_path.read_text(encoding="utf-8")

    assert "name: Monthly K-Collusion Data Update" in workflow
    assert "# monthly: 15th day 06:00 UTC" in workflow
    assert "- cron: '0 6 15 * *'" in workflow
    assert "Regenerate and commit data (monthly)" in workflow
    assert "weekly" not in workflow.lower()
