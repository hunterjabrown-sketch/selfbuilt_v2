"""
Safe CadQuery code executor.

Runs generated code in a subprocess with a hard timeout. The code must
define a `result` variable; we then export it to STL and return the bytes
plus basic geometric metadata (bounding box, volume, surface area).

We deliberately do NOT import cadquery in this parent process — every run
is isolated, so a crash in OCCT can't take down the Flask server.
"""
from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import tempfile
import textwrap
from dataclasses import dataclass
from typing import Optional


EXEC_TIMEOUT_SEC = 20


# The subprocess entrypoint. We write this to a temp file alongside the
# user code and call `python3 runner.py <code_file> <stl_out>`.
RUNNER = textwrap.dedent(r'''
    import json, sys, traceback
    code_path = sys.argv[1]
    stl_out   = sys.argv[2]
    meta_out  = sys.argv[3]

    with open(code_path, "r") as f:
        src = f.read()

    ns = {"__name__": "__cad__"}
    try:
        exec(compile(src, "<generated>", "exec"), ns)
    except Exception as e:
        print(json.dumps({
            "ok": False,
            "stage": "exec",
            "error": f"{type(e).__name__}: {e}",
            "traceback": traceback.format_exc(),
        }))
        sys.exit(0)

    result = ns.get("result")
    if result is None:
        print(json.dumps({
            "ok": False,
            "stage": "exec",
            "error": "No variable named `result` was defined.",
        }))
        sys.exit(0)

    # Normalize Assembly → Compound so STL export works
    try:
        import cadquery as cq
    except Exception as e:
        print(json.dumps({"ok": False, "stage": "import", "error": str(e)}))
        sys.exit(0)

    try:
        if isinstance(result, cq.Assembly):
            shape = result.toCompound()
        elif isinstance(result, cq.Workplane):
            shape = result.val() if hasattr(result, "val") else result
            # Prefer the full solid; .val() returns the top of the stack
            solids = result.solids().vals()
            if solids:
                if len(solids) == 1:
                    shape = solids[0]
                else:
                    shape = cq.Compound.makeCompound(solids)
        else:
            shape = result
    except Exception as e:
        print(json.dumps({
            "ok": False, "stage": "normalize",
            "error": f"{type(e).__name__}: {e}",
            "traceback": traceback.format_exc(),
        }))
        sys.exit(0)

    # Export STL
    try:
        cq.exporters.export(shape, stl_out, "STL")
    except Exception as e:
        print(json.dumps({
            "ok": False, "stage": "export",
            "error": f"{type(e).__name__}: {e}",
            "traceback": traceback.format_exc(),
        }))
        sys.exit(0)

    # Collect metadata
    try:
        bb = shape.BoundingBox()
        meta = {
            "ok": True,
            "bbox_mm": {
                "x": [round(bb.xmin, 3), round(bb.xmax, 3)],
                "y": [round(bb.ymin, 3), round(bb.ymax, 3)],
                "z": [round(bb.zmin, 3), round(bb.zmax, 3)],
                "size": [round(bb.xlen, 3), round(bb.ylen, 3), round(bb.zlen, 3)],
            },
        }
        try:
            meta["volume_mm3"] = round(shape.Volume(), 3)
        except Exception:
            meta["volume_mm3"] = None
        try:
            meta["area_mm2"] = round(shape.Area(), 3)
        except Exception:
            meta["area_mm2"] = None
        with open(meta_out, "w") as f:
            json.dump(meta, f)
        print(json.dumps(meta))
    except Exception as e:
        print(json.dumps({
            "ok": False, "stage": "meta",
            "error": f"{type(e).__name__}: {e}",
        }))
''')


@dataclass
class ExecResult:
    ok: bool
    stl_bytes: Optional[bytes] = None
    meta: Optional[dict] = None
    error: Optional[str] = None
    stage: Optional[str] = None
    traceback: Optional[str] = None
    stdout: str = ""
    stderr: str = ""

    def to_json(self, include_stl: bool = False) -> dict:
        d = {
            "ok": self.ok,
            "meta": self.meta,
            "error": self.error,
            "stage": self.stage,
            "traceback": self.traceback,
        }
        if include_stl and self.stl_bytes is not None:
            d["stl_base64"] = base64.b64encode(self.stl_bytes).decode("ascii")
        return d


def run_code(code: str, *, timeout_sec: int = EXEC_TIMEOUT_SEC) -> ExecResult:
    with tempfile.TemporaryDirectory(prefix="cad_") as d:
        code_path = os.path.join(d, "user_code.py")
        stl_path = os.path.join(d, "out.stl")
        meta_path = os.path.join(d, "meta.json")
        runner_path = os.path.join(d, "runner.py")

        with open(code_path, "w") as f:
            f.write(code)
        with open(runner_path, "w") as f:
            f.write(RUNNER)

        try:
            proc = subprocess.run(
                [sys.executable, runner_path, code_path, stl_path, meta_path],
                capture_output=True, text=True, timeout=timeout_sec,
            )
        except subprocess.TimeoutExpired:
            return ExecResult(
                ok=False, error=f"Execution exceeded {timeout_sec}s timeout.",
                stage="timeout",
            )

        stdout = proc.stdout or ""
        stderr = proc.stderr or ""

        # Parse last JSON line from stdout
        meta = None
        parsed = None
        for line in reversed(stdout.strip().splitlines()):
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                try:
                    parsed = json.loads(line)
                    break
                except Exception:
                    continue

        if parsed is None:
            return ExecResult(
                ok=False,
                error="Subprocess produced no parseable result.",
                stage="subprocess",
                stdout=stdout, stderr=stderr,
            )

        if not parsed.get("ok"):
            return ExecResult(
                ok=False,
                error=parsed.get("error") or "Unknown error",
                stage=parsed.get("stage"),
                traceback=parsed.get("traceback"),
                stdout=stdout, stderr=stderr,
            )

        # Success — read the STL
        if not os.path.exists(stl_path):
            return ExecResult(
                ok=False, error="STL file was not produced.",
                stage="export", stdout=stdout, stderr=stderr,
            )
        with open(stl_path, "rb") as f:
            stl_bytes = f.read()

        return ExecResult(
            ok=True, stl_bytes=stl_bytes, meta=parsed,
            stdout=stdout, stderr=stderr,
        )
