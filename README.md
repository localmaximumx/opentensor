# TonicLite

<p align="center">
  <img src="public/images/logos/toniclite.svg" alt="TonicLite Logo" width="88" height="88" />
</p>

<h3 align="center">Master Machine Learning & AI Engineering From Scratch</h3>

<p align="center">
  An open-source interactive coding platform for machine learning systems, deep learning algorithms, CUDA kernels, and technical AI interview preparation.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-architecture--project-structure">Architecture</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-license">License</a>
</p>

---

## 🌟 Features

### 💻 1,170+ Interactive Coding Problems
- **Deep Learning Algorithms**: Implement multi-head attention, backpropagation, convolution forward/backward passes, layer normalization, dropout, AdamW optimizer, and RoPE positional embeddings from mathematical principles.
- **Vectorized NumPy & PyTorch**: Master tensor slicing, broadcasting rules, matrix multiplication, autograd, and custom neural network layers.
- **CUDA & GPU Kernels**: Triton and CUDA kernel engineering, memory coalescing, shared memory tiling, and parallel reductions.
- **Classical ML & Data**: Linear regression, decision trees, k-means clustering, PCA, SQL queries, and Pandas data transformations.

### ⚡ Client-Side WebAssembly Python Sandbox (Pyodide)
- Zero server execution latency: runs Python 3.12 directly in the browser via WebAssembly.
- Built-in NumPy and math modules with real-time execution feedback.
- Captures live `stdout`, `stderr`, execution timings, and detailed stack traces.

### 🧪 20+ Automated Test Cases per Problem
- Every problem features a comprehensive suite of 20+ verification test cases.
- Validates numerical tolerances (`atol`, `rtol`), edge cases, empty shapes, zero-division, and dimensional broadcasting.
- Clear visual pass/fail badges with expandable input/output diffs and tolerance checks.

### 📱 Full Mobile Responsiveness & Touch Ergonomics
- **Dual-Mode Mobile Solver**: Clean toggle between `[Description]` and `[Code]` tabs.
- **Touch-Resizable Bottom Console**: Vertically resizable test case & execution console with a responsive touch handle.
- **Optimized Catalog**: 60px row height, horizontal tag scrolling, and difficulty color bars.
- **Floating Overlay Menu**: Non-intrusive mobile navigation overlay that never displaces page content.
- **Default Dark Mode**: High-contrast dark theme with mobile theme toggle integrated into the hamburger menu.

### 🔬 Research Papers Implementation Track
- Implement landmark papers step-by-step:
  - *Attention Is All You Need* (Transformers)
  - *Vision Transformer* (ViT)
  - *Deep Residual Learning for Image Recognition* (ResNet)
  - *Generative Adversarial Nets* (GANs)
  - *Auto-Encoding Variational Bayes* (VAE)
  - *U-Net: Convolutional Networks for Biomedical Image Segmentation*
  - *Densely Connected Convolutional Networks* (DenseNet)
  - *Word2Vec* & *Kimi K3*
- High-resolution architecture diagrams, mathematical equations (rendered with KaTeX), and step-by-step coding milestones.
- Interactive paper dropdown with quick search on mobile and full sidebar on desktop.

### 🎯 Technical Interview Assessments
- Timed FAANG-style Machine Learning Engineering mock interviews.
- Real-world production scenarios: LLM inference optimization, KV cache management, model quantization (INT8/FP4), flash attention, and distributed data parallelism.

### 👤 User Authentication & State Persistence
- Built-in multi-user system with secure SHA-256 password hashing.
- Dual-mode synchronization: instant offline `localStorage` fallback with serverless cloud sync via Vercel KV / Database.
- One-click account data backup export and restore in JSON format.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Routing** | React Router 7 |
| **Styling & Design** | Tailwind CSS, Lucide React Icons |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Python Runtime** | Pyodide (WebAssembly Python 3.12) |
| **Math Typesetting** | KaTeX |
| **Backend & Serverless** | Vercel Serverless Functions (`/api/*`), Node.js Crypto |
| **Cloud Storage** | Vercel KV / Postgres with offline `localStorage` fallback |

---

## 📁 Architecture & Project Structure

```text
toniclite/
├── api/                        # Vercel Serverless API Functions
│   ├── auth/                   # Authentication & session endpoints
│   ├── code/                   # User code draft persistence
│   ├── progress/               # Problem progress & submission records
│   └── lib/                    # Storage and crypto helpers
├── data/                       # Problem catalogs, test cases, and research tracks
├── public/                     # Static assets, logos, paper architecture diagrams
│   └── images/                 # Badges, architectures, categories
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AuthModal.tsx       # Sign In / Sign Up dialog
│   │   ├── ExplorePanel.tsx    # Sidebar papers & categories explore panel
│   │   ├── MathView.tsx        # KaTeX LaTeX formula renderer
│   │   ├── Navbar.tsx          # Responsive navigation & mobile overlay
│   │   ├── ProblemDrawer.tsx   # Side navigation drawer for problems
│   │   └── SolutionViewer.tsx  # Editorial solutions and explanations
│   ├── pages/                  # Top-level view routes
│   │   ├── HomePage.tsx        # Landing page with hero & features
│   │   ├── ProblemsPage.tsx    # Filterable problem catalog
│   │   ├── ProblemSolverPage.tsx # Monaco editor & Pyodide test runner
│   │   ├── ResearchPage.tsx    # Research paper hub with interactive diagrams
│   │   └── InterviewPage.tsx   # ML Engineering assessment tracks
│   ├── services/               # Core application services
│   │   ├── authService.ts      # Client authentication & storage sync
│   │   ├── dataService.ts      # Problem catalog & research paper data loader
│   │   └── pyodideRunner.ts    # WebAssembly Python sandbox manager
│   ├── App.tsx                 # Root application & routing
│   └── main.tsx                # Application entrypoint
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `pnpm`

### 1. Clone Repository

```bash
git clone https://github.com/localmaximumx/opentensor.git toniclite
cd toniclite
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal).

### 4. Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## ☁️ Deployment

### Automatic Deployment on Vercel

1. Push your repository to GitHub under your user or organization.
2. Log into [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
3. Import the `opentensor` repository.
4. Vercel automatically detects the configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

### Optional: Cloud Synchronization via Vercel KV

To enable multi-device cloud synchronization across user accounts:
1. In your Vercel Project dashboard, go to the **Storage** tab.
2. Click **Create Database** -> select **KV** (Redis).
3. Connect the KV database to your project. Environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) will be linked automatically.
4. If no KV store is configured, the application automatically functions with offline `localStorage` persistence.

---

## 🤝 Contributing

Contributions to TonicLite are welcome! Whether you are:
- Adding new tensor and neural network problem sets
- Expanding test case suites and edge cases
- Adding classic or frontier research paper tracks
- Improving mobile responsiveness or editor features

Feel free to open an issue or submit a pull request on [GitHub](https://github.com/localmaximumx/opentensor).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
