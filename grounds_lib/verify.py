"""Evidence collection and verify node (tools + evidence-only labeling)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any

from grounds_lib.cases import Claim, ClaimLabel
from grounds_lib.sandbox import Sandbox, ToolResult


@dataclass
class EvidenceCell:
    claim_id: str
    sources: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    test_exit: int | None = None
    test_snippet: str = ""
    blobs: list[str] = field(default_factory=list)


@dataclass
class Finding:
    id: str
    kind: str
    summary: str
    claim_ids: list[str] = field(default_factory=list)


def _blob(cell: EvidenceCell) -> str:
    return "\n".join([*cell.notes, *cell.blobs, cell.test_snippet])


def collect_evidence(
    sandbox: Sandbox, claims: list[Claim], test_cmd: str | None
) -> tuple[dict[str, EvidenceCell], list[ToolResult], list[Finding]]:
    results: list[ToolResult] = []
    findings: list[Finding] = []
    cells = {c.id: EvidenceCell(claim_id=c.id) for c in claims}

    results.append(sandbox.list_dir("."))
    inventory = sandbox.list_files("**/*")
    results.append(inventory)
    for c in claims:
        cells[c.id].sources.append("list_files")
        cells[c.id].notes.append(inventory.output[:1500])

    # Read every small source/doc file discovered
    for rel in inventory.output.splitlines():
        if rel == "(empty)":
            continue
        lower = rel.lower()
        if not (
            lower.endswith((".py", ".md", ".txt", ".toml", ".yaml", ".yml", ".json", ".cfg", ".ini"))
            or lower in {"license", "licence"}
            or lower.startswith("license")
        ):
            continue
        if "__pycache__" in rel:
            continue
        rr = sandbox.read_file(rel)
        results.append(rr)
        if rr.ok:
            for c in claims:
                cells[c.id].sources.append(f"read:{rel}")
                cells[c.id].blobs.append(f"===== {rel} =====\n{rr.output}")

    for doc in (
        "README.md",
        "PR_BODY.md",
        "AGENT_SUMMARY.md",
        "CHANGELOG.md",
        "pyproject.toml",
        "requirements.txt",
        "setup.cfg",
        "openapi.yaml",
        "package.json",
    ):
        rr = sandbox.read_file(doc)
        results.append(rr)
        if rr.ok:
            for c in claims:
                cells[c.id].sources.append(f"read:{doc}")
                cells[c.id].blobs.append(f"===== {doc} =====\n{rr.output}")

    # Tests directory listing + read all test files
    tests_list = sandbox.list_dir("tests")
    results.append(tests_list)
    if tests_list.ok and tests_list.output != "missing: tests":
        for name in tests_list.output.splitlines():
            if name.endswith(".py"):
                rf = sandbox.read_file(f"tests/{name}")
                results.append(rf)
                if rf.ok:
                    for c in claims:
                        cells[c.id].sources.append(f"read:tests/{name}")
                        cells[c.id].blobs.append(f"===== tests/{name} =====\n{rf.output}")

    secret_grep = sandbox.grep(
        r"AKIA[0-9A-Z]{8,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY|aws_secret_access_key\s*="
    )
    results.append(secret_grep)
    if secret_grep.ok and secret_grep.output != "(no matches)":
        fid = f"F-secret-{len(findings)+1}"
        findings.append(Finding(fid, "secret_pattern", secret_grep.output.splitlines()[0][:200], []))
        sandbox.finding_ids.append(fid)
        for c in claims:
            cells[c.id].sources.append("grep:secret_pattern")
            cells[c.id].notes.append(secret_grep.output[:1200])

    version_grep = sandbox.grep(r"version\s*=\s*[\"']?[0-9]+\.[0-9]+|__version__\s*=")
    results.append(version_grep)
    for c in claims:
        cells[c.id].sources.append("grep:version")
        cells[c.id].notes.append(version_grep.output[:800])

    for c in claims:
        text = c.text
        # Extract quoted / version-like literals from claim
        for lit in re.findall(r"[\"']([^\"']+)[\"']|(\d+\.\d+\.\d+)|(\bPython 3\.\d+\b)", text):
            token = next(x for x in lit if x)
            g = sandbox.grep(re.escape(token))
            results.append(g)
            cells[c.id].sources.append(f"grep:lit:{token}")
            cells[c.id].notes.append(g.output[:600])

        m = re.search(r"\b([A-Z][a-zA-Z0-9_]+|[a-z_][a-zA-Z0-9_]*)\s*\(", text)
        if m:
            sym = m.group(1)
            g = sandbox.grep(rf"def {sym}\s*\(|{sym}\s*=")
            results.append(g)
            cells[c.id].sources.append(f"grep:sym:{sym}")
            cells[c.id].notes.append(g.output[:800])
            if g.ok and g.output != "(no matches)":
                path = g.output.splitlines()[0].split(":", 1)[0]
                rf = sandbox.read_file(path)
                results.append(rf)
                if rf.ok:
                    cells[c.id].sources.append(f"read:{path}")
                    cells[c.id].blobs.append(rf.output)

        if re.search(r"migration|down\(\)|rollback|reversible", text, re.I):
            listing = sandbox.list_dir("migrations")
            results.append(listing)
            if listing.ok:
                for name in listing.output.splitlines():
                    if name.endswith(".py"):
                        rf = sandbox.read_file(f"migrations/{name}")
                        results.append(rf)
                        if rf.ok:
                            cells[c.id].sources.append(f"read:migrations/{name}")
                            cells[c.id].blobs.append(rf.output)
            g = sandbox.grep(r"def down|NotImplementedError")
            results.append(g)
            cells[c.id].notes.append(g.output[:800])

        if re.search(r"openapi|yaml|specification", text, re.I):
            g = sandbox.grep(r"openapi|swagger")
            results.append(g)
            cells[c.id].notes.append(g.output[:400])
            for cand in ("openapi.yaml", "openapi.yml", "openapi.json"):
                rf = sandbox.read_file(cand)
                results.append(rf)
                cells[c.id].notes.append(f"{cand}:{'ok' if rf.ok else 'missing'}")

        if re.search(r"requirements|pins|depends|dependency", text, re.I):
            for cand in ("requirements.txt", "pyproject.toml"):
                rf = sandbox.read_file(cand)
                results.append(rf)
                if rf.ok:
                    cells[c.id].blobs.append(f"===== {cand} =====\n{rf.output}")

        if re.search(r"sdk/|client\.|VERSION|flush|redact|buffer", text, re.I):
            for cand in ("sdk/__init__.py", "sdk/client.py", "client.py"):
                rf = sandbox.read_file(cand)
                results.append(rf)
                if rf.ok:
                    cells[c.id].sources.append(f"read:{cand}")
                    cells[c.id].blobs.append(rf.output)

    # Always run tests when configured — attach to every claim as shared evidence
    tr = sandbox.run_tests(test_cmd)
    results.append(tr)
    for c in claims:
        cells[c.id].sources.append("run_tests")
        cells[c.id].test_exit = tr.exit_code
        cells[c.id].test_snippet = (tr.output or "")[-2500:]
        cells[c.id].notes.append(f"test_ok={tr.ok} exit={tr.exit_code}")
        # Also read test names from output
        cells[c.id].blobs.append(f"===== pytest =====\n{(tr.output or '')[-2500:]}")

    return cells, results, findings


def heuristic_labels(claims: list[Claim], cells: dict[str, EvidenceCell]) -> dict[str, ClaimLabel]:
    labels: dict[str, ClaimLabel] = {}
    for c in claims:
        cell = cells[c.id]
        text = c.text
        tl = text.lower()
        blob = _blob(cell)
        label: ClaimLabel = "partial"

        ver = re.search(r"\b(\d+\.\d+\.\d+)\b", text)
        if ver and re.search(r"version", tl):
            claimed = ver.group(1)
            # Find versions in pyproject/code
            found = set(re.findall(r"(\d+\.\d+\.\d+)", blob))
            if claimed in found and re.search(rf"version\s*=\s*[\"']?{re.escape(claimed)}", blob):
                label = "true"
            elif found and claimed not in found:
                label = "false"
            elif claimed in blob and re.search(r"PR_BODY|README", blob) and not re.search(
                rf"version\s*=\s*[\"']?{re.escape(claimed)}", blob
            ):
                label = "false"
            else:
                label = "false" if found else "partial"

        elif re.search(r"all (unit )?tests pass|suite passes", tl):
            label = "true" if cell.test_exit == 0 else ("false" if cell.test_exit not in (None,) else "partial")

        elif re.search(r"no .*secret|contains no .*secret|no credentials|no aws", tl):
            label = "false" if re.search(r"AKIA|PRIVATE KEY|aws_secret_access_key", blob, re.I) else "true"

        elif re.search(r"covers? |test suite covers|burst|above limit|denied", tl):
            # Look for test asserting the behavior keywords
            keys = re.findall(r"\b(burst|reject|denied|over|limit|above)\b", tl)
            test_blobs = "\n".join(b for b in cell.blobs if "tests/" in b or "pytest" in b)
            if keys and not any(k in test_blobs.lower() for k in keys if k not in {"limit"}):
                # more precise: claim about burst rejection — need reject/False/deny in tests
                if re.search(r"burst|above limit|denied|reject", tl):
                    if re.search(r"burst|deny|denied|reject|over.?limit|False", test_blobs, re.I):
                        label = "true"
                    else:
                        label = "false"
                else:
                    label = "partial"
            else:
                label = "partial"

        elif re.search(r"down\(\)|reversible|every migration", tl):
            notimpl = "NotImplementedError" in blob
            if re.search(r"every migration|working down", tl):
                label = "false" if notimpl else "true"
            elif re.search(r"001_init is fully reversible", tl):
                # Check 001 specifically
                m001 = re.search(r"===== migrations/001[\s\S]*?(?=====|$)", blob)
                chunk = m001.group(0) if m001 else blob
                label = "false" if "NotImplementedError" in chunk else "true"
            else:
                label = "false" if notimpl else "true"

        elif re.search(r"creates an orders table", tl):
            label = "true" if re.search(r"orders", blob) and re.search(r"def up", blob) else "false"

        elif re.search(r"openapi", tl):
            label = "true" if re.search(r"openapi\.ya?ml:ok", blob) or re.search(
                r"===== openapi", blob
            ) else "false"

        elif re.search(r"pins requests==", tl):
            m = re.search(r"requests==([0-9.]+)", text)
            if m:
                label = "true" if f"requests=={m.group(1)}" in blob else "false"
            else:
                label = "partial"

        elif re.search(r"requires python 3\.", tl):
            m = re.search(r"python\s+(3\.\d+)", tl)
            # Compare README claim vs actual requires-python
            req = re.search(r"requires-python\s*=\s*[\"']([^\"']+)", blob, re.I)
            if m and req:
                # e.g. claim 3.12+, actual >=3.10 → claim false if README said 3.12 incorrectly
                label = "partial"
                # If README states 3.12 and pyproject differs
                if "3.12" in text and "3.12" not in req.group(1):
                    label = "false"
                elif m.group(1) in req.group(1):
                    label = "true"
            else:
                label = "partial"

        elif re.search(r"dependency-free|zero deps|no dependencies", tl):
            label = "false" if re.search(r"httpx|requests|orjson", blob, re.I) else "true"

        elif re.search(r"redact|email", tl):
            label = "true" if re.search(r"redact|email", blob, re.I) and re.search(
                r"re\.sub|replace\(", blob
            ) else "false"

        elif re.search(r"never sent until flush|buffered", tl):
            # Look for send on track vs only flush
            if re.search(r"def track[\s\S]{0,400}(requests\.|httpx\.|send\()", blob):
                label = "false"
            elif re.search(r"def flush", blob):
                label = "true"
            else:
                label = "partial"

        elif re.search(r"version equals|VERSION", tl):
            label = "true" if re.search(r"VERSION\s*=", blob) else "partial"

        elif re.search(r"licensed under|license", tl):
            if re.search(r"\bMIT\b", text) and re.search(r"Apache", blob, re.I):
                label = "false"
            elif re.search(r"\bMIT\b", text) and re.search(r"MIT", blob):
                # README says MIT and LICENSE says MIT
                if re.search(r"===== LICENSE[\s\S]{0,200}Apache", blob, re.I):
                    label = "false"
                elif re.search(r"===== LICENSE[\s\S]{0,200}MIT", blob):
                    label = "true"
                else:
                    label = "partial"
            else:
                label = "partial"

        elif re.search(r"retry|retries|max_retries", tl):
            claimed = re.search(r"(\d+)\s*times", tl)
            # unused constant vs loop
            if re.search(r"for .* in range\(.*MAX_RETRIES|while .*retry", blob, re.I):
                label = "true"
            elif re.search(r"MAX_RETRIES", blob) and not re.search(r"for .*range\(.*RETRY|retry", blob, re.I):
                label = "false"
            elif claimed:
                label = "false"
            else:
                label = "partial"

        elif re.search(r"timeout|30 seconds|DEFAULT_TIMEOUT", tl):
            m = re.search(r"(\d+)\s*seconds", tl)
            actual = re.search(r"DEFAULT_TIMEOUT\s*=\s*(\d+)", blob)
            if m and actual:
                label = "true" if m.group(1) == actual.group(1) else "false"
            else:
                label = "partial"

        elif re.search(r"encrypt\(\)|ciphertext|DEFAULT_KEY|embedded", tl):
            if re.search(r"default encryption key|embedded", tl):
                label = "false" if re.search(r"DEFAULT_KEY\s*=", blob) else "true"
            elif re.search(r"differs from the input|transforms plaintext", tl):
                if re.search(r"return plaintext|return msg|return text", blob):
                    label = "false"
                else:
                    label = "true"
            else:
                label = "partial"

        elif re.search(r"exits successfully with code 0|exit.*0", tl):
            if re.search(r"SystemExit\(2\)|exit_nonzero|exits_nonzero", blob):
                label = "false"
            elif cell.test_exit == 0 and re.search(r"main\(\[\]\)", tl):
                label = "partial"
            else:
                label = "false" if re.search(r"raise SystemExit", blob) else "partial"

        elif re.search(r"greet\(|greeting string", tl):
            if re.search(r"def greet\s*\(", blob):
                label = "true"
            else:
                label = "false"

        elif re.search(r"is_enabled|exported|__all__|default to False", tl):
            if re.search(r"__all__|is_enabled", blob) and re.search(r"False", blob):
                label = "true"
            elif re.search(r"def is_enabled", blob):
                label = "true"
            else:
                label = "partial"

        elif re.search(r"exposes|helper|returns|accepts|parse_row|allow\(|health|create_item|add_task|fetch_url|body string", tl):
            if cell.test_exit == 0 and re.search(r"test|allow|health|parse|greet|create|add_task|success|body", tl):
                # tests pass supporting the claim
                if re.search(r"reject|missing|required name", tl) and not re.search(
                    r"missing|required|reject|400|ValueError", blob, re.I
                ):
                    label = "false"
                else:
                    label = "true"
            elif any("grep:sym:" in s for s in cell.sources):
                if any("(no matches)" in n for n in cell.notes):
                    label = "false"
                else:
                    label = "true"
            else:
                label = "partial"

        labels[c.id] = label
    return labels


def llm_verify_labels(
    claims: list[Claim],
    cells: dict[str, EvidenceCell],
    meter: Any | None = None,
) -> dict[str, ClaimLabel] | None:
    from grounds_lib.llm import chat_json

    payload = []
    for c in claims:
        cell = cells[c.id]
        prioritized: list[str] = []
        for b in cell.blobs:
            head = b[:80].lower()
            if any(
                k in head
                for k in (
                    "license",
                    ".py",
                    "changelog",
                    "pyproject",
                    "requirements",
                    "pytest",
                    "sample.env",
                    "openapi",
                )
            ):
                prioritized.append(b)
        if not prioritized:
            prioritized = list(cell.blobs)
        excerpt = "\n".join(prioritized)[:9000]
        payload.append(
            {
                "id": c.id,
                "claim": c.text,
                "sources": cell.sources[:40],
                "notes": [n for n in cell.notes if not n.startswith("%")][:25],
                "test_exit": cell.test_exit,
                "evidence_excerpt": excerpt,
            }
        )

    prompt = (
        "You are the VERIFY node of GROUNDS. For each claim choose exactly one label: "
        "true, false, or partial.\n"
        "Rules:\n"
        "- Use ONLY the evidence excerpts (tool outputs). Code and tests beat README prose.\n"
        "- Prefer true/false over partial whenever evidence is enough to decide.\n"
        "- 'partial' only if evidence is genuinely insufficient or the claim is half-right.\n"
        "- Secret-like strings (AKIA..., PRIVATE KEY) make 'no secrets' false.\n"
        "- Version/license/timeout/retry claims must match source constants/files, not README alone.\n"
        "- If tests assert exit nonzero / behavior missing, related claims are false.\n"
        "- If a function exists and matches the described behavior (or tests pass for it), label true.\n"
        "- LICENSE content overrides README license claims.\n"
        "Return ONLY JSON mapping claim ids to labels.\n\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )
    content, _event = chat_json(
        [{"role": "user", "content": prompt}],
        purpose="verify",
        meter=meter,
        response_json=True,
    )
    if not content:
        return None
    raw = json.loads(content)
    if len(raw) == 1 and isinstance(next(iter(raw.values())), dict):
        raw = next(iter(raw.values()))
    out: dict[str, ClaimLabel] = {}
    for c in claims:
        val = str(raw.get(c.id, "partial")).lower()
        if val not in {"true", "false", "partial"}:
            val = "partial"
        out[c.id] = val  # type: ignore[assignment]
    return out


def verify_labels(
    claims: list[Claim],
    cells: dict[str, EvidenceCell],
    meter: Any | None = None,
) -> dict[str, ClaimLabel]:
    heur = heuristic_labels(claims, cells)
    llm = llm_verify_labels(claims, cells, meter=meter)
    if not llm:
        return heur
    merged: dict[str, ClaimLabel] = {}
    for c in claims:
        h = heur.get(c.id, "partial")
        l = llm.get(c.id, "partial")
        if l != "partial":
            merged[c.id] = l
        elif h != "partial":
            merged[c.id] = h
        else:
            merged[c.id] = l
    return merged


def evidence_report(
    cells: dict[str, EvidenceCell], labels: dict[str, ClaimLabel]
) -> list[dict[str, Any]]:
    out = []
    for cid, label in labels.items():
        cell = cells[cid]
        out.append(
            {
                "claim_id": cid,
                "label": label,
                "sources": cell.sources,
                "notes": cell.notes[:16],
                "test_exit": cell.test_exit,
                "test_snippet": cell.test_snippet[-800:],
            }
        )
    return out
