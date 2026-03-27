import os
import re
import shutil

source_attach_dir = "/Users/kylin/Documents/Study Notes/CV/attachments"
dest_img_dir = "/Users/kylin/GitHub/cskyliner/cskyliner.github.io/assets/img/posts/CV"
posts_dir = "/Users/kylin/GitHub/cskyliner/cskyliner.github.io/_posts"

os.makedirs(dest_img_dir, exist_ok=True)

post_files = [
    "2025-10-28-Structure-from-Motion.md",
    "2025-10-28-Multi-View-Stereo.md",
    "2025-12-14-Image-Generation.md"
]

def replace_image_link(match):
    full_match = match.group(0)
    filename = match.group(1)
    
    # Copy file if exists
    src_img_path = os.path.join(source_attach_dir, filename)
    if os.path.exists(src_img_path):
        dest_img_path = os.path.join(dest_img_dir, filename)
        shutil.copy2(src_img_path, dest_img_path)
        print(f"Copied image: {filename}")
    else:
        print(f"Warning: Image not found - {filename}")
        
    # Return markdown image format
    return f"![{filename}](/assets/img/posts/CV/{filename})"

for post_file in post_files:
    post_path = os.path.join(posts_dir, post_file)
    with open(post_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Match Obsidian image links: ![[filename.ext]] or ![[filename.ext|size]]
    content = re.sub(r'!\[\[(.*?\.(?:png|jpg|jpeg|gif))(?:\|.*?)?\]\]', replace_image_link, content)
    
    with open(post_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Processed images for {post_file}")
