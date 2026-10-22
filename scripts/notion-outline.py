#!/usr/bin/env python3
"""Print each case study's Notion outline (spine, projects, results, open notes).

    python3 scripts/notion-outline.py [client-slug ...]

Output is Notion markdown for the matching row in the Case Studies database
(Community Garden / Projects / Frye Creative). The repo is the source of truth;
Notion mirrors structure only, so regenerate and replace after copy changes.
Needs PyYAML.
"""
import os, re, sys, yaml

C = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "content")
IMG = r"\S+\.(?:jpe?g|png|webp|gif|avif)\b"

def mdx(p):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", open(p).read(), re.S)
    return yaml.safe_load(m.group(1)), m.group(2)

def image_counts(body):
    real = placeholder = 0
    inside = False
    for line in body.split("\n"):
        t = line.strip()
        if re.match(r"^::: \w+$", t): inside = True; continue
        if t == ":::": inside = False; continue
        if inside and t and not t.startswith("Caption:"):
            if re.match(rf"^(?:\d+\.\s*)?{IMG}", t, re.I): real += 1
            else: placeholder += 1
    return real, placeholder

notes = lambda b: re.findall(r"\[([^\]\n]+)\](?!\()", b)
plural = lambda n, w: f"{n} {w}{'s' * (n != 1)}"
skills = {s: mdx(f"{C}/skills/{s}/index.mdx")[0]["name"] for s in os.listdir(f"{C}/skills")}

def outline(slug):
    d, body = mdx(f"{C}/clients/{slug}/index.mdx")
    narrative, _, closing = body.partition("## Results")
    out = ["**Draft** — visible on wip, hidden on gregfrye.us.", ""] if d.get("draft") else []
    out += [f"*{d['summary']}*", "", "## Spine"]
    spine = re.findall(r'<SpineSection label="([^"]*)" subhead="([^"]*)">', narrative)
    out += [f"- **{a}** — {s}" for a, s in spine] or ["- *No spine yet.*"]
    out += ["", "## Projects"]
    todo = notes(body)
    for i, ps in enumerate(d.get("projects") or [], 1):
        pd, pb = mdx(f"{C}/clients/{slug}/projects/{ps}/index.mdx")
        real, ph = image_counts(pb)
        images = plural(real, "image") + (f", {plural(ph, 'placeholder')}" if ph else "")
        out += [f"{i}. **{pd['title']}**" + (" (draft)" if pd.get("draft") else "") + f" — {pd['summary']}",
                f"\tOfferings: {', '.join(skills.get(s, s) for s in pd.get('skills', []))} · {images}"]
        todo += notes(pb)
    if closing:
        results = closing.partition("## Credits")[0]
        out += ["", "## Results"] + [l for l in results.strip().split("\n") if l.strip()]
    if todo: out += ["", "## Open"] + [f"- [ ] {n}" for n in todo]
    out += ["", "---", f"Outline of `content/clients/{slug}` on claude/preview. Copy lives in the repo; this page mirrors its structure."]
    return "\n".join(out)

for slug in sys.argv[1:] or sorted(os.listdir(f"{C}/clients")):
    print(f"===== {slug}\n{outline(slug)}\n")
