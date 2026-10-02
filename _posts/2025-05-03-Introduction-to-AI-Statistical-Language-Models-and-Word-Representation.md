---
layout: distill
title: "Introduction to AI: Statistical Language Models and Word Representation"
date: 2025-05-03 10:00:00
description: "统计语言模型与词表示方法，包括朴素贝叶斯、tf-idf、word2vec 等"
categories: ["AIIntro", "notes"]
tags: ["NLP"]
math: true
author: "Ruolin Zuo"
giscus_comments: true
toc: true
---

## 朴素贝叶斯模型

**贝叶斯公式**：

$$
P(B_i\mid A) = \frac{P(A\mid B_i)P(B_i)}{\sum_{j=1}^{n} P(B_j)P(A\mid B_j)}
$$

- $P(B_i \mid \boldsymbol{A})$：后验概率（在观察到特征后样本属于类Bi的概率）

* $P(\boldsymbol{A} \mid B_i)$：似然（在给定类别Bi的条件下，观察到特征$\boldsymbol{A}$的概率）

- $P(B_i)$：先验概率（样本属于类Bi的概率）
- $P(\boldsymbol{A})$：证据（所有类别下观察到特征$\boldsymbol{A}$的总体概率）

由$A$的发生修改$B_i$ 发生的概率，执果求因。

**“朴素”**：假设总特征中的**所有特征**在**给定类别**的条件下**相互独立**，即：

$$
P(\boldsymbol{A} \mid B_i) = \prod_{j=1}^{n} P(A_j \mid B_i)
$$

**核心**(由相互独立与贝叶斯公式可以知道)：

$$
P(B_i \mid \boldsymbol{A}) \propto P(B_i) \cdot \prod_{j=1}^{n} P(A_j \mid B_i)
$$

以文本情感分类为例，朴素想法即为求出每个词在指定类别样本语句中发生的概率——比如正向情感样本中出现"love"的比例作为$P\left(\text{"love"}\mid postive\right)$——连乘然后归一化。

问题在于，一旦其中某个情况在样本中概率为零，整个预测将突变为零，造成失衡，因此需要使用某种手段进行“光滑”。

**加法光滑**：给统计得到的每种样本数量加上一个固定值$\alpha$，因为这相当于每个词都多加了$\alpha$，所以要在分母补足$\text{词汇类别数} \times \alpha$

$$
P("loved"\mid postive) = \frac{包含"loved"的正面样本数量+\alpha}{正面样本总数量+词汇类别数 \times \alpha}
$$

**拉普拉斯光滑**：加法光滑的特例，令$\alpha = 1$

## 信息检索:tf-idf

**tf:词频**

$tf = {n/N}$或 $tf = \log_{10}{(n/N + 1)}$

n： 某个词在文档中出现的次数

N：文档中所有词出现的次数之和（也就是词总数，包括重复）

**idf:逆文档频率**

衡量某个词在语料库的所有文档中的罕见程度

$$
idf = \log_{10}(\frac{D}{1+d})
$$

$D$：语料库中包含的文档总数量

$d$：语料库中出现某个词的文档数量

**tf-idf**:

$$
tfidf = tf \times idf
$$

用tf-idf值可以弱化常见词，保留重要的词。若某个词在某个文档中是高 频词，在整个语料中又是低频出现，那么这个词将具有高tf-idf值，它对 这篇文档来说，就是关键词，或主题词。

## 词袋模型(BoW)

1. 数据收集
2. 字典构建
3. 构建特征向量，字典中词的出现次数

缺点：仅统计词频，无次序信息；字典可能极大；文本向量稀疏；关键词的重要性未体现

## 词表示

如何将词变为向量，将文本转化为数值特征进行机器学习：

### 独热表示

表示方法：

- 向量的维度等于字典的大小 V
- 对于字典中的每一个词，只在其对应位置上取值为 1，其他位置为 0

问题1：字典若很大，则词向量很长很稀疏

问题2：仅将词符号化，不包含任何语义信息，没有考虑词间的相关性

### 分布式表示

理论基础：

上下文相似的词，其语义也相似。词的语义由其上下文决定，而不是人为标注，同时考虑了词间相关性，这是其优势所在。

核心思想：

- 选择一种方式描述上下文 /中心词
- 选择一种模型刻画中心词与其上下文之间的关系
- 进而训练该模型，通过输入词的描述来完成预测任务（上下文 ↔ 词）

#### word2vec（基于学习）

##### CBOW模型：

输入上下文预测中心词

$$
\text{context words} \rightarrow \text{center word}
$$

1. 当前词的上下文词语的one-hot编码 $\text{shape} = 1\times\vert{}V\vert$ 输入到输入层(例如当前词的前后两个词)
2. 这些词向量分别乘以同一个矩阵 $\boldsymbol{W} \in \mathbb{R}^{\vert{}V\vert \times d}$（周围词向量矩阵）后分别得到各自的 $1\times d$ 向量
3. 将这 $\vert{}V\vert$ 个 $1\times d$ 向量取平均（avg-Pooling）为一个 $1\times d$ 向量（这就是嵌入向量）
4. 将这个 $1\times d$ 向量乘矩阵 $\boldsymbol{W}' \in \mathbb{R}^{d \times \vert{}V\vert}$ (中心词向量矩阵)，变成一个 $1\times\vert{}V\vert$ 向量
5. 做Softmax分类，与真实标签 one-hot $1\times\vert{}V\vert$ 向量计算交叉熵损失
6. 每次前向传播之后反向传播误差，调整矩阵 $\boldsymbol{W}$ 和 $\boldsymbol{W}'$ 的值
7. 最后学习到的模型就是通过输入上下文转化为one-hot 向量输入，最后输出预测向量进而预测中心词，即通过上下文推断中心词

##### Skip-Gram模型

与CBOW模型对偶，输入中心词预测上下文。

$$
\text{center word} \rightarrow \text{context words}
$$

1. 把中心词转成 one-hot 向量。假设中心词是 $w_t$，它的 one-hot 表示为：$x_t \in \mathbb{R}^{1 \times \vert{}V\vert}$
2. 乘以输入矩阵 $W$，得到中心词的**embedding** $h = x_t W$ 。其中 $W \in \mathbb{R}^{\vert{}V\vert \times d}$ 。因此 $h \in \mathbb{R}^{1 \times d}$ 。由于 $x_t$ 是 one-hot，乘以 W 的效果其实就是“取出 W 中对应中心词的那一行”。也就是说：$h = v_{w_t}$.这里 $v_{w_t}$ 就是中心词 $w_t$ 的输入侧词向量。
3. 用这个中心词向量去预测上下文词。乘输出矩阵：$u = h W'$ 其中 $W' \in \mathbb{R}^{d \times \vert{}V\vert}$.所以 $u \in \mathbb{R}^{1 \times \vert{}V\vert}$.这里的 u 是每个词作为上下文词的 score/logit。
4. 对 u 做 softmax $p(w_o \mid w_t) = \frac{\exp(u_{w_o})}{\sum_{j=1}^{\vert{}V\vert} \exp(u_j)}$.这里 $w_o$ 是某一个上下文词，$w_t$ 是中心词。意思是：$\text{给定中心词 } w_t \text{，上下文词是 } w_o \text{ 的概率}$
5. 用真实上下文词作为标签，计算交叉熵损失。如果中心词是 `sits`，上下文词之一是 `cat`，那么模型要最大化：$p(\text{cat} \mid \text{sits})$.对应损失是：$-\log p(\text{cat} \mid \text{sits})$ .对于一个中心词对应多个上下文词时，总损失可以写成：$\mathcal{L} = -\sum_{-c \leq j \leq c, j \neq 0} \log p(w_{t+j} \mid w_t)$.其中 c 是窗口大小，$w_t$是中心词，$w_{t+j}$ 是窗口内的上下文词。
