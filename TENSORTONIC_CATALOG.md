# TensorTonic Comprehensive Data Export & Catalog

> Complete scrape and index of [TensorTonic](https://www.tensortonic.com/problems).

## Overview Statistics

- **Total Problems in Catalog**: 790
- **Free Problems Available**: 370
- **Pro Problems (Locked)**: 420
- **Problems with Full Theory & Test Cases Downloaded**: 130
- **Total Study Plans / Curricula**: 19
- **Total Guided ML Projects**: 24
- **Landmark ML Research Papers**: 23

### Problems by Execution Category

| Category | Problem Count | Description / Tech Stack |
| :--- | :--- | :--- |
| **Numpy** | 319 | Vectorized algorithms, matrix operations, activations, losses |
| **Python** | 233 | Pure Python from scratch, algorithmic data processing, logic |
| **Pytorch** | 118 | Deep learning architectures, autograd, layers, training loops |
| **Cuda** | 36 | Low-level GPU CUDA C/C++ kernels & parallel thread blocks |
| **Triton** | 34 | OpenAI Triton high-performance GPU kernels for AI |
| **Sql** | 25 | Relational data querying and metrics aggregation |
| **Pandas** | 25 | Feature engineering, data cleaning, tabular transformations |

### Problems by Difficulty

| Difficulty | Count | Percentage |
| :--- | :--- | :--- |
| **Easy** | 300 | 38.0% |
| **Medium** | 355 | 44.9% |
| **Hard** | 135 | 17.1% |

### Topics & Tags Distribution

| Topic / Tag | Problem Count |
| :--- | :--- |
| Data Processing | 138 |
| Linear Algebra | 103 |
| Neural Networks | 103 |
| GPU Programming | 80 |
| Computer Vision | 75 |
| Optimization | 75 |
| Probability and Statistics | 74 |
| Reinforcement Learning | 66 |
| Classic ML | 58 |
| Language Models | 57 |
| Calculus | 51 |
| Loss Functions | 50 |
| NLP | 49 |
| Inference | 44 |
| Transformers | 42 |
| Metrics & Evaluation | 41 |
| Activation Functions | 36 |
| Feature Engineering | 32 |
| Classification | 24 |
| Recommender Systems | 15 |
| MLOps | 14 |
| Object Detection | 14 |
| Time Series | 13 |
| Distributed Computing | 11 |
| Regression | 9 |
| Clustering | 8 |
| Scaling Laws | 6 |
| 3D Geometry | 5 |
| Generative Models | 4 |
| Quantization | 4 |

## Study Plans (19 Curricula)

| ID | Title | Difficulty | Est. Days | Problem Count | Focus Area |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `language-modeling-from-scratch` | **Language Modeling from Scratch** | Advanced | 45d | 62 | Stanford CS336 |
| `cracking-dl` | **Cracking Deep Learning** | Advanced | 45d | 35 | 35 Deep Learning Problems |
| `cracking-nlp` | **Cracking NLP** | Advanced | 35d | 35 | 35 NLP and Language Model Problems |
| `cracking-ml` | **Cracking ML** | Advanced | 35d | 35 | 35 Machine Learning Problems |
| `cracking-cv` | **Cracking CV** | Advanced | 35d | 35 | Computer Vision Problems |
| `cuda-basics` | **CUDA Kernels** | Intermediate | 7d | 35 | Program GPUs from first principles |
| `math-linear-algebra` | **Linear Algebra** | Intermediate | 20d | 30 | The Language of ML |
| `math-probability` | **Probability & Statistics** | Intermediate | 20d | 30 | Reasoning Under Uncertainty |
| `pytorch-basics` | **PyTorch Sheet** | Beginner | 18d | 30 | Tensors, Autograd, and Models |
| `cracking-rl` | **Cracking RL** | Advanced | 35d | 30 | 30 Reinforcement Learning problems |
| `math-calculus` | **Calculus for ML** | Intermediate | 15d | 30 | Derivatives, Gradients, Optimization |
| `triton-basics` | **Triton Kernels** | Intermediate | 7d | 30 | Write block-level GPU kernels in Python |
| `cracking-inference` | **Inference Engineering** | Basic to Advanced | 30d | 30 | 30 PyTorch problems for LLM inference |
| `autograd-from-scratch` | **Build Micrograd from Scratch** | Intermediate | 20d | 25 | Karpathy's Micrograd practise problems |
| `numpy-basics` | **NumPy Sheet** | Beginner | 15d | 25 | Array Computing from Scratch |
| `pandas-basics` | **Pandas Sheet** | Beginner | 15d | 25 | Data Manipulation Essentials |
| `sql-basics` | **SQL Sheet** | Beginner | 15d | 25 | Query Data Like a Pro |
| `math-optimization` | **Optimization** | Intermediate | 14d | 25 | Finding Optimal Solutions |
| `alphago-from-scratch` | **Build AlphaGo from Scratch** | Advanced | 14d | 18 | DeepMind's AlphaGo Zero practise problems |

## Guided Machine Learning Projects (24)

| # | Project Title | Description |
| :--- | :--- | :--- |
| 1 | **Build a RAG Agent** | Wire up a working RAG agent end to end: embed a knowledge base with Amazon Titan, store and search it in a local Chroma vector DB, and let a LangGraph ReAct agent answer questions with citations. |
| 2 | **Build a ReAct Agent** | Build the loop every agent framework hides. An LLM emits a Thought, picks an Action, your code runs the tool and feeds back an Observation, and the LLM continues until it returns a Final Answer. |
| 3 | **Build an MCP Server** | Build the core of an MCP server in Python. Describe tools, expose resources, validate model-supplied arguments, dispatch calls, and run a complete JSON-RPC client transcript. |
| 4 | **Sparse Autoencoder Feature Lab** | Implement a small sparse autoencoder from supplied activation samples, then investigate a compatible pretrained SAE using feature examples, counterexamples, and controlled ablations. |
| 5 | **Build an RL Environment** | Build a reinforcement learning environment from scratch, test it before training, see an agent exploit a badly designed reward, fix the reward so it cannot be farmed, and judge results honestly across many random seeds. |
| 6 | **Build an LLM Serving Scheduler** | Build the scheduler of an LLM server: attention with a KV cache, continuous batching, latency metrics, KV cache sizing, and a paged block allocator, then serve real traffic and fix the stalls long prompts cause. |
| 7 | **Write a Matrix Multiply Kernel in Triton** | Write Triton kernels for a vector add and a tiled matrix multiply, guard edge tiles with masks, count the global memory traffic of each tiling, estimate speed with a roofline model, launch tiles in a cache-friendly order, and fuse a bias and ReLU into the kernel. |
| 8 | **Build an Object Detector's Back Half** | Write everything that happens after a detector network: box formats and IoU, decoding anchor offsets into boxes, matching anchors to objects for training, class-aware NMS, and average precision computed the way COCO does. |
| 9 | **Fit a Model in Less Memory** | Count the bytes of weights, gradients, optimizer state and activations, plan activation checkpoints, quantize weights to int8 with absmax scales, and size a LoRA fine-tune, then measure all of it on a real PyTorch model. |
| 10 | **Write FlashAttention Step by Step** | Build FlashAttention step by step: safe and online softmax, merging partial results, tiled and causal attention that match PyTorch exactly, an exact count of the memory traffic that makes it fast, and the same algorithm as a Triton kernel. |
| 11 | **Classify Research Papers by Their Citations** | Build a graph neural network in PyTorch that predicts the topic of a research paper from its words and its citation links: score a split, build the normalized adjacency matrix, write GCN and neighbor-mean layers, and measure how deeper networks make every paper look alike. |
| 12 | **Train a Tiny CLIP from Scratch** | Train an image encoder and a text encoder into one shared space with the contrastive loss, search captions with pictures, classify with written prompts, prove the model ignores which color goes with which shape, and fix it with hard negatives. |
| 13 | **Build a Tiny Vision Transformer** | Build a Vision Transformer from scratch in PyTorch: cut images into patches, add a class token and positions, write attention and a pre-norm transformer block, measure how far each head looks, and compare it honestly with a CNN on Fashion-MNIST. |
| 14 | **Quantize a Language Model to 4 Bits** | Quantize with scales and zero points, group-wise int4 with protected channels, SmoothQuant factors, GPTQ error feedback, NF4 levels and a quantized KV cache, then measure every method on a real language model. |
| 15 | **Train an Agent with PPO** | Build PPO from scratch in PyTorch: discounted returns across episode boundaries, GAE advantages, the clipped surrogate objective, the approximate KL and clip fraction, and the complete minibatch loss. Then train an agent on CartPole, compare it with REINFORCE across seeds, and diagnose what happens when the clipping is removed. |
| 16 | **Build Hybrid Attention for Long Context** | Build the layers long-context models are made of: a sliding window mask, grouped-query attention, linear attention as a running state and the gated delta rule, then count exactly how much cache any mix of layers keeps. |
| 17 | **Split Training Across Many Workers** | Compare ring all-reduce with a parameter server, simulate the ring, size ZeRO memory per worker, schedule a pipeline and measure its bubble, split an MLP with tensor parallelism, and write the DiLoCo outer step. |
| 18 | **Build a Tiny GPT from Scratch** | Build a character-level GPT from scratch in PyTorch: a byte pair encoding merge, the next-token loss, causal self-attention, multi-head attention, the sampling filter with temperature, top-k and top-p, and the parameter count of a whole model. Then train it on Shakespeare and remove the causal mask to see why it matters. |
| 19 | **Build an AlphaZero-Style Game Player** | Build the pieces of AlphaZero for tic-tac-toe in plain Python: the game rules, a minimax solver, the PUCT selection score, policy targets from visit counts, and the full select, expand, evaluate and back up loop, then use them in a PyTorch notebook that trains a policy-value network by self-play. |
| 20 | **Align a Language Model with DPO** | Score replies by their log-probability, write the DPO loss and its implicit rewards, log reward accuracy and margin, write the IPO loss, and measure drift with per-token KL divergence. |
| 21 | **Generate Images with Diffusion and Rectified Flow** | Build DDPM and rectified flow from scratch in PyTorch: noise schedules, the one-jump forward process, the noise-prediction loss, reverse steps, Euler sampling and few-step DDPM sampling, on a 2D spiral and on small clothing images. |
| 22 | **Train a Reasoning Model with GRPO** | Score answers with a program instead of a reward model, sample a group of answers per prompt, turn rewards into group-relative advantages, write the clipped GRPO loss with a KL penalty, watch a lenient checker get hacked, fix it, and measure what training changed with pass at k. |
| 23 | **Plan with a Learned World Model** | Build model-based reinforcement learning in PyTorch: turn episodes into training pairs, measure how imagined rollouts drift, plan with random shooting and the cross-entropy method, and score plans with an ensemble so the planner stops exploiting what the model got wrong. |
| 24 | **Build a Mixture-of-Experts Language Model** | Build a mixture-of-experts layer from scratch in PyTorch: top-k routing, dispatch and combine, total versus active parameters, expert capacity, the Switch balancing loss and router z-loss, and the bias-based balancing of DeepSeek-V3. Then train a tiny character language model (an MLP over the last 8 characters) with it and watch the router collapse without balancing in this setup. |

## Landmark Research Papers Implemented (23)

| Paper Title | Authors / Year | Architecture | ArXiv / Paper Link |
| :--- | :--- | :--- | :--- |
| **Finding Structure in Time (Vanilla RNN)** | Elman, 1990 | `recurrent` | [Link](https://onlinelibrary.wiley.com/doi/abs/10.1207/s15516709cog1402_1) |
| **Long Short-Term Memory** | Hochreiter & Schmidhuber, 1997 | `recurrent` | [Link](https://www.bioinf.jku.at/publications/older/2604.pdf) |
| **ImageNet Classification with Deep Convolutional Neural Networks** | Krizhevsky, Sutskever & Hinton, 2012 | `cnn` | [Link](https://papers.nips.cc/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf) |
| **Word2Vec** | Mikolov et al., 2013 | `embedding` | [Link](https://arxiv.org/abs/1310.4546) |
| **Auto-Encoding Variational Bayes (VAE)** | Kingma & Welling, 2013 | `vae` | [Link](https://arxiv.org/abs/1312.6114) |
| **Very Deep Convolutional Networks** | Simonyan & Zisserman, 2014 | `cnn` | [Link](https://arxiv.org/abs/1409.1556) |
| **Generative Adversarial Networks (GAN)** | Goodfellow et al., 2014 | `gan` | [Link](https://arxiv.org/abs/1406.2661) |
| **Learning Phrase Representations using RNN Encoder-Decoder (GRU)** | Cho et al., 2014 | `recurrent` | [Link](https://arxiv.org/abs/1406.1078) |
| **Deep Residual Learning** | He et al., 2015 | `cnn` | [Link](https://arxiv.org/abs/1512.03385) |
| **U-Net: Convolutional Networks for Biomedical Image Segmentation** | Ronneberger et al., 2015 | `segmentation` | [Link](https://arxiv.org/abs/1505.04597) |
| **Attention Is All You Need** | Vaswani et al., 2017 | `transformer` | [Link](https://arxiv.org/abs/1706.03762) |
| **DenseNet** | Huang et al., 2017 | `cnn` | [Link](https://arxiv.org/abs/1608.06993) |
| **BERT: Pre-training of Deep Bidirectional Transformers** | Devlin et al., 2018 | `transformer` | [Link](https://arxiv.org/abs/1810.04805) |
| **GPT-2** | Radford et al., 2019 | `transformer` | [Link](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) |
| **An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale** | Dosovitskiy et al., 2020 | `transformer` | [Link](https://arxiv.org/abs/2010.11929) |
| **Denoising Diffusion Probabilistic Models** | Ho, Jain & Abbeel, 2020 | `diffusion` | [Link](https://arxiv.org/abs/2006.11239) |
| **LLaMA** | Touvron et al., 2023 | `transformer` | [Link](https://arxiv.org/abs/2302.13971) |
| **DeepSeek-V3** | DeepSeek-AI | `transformer` | [Link](https://arxiv.org/abs/2412.19437) |
| **Gemma 3** | Gemma Team, Google DeepMind | `transformer` | [Link](https://arxiv.org/abs/2503.19786) |
| **Arcee Trinity** | Arcee AI | `transformer` | [Link](https://blog.arcee.ai/arcee-trinity) |
| **gpt-oss** | OpenAI, 2025 | `transformer` | [Link](https://cdn.openai.com/pdf/419b6906-9da6-406c-a19d-1bb078ac7637/oai_gpt-oss_model_card.pdf) |
| **GLM-4.5** | GLM-4.5 Team, Z.ai (Zhipu), 2025 | `transformer` | [Link](https://arxiv.org/pdf/2508.06471) |
| **Kimi K3** | Kimi Team | `transformer` | [Link](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf) |

## Generated Data Files in this Repository

All scraped data is persisted in the `data/` folder:

1. **`data/master_tensortonic_database.json`** (~2.3 MB): Complete unified database containing catalog, study plans, projects, research papers, and full problem details.
2. **`data/problems_catalog.json`** (~580 KB): All 790 problems with metadata (slug, difficulty, category, tags, sortOrder, SEO description).
3. **`data/study_plans.json`** (~210 KB): Complete curriculums for all 19 study plans, including sections and problem sequences.
4. **`data/projects.json`**: All 24 practical end-to-end ML project challenges.
5. **`data/research_papers.json`**: 23 landmark ML paper implementations with metadata.
6. **`data/free_problems_full_details.json`** (~1.4 MB): Complete dictionary of 130 fully scraped problems containing statements, theory tutorials, code templates, test cases, and hints.
7. **`data/problem_details/{slug}.json`**: 130 standalone problem JSON files for modular consumption.