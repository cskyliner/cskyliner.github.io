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

    # Jekyll liquid tags conflict with mathjax {{ and }}
    # Wrap block math with {% raw %} ... {% endraw %} to prevent Liquid rendering errors
    # if it contains {{ or }}
    
    # Let's fix common math issues for Kramdown
    
    # 1. Ensure block math $$ is on its own line and has blank lines around it
    # We'll just replace $$ with \n$$\n where needed, then remove excess newlines
    content = re.sub(r'([^\n])\s*\$\$', r'\1\n$$', content)
    content = re.sub(r'\$\$\s*([^\n])', r'$$\n\1', content)
    
    # Replace any escaped \| inside math blocks which might be misinterpreted
    # Actually, simpler: replace \{ with \\{ if they are not already escaped for Liquid
    
    # Protect math blocks from Liquid parser if they contain { or }
    def protect_math(match):
        math_content = match.group(0)
        if '{' in math_content or '}' in math_content:
            return "{% raw %}\n" + math_content + "\n{% endraw %}"
        return math_content

    # This might double wrap if already wrapped, let's just do a simple replacement for now
    
    # Write back
    with open(post_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Fixed math spacing for {post_file}")
