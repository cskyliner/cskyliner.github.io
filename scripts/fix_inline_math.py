import os
import re

posts_dir = "/Users/kylin/GitHub/cskyliner/cskyliner.github.io/_posts"
post_files = [
    "2025-10-28-Structure-from-Motion.md",
    "2025-10-28-Multi-View-Stereo.md",
    "2025-12-14-Image-Generation.md"
]

def fix_list_math(content):
    # In Jekyll/Kramdown, list items with math can get messed up if the math is not spaced correctly.
    # Also, $$ for inline math might not be correctly parsed. 
    # Usually $math$ is standard for inline. Let's make sure it's cleanly spaced.
    lines = content.split('\n')
    fixed_lines = []
    
    for line in lines:
        # Match list items starting with '-' or '+' or '*' and fix math spacing
        if re.match(r'^\s*[-*+]\s+', line):
            # Sometimes things like "- **目标**：给定无标签数据$x$" need space before $
            # line = re.sub(r'([^\s$])\$([^\s$].*?[^\s$])\$([^\s$])', r'\1 $\2$ \3', line)
            
            # More conservatively: make sure inline math in lists has a clean space around it if attached to Chinese
            # This is tricky because Chinese characters don't need spaces, but markdown parsers sometimes do.
            # Let's add a space around $...$ if it's touching text.
            line = re.sub(r'([^\s])\$', r'\1 $', line)
            line = re.sub(r'\$([^\s.,;?!:）】。，；？！])', r'$ \1', line)
            
        fixed_lines.append(line)
        
    return '\n'.join(fixed_lines)

for post_file in post_files:
    post_path = os.path.join(posts_dir, post_file)
    with open(post_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split frontmatter
    parts = content.split('---\n', 2)
    if len(parts) >= 3:
        frontmatter = parts[1]
        body = parts[2]
        
        body = fix_list_math(body)
        
        new_content = f"---{parts[0]}\n{frontmatter}---\n{body}"
        with open(post_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed list math for {post_file}")

