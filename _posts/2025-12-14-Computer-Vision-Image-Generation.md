---
layout: distill
title: "Computer Vision: Image Generation"
date: 2025-12-14 17:26:00
description: "生成模型全景图：自回归模型，VAE，GAN 与扩散模型原理解析"
categories: ["CV", "notes"]
tags: ["CV", "Generative Models", "Deep Learning"]
math: true
author: "Kylin"
giscus_comments: true
toc: true
---

## 无监督学习 (Unsupervised Learning)

- **目标**：给定<mark>无标签数据</mark> $x$，学习数据的底层隐藏结构或者说分布 $P(x)$。比如聚类 clustering，降维 dimensionality reduction，K-mean 就是最为经典的无监督学习
- **生成模型分类**：
  1. **显式密度估计 (Explicit Density)**：直接定义并优化 $p(x)$ (如 Autoregressive)。
  2. **隐式密度估计 (Implicit Density)**：不直接写出 $p(x)$，而是学习生成样本的过程 (如 GAN)。
  3. **近似密度估计**：通过变分下界优化 (如 VAE)。

生成模型与自监督表示学习都能使用无标签数据，但关注点不同：表示学习希望得到适合迁移的特征 $f(x)$，生成模型则希望学习数据分布并采样得到新的 $x\sim p_{data}$，也就是学习生成更符合输入数据的样本。
{% include figure.liquid path="/assets/img/posts/CV/Screenshot-2026-07-21-at-19.41.04.png" class="img-fluid rounded z-depth-1" alt="Screenshot 2026-07-21 at 19.41.04" %}
---

## Autoregressive Models (自回归模型)

### 核心概念

自回归模型将图像生成的概率分布分解为一系列条件概率的乘积。即假设当前像素的值仅依赖于之前的像素。

### 数学表达

利用概率链式法则 (Chain Rule)：

$$
p(x) = p(x_1, x_2, \dots, x_T) = \prod_{t=1}^{T} p(x_t \vert x_1, \dots, x_{t-1})
$$

- **训练目标**：最大化似然函数 (Likelihood)。

训练时所有真实像素都已知，因此可以并行计算每个位置的条件概率，这叫 **teacher forcing**；采样时 $x_t$ 必须等待 $x_{<t}$ 生成完成，所以仍是串行过程。模型还必须人为选择像素或 token 的顺序，这个顺序决定条件依赖怎样展开。

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

**Autoencoder 自编码器**

{% include figure.liquid path="/assets/img/posts/CV/Screenshot-2026-07-22-at-16.17.42.png" class="img-fluid rounded z-depth-1" alt="Screenshot 2026-07-22 at 16.17.42" %}

普通 Autoencoder 只保证训练样本能被重建，但这没有意义，我们更希望模型可以生成不同的、但是符合原输入范式（分布）的样本。但是普通的 AE 因为 z 位于自由训练得到的 latent space，在这个空间中可能存在大片“空洞”，不规则、不连续，在这个 latent space 中随机采样得到的 $z$ 未必能解码为合理图像。而 VAE 的改变就在于同时约束每个样本的后验接近统一先验（高斯分布），使潜在空间连续且可采样。

### 模型架构

VAE 是一种**潜在变量模型 (Latent Variable Model)**。它不直接拟合 $P(x)$，而是引入潜在变量 $z$，通过编码器和解码器学习数据的压缩表示。

1. **Encoder (推断网络)**：$q_\phi(z\vert{}x)$，将输入 $x$ 映射到潜在空间分布（通常预测均值 $\mu$ 和方差 $\sigma$）。
2. **Decoder (生成网络)**：$p_\theta(x\vert{}z)$，从潜在向量 $z$ 还原图像 $x$。、

### 损失函数：ELBO (Evidence Lower Bound)

VAE 无法直接最大化 $\log p(x)$，转而最大化下界 (ELBO)：

$$
L(\theta, \phi; x) = \mathbb{E}_{q_\phi(z\vert{}x)}[\log p_\theta(x\vert{}z)] - D_{KL}(q_\phi(z\vert{}x) \vert\vert p(z))
$$

这个下界来自恒等式：

$$
\log p_\theta(x)
=\operatorname{ELBO}(x)
+D_{KL}\big(q_\phi(z\vert{}x)\Vert{}p_\theta(z\vert{}x)\big).
$$

KL 散度非负，所以最大化 ELBO 等价于一边提高数据似然的下界，一边让近似后验 $q_\phi(z\vert{}x)$ 接近真实后验。

- **第一项 (Reconstruction Loss)**：重构误差，希望生成的图像与原图尽可能相似。
- **第二项 (Regularization)**：KL 散度，强迫潜在分布 $q(z\vert{}x)$ 接近标准正态分布 $\mathcal{N}(0, I)$。

### 关键技巧：重参数化 (Reparameterization Trick)

为了让网络可导（Backpropagation），将随机采样 $z \sim \mathcal{N}(\mu, \sigma^2)$ 改写为：

$$
z = \mu + \sigma \odot \epsilon, \quad \epsilon \sim \mathcal{N}(0, I)
$$

这样随机性转移到了 $\epsilon$ 上，网络参数 $\mu$ 和 $\sigma$ 变得可导。

{% include figure.liquid path="/assets/img/posts/CV/L20-2-vae.png" class="img-fluid rounded z-depth-1" alt="L20-2-vae" width="900" %}

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

{% include figure.liquid path="/assets/img/posts/CV/L20-2-gan.png" class="img-fluid rounded z-depth-1" alt="L20-2-gan" width="900" %}

### 目标函数：Minimax Game (极大极小博弈)

$$
\min_G \max_D V(D,G)
=\mathbb{E}_{x\sim p_{data}}[\log D(x)]
+\mathbb{E}_{z\sim p_z}[\log(1-D(G(z)))]
$$

- **D 的目标**：最大化分辨能力（真图给高分，假图给低分）。
- **G 的目标**：最小化 D 分辨出的概率（让 D 认为 $G(z)$ 是真的）。

原始 minimax generator loss 为 $\mathbb E_z[\log(1-D(G(z)))]$。当判别器很强时，Sigmoid 已接近饱和，generator 梯度可能很小。实践中常改用非饱和目标：

$$
\mathcal L_G=-\mathbb E_z\log D(G(z)),
$$

它与原目标具有相同最优点，但训练早期能提供更强梯度。

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

   - $q(x_t \vert x_{t-1})$：逐步向数据添加高斯噪声。
   - 当步数 $T$ 足够大时，$x_T$ 近似为纯高斯噪声 $\mathcal{N}(0, I)$。
   - 这是一个固定的马尔可夫链 (Markov Chain)，不需要学习参数。

定义 $\alpha_t=1-\beta_t$、$\bar\alpha_t=\prod_{s=1}^{t}\alpha_s$，任意时刻都能从 $x_0$ 直接采样：

$$
q(x_t\mid x_0)
=\mathcal N\left(
\sqrt{\bar\alpha_t}x_0,
(1-\bar\alpha_t)I
\right).
$$

2. **反向过程 (Inverse Process / Denoising)**：

   - $p_\theta(x_{t-1} \vert x_t)$：训练神经网络来模拟反向去噪过程。
   - **目标**：估计每一步加入的噪声，或者直接预测 $x_{t-1}$ 的分布（通常假设也是高斯分布）。

神经网络通常参数化反向高斯分布的均值，写成：

$$
p_\theta(x_{t-1}\mid x_t)
=\mathcal N(\mu_\theta(x_t,t),\Sigma_t).
$$

常见实现不直接预测 $\mu_\theta$，而是预测生成 $x_t$ 时加入的噪声 $\epsilon$，再由已知公式换算反向均值。

### 训练原理

- 利用 $x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1-\bar{\alpha}_t}\epsilon$ 直接采样任意时刻的噪声图像。
- Loss Function：简单的均方误差 (MSE)，比较“真实添加的噪声”和“网络预测的噪声”。

$$
L_{simple} = \mathbb{E}_{t, x_0, \epsilon} [ \Vert \epsilon - \epsilon_\theta(x_t, t) \Vert^2 ]
$$

{% include figure.liquid path="/assets/img/posts/CV/L20-2-diffusion.png" class="img-fluid rounded z-depth-1" alt="L20-2-diffusion" width="900" %}

### Conditional Generation and Guidance

条件生成把文本、类别或其他模态条件 $c$ 输入去噪网络。Classifier-Free Guidance 同时训练有条件与无条件预测，并在采样时组合：

$$
\hat\epsilon
=\epsilon_\theta(x_t,t,\varnothing)
+w\left[
\epsilon_\theta(x_t,t,c)
-\epsilon_\theta(x_t,t,\varnothing)
\right].
$$

$w$ 越大，结果通常越符合条件，但多样性可能下降，过大还会产生失真。

### Latent Diffusion

直接在高分辨率像素空间反复运行 U-Net 成本很高。Latent Diffusion 先用 Autoencoder 把图像压缩到潜空间，在 latent 上扩散，最后解码回像素：

{% include figure.liquid path="/assets/img/posts/CV/L20-2-latent-diffusion.png" class="img-fluid rounded z-depth-1" alt="L20-2-latent-diffusion" width="900" %}

这种设计以少量重建损失换取大幅计算节省。Stable Diffusion 属于这一类，而不是在原始像素上直接扩散。

### 代表模型

- **DDPM (2020)**：奠定基础。
- **DALL·E 2 / Stable Diffusion**：结合 Transformer 或 Latent Space，实现文本到图像生成。

### 总结

- **优点**：生成质量极高（超过 GAN），模式覆盖好（多样性好），训练比 GAN 稳定
- **缺点**：采样（生成）速度慢，因为需要通过数百步迭代去噪（尽管已有加速算法如 DDIM）

---

## 5. Summary (总结与对比)

| **特性**       | **Autoregressive (PixelCNN)** | **VAE (变分自编码器)** | **GAN (生成对抗网络)**   | **Diffusion (扩散模型)** |
| -------------- | ----------------------------- | ---------------------- | ------------------------ | ------------------------ |
| **核心思想**   | 链式法则，逐像素预测          | 压缩编码 + 概率重构    | 两个网络博弈对抗         | 逐步加噪 $\to$ 逐步去噪  |
| **生成质量**   | 较好                          | 一般 (偏模糊)          | **高，但可能模式坍塌**   | **通常很高且覆盖较好**   |
| **生成速度**   | **慢** (串行)                 | **快** (单次前向)      | **快** (单次前向)        | **慢** (多次迭代)        |
| **训练稳定性** | 稳定 (最大似然)               | 稳定 (ELBO)            | **不稳定** (极难调参)    | 稳定                     |
| **密度估计**   | 显式 (Explicit)               | 近似 (Approximate)     | 隐式 (Implicit)          | 近似/显式                |
| **主要缺陷**   | 推理慢                        | 图像模糊               | 模式坍塌 (Mode Collapse) | 计算成本高               |

{% include figure.liquid path="/assets/img/posts/CV/image-77.png" class="img-fluid rounded z-depth-1" alt="image-77" width="797" %}

选择模型时没有绝对赢家：Autoregressive 模型提供清晰似然和稳定训练；VAE 给出结构化潜空间；GAN 推理快且图像锐利；Diffusion 训练稳定、模式覆盖好，但采样需要多步迭代。

## References

- Image Generation
- [CS231n 2025: Generative Models 1 and 2](https://cs231n.stanford.edu/2025/schedule.html)
