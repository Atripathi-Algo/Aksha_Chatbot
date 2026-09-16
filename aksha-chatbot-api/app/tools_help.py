"""
Help & Product Guide tool — Phase 1, green, no live data dependency.

Section 4.4 specifies FAISS hybrid keyword+vector retrieval. This is that
retrieval, minus FAISS itself: real semantic embeddings (fastembed's ONNX
runtime, BAAI/bge-small-en-v1.5 — small, no GPU/torch needed) over the two
docs already in the repo, with the original keyword/term-overlap score kept
as a tie-breaker. Brute-force cosine similarity over a few dozen chunks is
instant, so a vector INDEX (FAISS) buys nothing at this corpus size — the
embedding step itself was the real gap between "designed" and "shipped".
Swapping in FAISS later, if the corpus grows enough to need an index, only
touches this file.

Found live 2026-09-16, while building this: DOCS_DIR's old computation —
Path(__file__).resolve().parents[2] / "docs" — resolves correctly for a
local run (repo_root/aksha-chatbot-api/app/tools_help.py, three parents up
to repo_root), but is silently wrong inside the deployed Docker container.
The Dockerfile's build context is aksha-chatbot-api/ alone, so WORKDIR /srv
holds that directory's own contents directly — /srv/app/tools_help.py's
parents[2] is "/", not the repo root, and "/docs" doesn't exist in the
image. _CHUNKS has been loading as an empty list in every real deployment
of this container: search_docs has been silently returning zero results for
every query, and every "verified live" help_guide answer in Sections 9b/9d
must have been run outside Docker. CHATBOT_DOCS_DIR (below) fixes this the
same way AKSHA_HOST_DATA_PATH already works — an explicit env var pointing
at a bind-mounted docs/ directory in docker-compose.chatbot.yml — while
keeping the old computed path as the correct fallback for a local run.
"""

import os
import re
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding
from pydantic import BaseModel, Field

from app.logging_config import get_logger
from app.tool_registry import ToolSpec, register_tool

logger = get_logger(component="tools_help")

DOCS_DIR = Path(os.getenv("CHATBOT_DOCS_DIR") or (Path(__file__).resolve().parents[2] / "docs"))
DOC_FILES = ["CHATBOT_SYSTEM_ARCHITECTURE.md", "SUPPORT_CHATBOT_AGENT_CATALOG.md"]

_STOPWORDS = {"the", "a", "an", "is", "are", "do", "does", "how", "what", "i", "to", "for", "of", "in", "on", "and", "or", "my"}

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"

# Calibrated live against this corpus, 2026-09-16 (see calibration transcript
# in the docs-hygiene pass): genuinely relevant queries ("How do I search for
# an alert?", "What is the FPS for a camera?") scored 0.62-0.79 cosine
# similarity against their best-matching chunk. Clearly unrelated queries (a
# recipe, a sports score, "write me a poem") still scored 0.43-0.50 against
# their best (still irrelevant) match — this corpus is all chatbot/product
# text, so BGE's baseline similarity floor sits higher than intuition
# suggests; a threshold picked from general expectation rather than this
# corpus's real numbers would have let every one of those through. 0.55 sits
# with margin below the lowest relevant case and above the highest
# irrelevant one. Re-run that calibration if the docs corpus changes
# significantly — this constant is corpus-specific, not a general default.
MIN_SIMILARITY = 0.55


def _load_chunks() -> list[dict]:
    """Split each doc into sections at markdown headings — good enough
    granularity for retrieval without a real chunking pipeline."""
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
if not _CHUNKS:
    logger.warning("tools_help_no_chunks", docs_dir=str(DOCS_DIR))

_embedding_model: TextEmbedding | None = None
_chunk_vectors: "np.ndarray | None" = None  # (n_chunks, dim), L2-normalized rows


def _get_embedding_model() -> TextEmbedding:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL)
    return _embedding_model


def _l2_normalize(vectors: "np.ndarray") -> "np.ndarray":
    norms = np.linalg.norm(vectors, axis=-1, keepdims=True)
    norms[norms == 0] = 1.0
    return vectors / norms


def _chunk_embeddings() -> "np.ndarray":
    """Computed once per process and cached — the corpus is static repo
    content, not something that changes turn to turn."""
    global _chunk_vectors
    if _chunk_vectors is None:
        if not _CHUNKS:
            _chunk_vectors = np.zeros((0, 384), dtype=np.float32)
        else:
            model = _get_embedding_model()
            texts = [f"{c['section']}\n{c['text']}" for c in _CHUNKS]
            vectors = np.array(list(model.passage_embed(texts)), dtype=np.float32)
            _chunk_vectors = _l2_normalize(vectors)
    return _chunk_vectors


def _keyword_score(query_terms: set[str], chunk: dict) -> int:
    haystack = (chunk["section"] + " " + chunk["text"]).lower()
    return sum(1 for term in query_terms if term in haystack)


class SearchDocsInput(BaseModel):
    query: str = Field(description="The operator's question, verbatim.")


def _search_docs(params: SearchDocsInput) -> dict:
    if not _CHUNKS:
        return {"results": []}

    model = _get_embedding_model()
    chunk_vectors = _chunk_embeddings()
    query_vector = _l2_normalize(np.array([next(model.query_embed(params.query))], dtype=np.float32))[0]
    similarities = chunk_vectors @ query_vector

    terms = {t for t in re.findall(r"[a-z0-9]+", params.query.lower()) if t not in _STOPWORDS and len(t) > 2}

    scored = [
        (chunk, float(similarity), _keyword_score(terms, chunk))
        for chunk, similarity in zip(_CHUNKS, similarities)
        if similarity >= MIN_SIMILARITY
    ]
    # Primary rank: semantic similarity — the point of this fix is that
    # meaning, not exact wording, should lead. Keyword hits only break ties
    # among near-identical similarity scores (rounded to 3dp), rather than
    # driving the ranking themselves.
    scored.sort(key=lambda triple: (round(triple[1], 3), triple[2]), reverse=True)

    return {
        "results": [
            {"document": c["document"], "section": c["section"], "excerpt": c["text"][:500]}
            for c, _, _ in scored[:3]
        ]
    }


def warm_up() -> None:
    """Pay the embedding model's one-time cold-start cost (loading the ONNX
    session, embedding every chunk) at process startup rather than on a real
    operator's first query. Found live 2026-09-16: the first search_docs
    call after a container (re)start took long enough to matter, purely
    from this lazy initialization — every call after it was fast (a few
    seconds). Call this once from app/main.py at import time, mirroring the
    Dockerfile's own build-time model pre-fetch (that downloads the weights;
    this does the actual model load + chunk embedding, which can't happen
    at build time since it has no docs/ mounted yet)."""
    if _CHUNKS:
        _chunk_embeddings()


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
