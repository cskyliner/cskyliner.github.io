---
layout: distill
title: "Computer Vision: Structure from Motion (SFM)"
date: 2025-10-28 17:30:00
description: "深入解析运动恢复结构 (SFM) 算法，探讨相机标定与三维点云重建原理"
categories: ["CV", "notes"]
tags: ["CV", "3D Reconstruction", "SFM"]
math: true
author: "Kylin"
giscus_comments: true
toc: true
---

## Structure from Motion

|      | Calibration               | Triangulation                                | Structure from Motion           |
| ---- | ------------------------- | -------------------------------------------- | ------------------------------- |
| 输入 | Point pairs from 3D to 2D | camera parameters, point pairs from 2D to 2D | point pairs from 2D to 2D       |
| 输出 | camera parameters         | 3D points                                    | 3D points and camera parameters |

### The Ambiguity of Structure from Motion

SfM 的重建结果存在坐标规范歧义，并不是绝对唯一。假设 $(P,X)$ 满足投影关系：

$$
PX = x \Rightarrow P H^{-1} H X = x
$$

可见我们只要调整 H 变换，可以得到不同的解 $(P H^{-1}, H X)$。根据矩阵 $H$ 的不同性质，我们可以将这种模糊性分为三种类型：

#### Projective Ambiguity

#### Affine Ambiguity

#### Similar Ambiguity

### Affine Structure from Motion

基于基本的相机模型，我们介绍经典的 SFM 方法——**Affine Structure from Motion**。该方法假设相机采用仿射投影模型，并且通过多张图像中的对应点来恢复三维结构和相机运动。

为简化求解，先采用**仿射/弱透视相机模型**（Affine or Weak-Perspective Camera），近似认为投影线彼此平行，忽略明显的透视缩放变化。

这里区分两种常用近似：**正交投影** 和带整体尺度、平移的**弱透视投影**。

**正交投影** 假设相机远离物体，投影线与图像平面垂直，这种情况下投影矩阵可以表示为：

$$
P = \begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

**弱透视投影** 用场景平均深度产生一个整体尺度 $s\approx f/\bar Z$，但仍不描述物体内部随深度变化的透视缩放。其形式可写为：

$$
P = \begin{bmatrix}
f & 0 & 0 & 0 \\
0 & f & 0 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

而在 Affine Camera 中，我们采用简化的正交投影模型，加上相机本身的参数矩阵，我们就得到了简化相机模型：

{% include figure.liquid path="/assets/img/posts/CV/image-34.png" class="img-fluid rounded z-depth-1" alt="image-34" %}

- 其中二维和三维仿射变换分别位于正交投影两侧。非齐次形式为 $x=AX+t$，$A\in\mathbb{R}^{2\times3}$。在正交/弱透视相机中，$A$ 的两行互相正交且具有相同范数（弱透视时该范数为尺度），这一度量约束将在分解后用于消除仿射歧义。

接下来我们介绍如何通过多张图像中的对应点来恢复三维结构和相机运动。假设我们有 $m$ 张图像，每张图像中有 $n$ 个对应点，我们列出投影关系：

$$
x_{ij} = P_i X_j + t_i \quad i=1,2,\ldots,m \quad j=1,2,\ldots,n
$$

但是这里面依然有奇异性问题，如果我们对 P 乘上**仿射矩阵**（最后一行是 0001） H 的逆，对 X 乘上 H，同样满足投影关系，也就是还有 12 个奇异性：

$$
x_{ij} = P_i H^{-1} H X_j + t_i
$$

接着分析自由度。系统包含 $m$ 个相机矩阵与平移、$n$ 个三维点，并存在 12 自由度的整体仿射坐标变换歧义：

$$
\text{自由度} = m \cdot 8 + n \cdot 3 - 12
$$

而已知的投影点有：

$$
\text{已知量} = m \cdot n \cdot 2
$$

所以我们需要满足：

$$
m \cdot n \cdot 2 \ge m \cdot 8 + n \cdot 3 - 12
$$

T 这个偏置项看起来很别扭不是吗？我们可以通过**中心化**（centering）来简化问题。也就是将所有点的质心移动到原点，这样我们就可以消除 t 的影响，从而减少自由度：

$$
\hat{x}_{ij}=x_{ij}-\frac{1}{n}\sum_{k=1}^{n}x_{ik}
=A_i\left(X_j-\frac{1}{n}\sum_{k=1}^{n}X_k\right)
=A_i\hat X_j
$$

这里只需要人手动中心化 2D 的已知坐标，3D 坐标我们本来就是待求的，可以直接将质心设为原点(也就是最后一步去掉 hat 的原因)。这样我们就消除了 t 的影响，自由度变为：

$$
\text{自由度} = m \cdot 8 + n \cdot 3 - 12 - 3\cdot m = m \cdot 5 + n \cdot 3 - 12
$$

对系统分析后我们得到了最终方程，接着展开矩阵形式，看一看怎么**求解**：

{% include figure.liquid path="/assets/img/posts/CV/image-35.png" class="img-fluid rounded z-depth-1" alt="image-35" %}

我们发现 M 和 S 的形状分别是 $2m \times 3$ 和 $3 \times n$ 的矩阵，而 D 是 $2m \times n$ 的矩阵。在线性代数中，我们知道一个矩阵的秩（rank）是其线性无关行或列的最大数量。对于矩阵 D 来说，由于它是由矩阵 M 和 S 的乘积得到的，因此 D 的秩受到 M 和 S 秩的限制。具体来说，矩阵 D 的秩不能超过矩阵 M 和 S 中较小的那个的秩。因此，我们可以得出结论：

$$
\text{rank}(D) \leq \min(\text{rank}(M), \text{rank}(S)) \leq 3
$$

这意味着矩阵 D 的秩最多为 3。从一个大矩阵分解为两个小矩阵从而实现方程求解是一个老生常谈的话题，我们可以使用**奇异值分解**（Singular Value Decomposition, SVD）来实现这个分解过程。通过 SVD，我们可以将矩阵 D 分解为三个矩阵的乘积：

$$
D = U \Sigma V^T
$$

其中，U 和 V 是正交矩阵，Σ 是一个对角矩阵，其对角线上的元素称为奇异值。因为存在误差，Σ 不一定只有前三个奇异值非零，通过截断 Σ，只保留前三个最大的奇异值，来近似地重构矩阵 D：

$$
D \approx U_3 \Sigma_3 V_3^T
$$

这样，我们就可以通过 SVD 分解得到矩阵 M 和 S 的估计值：

$$
M = U_3 \Sigma_3^{1/2} \qquad

S = \Sigma_3^{1/2} V_3^T
$$

{% include figure.liquid path="/assets/img/posts/CV/image-20.png" class="img-fluid rounded z-depth-1" alt="image-20" %}

但分解仍不唯一：对任意可逆 $3\times3$ 矩阵 $H$，$MH$ 与 $H^{-1}S$ 的乘积仍是 $D$。这留下 9 自由度的线性变换歧义，需要用正交/弱透视相机的行正交与等范数约束完成 **Metric Upgrade**。

$$
(A_iH)(A_iH)^T = A_i H H^T A_i^T = I
$$

这个约束是很强的，但是并非线性不好解，我们先定 $N = HH^T$

$$
A_i N A_i^T = I
$$

这是一个线性方程，我们可以解出 N，然后通过 [**Cholesky 分解**](https://mathweb.ucsd.edu/~mlicht/wina2021/pdf/lecture07_cholesky.pdf)（Cholesky Decomposition）来求解 H：

$$
N = HH^T
$$

#### Dealing with Missing Data

在实际应用中，我们经常会遇到数据缺失的情况，比如某些图像中的某些点没有被正确匹配到对应的三维点。为了处理这些缺失的数据，我们可以采用下面这个方法，寻找一个最佳的稠密矩阵为起点，然后通过迭代的方法来完善缺失的数据。

{% include figure.liquid path="/assets/img/posts/CV/image-36.png" class="img-fluid rounded z-depth-1" alt="image-36" %}

### Projective Structure from Motion

从正交映射的仿射矩阵改为透视投影矩阵，我们就得到了**Projection Structure from Motion**。这种方法更符合实际的相机模型，可以更准确地恢复三维结构和相机运动。但随之而来的就是更多的自由度和更复杂的计算过程。

#### Bundle Adjustment

系统通常会有误差，我们可以通过**Bundle Adjustment** 来优化结果。Bundle Adjustment 是一种非线性优化技术，**旨在同时优化相机参数和三维点的位置**，以最小化投影误差。具体来说，我们定义一个目标函数，表示所有图像中投影点与实际观测点之间的误差平方和：

$$
J = \sum_{i=1}^{m} \sum_{j=1}^{n} w_{ij}\| x_{ij} - \hat{x}_{ij} \|^2
$$

- $\hat{x_{ij}} = proj(P_{i}X_{j})$, $w_{ij}$ 表示观测权重（如果点 $j$ 在图像 $i$ 中可见，则 $w_{ij}=1$，否则为 0）。

{% include figure.liquid path="/assets/img/posts/CV/image-37.png" class="img-fluid rounded z-depth-1" alt="image-37" %}

#### Self-Calibration

如果相机内参未知，我们可以通过**Self-Calibration** 来估计相机内参。Self-Calibration 利用多张图像中的对应点，通过分析投影矩阵的性质，来恢复相机的内参矩阵。

## Incremental Structure from Motion

增量式 SfM 从少量图像开始，恢复初始三维结构和相机姿态，再逐步加入新图像。对已具有三维位置的匹配点，使用 **PnP + RANSAC** 估计新相机位姿；对尚未重建的匹配轨迹，再通过 **Triangulation** 增加三维点。

但是增量式的方法容易受到误差的累积影响，因此在每次加入新的图像后，我们通常会使用 Bundle Adjustment 来优化整个系统的参数，从而减少误差的影响。

### Dealing with Repetition and symmetry

重复纹理和对称结构容易产生几何上一致但语义错误的匹配。除了 Descriptor Ratio Test 和双向匹配，还需要用极几何、Track Consistency、共可见关系与 RANSAC 联合过滤；否则少量系统性错配可能把相机位姿带入错误局部解。

## Conclusion

我们到现在基本实现了从多个 2D 图像重建 3D 结构的流程，首先利用 Feature Detection 识别 2D 特征，随后通过 Feature Matching 获得多张图像中的对应点，接着使用 Epipolar Geometry 和 RANSAC 计算 Fundamental Matrix，然后利用上面的 Incremental Structure from Motion 方法恢复三维结构和相机运动，最后通过 Bundle Adjustment 优化结果。这个流程是 3D 视觉的核心基础，后续的多视图几何、立体视觉等内容均基于此进行扩展。
