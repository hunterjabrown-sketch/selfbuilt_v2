"""
Flask CAD server.

Endpoints:
  POST /cad/generate     — prompt → STL + spec + meta + attempts
  POST /cad/execute      — raw CadQuery code → STL (no LLM)
  GET  /cad/health       — liveness + CadQuery version

Run:
  source venv/bin/activate
  CAD_PORT=3002 python -m cad_service.server
"""
from __future__ import annotations

import base64
import os
import sys
import time
from dataclasses import asdict

from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# Allow `python -m cad_service.server` or `python cad_service/server.py`
if __package__ in (None, ""):
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from cad_service import generator, executor, validator  # type: ignore
else:
    from . import generator, executor, validator


app = Flask(__name__)
CORS(app, resources={r"/cad/*": {"origins": "*"}})


@app.get("/cad/health")
def health():
    import subprocess
    try:
        v = subprocess.run(
            [sys.executable, "-c", "import cadquery; print(cadquery.__version__)"],
            capture_output=True, text=True, timeout=10,
        )
        cq_ver = v.stdout.strip() or v.stderr.strip()
    except Exception as e:
        cq_ver = f"error: {e}"
    return jsonify({"ok": True, "cadquery": cq_ver, "time": time.time()})


@app.post("/cad/generate")
def generate_endpoint():
    body = request.get_json(silent=True) or {}
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"ok": False, "error": "Missing 'prompt'."}), 400

    t0 = time.time()
    res = generator.generate(prompt, remember=bool(body.get("remember", True)))
    payload = {
        "ok": res.ok,
        "prompt": res.prompt,
        "spec": res.spec,
        "code": res.code,
        "meta": res.meta,
        "error": res.error,
        "attempts": [asdict(a) for a in res.attempts],
        "elapsed_sec": round(time.time() - t0, 2),
    }
    if res.ok and res.stl_bytes is not None:
        payload["stl_base64"] = base64.b64encode(res.stl_bytes).decode("ascii")
        payload["stl_bytes_length"] = len(res.stl_bytes)
    status = 200 if res.ok else 422
    return jsonify(payload), status


@app.post("/cad/execute")
def execute_endpoint():
    """Directly execute CadQuery code (no LLM) — used for testing and
    for regenerating STL from already-validated stored code."""
    body = request.get_json(silent=True) or {}
    code = body.get("code") or ""
    ok, reason = validator.static_check(code)
    if not ok:
        return jsonify({"ok": False, "stage": "static", "error": reason}), 422
    res = executor.run_code(code)
    payload = res.to_json(include_stl=True)
    return jsonify(payload), (200 if res.ok else 422)


if __name__ == "__main__":
    port = int(os.environ.get("CAD_PORT", "3002"))
    host = os.environ.get("CAD_HOST", "127.0.0.1")
    debug = bool(int(os.environ.get("CAD_DEBUG", "0")))
    print(f"[cad_service] listening on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
