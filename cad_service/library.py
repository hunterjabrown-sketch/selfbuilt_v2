"""
Self-learning example library.

When a generation succeeds, we optionally persist
  cad_service/examples/<id>/{prompt.txt, spec.json, code.py, meta.json}
and keep a tiny index at examples/index.json.

At generation time, we pull the top-K most similar past prompts (by
simple token-overlap + category match — cheap, no embedding service
required) and include their successful code as few-shot examples in the
planner/codegen prompts. Over time this makes the system more accurate
on the shapes that actually get built.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass, asdict
from typing import List, Optional


HERE = os.path.dirname(os.path.abspath(__file__))
EXAMPLES_DIR = os.path.join(HERE, "examples")
INDEX_PATH = os.path.join(EXAMPLES_DIR, "index.json")


def _tokens(text: str) -> set:
    return set(re.findall(r"[a-zA-Z]{3,}", (text or "").lower()))


def _load_index() -> List[dict]:
    if not os.path.exists(INDEX_PATH):
        return []
    try:
        with open(INDEX_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return []


def _save_index(idx: List[dict]) -> None:
    os.makedirs(EXAMPLES_DIR, exist_ok=True)
    with open(INDEX_PATH, "w") as f:
        json.dump(idx, f, indent=2)


@dataclass
class Example:
    id: str
    prompt: str
    category: str
    code: str
    meta: dict
    created_at: float


def save_example(prompt: str, spec: Optional[dict], code: str, meta: dict) -> Example:
    eid = hashlib.sha1(f"{prompt}:{time.time()}".encode()).hexdigest()[:12]
    category = (spec or {}).get("category", "other")
    ex = Example(
        id=eid, prompt=prompt.strip(), category=category, code=code,
        meta=meta or {}, created_at=time.time(),
    )
    d = os.path.join(EXAMPLES_DIR, eid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "prompt.txt"), "w") as f:
        f.write(prompt)
    if spec is not None:
        with open(os.path.join(d, "spec.json"), "w") as f:
            json.dump(spec, f, indent=2)
    with open(os.path.join(d, "code.py"), "w") as f:
        f.write(code)
    with open(os.path.join(d, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    idx = _load_index()
    idx.append({
        "id": eid, "prompt": prompt.strip(), "category": category,
        "created_at": ex.created_at,
    })
    _save_index(idx)
    return ex


def find_similar(prompt: str, *, category: Optional[str] = None, k: int = 3) -> List[Example]:
    idx = _load_index()
    if not idx:
        return []
    q = _tokens(prompt)
    scored = []
    for row in idx:
        t = _tokens(row.get("prompt", ""))
        overlap = len(q & t)
        bonus = 2 if category and row.get("category") == category else 0
        scored.append((overlap + bonus, row))
    scored.sort(key=lambda x: x[0], reverse=True)

    out: List[Example] = []
    for score, row in scored[:k]:
        if score <= 0:
            continue
        d = os.path.join(EXAMPLES_DIR, row["id"])
        try:
            with open(os.path.join(d, "prompt.txt")) as f: p = f.read()
            with open(os.path.join(d, "code.py")) as f: c = f.read()
            meta_path = os.path.join(d, "meta.json")
            meta = {}
            if os.path.exists(meta_path):
                with open(meta_path) as f: meta = json.load(f)
            out.append(Example(
                id=row["id"], prompt=p, category=row.get("category", "other"),
                code=c, meta=meta, created_at=row.get("created_at", 0),
            ))
        except Exception:
            continue
    return out


def render_examples_for_prompt(examples: List[Example]) -> str:
    if not examples:
        return ""
    parts = ["## Similar past builds (reference only — adapt, don't copy)"]
    for e in examples:
        parts.append(f"### prompt: {e.prompt[:160]}")
        parts.append("```python")
        parts.append(e.code.strip())
        parts.append("```")
    return "\n".join(parts)
