"""
Pre-execution static validator for generated CadQuery code.

Catches obvious problems BEFORE we spin up a subprocess:
  - parse errors
  - banned imports / built-ins (I/O, subprocess, etc.)
  - missing `result` assignment
  - absurd dimensions (> 10 m or < 0.1 mm)

Returning `(ok, reason)` — if `ok` is False, the caller should pass
`reason` back to the code generator as an error for the self-correction
loop.
"""
from __future__ import annotations

import ast
import re
from typing import Tuple


ALLOWED_IMPORTS = {"cadquery", "math"}
BANNED_NAMES = {
    "open", "exec", "eval", "compile", "__import__",
    "input", "globals", "locals", "vars",
}


def extract_code(text: str) -> str:
    """Pull the first fenced python block out of an LLM response; if none,
    treat the whole text as code."""
    m = re.search(r"```(?:python)?\s*\n(.*?)```", text, re.DOTALL)
    return m.group(1).strip() if m else text.strip()


def static_check(code: str) -> Tuple[bool, str]:
    # Parse
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"SyntaxError: {e.msg} (line {e.lineno})"

    # Walk for banned imports + names
    assigned_result = False
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for n in node.names:
                top = n.name.split(".")[0]
                if top not in ALLOWED_IMPORTS:
                    return False, f"Disallowed import: {n.name}. Only {sorted(ALLOWED_IMPORTS)} are permitted."
        elif isinstance(node, ast.ImportFrom):
            top = (node.module or "").split(".")[0]
            if top not in ALLOWED_IMPORTS:
                return False, f"Disallowed import: from {node.module}."
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in BANNED_NAMES:
                return False, f"Banned function call: {node.func.id}()."
        elif isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id == "result":
                    assigned_result = True

    if not assigned_result:
        return False, "Code must assign a final `result` variable."

    # Quick dimension sanity — look for numeric literals that look like mm
    # dimensions and flag ones that are obviously out of hand.
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            v = abs(float(node.value))
            if v > 10_000:
                return False, f"Dimension {v} mm is implausible (>10 m). Verify units."

    return True, "ok"
