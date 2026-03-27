---
layout: distill
title: 计算机视觉-图像生成模型
date: 2025-12-14 17:26:00
description: 生成模型全景图：自回归模型，VAE，GAN与扩散模型原理解析
categories: [CV, notes]
tags: ['CV', 'Generative Models', 'Deep Learning']
math: true
mermaid: true
author: Kylin
giscus_comments: true
toc:
  - name: 概览
---
## 背景知识：无监督学习 (Unsupervised Learning)

- **目标**：给定无标签数据 $x$，学习数据的底层隐藏结构或概率分布 $P(x)$。
- **生成模型分类**：
    1. **显式密度估计 (Explicit Density)**：直接定义并优化 $p(x)$ (如 Autoregressive)。
    2. **隐式密度估计 (Implicit Density)**：不直接写出 $p(x)$，而是学习生成样本的过程 (如 GAN)。
    3. **近似密度估计**：通过变分下界优化 (如 VAE)。

---

## Autoregressive Models (自回归模型)

### 核心概念

自回归模型将图像生成的概率分布分解为一系列条件概率的乘积。即假设当前像素的值仅依赖于之前的像素。

### 数学表达

利用概率链式法则 (Chain Rule)：

$$p(x) = p(x_1, x_2, \dots, x_T) = \prod_{t=1}^{T} p(x_t | x_1, \dots, x_{t-1})$$

- **训练目标**：最大化似然函数 (Likelihood)。

### 典型模型

1. **PixelRNN**：利用 LSTM 逐个像素生成。
    - _缺点_：也就是生成的顺序是串行的，速度非常慢。
2. **PixelCNN**：利用**掩膜卷积 (Masked Convolution)**。
    - _特点_：使用标准的卷积神经网络，但通过 Mask 确保预测像素 $x_i$ 时只看到它之前的像素。
    - _优势_：训练可以并行化（因为训练时已知所有 Ground Truth）。
    - _缺点_：生成（推理）时仍然必须串行，速度慢。

### 总结

- **优点**：显式密度估计，似然值 (Likelihood) 高，训练稳定。
- **缺点**：生成速度极慢（Sequential generation），难以应用于实时场景。

---

## Variational Autoencoder (VAE, 变分自编码器)

### 核心概念

VAE 是一种**潜在变量模型 (Latent Variable Model)**。它不直接拟合 $P(x)$，而是引入潜在变量 $z$，通过编码器和解码器学习数据的压缩表示。

### 模型架构

1. **Encoder (推断网络)**：$q_\phi(z|x)$，将输入 $x$ 映射到潜在空间分布（通常预测均值 $\mu$ 和方差 $\sigma$）。
2. **Decoder (生成网络)**：$p_\theta(x|z)$，从潜在向量 $z$ 还原图像 $x$。

### 损失函数：ELBO (Evidence Lower Bound)

VAE 无法直接最大化 $\log p(x)$，转而最大化下界 (ELBO)：

$$L(\theta, \phi; x) = \mathbb{E}_{q_\phi(z|x)}[\log p_\theta(x|z)] - D_{KL}(q_\phi(z|x) || p(z))$$

- **第一项 (Reconstruction Loss)**：重构误差，希望生成的图像与原图尽可能相似。
- **第二项 (Regularization)**：KL 散度，强迫潜在分布 $q(z|x)$ 接近标准正态分布 $\mathcal{N}(0, I)$。

### 关键技巧：重参数化 (Reparameterization Trick)

为了让网络可导（Backpropagation），将随机采样 $z \sim \mathcal{N}(\mu, \sigma^2)$ 改写为：

$$
z = \mu + \sigma \odot \epsilon, \quad \epsilon \sim \mathcal{N}(0, I)
$$

这样随机性转移到了 $\epsilon$ 上，网络参数 $\mu$ 和 $\sigma$ 变得可导。

### 总结

- **优点**：理论完备，训练速度快，允许进行流形插值 (Manifold interpolation)。
- **缺点**：生成的图像通常比较**模糊 (Blurry)**，不如 GAN 清晰（因为使用 MSE 损失倾向于取平均）。

---

## Generative Adversarial Network (GAN, 生成对抗网络)

### 核心概念

基于博弈论 (Game Theory)，由两个网络进行对抗训练。不显式建模 $P(x)$，而是学习一种从随机噪声映射到数据分布的变换。

### 模型架构

- **Generator (G)**：输入随机噪声 $z$，生成假图像 $G(z)$。目标是欺骗 D。
- **Discriminator (D)**：输入图像，判断是真实数据 (Real) 还是生成数据 (Fake)。

### 目标函数：Minimax Game (极大极小博弈)

$$\min_G \max_D V(D, G) = \mathbb{E}_{x \sim p_{data}}[\log D(x)] + \mathbb{E}_{z \sim p_{z}}[\log(1 - D(G(z)))]$$

- **D 的目标**：最大化分辨能力（真图给高分，假图给低分）。
- **G 的目标**：最小化 D 分辨出的概率（让 D 认为 $G(z)$ 是真的）。

### 常见问题

1. **训练不稳定**：很难达到纳什均衡 (Nash Equilibrium)。
2. **模式坍塌 (Mode Collapse)**：G 发现一种能够骗过 D 的模式后，反复生成这一种图片，失去了多样性。
3. **梯度消失**：如果 D 太强，G 可能会因为梯度消失而无法学习。

### 总结

- **优点**：生成的图像极其**清晰锐利**，视觉效果好。
- **缺点**：训练极其困难，不稳定，缺乏显式的概率密度解释。

---

## Diffusion Models (扩散模型)

### 核心概念

受非平衡热力学启发。通过定义一个逐步加噪的前向过程，并学习一个去噪的反向过程来生成图像。

### 两个过程

1. **前向过程 (Forward Process / Diffusion)**：
    
    - $q(x_t | x_{t-1})$：逐步向数据添加高斯噪声。
    - 当步数 $T$ 足够大时，$x_T$ 近似为纯高斯噪声 $\mathcal{N}(0, I)$。
    - 这是一个固定的马尔可夫链 (Markov Chain)，不需要学习参数。
        
2. **反向过程 (Inverse Process / Denoising)**：
    
    - $p_\theta(x_{t-1} | x_t)$：训练神经网络来模拟反向去噪过程。
    - **目标**：估计每一步加入的噪声，或者直接预测 $x_{t-1}$ 的分布（通常假设也是高斯分布）。

### 训练原理

- 利用 $x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1-\bar{\alpha}_t}\epsilon$ 直接采样任意时刻的噪声图像。
- Loss Function：简单的均方误差 (MSE)，比较“真实添加的噪声”和“网络预测的噪声”。

$$
L_{simple} = \mathbb{E}_{t, x_0, \epsilon} [ \| \epsilon - \epsilon_\theta(x_t, t) \|^2 ]
$$

### 代表模型

- **DDPM (2020)**：奠定基础。
- **DALL·E 2 / Stable Diffusion**：结合 Transformer 或 Latent Space，实现文本到图像生成。

### 总结

- **优点**：生成质量极高（超过 GAN），模式覆盖好（多样性好），训练比 GAN 稳定
- **缺点**：采样（生成）速度慢，因为需要通过数百步迭代去噪（尽管已有加速算法如 DDIM）

---

## 5. Summary (总结与对比)

| **特性**    | **Autoregressive (PixelCNN)** | **VAE (变分自编码器)** | **GAN (生成对抗网络)**     | **Diffusion (扩散模型)** |
| --------- | ----------------------------- | ---------------- | -------------------- | -------------------- |
| **核心思想**  | 链式法则，逐像素预测                    | 压缩编码 + 概率重构      | 两个网络博弈对抗             | 逐步加噪 $\to$ 逐步去噪      |
| **生成质量**  | 较好                            | 一般 (偏模糊)         | **优 (清晰锐利)**         | **最优 (SOTA)**        |
| **生成速度**  | **慢** (串行)                    | **快** (单次前向)     | **快** (单次前向)         | **慢** (多次迭代)         |
| **训练稳定性** | 稳定 (最大似然)                     | 稳定 (ELBO)        | **不稳定** (极难调参)       | 稳定                   |
| **密度估计**  | 显式 (Explicit)                 | 近似 (Approximate) | 隐式 (Implicit)        | 近似/显式                |
| **主要缺陷**  | 推理慢                           | 图像模糊             | 模式坍塌 (Mode Collapse) | 计算成本高                |

![image-77.png](/assets/img/posts/CV/image-77.png)