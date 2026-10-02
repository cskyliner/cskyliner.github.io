import unittest
from pathlib import Path

from import_obsidian_notes import (
    NoteSpec,
    Settings,
    convert_note,
    convert_obsidian_syntax,
    strip_frontmatter,
)


class ObsidianImportTests(unittest.TestCase):
    def setUp(self):
        self.settings = Settings(
            attachment_source=Path("CV/attachments"),
            attachment_destination=Path("assets/img/posts/CV"),
            asset_url="/assets/img/posts/CV",
            strip_standalone_links=("CV",),
            links={"Published Note": "/blog/2025/published-note/"},
        )
        self.note = NoteSpec(
            note_id="test",
            source="CV/Test",
            destination=Path("_posts/2025-01-01-test.md"),
            title="Test",
            date="2025-01-01 12:00:00",
            description="Test note",
            categories=("CV", "notes"),
            tags=("CV",),
        )

    def test_frontmatter_is_removed(self):
        source = "---\ntitle: Source\n---\n\nBody\n"
        self.assertEqual(strip_frontmatter(source), "Body\n")

    def test_math_is_normalized_and_survives_formatter(self):
        source = """---
title: Source
---

[[CV]]

- 颜色 $ c_i $ 乘以 $ \\alpha_i $，再乘以 $ \\prod_{j=1}^{i-1}(1-\\alpha_j) $。

$$ \\hat{x}_{ij}=P_iX_j $$
"""

        def hostile_formatter(text: str) -> str:
            # Protected math is absent while the Markdown formatter runs.
            self.assertNotIn("c_i", text)
            self.assertNotIn("hat", text)
            return text

        result = convert_note(source, self.note, self.settings, formatter=hostile_formatter)
        self.assertIn("$c_i$", result.content)
        self.assertIn("$\\alpha_i$", result.content)
        self.assertIn("$$\n\\hat{x}_{ij}=P_iX_j\n$$", result.content)
        self.assertNotIn("c*i", result.content)

    def test_obsidian_links_and_images_are_converted(self):
        result = convert_obsidian_syntax(
            "[[CV]]\n[[Published Note|read this]] [[Draft Note]] ![[image 1.png|640x320]]\n",
            self.settings,
        )
        self.assertIn("[read this](/blog/2025/published-note/)", result.content)
        self.assertIn("Draft Note", result.content)
        self.assertNotIn("[[", result.content)
        self.assertIn('path="/assets/img/posts/CV/image-1.png"', result.content)
        self.assertIn('width="640"', result.content)
        self.assertIn('height="320"', result.content)
        self.assertEqual(result.assets[0].source_name, "image 1.png")

    def test_code_is_not_treated_as_obsidian_or_math_syntax(self):
        source = """---
title: Source
---

`$not_math$ [[not-a-link]]`

```python
value = "$still_not_math$"
link = "[[still-not-a-link]]"
```
"""
        result = convert_note(source, self.note, self.settings, formatter=lambda text: text)
        self.assertIn("`$not_math$ [[not-a-link]]`", result.content)
        self.assertIn('value = "$still_not_math$"', result.content)
        self.assertIn('link = "[[still-not-a-link]]"', result.content)


if __name__ == "__main__":
    unittest.main()
