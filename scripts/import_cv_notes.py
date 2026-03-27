import os
import re
from datetime import datetime

source_dir = "/Users/kylin/Documents/Study Notes/CV"
dest_dir = "/Users/kylin/GitHub/cskyliner/cskyliner.github.io/_posts"

notes = [
    {
        "filename": "L9 Structure from Motion(SFM).md",
        "date": "2025-10-28 17:30:00",
        "title": "计算机视觉-Structure from Motion (SFM)",
        "description": "深入解析运动恢复结构 (SFM) 算法，探讨相机标定与三维点云重建原理",
        "dest_name": "2025-10-28-Structure-from-Motion.md",
        "tags": "['CV', '3D Reconstruction', 'SFM']"
    },
    {
        "filename": "L10 Multi-View Stereo(MVS).md",
        "date": "2025-10-28 20:00:00",
        "title": "计算机视觉-Multi-View Stereo (MVS)",
        "description": "多视角立体视觉技术，从校准图片构建稠密 3D 模型",
        "dest_name": "2025-10-28-Multi-View-Stereo.md",
        "tags": "['CV', '3D Reconstruction', 'MVS']"
    },
    {
        "filename": "L20 Image Generation.md",
        "date": "2025-12-14 17:26:00",
        "title": "计算机视觉-图像生成模型",
        "description": "生成模型全景图：自回归模型，VAE，GAN与扩散模型原理解析",
        "dest_name": "2025-12-14-Image-Generation.md",
        "tags": "['CV', 'Generative Models', 'Deep Learning']"
    }
]

for note in notes:
    src_path = os.path.join(source_dir, note["filename"])
    dest_path = os.path.join(dest_dir, note["dest_name"])
    
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Strip the original frontmatter and obsidian tags
    content = re.sub(r'^---.*?---\n+', '', content, flags=re.DOTALL)
    content = re.sub(r'\[\[CV\]\]\n+', '', content)
    
    frontmatter = f"""---
layout: distill
title: {note['title']}
date: {note['date']}
description: {note['description']}
categories: [CV, notes]
tags: {note['tags']}
math: true
mermaid: true
author: Kylin
giscus_comments: true
toc:
  - name: 概览
---
"""
    
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(frontmatter + content)
        
    print(f"Exported {note['dest_name']}")
