"""
Claude-driven CadQuery code generator with self-correction.

Two-stage pipeline:
  1. Planner — Opus turns the user's free-text request into a structured
     BuildSpec JSON (dimensions, parts, assumptions).
  2. Code generator — Sonnet (or Opus) writes CadQuery code against the
     BuildSpec, with few-shot examples pulled from the self-learning
     library.

Around the code generator we wrap a retry loop: if the code fails static
validation OR subprocess execution, the error is fed back in and the
model is asked to fix it. Up to MAX_ATTEMPTS total attempts per build.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Optional, List

from anthropic import Anthropic

from .executor import run_code, ExecResult
from .validator import extract_code, static_check
from . import library


HERE = os.path.dirname(os.path.abspath(__file__))
SYSTEM_PROMPT = open(os.path.join(HERE, "prompts", "system.md")).read()
PLANNER_PROMPT = open(os.path.join(HERE, "prompts", "planner.md")).read()

PLANNER_MODEL = os.environ.get("CAD_PLANNER_MODEL", "claude-opus-4-7")
CODEGEN_MODEL = os.environ.get("CAD_CODEGEN_MODEL", "claude-sonnet-4-6")
MAX_ATTEMPTS = int(os.environ.get("CAD_MAX_ATTEMPTS", "3"))

_client: Optional[Anthropic] = None


def _anthropic() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic()
    return _client


@dataclass
class Attempt:
    code: str
    ok: bool
    error: Optional[str] = None
    stage: Optional[str] = None


@dataclass
class GenerateResult:
    ok: bool
    prompt: str
    spec: Optional[dict] = None
    code: Optional[str] = None
    stl_bytes: Optional[bytes] = None
    meta: Optional[dict] = None
    attempts: List[Attempt] = field(default_factory=list)
    error: Optional[str] = None


def _plan(prompt: str) -> Optional[dict]:
    """Call the planner model. Failures here are non-fatal — we still
    attempt code generation with just the raw prompt if planning breaks."""
    try:
        msg = _anthropic().messages.create(
            model=PLANNER_MODEL,
            max_tokens=1500,
            system=PLANNER_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(block.text for block in msg.content if block.type == "text")
        # Strip fences if present
        t = text.strip()
        if t.startswith("```"):
            t = t.split("```", 2)[1]
            if t.startswith("json\n"): t = t[5:]
            t = t.rsplit("```", 1)[0]
        return json.loads(t.strip())
    except Exception:
        return None


def _build_codegen_messages(
    prompt: str,
    spec: Optional[dict],
    prior_attempts: List[Attempt],
    examples_text: str,
) -> list:
    user_blocks = []

    header = ["# Build request", prompt.strip()]
    if spec is not None:
        header += [
            "",
            "# BuildSpec (planner output — treat as the source of truth for dimensions)",
            "```json",
            json.dumps(spec, indent=2),
            "```",
        ]
    if examples_text:
        header += ["", examples_text]
    user_blocks.append({"role": "user", "content": "\n".join(header)})

    # Feed in prior failed attempts for self-correction
    for a in prior_attempts:
        if a.ok:
            continue
        user_blocks.append({
            "role": "assistant",
            "content": f"```python\n{a.code}\n```",
        })
        user_blocks.append({
            "role": "user",
            "content": (
                f"That code failed at stage `{a.stage or 'unknown'}` with:\n\n"
                f"{a.error}\n\n"
                "Diagnose the root cause, then produce a corrected full code "
                "block. Do not repeat the same mistake."
            ),
        })

    return user_blocks


def _codegen(prompt: str, spec: Optional[dict], prior: List[Attempt], examples_text: str) -> str:
    messages = _build_codegen_messages(prompt, spec, prior, examples_text)
    msg = _anthropic().messages.create(
        model=CODEGEN_MODEL,
        max_tokens=2500,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    text = "".join(block.text for block in msg.content if block.type == "text")
    return extract_code(text)


def generate(prompt: str, *, remember: bool = True) -> GenerateResult:
    # 1. Plan (soft-fail)
    spec = _plan(prompt)

    # 2. Pull similar past successful builds from the library
    category = (spec or {}).get("category") if spec else None
    examples = library.find_similar(prompt, category=category, k=3)
    examples_text = library.render_examples_for_prompt(examples)

    # 3. Self-correcting code generation
    attempts: List[Attempt] = []
    last_exec: Optional[ExecResult] = None
    for i in range(MAX_ATTEMPTS):
        try:
            code = _codegen(prompt, spec, attempts, examples_text)
        except Exception as e:
            return GenerateResult(
                ok=False, prompt=prompt, spec=spec, attempts=attempts,
                error=f"Codegen call failed: {e}",
            )

        ok, reason = static_check(code)
        if not ok:
            attempts.append(Attempt(code=code, ok=False, error=reason, stage="static"))
            continue

        res = run_code(code)
        last_exec = res
        if res.ok:
            attempts.append(Attempt(code=code, ok=True))
            if remember:
                try:
                    library.save_example(prompt, spec, code, res.meta or {})
                except Exception:
                    pass
            return GenerateResult(
                ok=True, prompt=prompt, spec=spec, code=code,
                stl_bytes=res.stl_bytes, meta=res.meta, attempts=attempts,
            )
        attempts.append(Attempt(
            code=code, ok=False, error=res.error, stage=res.stage,
        ))

    return GenerateResult(
        ok=False, prompt=prompt, spec=spec, attempts=attempts,
        error=(last_exec.error if last_exec else "No attempts succeeded."),
    )
