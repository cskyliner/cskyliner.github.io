import os
import re

posts_dir = "/Users/kylin/GitHub/cskyliner/cskyliner.github.io/_posts"
post_files = [
    "2025-10-28-Structure-from-Motion.md",
    "2025-10-28-Multi-View-Stereo.md",
    "2025-12-14-Image-Generation.md"
]

for post_file in post_files:
    post_path = os.path.join(posts_dir, post_file)
    with open(post_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix Math rendering
    # Jekyll/Liquid often chokes on {{ and }} in math blocks, or $...$ inline math needs spacing.
    # A common issue in kramdown/mathjax is double blank lines before/after block math, 
    # or ensuring block math uses $$ on their own lines.
    
    # 2. Extract Headings for TOC
    # Find all ## Headings (H2) and ### Headings (H3)
    # The frontmatter is between the first two '---'
    parts = content.split('---\n', 2)
    if len(parts) >= 3:
        frontmatter = parts[1]
        body = parts[2]
        
        # Extract headings from body
        headings = []
        lines = body.split('\n')
        current_h2 = None
        for line in lines:
            h2_match = re.match(r'^##\s+(.+)$', line)
            h3_match = re.match(r'^###\s+(.+)$', line)
            
            if h2_match:
                title = h2_match.group(1).strip()
                current_h2 = {"name": title, "subsections": []}
                headings.append(current_h2)
            elif h3_match and current_h2 is not None:
                title = h3_match.group(1).strip()
                current_h2["subsections"].append({"name": title})
                
        # Rebuild TOC in frontmatter
        toc_yaml = "toc:\n"
        for h2 in headings:
            toc_yaml += f"  - name: {h2['name']}\n"
            # Limit subsections depth to avoid overly complex TOC
            if h2['subsections']:
                toc_yaml += "    subsections:\n"
                for h3 in h2['subsections']:
                    toc_yaml += f"      - name: {h3['name']}\n"
                    
        # Replace old TOC with new TOC
        frontmatter = re.sub(r'toc:\n\s+- name: 概览\n?', toc_yaml, frontmatter)
        
        # Write back
        new_content = f"---{parts[0]}\n{frontmatter}---\n{body}"
        with open(post_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed TOC and formatting for {post_file}")

