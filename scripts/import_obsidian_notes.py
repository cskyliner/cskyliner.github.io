#!/usr/bin/env python3
"""Import Obsidian notes into Jekyll without letting formatters alter LaTeX.

The importer reads notes through ``obsidian-cli`` and discovers the default
vault through the same CLI. Import metadata lives in ``obsidian_imports.toml``.

Examples:
    python scripts/import_obsidian_notes.py
    python scripts/import_obsidian_notes.py --note mvs --check
    python scripts/import_obsidian_notes.py --note mvs --write
    python scripts/import_obsidian_notes.py --write
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import subprocess
import sys
import tomllib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = Path(__file__).with_name("obsidian_imports.toml")
IMAGE_EXTENSIONS = {".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
TOKEN_PREFIX = "OBSIDIANIMPORTPROTECTED"


class ImportFailure(RuntimeError):
    """Raised when a note cannot be converted without losing information."""


@dataclass(frozen=True)
class Settings:
    attachment_source: Path
    attachment_destination: Path
    asset_url: str
    strip_standalone_links: tuple[str, ...] = ()
    links: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class NoteSpec:
    note_id: str
    source: str
    destination: Path
    title: str
    date: str
    description: str
    categories: tuple[str, ...]
    tags: tuple[str, ...]
    layout: str = "distill"
    author: str = "Kylin"
    lang: str = "zh-CN"
    math: bool = True
    toc: bool = True
    giscus_comments: bool = True
    mermaid: bool = False
    heading_offset: int = 0


@dataclass(frozen=True)
class AssetReference:
    source_name: str
    output_name: str


@dataclass
class ConversionResult:
    content: str
    assets: list[AssetReference]
    unresolved_links: list[str]


class TokenStore:
    """Temporarily replaces syntax that must remain byte-for-byte unchanged."""

    def __init__(self, kind: str) -> None:
        self.kind = kind
        self.values: list[str] = []

    def add(self, value: str) -> str:
        token = f"{TOKEN_PREFIX}{self.kind}{len(self.values):04d}TOKEN"
        self.values.append(value)
        return token

    def restore(self, text: str) -> str:
        for index, value in enumerate(self.values):
            token = f"{TOKEN_PREFIX}{self.kind}{index:04d}TOKEN"
            if token not in text:
                raise ImportFailure(f"Formatter removed protected token: {token}")
            text = text.replace(token, value)
        return text


def load_manifest(path: Path) -> tuple[Settings, list[NoteSpec]]:
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    raw_settings = data.get("settings", {})
    settings = Settings(
        attachment_source=Path(raw_settings["attachment_source"]),
        attachment_destination=Path(raw_settings["attachment_destination"]),
        asset_url=raw_settings["asset_url"].rstrip("/"),
        strip_standalone_links=tuple(raw_settings.get("strip_standalone_links", [])),
        links=dict(data.get("links", {})),
    )

    notes = []
    for raw_note in data.get("notes", []):
        notes.append(
            NoteSpec(
                note_id=raw_note["id"],
                source=raw_note["source"],
                destination=Path(raw_note["destination"]),
                title=raw_note["title"],
                date=raw_note["date"],
                description=raw_note["description"],
                categories=tuple(raw_note.get("categories", [])),
                tags=tuple(raw_note.get("tags", [])),
                layout=raw_note.get("layout", "distill"),
                author=raw_note.get("author", "Kylin"),
                lang=raw_note.get("lang", "zh-CN"),
                math=raw_note.get("math", True),
                toc=raw_note.get("toc", True),
                giscus_comments=raw_note.get("giscus_comments", True),
                mermaid=raw_note.get("mermaid", False),
                heading_offset=raw_note.get("heading_offset", 0),
            )
        )

    if not notes:
        raise ImportFailure(f"No notes are configured in {path}")
    return settings, notes


def run_cli(command: list[str]) -> str:
    try:
        completed = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as error:
        raise ImportFailure("obsidian-cli is not installed or is not on PATH") from error
    except subprocess.CalledProcessError as error:
        details = error.stderr.strip() or error.stdout.strip()
        raise ImportFailure(f"Command failed: {' '.join(command)}\n{details}") from error
    return completed.stdout


def discover_vault_path() -> Path:
    output = run_cli(["obsidian-cli", "print-default", "--path-only"]).strip()
    if not output:
        raise ImportFailure("obsidian-cli has no default vault configured")
    vault = Path(output).expanduser().resolve()
    if not vault.is_dir():
        raise ImportFailure(f"Default Obsidian vault does not exist: {vault}")
    return vault


def read_note(source: str) -> str:
    return run_cli(["obsidian-cli", "print", source]).replace("\r\n", "\n")


def strip_frontmatter(text: str) -> str:
    return re.sub(r"\A---\s*\n.*?\n---\s*\n", "", text, count=1, flags=re.DOTALL)


def mask_fenced_code(text: str, store: TokenStore) -> str:
    lines = text.splitlines(keepends=True)
    output: list[str] = []
    index = 0
    while index < len(lines):
        opening = re.match(r"^[ \t]*(`{3,}|~{3,})", lines[index])
        if not opening:
            output.append(lines[index])
            index += 1
            continue

        marker = opening.group(1)
        marker_char = re.escape(marker[0])
        minimum_length = len(marker)
        block = [lines[index]]
        index += 1
        closing_pattern = re.compile(rf"^[ \t]*{marker_char}{{{minimum_length},}}[ \t]*\n?$")
        while index < len(lines):
            block.append(lines[index])
            if closing_pattern.match(lines[index]):
                index += 1
                break
            index += 1
        else:
            raise ImportFailure("Unclosed fenced code block in Obsidian note")

        output.append(f"\n{store.add(''.join(block).rstrip())}\n")
    return "".join(output)


def mask_inline_code(text: str, store: TokenStore) -> str:
    pattern = re.compile(r"(`+)([^\n]*?)(\1)")
    return pattern.sub(lambda match: store.add(match.group(0)), text)


def shift_headings(text: str, offset: int) -> str:
    """Shift Markdown ATX headings while fenced code is protected."""

    if offset == 0:
        return text
    if offset < 0:
        raise ImportFailure("heading_offset cannot be negative")

    def replace(match: re.Match[str]) -> str:
        level = len(match.group(1)) + offset
        if level > 6:
            raise ImportFailure("heading_offset would create a heading deeper than level 6")
        return "#" * level + match.group(2)

    return re.sub(r"(?m)^(#{1,6})([ \t]+)", replace, text)


def escape_pipes(formula: str) -> str:
    """Keep kramdown from reading a math pipe as a table cell separator.

    kramdown turns any line containing a bare "|" into a table row, which splits
    inline math and leaves MathJax nothing to render. \\vert and \\Vert are the same
    glyphs as | and \\|, so the escape is invisible in the rendered output.
    """

    def replace(match: re.Match[str]) -> str:
        command = "\\Vert" if match.group(1) else "\\vert"
        letter = match.group(2)
        # A control word must not run into a following letter ("\vertx" is undefined).
        return f"{command}{{}}{letter}" if letter else command

    return re.sub(r"(\\?)\|([A-Za-z]?)", replace, formula)


def mask_math(text: str, store: TokenStore) -> tuple[str, list[str]]:
    formulas: list[str] = []

    display_pattern = re.compile(r"(?<!\\)\$\$(.*?)(?<!\\)\$\$", re.DOTALL)

    def replace_display(match: re.Match[str]) -> str:
        # Prettier strips trailing whitespace, so normalise it inside the formula too;
        # LaTeX ignores it, and the restored math then matches Prettier's output.
        body = re.sub(r"[ \t]+$", "", match.group(1).strip(), flags=re.MULTILINE)
        formula = escape_pipes(f"$$\n{body}\n$$")
        formulas.append(formula)
        return f"\n\n{store.add(formula)}\n\n"

    text = display_pattern.sub(replace_display, text)

    inline_pattern = re.compile(r"(?<!\\)(?<!\$)\$(?!\$)([^\n]+?)(?<!\\)\$(?!\$)")

    def replace_inline(match: re.Match[str]) -> str:
        body = match.group(1).strip()
        if not body:
            raise ImportFailure("Empty inline math expression")
        formula = escape_pipes(f"${body}$")
        formulas.append(formula)
        return store.add(formula)

    text = inline_pattern.sub(replace_inline, text)
    remaining_dollars = re.findall(r"(?<!\\)\$", text)
    if remaining_dollars:
        raise ImportFailure(
            "Unmatched dollar delimiter remains after parsing math; fix the source note before importing"
        )
    return text, formulas


def sanitize_asset_name(filename: str) -> str:
    source = Path(filename).name
    stem = re.sub(r"[^\w.-]+", "-", Path(source).stem, flags=re.UNICODE).strip("-.")
    suffix = Path(source).suffix.lower()
    if not stem or suffix not in IMAGE_EXTENSIONS:
        raise ImportFailure(f"Unsupported image attachment: {filename}")
    return f"{stem}{suffix}"


def parse_image_size(value: str | None) -> tuple[str | None, str | None]:
    if not value:
        return None, None
    match = re.fullmatch(r"\s*(\d+)(?:x(\d+))?\s*", value)
    if not match:
        return None, None
    return match.group(1), match.group(2)


def convert_obsidian_syntax(text: str, settings: Settings) -> ConversionResult:
    assets: list[AssetReference] = []
    unresolved_links: list[str] = []

    for link in settings.strip_standalone_links:
        escaped = re.escape(link)
        text = re.sub(
            rf"(?m)^\s*\[\[{escaped}(?:\|[^\]]+)?\]\]\s*\n?",
            "",
            text,
        )

    embed_pattern = re.compile(r"!\[\[([^\]]+)\]\]")

    def replace_embed(match: re.Match[str]) -> str:
        payload = match.group(1)
        target, separator, display = payload.partition("|")
        suffix = Path(target).suffix.lower()
        if suffix not in IMAGE_EXTENSIONS:
            label = display if separator else Path(target).name
            unresolved_links.append(target)
            return label

        output_name = sanitize_asset_name(target)
        assets.append(AssetReference(source_name=target, output_name=output_name))
        width, height = parse_image_size(display if separator else None)
        options = [
            f'path="{settings.asset_url}/{output_name}"',
            'class="img-fluid rounded z-depth-1"',
            f'alt="{html.escape(Path(target).stem, quote=True)}"',
        ]
        if width:
            options.append(f'width="{width}"')
        if height:
            options.append(f'height="{height}"')
        return "{% include figure.liquid " + " ".join(options) + " %}"

    text = embed_pattern.sub(replace_embed, text)

    wikilink_pattern = re.compile(r"(?<!!)\[\[([^\]]+)\]\]")

    def replace_wikilink(match: re.Match[str]) -> str:
        payload = match.group(1)
        target, separator, label = payload.partition("|")
        label = label if separator else target.split("#", 1)[0]
        url = settings.links.get(target) or settings.links.get(target.split("#", 1)[0])
        if url:
            return f"[{label}]({url})"
        unresolved_links.append(target)
        return label

    text = wikilink_pattern.sub(replace_wikilink, text)
    text = re.sub(r"==([^=\n]+)==", r"<mark>\1</mark>", text)
    text = re.sub(
        r"(?m)^>\s*\[!(\w+)\](?:[+-])?\s*(.*)$",
        lambda match: f"> **{match.group(1).title()}{' — ' + match.group(2) if match.group(2) else ''}**",
        text,
    )
    return ConversionResult(text, assets, unresolved_links)


def local_prettier() -> Path:
    executable = REPO_ROOT / "node_modules" / ".bin" / "prettier"
    if not executable.exists():
        raise ImportFailure("Local Prettier is missing; run npm install first")
    return executable


def format_markdown(text: str, formatter: Callable[[str], str] | None = None) -> str:
    if formatter:
        return formatter(text)
    completed = subprocess.run(
        [str(local_prettier()), "--parser", "markdown"],
        cwd=REPO_ROOT,
        input=text,
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout


def yaml_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def build_frontmatter(note: NoteSpec) -> str:
    lines = [
        "---",
        f"layout: {note.layout}",
        f"lang: {yaml_string(note.lang)}",
        f"title: {yaml_string(note.title)}",
        f"date: {note.date}",
        f"description: {yaml_string(note.description)}",
        "categories: [" + ", ".join(yaml_string(item) for item in note.categories) + "]",
        "tags: [" + ", ".join(yaml_string(item) for item in note.tags) + "]",
        f"math: {str(note.math).lower()}",
        f"author: {yaml_string(note.author)}",
        f"giscus_comments: {str(note.giscus_comments).lower()}",
        f"toc: {str(note.toc).lower()}",
    ]
    if note.mermaid:
        lines.append("mermaid: true")
    lines.extend(["---", ""])
    # Prettier expects a blank line between the front matter and the body.
    return "\n".join(lines) + "\n"


def extract_math(text: str) -> list[str]:
    display = re.findall(r"(?<!\\)\$\$.*?(?<!\\)\$\$", text, flags=re.DOTALL)
    without_display = re.sub(r"(?<!\\)\$\$.*?(?<!\\)\$\$", "", text, flags=re.DOTALL)
    inline = re.findall(r"(?<!\\)(?<!\$)\$(?!\$)[^\n]+?(?<!\\)\$(?!\$)", without_display)
    return display + inline


def convert_note(
    source: str,
    note: NoteSpec,
    settings: Settings,
    formatter: Callable[[str], str] | None = None,
) -> ConversionResult:
    body = strip_frontmatter(source).strip() + "\n"
    if TOKEN_PREFIX in body:
        raise ImportFailure(f"Source note contains reserved text: {TOKEN_PREFIX}")

    code_store = TokenStore("CODE")
    math_store = TokenStore("MATH")
    body = mask_fenced_code(body, code_store)
    body = mask_inline_code(body, code_store)
    body = shift_headings(body, note.heading_offset)
    body, expected_formulas = mask_math(body, math_store)
    converted = convert_obsidian_syntax(body, settings)
    body = format_markdown(converted.content, formatter=formatter)
    body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
    body = math_store.restore(body)

    actual_formulas = extract_math(body)
    if actual_formulas != expected_formulas:
        raise ImportFailure("Math changed during formatting; import aborted")

    # Prettier laid out tables using the masked math tokens, so align them again with the
    # formulas restored. Keep that result only when no formula was rewritten.
    aligned = format_markdown(body, formatter=formatter)
    aligned = re.sub(r"\n{3,}", "\n\n", aligned).strip() + "\n"
    if extract_math(aligned) == expected_formulas:
        body = aligned

    if re.search(r"!?\[\[[^\]]+\]\]", body):
        raise ImportFailure("Unconverted Obsidian link remains in generated Markdown")
    body = code_store.restore(body)

    converted.content = build_frontmatter(note) + body
    return converted


def file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_asset(vault: Path, settings: Settings, reference: AssetReference) -> Path:
    direct = vault / settings.attachment_source / reference.source_name
    if direct.is_file():
        return direct

    basename = Path(reference.source_name).name
    matches = [
        path
        for path in vault.rglob(basename)
        if path.is_file() and ".obsidian" not in path.parts
    ]
    if len(matches) == 1:
        return matches[0]
    if not matches:
        raise ImportFailure(f"Attachment not found in vault: {reference.source_name}")
    raise ImportFailure(f"Attachment name is ambiguous: {reference.source_name}")


def unique_assets(references: Iterable[AssetReference]) -> list[AssetReference]:
    by_output: dict[str, AssetReference] = {}
    for reference in references:
        previous = by_output.get(reference.output_name)
        if previous and previous.source_name != reference.source_name:
            raise ImportFailure(f"Two attachments map to {reference.output_name}")
        by_output[reference.output_name] = reference
    return list(by_output.values())


def asset_is_current(source: Path, destination: Path) -> bool:
    return destination.is_file() and file_digest(source) == file_digest(destination)


def select_notes(notes: list[NoteSpec], selected: list[str]) -> list[NoteSpec]:
    if not selected:
        return notes
    by_id = {note.note_id: note for note in notes}
    missing = sorted(set(selected) - by_id.keys())
    if missing:
        raise ImportFailure(f"Unknown note id(s): {', '.join(missing)}")
    return [by_id[note_id] for note_id in selected]


def parse_arguments(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--note", action="append", default=[], help="Import one configured note id; repeat as needed")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="Write posts and copy referenced assets")
    mode.add_argument("--check", action="store_true", help="Exit non-zero when generated files are stale")
    parser.add_argument("--skip-assets", action="store_true", help="Do not check or copy image attachments")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_arguments(argv)
    try:
        settings, configured_notes = load_manifest(args.manifest.resolve())
        notes = select_notes(configured_notes, args.note)
        vault = discover_vault_path()
        stale = False

        for note in notes:
            source = read_note(note.source)
            result = convert_note(source, note, settings)
            destination = REPO_ROOT / note.destination
            content_current = destination.is_file() and destination.read_text(encoding="utf-8") == result.content
            stale = stale or not content_current

            if args.write:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text(result.content, encoding="utf-8")
                print(f"updated {note.note_id}: {note.destination}")
            else:
                state = "current" if content_current else "would update"
                print(f"{state} {note.note_id}: {note.destination}")

            if result.unresolved_links:
                targets = ", ".join(sorted(set(result.unresolved_links)))
                print(f"  rendered unresolved links as text: {targets}")

            if args.skip_assets:
                continue

            asset_destination = REPO_ROOT / settings.attachment_destination
            for reference in unique_assets(result.assets):
                source_asset = resolve_asset(vault, settings, reference)
                destination_asset = asset_destination / reference.output_name
                current = asset_is_current(source_asset, destination_asset)
                stale = stale or not current
                if args.write and not current:
                    destination_asset.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source_asset, destination_asset)
                    print(f"  copied asset: {reference.output_name}")
                elif not args.write and not current:
                    print(f"  would copy asset: {reference.output_name}")

        if args.check and stale:
            return 1
        return 0
    except ImportFailure as error:
        print(f"error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
