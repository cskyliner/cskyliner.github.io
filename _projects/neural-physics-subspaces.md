---
layout: page
title: "Neural Physics Subspaces"
description: 基于 XMAKE + Imgui + OpenGL + pybind11 的神经物理子空间研究项目，复现论文 neural-physics-subspaces
github: https://github.com/cskyliner/neural-physics-subspaces
arxiv: https://arxiv.org/abs/2305.03846
redirect: https://github.com/cskyliner/neural-physics-subspaces
importance: 1
category: coursework
tags:
  - C++
  - Python
  - JAX
  - OpenGL
  - Scientific Computing
---

## Overview

A neural physics subspaces project that reproduces the paper _"Neural Physics Subspaces"_ using a modern C++/Python hybrid architecture. The system combines physical simulation with learned subspaces for efficient dynamics computation.

## Tech Stack

- **XMAKE** — Build system configuration
- **Imgui** — GUI and interactive visualization
- **OpenGL** — 3D rendering engine
- **pybind11** — C++ / Python interoperability
- **JAX** — Automatic differentiation and deep learning

## Architecture

The project integrates C++ for performance-critical rendering and simulation with Python for neural network training. The workflow: XMAKE compiles the C++ core → Imgui handles interaction → OpenGL renders the visualization → pybind11 bridges Python training results.

## Publications

Related paper: [Neural Physics Subspaces (arXiv:2305.03846)](https://arxiv.org/abs/2305.03846)

Pre-trained models are available on the [GitHub Releases](https://github.com/cskyliner/neural-physics-subspaces/releases/tag/v1.0-model) page.
