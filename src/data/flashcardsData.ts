export interface Flashcard {
  id: string;
  category: 'Transformers & LLMs' | 'Deep Learning' | 'Tensors & Math' | 'Loss & Optimization' | 'ML Systems & Inference' | 'Computer Vision';
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced';
  question: string;
  shortHint?: string;
  answerSummary: string;
  keyFormulaOrCode?: string;
  explanation: string[];
  interviewTip: string;
  relatedProblemSlug?: string;
}

export interface FlashcardProgress {
  cardId: string;
  state: 'new' | 'learning' | 'review' | 'mastered';
  intervalDays: number;
  nextReviewDate: number; // timestamp
  consecutiveCorrect: number;
  lastReviewedDate?: number;
}

export const FLASHCARD_CATEGORIES = [
  'All',
  'Transformers & LLMs',
  'Deep Learning',
  'Tensors & Math',
  'Loss & Optimization',
  'ML Systems & Inference',
  'Computer Vision'
] as const;

export const FLASHCARDS_DATA: Flashcard[] = [
  {
    id: 'fc-attn-complexity',
    category: 'Transformers & LLMs',
    difficulty: 'Intermediate',
    question: 'Why is standard Self-Attention quadratic O(N²) in sequence length for both compute and memory?',
    shortHint: 'Think about the QK^T matrix dimensions.',
    answerSummary: 'Computing attention logits requires multiplying Q (N × d) by K^T (d × N), generating an N × N attention matrix that must be materialized in GPU HBM before computing softmax.',
    keyFormulaOrCode: 'Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V\nMatrix shapes: (N, d) x (d, N) -> (N, N) logits table',
    explanation: [
      'For sequence length N and embedding dimension d, computing Q K^T requires 2 * N^2 * d FLOPs.',
      'Softmax and storing the intermediate attention weights requires O(N^2) GPU memory.',
      'FlashAttention eliminates the O(N^2) memory bottleneck by tiling Q, K, V into GPU SRAM and fusing the softmax without materializing the full N x N matrix in HBM.'
    ],
    interviewTip: 'Interviewers often follow up with: "How does FlashAttention compute softmax across tiles without storing all logits?" Answer: Using the Online Softmax trick (tracking running maximum and sum of exponentials).',
    relatedProblemSlug: 'scaled-dot-product-attention'
  },
  {
    id: 'fc-rmsnorm-vs-layernorm',
    category: 'Transformers & LLMs',
    difficulty: 'Foundation',
    question: 'Why do modern LLMs (LLaMA 2/3, Mistral, Gemma) replace LayerNorm with RMSNorm?',
    shortHint: 'What component of LayerNorm is omitted in RMSNorm?',
    answerSummary: 'RMSNorm removes the mean-centering step and only normalizes by the root mean square of activations, yielding 10-50% faster normalization kernel execution with no degradation in training stability or downstream perplexity.',
    keyFormulaOrCode: 'LayerNorm(x) = ((x - mu) / sqrt(sigma^2 + eps)) * gamma + beta\nRMSNorm(x) = (x / RMS(x)) * gamma,  where RMS(x) = sqrt(1/d * sum(x_i^2) + eps)',
    explanation: [
      'LayerNorm computes both mean mu and variance sigma^2 across the hidden dimension, requiring two passes or combined reduction.',
      'Empirical studies demonstrate that the shift-invariance (subtracting mu) contributes minimally to gradient stability, whereas scale-invariance (dividing by RMS) provides the primary regularizing benefit.',
      'RMSNorm simplifies the kernel, reducing memory bandwidth transfers between GPU registers and global memory.'
    ],
    interviewTip: 'Highlight that normalization layers are memory-bandwidth-bound rather than compute-bound on modern GPUs, so cutting reduction operations directly speeds up every transformer block.',
    relatedProblemSlug: 'dl-layer-normalization'
  },
  {
    id: 'fc-adamw-weight-decay',
    category: 'Loss & Optimization',
    difficulty: 'Intermediate',
    question: 'What is the mathematical difference between L2 Regularization in Adam and decoupled Weight Decay in AdamW?',
    shortHint: 'Look at whether weight decay is applied before or after second-moment normalization.',
    answerSummary: 'Standard Adam adds the L2 gradient lambda * theta to the gradient g_t before dividing by sqrt(v_t), which penalizes high-variance parameters LESS than low-variance parameters. AdamW decouples weight decay, subtracting lambda * theta directly from the weights.',
    keyFormulaOrCode: 'Naive Adam with L2: g_t = grad + lambda * theta;  theta <- theta - lr * m_t / (sqrt(v_t) + eps)\nAdamW Decoupled:   theta <- theta - lr * lambda * theta - lr * m_t / (sqrt(v_t) + eps)',
    explanation: [
      'In standard SGD with momentum, L2 regularization is mathematically equivalent to weight decay.',
      'In adaptive optimizers (Adam, RMSProp), dividing the L2 gradient by sqrt(v_t) scales down regularization for weights with large historic gradients and excessively regularizes weights with small historic gradients.',
      'Loshchilov & Hutter (2019) showed that decoupling weight decay restores true exponential weight shrinkage across all parameters regardless of gradient magnitudes.'
    ],
    interviewTip: 'A classic question at OpenAI and Meta: "Why did transformers fail to generalize when trained with PyTorch Adam(weight_decay=0.01) before AdamW?" Explain the adaptive second-moment distortion.',
    relatedProblemSlug: 'adam-optimizer'
  },
  {
    id: 'fc-rope-positional',
    category: 'Transformers & LLMs',
    difficulty: 'Advanced',
    question: 'How does Rotary Position Embedding (RoPE) represent relative position between tokens?',
    shortHint: 'Think about complex numbers and 2D orthogonal rotation matrices.',
    answerSummary: 'RoPE groups hidden dimensions into 2D pairs and rotates each 2D vector by an angle proportional to the token position m * theta. The dot product between rotated query q_m and key k_n depends exclusively on the relative distance (m - n).',
    keyFormulaOrCode: '<R_m q, R_n k> = q^T R_m^T R_n k = q^T R_{n-m} k = g(q, k, m - n)\nRotation: [x1, x2]^T -> [x1 cos(m*theta) - x2 sin(m*theta), x1 sin(m*theta) + x2 cos(m*theta)]^T',
    explanation: [
      'Absolute positional encodings (sinusoidal or learned) are added to input embeddings: x + p. Their dot product contains cross terms (x_q p_k + p_q x_k) that distort semantic representations.',
      'RoPE applies a multiplicative rotation directly to query and key vectors in each attention head, preserving norm while embedding position.',
      'Because R_m is orthogonal, R_m^T R_n = R_{n - m}, ensuring attention score naturally decays with relative token distance.'
    ],
    interviewTip: 'Mention context-window extension methods: RoPE position interpolation (Linear scaling, YaRN, NTK-aware scaling) works smoothly because RoPE decomposes position into frequency harmonics.',
    relatedProblemSlug: 'positional-encoding'
  },
  {
    id: 'fc-kv-cache-footprint',
    category: 'ML Systems & Inference',
    difficulty: 'Intermediate',
    question: 'How do you calculate the exact memory footprint of the Key-Value (KV) cache for an autoregressive LLM?',
    shortHint: 'Count batch size, layers, heads, head dimension, sequence length, and byte precision.',
    answerSummary: 'For batch size B, sequence length S, number of layers L, number of KV heads H_kv, and head dimension D in precision P bytes: KV Cache Memory = 2 * B * S * L * H_kv * D * P bytes (factor of 2 accounts for both Keys and Values).',
    keyFormulaOrCode: 'KV_bytes = 2 * B * S * L * (n_kv_heads * d_head) * bytes_per_element\nExample LLaMA-70B (FP16, B=1, S=4096): 2 * 1 * 4096 * 80 * (8 * 128) * 2 = 1.34 GB',
    explanation: [
      'During autoregressive decoding, generating each new token only requires processing the latest token as query, but needs keys and values of all previous tokens.',
      'Without caching, computing attention would take O(N^2) FLOPs per step. Caching K and V reduces compute to O(N) at the expense of linear GPU VRAM consumption.',
      'Multi-Query Attention (MQA) sets H_kv = 1, and Grouped-Query Attention (GQA) sets H_kv = H_q / G, drastically slashing KV cache memory by 4x to 8x.'
    ],
    interviewTip: 'Always point out that in long-context inference (e.g. 32k-128k context), the KV cache can easily exceed the size of the model weights themselves!',
    relatedProblemSlug: 'dl-multi-head-attention'
  },
  {
    id: 'fc-vanishing-gradients',
    category: 'Deep Learning',
    difficulty: 'Foundation',
    question: 'What is the primary mathematical cause of vanishing gradients, and how do residual connections prevent it?',
    shortHint: 'Look at the chain rule expansion and the Jacobian of residual blocks.',
    answerSummary: 'Repeated matrix multiplications of Jacobians with spectral radius < 1 cause gradients to shrink exponentially as they backpropagate through deep layers. Residual connections add an identity skip path x_{l+1} = x_l + F(x_l), guaranteeing an unimpeded gradient term of +1.',
    keyFormulaOrCode: 'x_{l+1} = x_l + F(x_l)\ndL / dx_l = (dL / dx_{l+1}) * (I + dF(x_l) / dx_l)',
    explanation: [
      'By the chain rule, gradient flow through L layers is a product of L Jacobians: prod_{k=l}^{L-1} (d x_{k+1} / d x_k).',
      'For standard architectures, if eigenvalues of these matrices are less than 1, the gradient decays exponentially to zero.',
      'With residual connections, dL / dx_l expands to dL / dx_L * (I + sum_{k} dF_k/dx_k). The identity matrix I ensures gradient can flow directly from the final layer back to any shallow layer without dying.'
    ],
    interviewTip: 'Mention that Highway Networks and LSTMs (constant error carousel) were early precursors to ResNet’s skip connection concept.',
    relatedProblemSlug: 'gradient-descent-quadratic'
  },
  {
    id: 'fc-softmax-numerical-stability',
    category: 'Tensors & Math',
    difficulty: 'Foundation',
    question: 'Why does naive softmax overflow, and what is the standard numerically stable reformulation?',
    shortHint: 'What happens when computing exp(1000) in 32-bit floating point?',
    answerSummary: 'In IEEE 754 float32, exp(x) overflows to +inf for x > 88.7. To maintain stability, subtract the maximum logit c = max(z) from all logits before computing exponentials: softmax(z) = softmax(z - max(z)).',
    keyFormulaOrCode: 'softmax(z_i) = exp(z_i - c) / sum_j exp(z_j - c),  where c = max_k(z_k)\nProof: exp(z_i - c) / sum exp(z_j - c) = (exp(z_i) * exp(-c)) / (exp(-c) * sum exp(z_j))',
    explanation: [
      'Subtracting a constant c from every logit does not change the resulting probabilities because exp(-c) cancels out in the numerator and denominator.',
      'Setting c = max(z) guarantees the largest input to exp() is exp(0) = 1.0, completely eliminating floating-point overflow.',
      'Underflow of tiny probabilities is safely handled by floating-point denormals or clamped to 0.'
    ],
    interviewTip: 'Follow up with LogSoftmax: log(softmax(z)) = (z_i - c) - log(sum_j exp(z_j - c)). This is known as the Log-Sum-Exp (LSE) trick.',
    relatedProblemSlug: 'sigmoid-numpy'
  },
  {
    id: 'fc-gelu-vs-relu',
    category: 'Deep Learning',
    difficulty: 'Intermediate',
    question: 'Why do Transformers and modern deep networks prefer GELU or SwiGLU over ReLU?',
    shortHint: 'Think about dead neurons and probabilistic gating.',
    answerSummary: 'ReLU hard-clamps all negative inputs to 0, which permanently kills gradients for deactivated neurons (the "Dying ReLU" problem). GELU provides a smooth, non-monotonic probabilistic gating function that retains small negative gradient signals.',
    keyFormulaOrCode: 'GELU(x) = x * Phi(x) = x * P(X <= x),  where X ~ N(0, 1)\nApprox: GELU(x) ≈ 0.5 * x * (1 + tanh(sqrt(2/pi) * (x + 0.044715 * x^3)))\nSwiGLU(x, W_1, W_2) = (x W_1 * sigmoid(beta * x W_1)) * (x W_2)',
    explanation: [
      'GELU weights inputs by their percentile in a standard normal distribution, allowing negative values to pass through with small negative magnitude.',
      'The smooth curvature around x = 0 provides continuous higher-order derivatives, enabling gradient-based optimizers to navigate narrow loss ravines.',
      'SwiGLU (Swish-Gated Linear Unit) adds element-wise multiplication with a linear projection, giving the feedforward network higher representation capacity.'
    ],
    interviewTip: 'LLaMA replaced GELU with SwiGLU and reduced hidden dimension from 4d to (2/3)*4d to keep parameter count equal while boosting accuracy.',
    relatedProblemSlug: 'sigmoid-numpy'
  },
  {
    id: 'fc-broadcasting-rules',
    category: 'Tensors & Math',
    difficulty: 'Foundation',
    question: 'What are the two formal NumPy / PyTorch broadcasting rules for binary operations on tensors?',
    shortHint: 'How are dimensions matched, starting from which side?',
    answerSummary: 'Align shape tuples starting from the trailing (rightmost) dimension moving leftward. Two dimensions are compatible if: (1) they are equal, or (2) one of them is 1. Missing leading dimensions are prepended with 1.',
    keyFormulaOrCode: 'Example 1: A (3, 1, 5) + B (2, 5) -> B becomes (1, 2, 5) -> Result: (3, 2, 5)\nExample 2: A (4, 3) + B (4,) -> Error! 3 != 4 (trailing dimensions must match or be 1)',
    explanation: [
      'If tensors have different ranks, the smaller tensor is prepended with 1s on the left until shapes have equal length.',
      'Along any dimension of size 1, the tensor behaves as if copied along that axis without actual memory allocation (using zero stride).',
      'If two dimensions mismatch and neither is 1, a ValueError ("operands could not be broadcast together") is raised.'
    ],
    interviewTip: 'Watch out for 1D arrays: shape (N,) broadcasts differently than (N, 1) or (1, N). Always clarify tensor shapes before writing tensor operations in an interview.',
    relatedProblemSlug: 'matrix-transpose'
  },
  {
    id: 'fc-speculative-decoding',
    category: 'ML Systems & Inference',
    difficulty: 'Advanced',
    question: 'How does Speculative Decoding accelerate LLM inference without altering the output probability distribution?',
    shortHint: 'Think about a small draft model drafting tokens, verified by the large target model in one forward pass.',
    answerSummary: 'A fast, small draft model generates K speculative tokens sequentially. The large target model evaluates all K tokens in parallel in a single forward pass. Tokens are accepted or rejected via modified rejection sampling that mathematically matches the target distribution.',
    keyFormulaOrCode: 'Acceptance probability: alpha = min(1, p_target(x) / p_draft(x))\nIf rejected at token k, sample replacement from max(0, p_target(x) - p_draft(x)) and stop.',
    explanation: [
      'LLM token generation is memory-bandwidth bound: reading 70B parameters from VRAM takes ~14ms regardless of whether 1 token or 5 tokens are computed.',
      'Verifying K tokens in parallel amortizes memory transfer across multiple tokens.',
      'Because acceptance criteria uses rejection sampling, the output sequence is mathematically proven to come from the target model’s exact probability distribution.'
    ],
    interviewTip: 'When asked about speedups, quote realistic benchmarks: 2x to 3x speedup on coding/structured tasks where acceptance rate is high (>80%), slightly lower on creative open-ended text.',
    relatedProblemSlug: 'pad-sequences'
  },
  {
    id: 'fc-label-smoothing',
    category: 'Loss & Optimization',
    difficulty: 'Intermediate',
    question: 'Why do we use Label Smoothing in Cross-Entropy, and what problem does it mitigate?',
    shortHint: 'What happens to logits when cross-entropy loss tries to reach 0 for one-hot targets?',
    answerSummary: 'With hard one-hot targets, cross-entropy only reaches 0 when the correct logit approaches +infinity and incorrect logits reach -infinity. Label smoothing mixes one-hot labels with a uniform distribution, preventing the model from becoming overconfident.',
    keyFormulaOrCode: 'y_smoothed = (1 - alpha) * y_onehot + alpha / K\nLoss = (1 - alpha) * CE(y, p) + alpha * D_KL(Uniform || p)',
    explanation: [
      'Over-confidence causes high calibration error (ECE) and poor generalization, making models fragile to slight distribution shifts.',
      'Label smoothing acts as a regularizer by penalizing extreme logit differences.',
      'It encourages representations of samples within the same class to form tight, equidistant clusters in the pen-ultimate embedding space.'
    ],
    interviewTip: 'Note that label smoothing is rarely used if the model will later be distilled into a student network, because soft teacher distributions already carry dark knowledge.',
    relatedProblemSlug: 'logistic-regression-training'
  },
  {
    id: 'fc-lora-mechanics',
    category: 'Transformers & LLMs',
    difficulty: 'Intermediate',
    question: 'How does Low-Rank Adaptation (LoRA) freeze pre-trained weights and reduce trainable parameters by 99%?',
    shortHint: 'Decompose a d x k weight update into two low-rank matrices.',
    answerSummary: 'LoRA freezes pre-trained weight matrix W_0 (d x k) and parameterizes weight update delta_W as the product of two low-rank matrices B (d x r) and A (r x k), where rank r << min(d, k).',
    keyFormulaOrCode: 'h = W_0 x + (alpha / r) * B A x\nInitialized: A ~ N(0, sigma^2), B = 0 (ensuring delta_W = 0 at start of fine-tuning)',
    explanation: [
      'Agha et al. (2020) demonstrated that weight updates during downstream adaptation have a very low intrinsic dimension.',
      'For d = 4096, k = 4096, and rank r = 16, parameters shrink from 16.7M down to 2 * 4096 * 16 = 131k (a 99.2% reduction).',
      'At deployment, delta_W = (alpha / r) * B A can be merged directly into W_0: W = W_0 + delta_W, incurring zero inference latency overhead.'
    ],
    interviewTip: 'Explain why matrix B is initialized to zeros and A with Gaussian noise: so that Delta W = 0 at step 0, preserving the pre-trained model’s exact behavior before training starts.',
    relatedProblemSlug: 'matrix-transpose'
  },
  {
    id: 'fc-precision-bf16-fp16',
    category: 'ML Systems & Inference',
    difficulty: 'Intermediate',
    question: 'Why is Bfloat16 (BF16) preferred over Float16 (FP16) for modern deep learning training?',
    shortHint: 'Compare the number of exponent and mantissa bits against FP32.',
    answerSummary: 'BF16 allocates 8 exponent bits and 7 mantissa bits (identical dynamic range to FP32), completely avoiding gradient underflow/overflow without needing loss scaling. FP16 has only 5 exponent bits, requiring fragile dynamic loss scaling.',
    keyFormulaOrCode: 'FP32: 1 sign + 8 exponent + 23 mantissa\nBF16: 1 sign + 8 exponent + 7 mantissa  (Max: ~3.4e38, Min: ~1.2e-38)\nFP16: 1 sign + 5 exponent + 10 mantissa (Max: 65,504,   Min: 6.1e-5)',
    explanation: [
      'FP16 has a maximum representable value of only 65,504. In deep models, activation gradients easily exceed this value, causing NaN overflows.',
      'FP16 requires tracking a dynamic loss scaling factor to shift gradients into representable range, which can fail during sudden loss spikes.',
      'BF16 directly truncates 16 mantissa bits from FP32, making FP32 to BF16 conversion a trivial bit-shift and eliminating numerical instability.'
    ],
    interviewTip: 'Interviewers may ask: "Does BF16 have lower precision than FP16?" Answer: Yes, 7 bits of mantissa vs 10 bits in FP16, but deep learning neural nets are resilient to small rounding noise and extremely sensitive to dynamic range.',
    relatedProblemSlug: 'sigmoid-numpy'
  },
  {
    id: 'fc-nms-iou',
    category: 'Computer Vision',
    difficulty: 'Intermediate',
    question: 'How does Non-Maximum Suppression (NMS) eliminate duplicate object detection bounding boxes?',
    shortHint: 'Sort by confidence, iterate, compute IoU with remaining boxes.',
    answerSummary: 'Sort all candidate boxes in descending order of classification confidence. Greedily pick the highest-scoring box, and discard any remaining candidate boxes whose Intersection-over-Union (IoU) with the selected box exceeds a threshold (e.g. 0.5).',
    keyFormulaOrCode: 'IoU(A, B) = Area(A intersect B) / Area(A union B)\nArea(A union B) = Area(A) + Area(B) - Area(A intersect B)',
    explanation: [
      'Anchor-based detectors (YOLO, Faster R-CNN, SSD) output hundreds or thousands of overlapping candidate boxes per object.',
      'Hard NMS discards overlapping boxes completely, which can accidentally erase distinct objects that happen to overlap heavily (e.g. people in a crowded room).',
      'Soft-NMS decays the confidence score of overlapping boxes as a continuous function of IoU rather than abruptly setting their score to zero.'
    ],
    interviewTip: 'Mention time complexity: naive pairwise IoU is O(N^2), but can be accelerated via GPU coordinate tensor broadcasting or batched torchvision ops.',
    relatedProblemSlug: 'anchor-box-generation'
  },
  {
    id: 'fc-model-parallelism-tp-pp-zero',
    category: 'ML Systems & Inference',
    difficulty: 'Advanced',
    question: 'What are the core differences between Tensor Parallelism (TP), Pipeline Parallelism (PP), and ZeRO Stage 3?',
    shortHint: 'How is computation vs memory partitioned across multiple GPUs?',
    answerSummary: 'Tensor Parallelism splits individual weight matrices across GPUs within a node (fast NVLink required). Pipeline Parallelism splits layers sequentially across nodes (bubble overhead). ZeRO Stage 3 partitions optimizer states, gradients, and model weights across data-parallel ranks.',
    keyFormulaOrCode: 'Megatron TP: Y_1 = X W_col,  Y_2 = Y_1 W_row -> All-Reduce sum\nZeRO-3: Each GPU holds 1/N params, gathers via All-Gather during forward/backward, then frees memory',
    explanation: [
      'TP introduces frequent All-Reduce communications inside each transformer block, requiring ultra-high bandwidth (900 GB/s NVLink) and is usually limited to 8 GPUs.',
      'PP divides 80 layers among 8 nodes; micro-batching is required (1F1B schedule) to minimize pipeline bubble idle time.',
      'ZeRO-3 eliminates redundant parameter storage without altering model execution semantics, scaling to thousands of GPUs with minimal communication overhead.'
    ],
    interviewTip: 'Know the 3 stages of ZeRO: Stage 1 partitions Optimizer States (4x memory saving), Stage 2 partitions Gradients (8x saving), Stage 3 partitions Model Parameters (linear memory reduction with N GPUs).',
    relatedProblemSlug: 'dl-encoder-block'
  },
  {
    id: 'fc-weight-init-he-xavier',
    category: 'Deep Learning',
    difficulty: 'Intermediate',
    question: 'Why does He (Kaiming) initialization use variance 2/n_in, whereas Xavier (Glorot) initialization uses 2/(n_in + n_out)?',
    shortHint: 'How does ReLU zeroing out half the activations affect output variance?',
    answerSummary: 'Xavier assumes symmetric linear/tanh activations with zero mean. ReLU zeros out all negative inputs, halving the expected activation variance. He initialization multiplies variance by 2 (yielding 2 / n_in) to preserve unit signal variance across layers.',
    keyFormulaOrCode: 'Xavier Normal: W ~ N(0, 2 / (n_in + n_out))\nHe Normal:     W ~ N(0, 2 / n_in)   [for ReLU / LeakyReLU]',
    explanation: [
      'If activations expand or shrink by a factor c at each layer, after L layers variance scales as c^L. For deep networks (L=50), even c=1.1 causes explosion and c=0.9 causes signal collapse.',
      'Under ReLU activation: E[ReLU(z)^2] = 0.5 * Var(z).',
      'Setting Var(w) = 2 / n_in precisely cancels out the 0.5 factor, keeping signal variance constant from layer 1 to layer L.'
    ],
    interviewTip: 'For LeakyReLU with negative slope a, the variance formula adjusts to Var(W) = 2 / ((1 + a^2) * n_in).',
    relatedProblemSlug: 'gradient-descent-quadratic'
  },
  {
    id: 'fc-infonce-contrastive',
    category: 'Loss & Optimization',
    difficulty: 'Advanced',
    question: 'What is the role of the temperature hyperparameter tau in InfoNCE / Contrastive Loss?',
    shortHint: 'How does tau scale logits before softmax, and what does it do to hard negatives?',
    answerSummary: 'Temperature tau acts as a hardness controller: smaller tau sharpens the distribution, forcing the gradient to focus disproportionately on hard negative samples (negatives with high similarity). Larger tau treats all negatives more uniformly.',
    keyFormulaOrCode: 'L_InfoNCE = -log ( exp(sim(q, k_+) / tau) / (exp(sim(q, k_+) / tau) + sum_i exp(sim(q, k_i^-) / tau)) )',
    explanation: [
      'Dividing cosine similarities (which lie in [-1, 1]) by tau scales the dynamic range before softmax.',
      'As tau -> 0, the loss behaves like a hard max operator, where only the single hardest negative contributes to parameter updates.',
      'If tau is too small, training becomes unstable due to exploding gradients on ambiguous false negatives; if tau is too large, the model fails to learn fine-grained discriminative features.'
    ],
    interviewTip: 'CLIP (Radford et al.) treats tau as a learnable parameter initialized to log(1/0.07), clipped to avoid numerical instability.',
    relatedProblemSlug: 'cosine-embedding-loss'
  },
  {
    id: 'fc-dpo-vs-ppo',
    category: 'Transformers & LLMs',
    difficulty: 'Advanced',
    question: 'How does Direct Preference Optimization (DPO) eliminate the need for training a separate reward model in RLHF?',
    shortHint: 'Look at the closed-form substitution of reward r(x, y) with model log-ratios.',
    answerSummary: 'DPO uses the mathematical equivalence between the Bradley-Terry preference model and the optimal RL policy under KL penalty. It expresses ground-truth reward analytically as r(x, y) = beta * log(pi_theta(y|x) / pi_ref(y|x)), optimizing the LLM policy directly with binary cross-entropy.',
    keyFormulaOrCode: 'L_DPO = -E[ log sigma( beta * log(pi_theta(y_w|x) / pi_ref(y_w|x)) - beta * log(pi_theta(y_l|x) / pi_ref(y_l|x)) ) ]',
    explanation: [
      'Traditional RLHF (PPO) requires four simultaneous models in GPU memory: Actor (policy), Critic (value head), Reference Model, and Reward Model.',
      'PPO is notoriously sensitive to hyperparameter tuning and requires continuous online sampling during training.',
      'DPO operates offline directly on pairs of chosen (y_w) and rejected (y_l) responses, maximizing the probability margin of preferred responses relative to the reference policy.'
    ],
    interviewTip: 'Mention potential caveats of DPO: because it trains on offline static pairs, it can overfit or degrade if the dataset contains noisy or contradictory label annotations.',
    relatedProblemSlug: 'logistic-regression-training'
  },
  {
    id: 'fc-moe-routing',
    category: 'Transformers & LLMs',
    difficulty: 'Advanced',
    question: 'How does Mixture-of-Experts (MoE) route tokens, and why is an auxiliary load balancing loss required?',
    shortHint: 'What happens if the router learns a bias towards 1 or 2 specific experts early in training?',
    answerSummary: 'A gating network computes router logits for each token and activates Top-K experts (e.g. Top-2 of 8). Without an auxiliary loss, the router experiences "expert collapse", routing nearly all tokens to the same 1 or 2 experts while remaining experts starve.',
    keyFormulaOrCode: 'G(x) = Softmax(TopK(x W_g + noise, k))\ny = sum_{i in TopK} G(x)_i * Expert_i(x)\nAux_Loss = alpha * N * sum_{i=1}^N (f_i * P_i)  [f_i = fraction routed, P_i = router prob]',
    explanation: [
      'MoE allows scaling total parameter capacity (e.g. Mixtral 8x7B has 47B parameters) while maintaining the inference FLOPs of a much smaller model (only 13B active parameters per token).',
      'Because gradient descent reinforces early winning experts, routing entropy collapses rapidly without balance regularization.',
      'The auxiliary loss minimizes the dot product between fraction of tokens routed f_i and router probability mass P_i across all experts.'
    ],
    interviewTip: 'Mention DeepSeek-V2 / V3’s innovations: Multi-head Latent Attention (MLA) combined with fine-grained MoE (e.g. 64 experts with 8 active + 1 shared expert) to ensure common factual knowledge is always available.',
    relatedProblemSlug: 'dl-encoder-block'
  },
  {
    id: 'fc-dropout-inverted',
    category: 'Deep Learning',
    difficulty: 'Foundation',
    question: 'Why does modern deep learning use "Inverted Dropout" instead of standard dropout during training?',
    shortHint: 'Where does the scaling factor 1 / (1 - p) occur: training or inference?',
    answerSummary: 'Inverted Dropout scales active neuron activations by 1 / (1 - p) during training. This ensures the expected value of activations remains unchanged, requiring ZERO operations or modifications during inference.',
    keyFormulaOrCode: 'Standard Dropout:\n  Train: h_drop = m * h  [m ~ Bernoulli(1 - p)]\n  Test:  h_test = (1 - p) * h\nInverted Dropout:\n  Train: h_drop = (m * h) / (1 - p)\n  Test:  h_test = h  (no scaling needed!)',
    explanation: [
      'In standard dropout, if p = 0.5, the total signal intensity at test time would be 2x higher than during training unless multiplied by (1 - p).',
      'Scaling during test time adds unnecessary latency and complicates inference model deployment.',
      'Inverted dropout moves the division into the training forward pass, leaving the inference path completely clean and identical to a normal layer.'
    ],
    interviewTip: 'Remember to mention that dropout is typically disabled or set to very low probability (<0.1) in large autoregressive language models, as massive pre-training data already provides sufficient regularization.',
    relatedProblemSlug: 'dropout-training'
  },
  {
    id: 'fc-paged-attention',
    category: 'ML Systems & Inference',
    difficulty: 'Intermediate',
    question: 'How does PagedAttention (vLLM) solve KV cache memory fragmentation in LLM serving?',
    shortHint: 'Think about OS virtual memory paging applied to KV cache allocation.',
    answerSummary: 'Traditional serving allocates a contiguous buffer for maximum sequence length (e.g. 4096 tokens), wasting 60-80% of VRAM due to internal/external fragmentation. PagedAttention divides the KV cache into fixed-size physical blocks (e.g. 16 tokens) mapped dynamically through a page table.',
    keyFormulaOrCode: 'Block Table: Logical Token Block -> Physical VRAM Block Index\nSRAM Kernel: Gathers non-contiguous KV blocks into on-chip cache on the fly',
    explanation: [
      'Internal fragmentation occurs when reservation assumes maximum length but user prompt is short.',
      'External fragmentation happens because sequences have varying lifetimes and arrive asynchronously.',
      'PagedAttention reduces memory waste to under 4%, enabling batch sizes 2x to 4x larger on the same GPU hardware.'
    ],
    interviewTip: 'Mention that PagedAttention also enables zero-copy prompt sharing for parallel sampling and beam search (Copy-on-Write mechanism).',
    relatedProblemSlug: 'pad-sequences'
  },
  {
    id: 'fc-quantization-affine',
    category: 'ML Systems & Inference',
    difficulty: 'Intermediate',
    question: 'How do scale (S) and zero-point (Z) map FP32/BF16 tensor values to INT8 integers?',
    shortHint: 'Write down the affine quantization mapping formula.',
    answerSummary: 'Uniform affine quantization maps real float x in [alpha, beta] to integer q in [q_min, q_max] via q = round(x / S) + Z, where scale S = (beta - alpha) / (q_max - q_min) and zero-point Z = round((0 - alpha) / S) + q_min.',
    keyFormulaOrCode: 'Quantize:   q = clip(round(x / S) + Z, q_min, q_max)\nDequantize: x_approx = S * (q - Z)\nSymmetric Quant: Z = 0, S = max(|alpha|, |beta|) / 127',
    explanation: [
      'Symmetric quantization sets Z = 0, which eliminates extra bias subtraction in matrix multiplications and accelerates INT8 Tensor Cores.',
      'Asymmetric quantization handles skewed activation distributions (e.g. post-ReLU values >= 0) by setting Z != 0.',
      'Per-channel or per-group quantization applies separate (S, Z) pairs per row or per 128 elements to handle activation outliers.'
    ],
    interviewTip: 'At NVIDIA/Apple/Qualcomm, be ready to derive integer matrix multiplication: X * W = S_X * S_W * (q_X - Z_X) * (q_W - Z_W).',
    relatedProblemSlug: 'sigmoid-numpy'
  },
  {
    id: 'fc-jacobian-hessian',
    category: 'Tensors & Math',
    difficulty: 'Intermediate',
    question: 'What are the dimensions and computational differences between the Jacobian and Hessian matrices?',
    shortHint: 'First-order vector derivatives vs second-order scalar derivatives.',
    answerSummary: 'For f: R^n -> R^m, the Jacobian J is an m x n matrix of first-order partial derivatives J_ij = df_i / dx_j. For scalar loss L: R^n -> R, the Hessian H is an n x n symmetric matrix of second-order derivatives H_ij = d^2 L / (dx_i dx_j).',
    keyFormulaOrCode: 'Jacobian: J in R^{m x n},  J_ij = d f_i / d x_j\nHessian:  H in R^{n x n},  H_ij = d^2 L / (d x_i d x_j)\nNewton step: Delta x = -H^{-1} grad(L) -> O(n^3) compute!',
    explanation: [
      'In deep learning with n = 100M parameters, the Hessian matrix would require 100M x 100M = 10^16 floating point values (40 Petabytes of memory!).',
      'Inverting H takes O(n^3) time, making exact second-order optimization impossible for large neural networks.',
      'Quasi-Newton methods (BFGS, L-BFGS) approximate H^{-1} using gradient history, while adaptive first-order methods (Adam) use diagonal approximations.'
    ],
    interviewTip: 'Hessian eigenvalues indicate curvature: positive eigenvalues indicate local minima, negative indicate saddle points. Saddle points dominate high-dimensional optimization landscapes.',
    relatedProblemSlug: 'gradient-descent-quadratic'
  },
  {
    id: 'fc-cosine-annealing',
    category: 'Loss & Optimization',
    difficulty: 'Foundation',
    question: 'Why is Cosine Annealing with Warmup widely used in training modern LLMs and vision models?',
    shortHint: 'Why warmup first, and why decay following half a cosine curve?',
    answerSummary: 'Warmup prevents early gradient explosion when weights and adaptive optimizer statistics (m_t, v_t) are unstable. Cosine decay smoothly lowers the learning rate to near-zero without abrupt step drops, helping parameters settle into flat, generalizable minima.',
    keyFormulaOrCode: 'lr_t = lr_min + 0.5 * (lr_max - lr_min) * (1 + cos(pi * t / T_max))\nWarmup: lr_t = lr_max * (t / T_warmup)  for t < T_warmup',
    explanation: [
      'Step-decay schedules introduce artificial spikes when learning rate drops and require arbitrary milestone tuning.',
      'Cosine schedule continuously shrinks the step size, allowing deep networks to escape sharp minima early and fine-tune delicately late in training.',
      'Warmup is strictly necessary for Transformers because self-attention entropy is erratic before layer norms and projections stabilize.'
    ],
    interviewTip: 'Chinchilla scaling laws and LLaMA training recipes recommend setting lr_min = 0.1 * lr_max (rather than 0) for continuous pre-training extensions.',
    relatedProblemSlug: 'adam-optimizer'
  },
  {
    id: 'fc-svd-pca',
    category: 'Tensors & Math',
    difficulty: 'Intermediate',
    question: 'How is Singular Value Decomposition (SVD) connected to Principal Component Analysis (PCA)?',
    shortHint: 'Think about centering the data matrix X and comparing X^T X to V Sigma^2 V^T.',
    answerSummary: 'For mean-centered data matrix X (N x D), computing SVD gives X = U Sigma V^T. The right singular vectors V are the exact eigenvectors of the sample covariance matrix C = (1 / (N - 1)) X^T X, and singular values sigma_i^2 / (N - 1) are the eigenvalues.',
    keyFormulaOrCode: 'X = U Sigma V^T\nX^T X = (V Sigma U^T) (U Sigma V^T) = V Sigma^2 V^T\nPrincipal components = X V = U Sigma',
    explanation: [
      'Computing SVD directly on data matrix X has better numerical stability and avoids squaring condition numbers compared to explicitly forming X^T X.',
      'The diagonal singular values in Sigma represent the standard deviation of data projected along each principal component direction.',
      'Truncated SVD keeping top-k singular values provides the best rank-k Frobenius norm approximation (Eckart-Young-Mirsky theorem).'
    ],
    interviewTip: 'Always emphasize centering data before computing PCA: subtracting the feature-wise mean ensures the first singular vector aligns with maximum variance rather than the mean offset.',
    relatedProblemSlug: 'matrix-transpose'
  },
  {
    id: 'fc-entropy-information-gain',
    category: 'Loss & Optimization',
    difficulty: 'Foundation',
    question: 'What is Shannon Entropy, and how does Information Gain determine the best split in a Decision Tree?',
    shortHint: 'Measure of uncertainty in bits, and expected entropy reduction.',
    answerSummary: 'Entropy measures uncertainty: H(S) = -sum p_i log2(p_i). Information Gain IG(S, A) is the reduction in entropy achieved by partitioning dataset S on attribute A: IG(S, A) = H(S) - sum (|S_v| / |S|) * H(S_v). The algorithm picks the split that maximizes IG.',
    keyFormulaOrCode: 'H(S) = -sum_{i=1}^C p_i log_2(p_i)\nIG(S, A) = H(S) - sum_{v in Values(A)} (|S_v| / |S|) * H(S_v)',
    explanation: [
      'A node with equal class distribution has maximum entropy (1.0 for binary), while a pure node (100% one class) has entropy 0.',
      'Information gain favors attributes with many values. C4.5 addresses this by using Gain Ratio = IG(S, A) / SplitInfo(A).',
      'Gini Impurity (used in CART) is an alternative: Gini(S) = 1 - sum p_i^2, which is computationally faster because it avoids logarithms.'
    ],
    interviewTip: 'Gini vs Entropy: Gini is faster (no log computation) and produces nearly identical tree splits 98% of the time.',
    relatedProblemSlug: 'entropy-node'
  },
  {
    id: 'fc-perplexity-cross-entropy',
    category: 'Transformers & LLMs',
    difficulty: 'Foundation',
    question: 'What is the exact mathematical relationship between Cross-Entropy Loss and Perplexity (PPL)?',
    shortHint: 'Take the exponential of the cross-entropy loss.',
    answerSummary: 'Perplexity is the exponentiated cross-entropy loss: PPL = exp(Loss_CE). It represents the effective branching factor—the geometric average number of equally likely words the model is choosing among at each token position.',
    keyFormulaOrCode: 'Loss_CE = - (1 / N) * sum_{t=1}^N log(P(w_t | w_{<t}))\nPerplexity = exp(Loss_CE) = prod_{t=1}^N (1 / P(w_t | w_{<t}))^{1 / N}',
    explanation: [
      'If a vocabulary has 32,000 tokens and the model guesses uniformly at random, Perplexity is exactly 32,000.',
      'A model with Perplexity = 10 is as confident as a fair 10-sided die roll at each word step.',
      'Perplexity is vocabulary-dependent: comparing PPL between models with different tokenizers (e.g. byte-level vs BPE 50k) is invalid unless normalized by bytes-per-token.'
    ],
    interviewTip: 'Crucial interview gotcha: You cannot directly compare Perplexity of LLaMA (32k vocab) vs Gemma (256k vocab) without normalizing cross-entropy by bits per byte (BPB).',
    relatedProblemSlug: 'logistic-regression-training'
  }
];

