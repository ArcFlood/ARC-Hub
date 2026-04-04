"""
obsidian_reader.py — Parse Obsidian .md files into ConversationDoc records.

ARC-Memory originally expected AI-export frontmatter. For a general-purpose
vault, missing metadata is inferred so plain Obsidian notes can still be
indexed and retrieved.
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

import frontmatter

logger = logging.getLogger(__name__)

VALID_SOURCE_TYPES = {"chatgpt", "claude", "arcos", "obsidian"}


@dataclass
class ConversationDoc:
    """Structured representation of a single Obsidian conversation file."""

    # File identity
    source_path: str           # Full path to .md file
    conversation_id: str       # UUID grouping all chunks from this file
    file_hash: str             # SHA256 of raw file content

    # Frontmatter fields
    title: str
    date: str                  # ISO date string (e.g. "2024-03-15")
    source_type: str           # "chatgpt" | "claude" | "arcos"

    # Body content
    body: str                  # Raw markdown body (no frontmatter)

    # Optional frontmatter extras
    tags: list[str] = field(default_factory=list)


def _compute_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _safe_str(value) -> str:
    """Coerce frontmatter values to string, handling None."""
    if value is None:
        return ""
    return str(value).strip()


def _infer_date(path: Path, metadata_date) -> str:
    """Prefer frontmatter date, otherwise fall back to file mtime."""
    date = _safe_str(metadata_date)
    if date:
        return date
    return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()


def parse_file(path: Path) -> Optional[ConversationDoc]:
    """
    Parse a single .md file. Returns ConversationDoc or None if unreadable.

    Plain Obsidian notes without AI-export frontmatter are accepted and
    normalized as source_type="obsidian".
    """
    raw_bytes: bytes
    try:
        raw_bytes = path.read_bytes()
    except OSError as e:
        logger.warning("Cannot read %s: %s", path, e)
        return None

    file_hash = _compute_hash(raw_bytes)

    try:
        post = frontmatter.loads(raw_bytes.decode("utf-8", errors="replace"))
    except Exception as e:
        logger.warning("Frontmatter parse failed for %s: %s", path, e)
        return None

    raw_source_type = _safe_str(post.metadata.get("source", "")).lower()
    if not raw_source_type:
        source_type = "obsidian"
    elif raw_source_type in VALID_SOURCE_TYPES:
        source_type = raw_source_type
    else:
        logger.info(
            "Normalizing %s — unsupported 'source' field %r → 'obsidian'",
            path.name,
            raw_source_type,
        )
        source_type = "obsidian"

    title = _safe_str(post.metadata.get("title", path.stem))
    date = _infer_date(path, post.metadata.get("date", ""))

    tags_raw = post.metadata.get("tags", [])
    tags: list[str] = (
        tags_raw if isinstance(tags_raw, list) else [str(tags_raw)]
    )

    body = post.content.strip()
    if not body:
        logger.info("Skipping %s — note body is empty", path.name)
        return None

    return ConversationDoc(
        source_path=str(path.resolve()),
        conversation_id=str(uuid.uuid5(uuid.NAMESPACE_URL, str(path.resolve()))),
        file_hash=file_hash,
        title=title,
        date=date,
        source_type=source_type,
        body=body,
        tags=tags,
    )


def walk_vault(vault_path: str | Path) -> list[ConversationDoc]:
    """
    Recursively walk vault_path, parse all .md files, return valid docs.

    Unreadable or unparseable files are skipped and logged — they do not raise.
    """
    vault = Path(vault_path).expanduser().resolve()
    if not vault.exists():
        raise FileNotFoundError(f"Vault path does not exist: {vault}")

    docs: list[ConversationDoc] = []
    md_files = sorted(vault.rglob("*.md"))

    logger.info("Found %d .md files in %s", len(md_files), vault)

    for path in md_files:
        doc = parse_file(path)
        if doc is not None:
            docs.append(doc)

    logger.info(
        "Parsed %d valid / %d skipped from vault",
        len(docs),
        len(md_files) - len(docs),
    )
    return docs
