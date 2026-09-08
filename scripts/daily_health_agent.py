#!/usr/bin/env python3
"""
FundLens Daily Health & Job-Failure Agent
==========================================
Runs once a day (via .github/workflows/daily-health-check.yml) to:
  1. Check backend (Render) and frontend (Cloudflare) uptime + response latency.
  2. Check the last ~26h of runs for the other scheduled GitHub Actions workflows
     (nightly NAV ingest, EC2 Airflow lifecycle) for failures.
  3. Emit a Markdown report and a machine-readable exit status so the workflow
     can decide whether to file/assign a GitHub issue for remediation.

Exit code 0 = all healthy. Exit code 1 = one or more issues detected.
"""
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests

BACKEND_URL = os.environ.get("HEALTH_BACKEND_URL", "https://fundlens-backend.onrender.com/api/v1/health")
FRONTEND_URL = os.environ.get("HEALTH_FRONTEND_URL", "https://fundlens.sandipprodhan.in/")
LATENCY_WARN_MS = int(os.environ.get("HEALTH_LATENCY_WARN_MS", "3000"))
REQUEST_TIMEOUT = int(os.environ.get("HEALTH_REQUEST_TIMEOUT", "20"))

GITHUB_REPOSITORY = os.environ.get("GITHUB_REPOSITORY", "")  # "owner/repo"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
JOB_WORKFLOWS = ["nightly-ingest-snapshots.yml", "ec2-airflow-lifecycle.yml"]
LOOKBACK_HOURS = int(os.environ.get("HEALTH_LOOKBACK_HOURS", "26"))
# Render free-tier services spin down when idle; a cold start can take well over
# REQUEST_TIMEOUT to respond, so retry once with a longer budget before failing.
COLD_START_TIMEOUT = int(os.environ.get("HEALTH_COLD_START_TIMEOUT", "60"))


def check_endpoint(name: str, url: str) -> Dict[str, Any]:
    result: Dict[str, Any] = {"name": name, "url": url, "ok": False, "status_code": None, "latency_ms": None, "error": None}
    if not url:
        result["error"] = "URL not configured"
        return result
    for attempt, timeout in enumerate((REQUEST_TIMEOUT, COLD_START_TIMEOUT)):
        try:
            start = time.perf_counter()
            response = requests.get(url, timeout=timeout)
            latency_ms = round((time.perf_counter() - start) * 1000)
            result["status_code"] = response.status_code
            result["latency_ms"] = latency_ms
            result["ok"] = response.ok
            result["error"] = None
            if response.ok and attempt == 1:
                result["warning"] = f"Slow response after cold-start retry: {latency_ms}ms"
            elif response.ok and latency_ms > LATENCY_WARN_MS:
                result["warning"] = f"Slow response: {latency_ms}ms (threshold {LATENCY_WARN_MS}ms)"
            return result
        except requests.RequestException as ex:
            result["error"] = str(ex)
    return result


def check_workflow_failures(workflow_file: str) -> List[Dict[str, Any]]:
    """Returns failed runs of a scheduled workflow within the lookback window."""
    if not GITHUB_REPOSITORY or not GITHUB_TOKEN:
        return []
    since = (datetime.now(timezone.utc) - timedelta(hours=LOOKBACK_HOURS)).isoformat()
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/actions/workflows/{workflow_file}/runs"
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}
    params = {"created": f">={since}", "per_page": 20}
    try:
        response = requests.get(url, headers=headers, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        runs = response.json().get("workflow_runs", [])
    except requests.RequestException as ex:
        return [{"workflow": workflow_file, "error": str(ex)}]

    failures = []
    for run in runs:
        if run.get("conclusion") in ("failure", "timed_out", "cancelled"):
            failures.append({
                "workflow": workflow_file,
                "run_id": run.get("id"),
                "conclusion": run.get("conclusion"),
                "created_at": run.get("created_at"),
                "html_url": run.get("html_url"),
            })
    return failures


def build_report(endpoint_results: List[Dict[str, Any]], job_failures: List[Dict[str, Any]]) -> str:
    lines = [f"# FundLens Daily Health Report — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", ""]

    lines.append("## Application Performance")
    for r in endpoint_results:
        if r["error"]:
            lines.append(f"- ❌ **{r['name']}** ({r['url']}) — request failed: `{r['error']}`")
        elif not r["ok"]:
            lines.append(f"- ❌ **{r['name']}** ({r['url']}) — HTTP {r['status_code']}, {r['latency_ms']}ms")
        elif r.get("warning"):
            lines.append(f"- ⚠️ **{r['name']}** ({r['url']}) — HTTP {r['status_code']}, {r['warning']}")
        else:
            lines.append(f"- ✅ **{r['name']}** ({r['url']}) — HTTP {r['status_code']}, {r['latency_ms']}ms")

    lines.append("")
    lines.append("## Scheduled Job Failures (last {}h)".format(LOOKBACK_HOURS))
    if not job_failures:
        lines.append("- ✅ No failures found in monitored workflows: " + ", ".join(JOB_WORKFLOWS))
    else:
        for f in job_failures:
            if "error" in f:
                lines.append(f"- ⚠️ Could not check `{f['workflow']}`: {f['error']}")
            else:
                lines.append(
                    f"- ❌ `{f['workflow']}` run [{f['run_id']}]({f['html_url']}) "
                    f"concluded `{f['conclusion']}` at {f['created_at']}"
                )

    return "\n".join(lines)


def main() -> int:
    endpoint_results = [
        check_endpoint("Backend API (Render)", BACKEND_URL),
        check_endpoint("Frontend (Cloudflare)", FRONTEND_URL),
    ]

    job_failures: List[Dict[str, Any]] = []
    for workflow_file in JOB_WORKFLOWS:
        job_failures.extend(check_workflow_failures(workflow_file))

    report = build_report(endpoint_results, job_failures)
    print(report)

    report_path = os.environ.get("HEALTH_REPORT_PATH", "health-report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    has_hard_failure = any(not r["ok"] for r in endpoint_results) or len(job_failures) > 0

    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as f:
            f.write(f"has_issues={'true' if has_hard_failure else 'false'}\n")

    return 1 if has_hard_failure else 0


if __name__ == "__main__":
    sys.exit(main())
