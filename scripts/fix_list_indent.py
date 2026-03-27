import os
import re

posts_dir = "/Users/kylin/GitHub/cskyliner/cskyliner.github.io/_posts"
post_files = [
    "2025-10-28-Structure-from-Motion.md",
    "2025-10-28-Multi-View-Stereo.md",
    "2025-12-14-Image-Generation.md"
]

def fix_list_indent(content):
    # In markdown lists, block math must be indented to the level of the list item text 
    # to be considered part of the list item.
    # Otherwise it breaks the list or the math doesn't render.
    
    lines = content.split('\n')
    fixed_lines = []
    
    in_list = False
    list_indent = 0
    in_math_block = False
    
    for line in lines:
        # Detect start of a list item
        list_match = re.match(r'^(\s*)[-*+]\s+', line)
        num_list_match = re.match(r'^(\s*)\d+\.\s+', line)
        
        if list_match:
            in_list = True
            list_indent = len(list_match.group(1)) + 2 # estimate indent needed for children
        elif num_list_match:
            in_list = True
            list_indent = len(num_list_match.group(1)) + 3
        elif not line.strip() and not in_math_block:
            # Blank line might end a list or just be spacing inside a list
            pass
        elif line.strip() and not line.startswith(' ') and not in_math_block and line.strip() != '$$':
            if not line.startswith('#'): # Not a heading
                # We might have exited the list
                pass
                
        # If we see block math start/end
        if line.strip() == '$$':
            in_math_block = not in_math_block
            if in_list:
                # Indent the $$ to match the list item
                line = (' ' * list_indent) + '$$'
        elif in_math_block and in_list:
            # Indent the math content
            if line.strip():
                line = (' ' * list_indent) + line.strip()
                
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
        
        body = fix_list_indent(body)
        
        new_content = f"---{parts[0]}\n{frontmatter}---\n{body}"
        with open(post_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed list indentation for math in {post_file}")

