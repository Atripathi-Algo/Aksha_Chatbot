"""
Help & Product Guide tool — Phase 1, green, no live data dependency.

Section 4.4 specifies FAISS hybrid keyword+vector retrieval; this is the
pragmatic MVP version — keyword/term-overlap scoring over the two docs
already in the repo, no embeddings model required. Swapping in real FAISS
retrieval later only touches this file, not the agent or formatter.
"""

import re
from pathlib import Path

from pydantic import BaseModel, Field

from app.tool_registry import ToolSpec, register_tool

DOCS_DIR = Path(__file__).resolve().parents[2] / "docs"
DOC_FILES = ["CHATBOT_SYSTEM_ARCHITECTURE.md", "SUPPORT_CHATBOT_AGENT_CATALOG.md"]

_STOPWORDS = {"the", "a", "an", "is", "are", "do", "does", "how", "what", "i", "to", "for", "of", "in", "on", "and", "or", "my"}


def _load_chunks() -> list[dict]:
    """Split each doc into sections at markdown headings — good enough
    granularity for keyword scoring without a real chunking pipeline."""
    chunks = []
    for filename in DOC_FILES:
        path = DOCS_DIR / filename
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        sections = re.split(r"\n(?=#{1,4} )", text)
        for section in sections:
            lines = section.strip().split("\n", 1)
            if not lines or not lines[0].startswith("#"):
                continue
            heading = lines[0].lstrip("# ").strip()
            body = lines[1] if len(lines) > 1 else ""
            chunks.append({"document": filename, "section": heading, "text": body[:1500]})
    return chunks


_CHUNKS = _load_chunks()


def _score(query_terms: set[str], chunk: dict) -> int:
    haystack = (chunk["section"] + " " + chunk["text"]).lower()
    return sum(1 for term in query_terms if term in haystack)


class SearchDocsInput(BaseModel):
    query: str = Field(description="The operator's question, verbatim.")


def _search_docs(params: SearchDocsInput) -> dict:
    terms = {t for t in re.findall(r"[a-z0-9]+", params.query.lower()) if t not in _STOPWORDS and len(t) > 2}
    if not terms:
        return {"results": []}

    scored = [(chunk, _score(terms, chunk)) for chunk in _CHUNKS]
    scored = [(c, s) for c, s in scored if s > 0]
    scored.sort(key=lambda pair: pair[1], reverse=True)

    return {
        "results": [
            {"document": c["document"], "section": c["section"], "excerpt": c["text"][:500]}
            for c, _ in scored[:3]
        ]
    }


def register() -> None:
    register_tool(
        ToolSpec(
            name="search_docs",
            domain="help_guide",
            description="Search Aksha product documentation for how-to and definitional answers. No live data — this only reads static docs.",
            input_model=SearchDocsInput,
            handler=_search_docs,
        )
    )
