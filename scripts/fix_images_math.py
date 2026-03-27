import os
import re

posts_dir = "/Users/kylin/GitHub/cskyliner/cskyliner.github.io/_posts"
post_files = [
    "2025-10-28-Structure-from-Motion.md",
    "2025-10-28-Multi-View-Stereo.md",
    "2025-12-14-Image-Generation.md"
]

def fix_inline_math_in_lists(content):
    # Obsidian allows "- $math$" but kramdown sometimes fails if there isn't a space 
    # or if the math contains characters that confuse the markdown parser.
    # A common fix is ensuring there is a space after the bullet: "- $x$" not "-$x$"
    # And ensuring inline math doesn't span multiple lines weirdly.
    
    # Let's fix lists with math that might be misaligned
    lines = content.split('\n')
    fixed_lines = []
    in_math_block = False
    
    for line in lines:
        if line.strip() == '$$':
            in_math_block = not in_math_block
            
        if not in_math_block:
            # Fix bolding around math: **$math$** -> ** $math$ ** or just ensuring standard spacing
            # Actually, the most common issue is inline math with escaping like \\_ or \*
            
            # Make sure bullets have a space
            line = re.sub(r'^(\s*[-*+])\$', r'\1 $', line)
            
        fixed_lines.append(line)
        
    return '\n'.join(fixed_lines)

def fix_images(content):
    # Convert standard markdown images to HTML with max-width/responsive styling
    # From: ![alt](/assets/img/posts/CV/img.png)
    # To: <img src="/assets/img/posts/CV/img.png" alt="alt" class="img-fluid rounded z-depth-1" style="max-width: 80%; margin: 0 auto; display: block;" />
    
    def repl_img(match):
        alt_text = match.group(1)
        img_src = match.group(2)
        # Using al-folio's built-in responsive image classes (img-fluid rounded z-depth-1)
        return f'<div class="row mt-3"><div class="col-sm mt-3 mt-md-0"><figure><picture><img src="{img_src}" class="img-fluid rounded z-depth-1" alt="{alt_text}" style="max-width: 80%; margin: 0 auto; display: block;" /></picture></figure></div></div>'

    # Match ![alt](src)
    return re.sub(r'!\[(.*?)\]\((.*?)\)', repl_img, content)

for post_file in post_files:
    post_path = os.path.join(posts_dir, post_file)
    with open(post_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split frontmatter
    parts = content.split('---\n', 2)
    if len(parts) >= 3:
        frontmatter = parts[1]
        body = parts[2]
        
        body = fix_images(body)
        body = fix_inline_math_in_lists(body)
        
        # Another common MathJax issue: ensuring inline math variables are properly parsed
        # In Kramdown, `$$` is block math, `$$...$$` inline math in some configs, 
        # but typical al-folio uses `$...$` for inline. 
        # Let's double check there are no double escaped backslashes in math like `\\\\` that should be `\\`
        
        new_content = f"---{parts[0]}\n{frontmatter}---\n{body}"
        with open(post_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed images and math for {post_file}")

