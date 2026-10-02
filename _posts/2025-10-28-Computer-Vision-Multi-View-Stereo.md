---
layout: distill
title: "Computer Vision: Multi-View Stereo (MVS)"
date: 2025-10-28 20:00:00
description: "多视角立体视觉技术，从校准图片构建稠密 3D 模型"
categories: ["CV", "notes"]
tags: ["CV", "3D Reconstruction", "MVS"]
math: true
author: "Kylin"
giscus_comments: true
toc: true
---

## Multi-View Stereo

输入经过 Calibrated 的多张图片（保证完整性），输出稠密的 3D 重建模型（Voxel、Mesh、Points Cloud）

Basic Idea：图像间的密集对应关系

## Silhouette-based MVS

### Visual Hull

从多个已标定视角提取物体 Silhouette。每个轮廓在三维空间中对应一个由相机中心向外延伸的 **Visual Cone**，所有 Visual Cone 的交集就是 Visual Hull。

Visual Hull 能稳定恢复物体外轮廓，但无法重建没有出现在任何 Silhouette 上的凹陷结构；轮廓分割误差也会直接影响重建。

### Plane-Sweeping Stereo

在一组候选深度平面上逐层扫描。对每个平面，用相机参数把其他视图 Warp 到参考视图，并计算颜色一致性；一致性最高的平面深度作为该像素的估计。

平面扫描把三维搜索转化为一系列二维 Homography Warp，易于并行，也常用于现代深度网络构造 Cost Volume。

{% include figure.liquid path="/assets/img/posts/CV/image-38.png" class="img-fluid rounded z-depth-1" alt="image-38" width="529" height="262" %}

## Depth Map based MVS

通过轮廓线或者平面扫描，我们通常只能得到粗略结构，因此还需要更精细的深度图进行补全。

我们已知怎么从两张图获得深度图，因此我们两两取对计算深度图，随后融合深度图。不过这时的两两计算应该减少局部约束比如平滑去噪，详情见下图：

{% include figure.liquid path="/assets/img/posts/CV/image-39.png" class="img-fluid rounded z-depth-1" alt="image-39" width="602" height="292" %}

- 当两张图的时候因为视角限制，无法看到部分区域会出现“漏洞”，因此我们进行平滑处理，但是如果我们有多张图，我们可以通过多张图的深度信息进行补全，从而减少平滑处理带来的误差，此时如果提前平滑会丢失一些细节，因此我们应该先计算深度图，随后再进行融合和平滑处理

## Patch-based MVS

之前在 L8 Two-View Stereo 中，我们讨论过逐像素匹配的局限。Patch-based MVS 改用小块区域进行匹配，以利用局部纹理和空间连续性，提高对噪声的鲁棒性。

### What is Patch?

Patch 是图像中的一个小区域，通常是一个矩形或正方形区域，包含多个像素点（类似于卷积），而且同时包含了该区域面的法向量信息。一方面 patch 不至于过大，我们可以用平面 patch 拟合整体曲面，而平面方便操作计算；另一方面 Patch 又包含了范围信息，对像素的连续性加了较强约束。下图展示了从标准 3D 信息中进行 Patch 重建和点重建的区别：

{% include figure.liquid path="/assets/img/posts/CV/image-40.png" class="img-fluid rounded z-depth-1" alt="image-40" %}

### Patch Similarity

Patch-based MVS 方法通过比较不同图像中对应 Patch 的相似性来估计深度信息。那么我们如何定义 Patch 之间的相似性呢？

我们将 N (I, J, p) 定义为：在图像 I 和 J 中，Patch p 的一致性函数。我们首先将 3DPatch 投影到两个图像上，随后计算两个 Patch 之间的颜色差异，定义为：

$$
N(I,J,p)=
\frac{\sum_{k\in\Omega_p}(I_k-\bar I)(J_k-\bar J)}
{\sqrt{\sum_{k\in\Omega_p}(I_k-\bar I)^2}
\sqrt{\sum_{k\in\Omega_p}(J_k-\bar J)^2}}
$$

而 $N(p)$ 为所有可见图像对 $V(p) = \{I_1,...,I_n\}$ 之间的一致性函数的平均值：

$$
N(p)=\frac{2}{n(n-1)}
\sum_{i=1}^{n}\sum_{j=i+1}^{n}N(I_i,I_j,p)
$$

Patch 由三维位置、法向量和可见图像集合共同决定。可以通过优化位置和法向量来最大化多视图一致性，常用思路是 **Coordinate Descent**：每次固定其他变量，只更新一个变量，迭代至收敛。

但更新 V (p) 也很重要，因为随着 Patch 位置和法向量的变化，Patch 可见的图像对也会变化，因此我们需要不断更新 V (p)，从而保证一致性函数的正确性。这个函数不可微分，因此我们通过暴力搜索的方式进行更新。首先计算每张图对其他图的**一致性函数之和**，选择第一个图像作为**参考图像**，随后选择与参考图像一致性函数最大的图像作为第二个图像，依此类推，直到一致性函数小于某个阈值为止。

### Procedure

我们首先通过几张图片进行特征点匹配，获得初始的 sparse 3D points，然后我们通过这些 sparse 3D points 进行 Patch 初始化，随后进行 Patch 优化。

随后我们对 Patch 进行拓展和过滤：

- Patch Extension：我们通过初始 Patch 进行拓展，生成新的 Patch，随后进行优化。具体来说我们选择一个已经优化的 Patch，检查其映射后的邻域，如果邻域内没有 Patch，我们就生成一个新的 Patch（初始化时复制原已优化 Patch），随后进行优化。直到我们无法生成新的 Patch 为止。
- Patch Filtering：我们通过一致性函数对 Patch 进行过滤，去除那些一致性较差的 Patch，从而提高最终重建的质量。还有遮挡的 Patch 也会被去除。

## Neural Radiance Fields (NeRF)

NeRF 是一种神经场表示与可微渲染方法，通过网络表示空间中的体密度和视角相关颜色。它首先用于 Novel View Synthesis，也可从密度场中提取近似几何，但不能简单等同于传统显式 Mesh 重建。

首先 NeRF 是以光线为基础的，我们通过相机参数和像素位置生成光线，随后通过神经网络预测光线上的体积密度和颜色信息，最后通过体积渲染技术合成图像。具体来说，我们设 s 是光线上的某个位置，一束光在该位置的颜色为 $I(s)$，初始颜色为 $I(0)$，然后空间在某一位置的“密度”为 $\tau(s)$ 那么我们有以下公式表示光线经过一段路径抵达 s 产生的衰减（假设这段位移很小，密度相同）：

$$
\frac{dI(s)}{ds} = -\tau(s) I(s)
$$

这是一阶线性微分方程，我们可以通过积分得到光线终点的颜色：

$$
I(s) = I(0) \exp(-\int_{0}^{s} \tau(t) dt)
$$

这里我们考虑物理意义，$\exp(-\int_{0}^{s} \tau(t) dt)$ 可以表示光线在路径上由于介质吸收而衰减的比例。我们表示不透明度为 $\alpha(s) = 1 -\exp(-\int_{0}^{s} \tau(t) dt)$，那么我们有：

$$
I(s) = I(0) (1 - \alpha(s))
$$

这样我们获得了在通过一段已知密度介质中的光线颜色。随后我们将整段光线分割成多个小段，我们可以获得最后的颜色为：

$$
I(L) = \sum_{i=1}^{N} \prod_{j=1}^{i-1} (1 - \alpha_j) c_i \alpha_i
$$

- 理解为：每一小段的颜色 $c_i$ 乘以该段的不透明度 $\alpha_i$，再乘以前面所有段的透射率 $T_i=\prod_{j=1}^{i-1}(1-\alpha_j)$，最后对所有小段求和。

随后通过神经网络预测密度 $\tau(s)$ 和颜色 $c(s,d)$。标准 NeRF 中密度主要由位置决定，颜色还依赖观察方向：

$$
(\tau(s),c(s,d))=\operatorname{MLP}(s,d)
$$

## Gaussian Splatting

3D Gaussian Splatting 使用一组带位置、各向异性协方差、透明度和视角相关颜色的三维高斯表示场景。渲染时将高斯投影并 Splat 到图像平面，避免像 NeRF 那样沿每条射线密集查询 MLP，因此通常具有更高的实时渲染效率。它与 NeRF 的表示差异可回顾 Neural Implicit Representations。
