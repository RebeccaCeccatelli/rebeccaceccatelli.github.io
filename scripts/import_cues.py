#!/usr/bin/env python3
"""
Import "Thoughts and Cues" from the Google Doc into src/content/cues/YYYY-MM.yaml.

Usage:
    python3 scripts/import_cues.py              # downloads the doc's HTML export
    python3 scripts/import_cues.py path/to.html # uses a local HTML export

The doc must be shared as "anyone with the link can view".
Re-running OVERWRITES the month files, so after you start editing the YAML by
hand, prefer adding new entries there directly (or import into a scratch copy).
"""
import html
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

DOC_ID = "121__tf13OBsBYQ-ElwtQaPBH9HtS2w0MhcGWNFl06KA"
YEAR = 2026
OUT = Path(__file__).resolve().parent.parent / "src" / "content" / "cues"

MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def load(argv):
    if len(argv) > 1:
        return Path(argv[1]).read_text(encoding="utf8")
    url = f"https://docs.google.com/document/d/{DOC_ID}/export?format=html"
    with urllib.request.urlopen(url) as r:
        return r.read().decode("utf8")


def style_classes(src):
    css = " ".join(re.findall(r"(?s)<style[^>]*>(.*?)</style>", src))
    italic, bold = set(), set()
    for name, body in re.findall(r"\.(c\d+)\{([^}]*)\}", css):
        if "font-style:italic" in body:
            italic.add(name)
        if re.search(r"font-weight:(700|bold)", body):
            bold.add(name)
    return italic, bold


def unwrap(href):
    href = html.unescape(href)
    if href.startswith("https://www.google.com/url"):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get("q")
        if q:
            return q[0]
    return href


def to_md(fragment, italic, bold):
    """Convert one <li>/<p> inner HTML from the Docs export into inline Markdown.
    Consecutive spans with the same emphasis are merged before wrapping."""
    runs = []  # (style, text) where style in {"", "*", "**", "link"}
    for m in re.finditer(r'(?s)<span class="([^"]*)">(.*?)</span>', fragment):
        classes, inner = set(m.group(1).split()), m.group(2)
        style = "**" if classes & bold else "*" if classes & italic else ""
        pos = 0
        for a in re.finditer(r'(?s)<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', inner):
            runs.append((style, clean(inner[pos:a.start()])))
            text = clean(a.group(2)).strip()
            if text:
                runs.append(("link", f"[{text}]({unwrap(a.group(1))})"))
            pos = a.end()
        runs.append((style, clean(inner[pos:])))
    merged = []
    for style, text in runs:
        if not text:
            continue
        if merged and merged[-1][0] == style and style != "link":
            merged[-1][1] += text
        else:
            merged.append([style, text])
    out = []
    for style, text in merged:
        if style in ("*", "**") and text.strip():
            lead = text[: len(text) - len(text.lstrip())]
            trail = text[len(text.rstrip()):]
            text = f"{lead}{style}{text.strip()}{style}{trail}"
        out.append(text)
    return re.sub(r"[ \t]+", " ", "".join(out)).strip()


def clean(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).replace("\xa0", " ")


TAG_ALIASES = {"classical music": "Music", "politics & media": "Politics", "pop culture": "Pop Culture"}


def norm_tag(tag):
    t = tag.strip()
    if t.lower() in TAG_ALIASES:
        return TAG_ALIASES[t.lower()]
    t = re.split(r"[,/?&]", t)[0].strip()
    return TAG_ALIASES.get(t.lower(), t[:1].upper() + t[1:])


def parse_date(text):
    t = text.lower().replace(",", " ").strip().rstrip(":").strip()
    m = re.match(r"([a-z]+)\s+(\d+)(?:st|nd|rd|th)?(?:\s*[-–]\s*(\d+))?", t)
    if not m or m.group(1)[:3] not in MONTHS:
        return None
    month, day = MONTHS[m.group(1)[:3]], int(m.group(2))
    label = f"{m.group(1)[:3].title()} {day}" + (f"–{m.group(3)}" if m.group(3) else "")
    return f"{YEAR}-{month:02d}-{day:02d}", label


def parse(src):
    italic, bold = style_classes(src)
    body = src[src.find("<body"):]
    days = []
    for block in re.finditer(r'(?s)<p[^>]*>(.*?)</p>|<ul class="[^"]*lst-kix_\w+-(\d)[^"]*">(.*?)</ul>', body):
        if block.group(1) is not None:
            raw = html.unescape(re.sub(r"<[^>]+>", "", block.group(1))).replace("\xa0", " ").strip()
            parsed = parse_date(raw.split(":")[0] + ":") if raw else None
            if parsed:
                days.append({"date": parsed[0], "label": parsed[1], "items": []})
            continue
        if not days:
            continue
        level = int(block.group(2))
        for li in re.findall(r"(?s)<li[^>]*>(.*?)</li>", block.group(3)):
            text = to_md(li, italic, bold)
            if not text or re.match(r"(TODO|TBD)\b", text):
                continue
            if level == 0:
                m = re.match(r"\[([^\]]+)\](?!\()\s*(.*)", text, re.S)
                tag, text = (norm_tag(m.group(1)), m.group(2).strip()) if m else ("Miscellaneous", text)
                days[-1]["items"].append({"tag": tag, "text": text, "sub": []})
            elif days[-1]["items"]:
                parent = days[-1]["items"][-1]
                for _ in range(level - 1):  # descend to the right depth
                    if parent["sub"]:
                        parent = parent["sub"][-1]
                parent["sub"].append({"text": text, "sub": []})
    return [d for d in days if d["items"]]


def yq(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def dump_items(items, indent):
    pad = " " * indent
    lines = []
    for it in items:
        first = True
        if "tag" in it:
            lines.append(f"{pad}- tag: {yq(it['tag'])}")
            first = False
        lines.append(f"{pad}{'- ' if first else '  '}text: {yq(it['text'])}")
        if it["sub"]:
            lines.append(f"{pad}  sub:")
            lines += dump_items(it["sub"], indent + 4)
    return lines


def main():
    days = parse(load(sys.argv))
    OUT.mkdir(parents=True, exist_ok=True)
    by_month = {}
    for d in days:
        by_month.setdefault(d["date"][:7], []).append(d)
    for month, ds in by_month.items():
        lines = [f"# Thoughts & Cues — {month}. Edit freely; text is Markdown.",
                 f"month: {yq(month)}", "days:"]
        for d in ds:
            lines += [f"  - date: {d['date']}", f"    label: {yq(d['label'])}", "    items:"]
            lines += dump_items(d["items"], 6)
        (OUT / f"{month}.yaml").write_text("\n".join(lines) + "\n", encoding="utf8")
        print(f"{month}: {len(ds)} days, {sum(len(d['items']) for d in ds)} entries")


if __name__ == "__main__":
    main()
