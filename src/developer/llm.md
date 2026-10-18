---
title: "大模型 / 推理与微调 高频问题整理"
permalink: "developer/llm.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "llm"
---
## 大模型推理和训练有什么区别？ {#inference-vs-training}

### 面试快答

训练通过前向、损失与反向传播更新权重；推理使用已有权重处理输入并生成输出。训练关注优化与显存中的梯度/优化器状态，推理关注延迟、吞吐和缓存。

### 详细解析

推理同样有 Prefill 和 Decode 的计算与显存成本，模型文件大小不等于完整运行显存。部署容量要加上 KV Cache、批次、临时张量和运行框架预留。

#### 核心对比

| 对比项 | 训练 | 推理 |
| --- | --- | --- |
| 目标 | 最小化 loss，更新权重 | 给定输入，生成输出 Token |
| 计算 | 前向 + 反向传播 + 梯度更新 | 仅前向传播 |
| 显存 | 权重 + 梯度 + 优化器状态（约为推理 3~4 倍） | 权重 + KV Cache + 激活 |
| 精度 | 通常 FP32/BF16 + 混合精度 | FP16/BF16/INT8/INT4 量化常见 |
| 并行 | Data / Tensor / Pipeline / ZeRO | Tensor / Pipeline Parallel，侧重 batch 调度 |
| 优化指标 | 收敛速度、loss、泛化 | 延迟（TTFT/TPOT）、吞吐（TPS）、成本 |



推理只做前向、逐 Token 自回归生成，瓶颈在 Attention 和 KV Cache，追求低延迟和高吞吐。

## Prefill、Decode 和 PD 分离是什么？ {#prefill-decode}

### 面试快答

Prefill 处理输入 Token 并构建 KV Cache，Decode 利用已有状态逐步生成新 Token。前者通常更偏计算密集，后者常受显存带宽与调度影响。

### 详细解析

PD 分离可以独立优化两阶段资源，但会增加 KV 传输、调度和故障处理成本。按 TTFT、单 Token 延迟、吞吐和长短请求混合负载评估，而非只看总 QPS。

#### Prefill vs Decode

| 阶段 | 输入 | 计算特点 | 瓶颈 | 资源偏好 |
| --- | --- | --- | --- | --- |
| **Prefill** | 完整 prompt（可能很长） | 所有 token 并行计算，计算密集（compute-bound） | 矩阵乘法 FLOPs | 高算力 GPU（A100/H100） |
| **Decode** | 每次仅 1 个新 token | 读取全部历史 KV Cache，访存密集（memory-bound） | 显存带宽、KV Cache 大小 | 大显存、高带宽 GPU |

```text
Prefill:  prompt=[t1, t2, ..., tn]  → 一次前向，输出 logits + 建立 KV Cache
Decode:   每步输入=[t_new]           → 读历史 KV，算新 token logits，追加 KV
```

-   长 prompt → TTFT 高（Prefill 慢）；长输出 → TPOT 累积明显（Decode 步数多）。
-   Prefill 优化：FlashAttention、算子融合；Decode 优化：PagedAttention、KV 量化、Continuous Batching。

#### PD 分离（Prefill / Decode 分离部署）

将 Prefill 节点和 Decode 节点**独立部署、独立扩缩容**，避免长 Prefill 阻塞 Decode 请求（拖高 TPOT），也避免短 Decode 浪费 Prefill 算力。

```text
请求 → Prefill 节点（处理 prompt，生成 KV Cache）
     → 传输 KV Cache → Decode 节点（逐 token 生成）
     → 返回结果
```

#### 分离的收益与挑战

| 收益 | 挑战 |
| --- | --- |
| Prefill / Decode 各用最适合的 GPU 类型 | KV Cache 跨节点传输有网络开销 |
| 独立扩缩容，提升整体吞吐 | 全局调度与请求路由复杂度增加 |
| 减少两阶段互相排队干扰 | 需保证 KV 格式兼容与传输延迟可控 |

代表方案：**Mooncake**、**DistServe**、NVIDIA NIM 等。

## Attention 机制是什么？ {#attention-mechanism}

### 面试快答

Attention 用 Query 与 Key 的相关性对 Value 加权，使当前位置能利用上下文。标准全注意力的交互规模随序列长度近似平方增长，但具体内存与实现成本受优化方式影响。

### 详细解析

FlashAttention 等优化减少中间结果的显存读写，不等于把标准全注意力所有计算都变成线性。推理 Decode 复用 KV，与一次性处理完整序列的成本模型不同。

#### 运算含义

标准缩放点积注意力计算 softmax(QKᵀ / √d) V，多头注意力在不同表示子空间中组合上下文。因果掩码限制解码器位置看到后续 Token。

#### 复杂度

长度为 n 的全注意力包含成对交互，其计算随 n 近似平方增长；朴素实现可能显式保存 n×n 中间矩阵。FlashAttention 等方法通过分块与重计算减少显存读写和中间存储，并非把标准全注意力计算统一变为线性。

#### 推理区别

Prefill 一次处理输入，Decode 使用 KV Cache 为新 Token 查询历史状态。讨论成本必须说明是完整序列还是单步生成，也要区分计算量、内存占用和带宽瓶颈。

## 什么是 KV Cache？ {#kv-cache}

### 面试快答

KV Cache 保存先前 Token 在各层的 Key/Value，避免每步重复计算历史状态。缓存随层数、序列长度、并发、KV 头数和精度增长，是推理容量的重要约束。

### 详细解析

粗略估算可按层数×序列长度×KV 头数×头维度×2×每元素字节再乘并发，实际还含分配开销。GQA/MQA、量化和分页可降成本，但要验证兼容性与质量。

#### 为什么需要

```text
无 KV Cache：每生成 1 token，重算全部历史 token 的 Attention → O(n²) 每步
有 KV Cache：Prefill 算一次存下来，Decode 每步只算新 token 的 Q，与缓存 K/V 做 Attention → O(n) 每步
```

#### 工作流程

1.  **Prefill**：处理 prompt，计算每层 K/V，写入 Cache。
2.  **Decode**：新 token 只算自己的 Q 和新 K/V，追加到 Cache；Attention 用 Q 与全部缓存 K 算分数，加权缓存 V。

KV Cache 是推理加速的**必要手段**，但长上下文 + 高并发下会成为显存主要占用来源（见下一题）。

## vLLM 是什么？ {#vllm-what}

### 面试快答

vLLM 是面向模型推理服务的框架，常通过 KV 内存管理与动态批处理提升资源利用率。收益依赖模型、硬件、版本与请求分布，不能只用峰值吞吐判断。

### 详细解析

评估还需覆盖长上下文、取消、流式返回、公平性和过载行为。生产服务外层仍需要认证、配额、监控与故障隔离，推理框架不是完整 API 网关。

#### 核心特性

| 特性 | 说明 |
| --- | --- |
| PagedAttention | 分页管理 KV Cache，减少显存碎片，提高并发 |
| Continuous Batching | 动态插入/移除请求，GPU 利用率高 |
| OpenAI 兼容 API | `/v1/chat/completions`，易接入现有应用 |
| 多模型支持 | LLaMA、Qwen、Mistral 等 HuggingFace 模型 |
| 量化推理 | AWQ、GPTQ、FP8 等 |

```bash
# 启动服务
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-2-7b-chat-hf \
  --tensor-parallel-size 2
```

同类方案：TGI（HuggingFace）、TensorRT-LLM（NVIDIA）、SGLang。选型看生态、硬件、是否需极致延迟。

## 大模型推理加速是什么？ {#inference-acceleration}

### 面试快答

推理优化可从批处理、KV 管理、量化、算子优化、并行和推测解码入手。先确认瓶颈，再评估吞吐、首 Token、逐 Token 延迟与质量取舍。

### 详细解析

量化不一定在每种硬件上都更快，推测解码也受草稿模型命中率影响。用真实输入输出长度和并发曲线测试，避免把不同质量或不同请求长度的结果直接比较。

推理是**自回归逐 Token 生成**，瓶颈通常在 Attention 计算、KV 缓存读写、显存带宽和 batch 调度，而非单纯 FLOPs。

#### 核心优化方向

| 方向 | 原理 | 典型手段 |
| --- | --- | --- |
| Attention 加速 | 减少 QK^T 计算与内存访问 | FlashAttention、FlashAttention-2 |
| KV Cache | 缓存历史 K/V，避免重复计算 | PagedAttention、KV 量化 |
| 批处理调度 | 提高 GPU 利用率 | Continuous Batching、Dynamic Batching |
| 模型压缩 | 降低权重与激活精度 | INT8/INT4 量化（GPTQ、AWQ） |
| 解码策略 | 用小模型辅助大模型生成 | Speculative Decoding |
| 并行部署 | 多卡分担计算 | Tensor Parallel、Pipeline Parallel |

#### KV Cache

生成每个新 Token 时，历史 Token 的 Key/Value 可复用。KV Cache 将这部分存下来，避免 Prefill 之后每步重复计算 Attention。

```python
Prefill：处理完整 prompt，建立 KV Cache
Decode：每步只算新 token，读取已有 KV Cache
```

长上下文下 KV Cache 显存占用大，PagedAttention（vLLM）将其分页管理，减少碎片并提高并发。

#### Continuous Batching

传统静态 batch 需等最长序列结束才释放；Continuous Batching 在推理过程中动态插入/移除请求，显著提升吞吐。

```python
静态 batch：A、B、C 同时开始，等最慢的结束
Continuous Batching：A 先结束立刻释放，新请求 D 补位
```

#### 量化推理

将 FP16/FP32 权重压缩为 INT8/INT4，降低显存占用与内存带宽压力，常见方案 GPTQ、AWQ、GGUF。

```python
FP16 7B 模型 ≈ 14GB 显存
INT4 量化后 ≈ 4GB，延迟通常可接受
```

#### Speculative Decoding

用小模型（Draft Model）快速生成多个候选 Token，大模型并行验证，接受则一次前进多步，减少大模型调用次数。

#### 常见推理框架

-   **vLLM**：PagedAttention + Continuous Batching，高吞吐自托管首选
-   **TGI / TensorRT-LLM**：NVIDIA 生态，适合生产部署
-   **llama.cpp / Ollama**：CPU/边缘侧轻量推理

面试要点：推理加速 ≠ 换更大模型；从 Attention、KV Cache、Batch 调度、量化、并行 五个维度回答即可。

## 模型微调 SFT 是什么？ {#sft-finetuning}

### 面试快答

SFT 用监督样本调整模型的任务行为和输出风格，参数高效方法如 LoRA 只训练部分新增参数。知识频繁更新或需要引用时，通常仍需检索和外部工具。

### 详细解析

先建立基线与独立评测集，再检查数据授权、质量、泄漏和覆盖。微调不保证消除幻觉，训练与推理模板不一致也可能降低效果。

#### 在大模型训练链路中的位置

```text
预训练（Pre-training）
  ↓ 海量无标注文本，学语言与知识
SFT（Supervised Fine-Tuning）
  ↓ 指令-回答对，学对话与任务格式
RLHF / DPO（可选）
  ↓ 人类偏好对齐，提升安全性与有用性
```

SFT 解决的是「模型能说话、能按指令完成任务」，而非注入大量易变事实（后者更适合 RAG）。

#### 训练数据格式

典型为 instruction-output 对，也可含 system prompt 和多轮对话。

```json
{
  "instruction": "将以下句子翻译成英文",
  "input": "今天天气很好",
  "output": "The weather is nice today."
}
```

多轮对话则按 ChatML / ShareGPT 等模板组织，训练时只对 assistant 回复部分计算 loss。

#### SFT 能做什么

-   教模型遵循指令（问答、摘要、分类、代码生成）
-   固化输出格式（JSON、Markdown、企业话术）
-   适配领域术语与表达风格（医疗、法律、客服）
-   激发预训练阶段已学能力（In-context 能力对齐）

#### SFT 不适合什么

-   注入大量实时或易变知识 → 用 RAG
-   复杂价值观与安全对齐 → 需 RLHF/DPO
-   数据量极少且要求强推理 → 效果有限，需更多数据或更强基座

#### Full Fine-tuning vs LoRA

| 方式 | 特点 | 适用 |
| --- | --- | --- |
| Full Fine-tuning | 更新全部参数，效果上限高 | 充足算力、大量高质量数据 |
| LoRA / QLoRA | 只训练低秩适配器，~1% 参数 | 单卡微调 7B~70B，多任务切换 |

#### 与预训练、RLHF 的区别

| 阶段 | 数据 | 目标 |
| --- | --- | --- |
| 预训练 | 海量无标注文本 | 学语言规律与世界知识 |
| SFT | 标注 instruction-output | 学任务执行与对话格式 |
| RLHF/DPO | 人类偏好排序 | 对齐价值观、减少有害输出 |

企业落地多数直接用 API 基座模型 + Prompt/RAG；仅在需要**固化风格或专有任务**时才做 SFT。

## 大模型 RLHF 是什么？ {#llm-rlhf}

### 面试快答

RLHF 通过人类偏好等反馈训练奖励或优化策略，使输出更贴近期望。它与监督微调解决的问题不同，偏好优化也有多种实现方式。

### 详细解析

应用开发者重点理解偏好数据、奖励偏差和评测边界，不必把复杂训练算法当业务必备。偏好高分不等于事实真实或任务成功，仍需可验证的业务测试。

SFT 教会模型「怎么回答」；RLHF 教会模型「哪种回答更好」。

#### 为什么需要 RLHF？

SFT 只用单一标准答案训练，难以覆盖「多种回答都合理但优劣不同」的场景，也无法有效抑制有害、幻觉、啰嗦等输出。RLHF 引入**人类偏好排序**，让模型学习「更好 vs 更差」。

#### 经典三阶段流程

```python
阶段 1：SFT（监督微调）
  用 instruction-output 数据，得到会对话的基础模型

阶段 2：训练奖励模型（Reward Model, RM）
  人工对同一问题的多个回答排序（A > B > C）
  RM 学习预测人类偏好分数

阶段 3：强化学习优化（通常 PPO）
  用 RM 给模型输出打分作为奖励信号
  通过 PPO 更新策略模型，使高分回答概率增大
  同时用 KL 散度约束，防止偏离 SFT 模型太远（模型崩溃）
```

#### 各阶段职责

| 阶段 | 输入 | 输出 |
| --- | --- | --- |
| SFT | 标注问答对 | 能遵循指令的基础模型 |
| 奖励模型 | 人类偏好排序数据 | 给任意回答打偏好分的 RM |
| PPO 强化学习 | RM 奖励 + KL 惩罚 | 对齐人类价值观的最终模型 |

#### RLHF 的难点

-   **标注成本高**：偏好排序需大量人工参与。
-   **训练不稳定**：PPO 超参敏感，易出现奖励黑客（reward hacking）。
-   **工程复杂**：需同时维护 SFT 模型、RM、策略模型，显存与调度成本高。

#### RLHF 的替代：DPO

DPO（Direct Preference Optimization）跳过显式奖励模型和 PPO，直接用偏好对（chosen vs rejected）优化策略，**更简单、更稳定**，效果接近 RLHF，近年被广泛采用。

```text
RLHF：SFT → 训 RM → PPO 强化学习（三模型、复杂）
DPO：  SFT → 直接偏好优化（两阶段、轻量化）
```
