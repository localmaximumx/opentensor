# OpenTensor

<p align="center">
  <img src="public/images/logos/opentensor.svg" alt="OpenTensor Logo" width="80" height="80" />
</p>

<h3 align="center">Master Machine Learning & AI Engineering From Scratch</h3>

<p align="center">
  An open, modern interactive platform for machine learning systems, deep learning algorithms, CUDA kernels, and technical AI interview preparation.
</p>

---

## 🌟 Highlights

- **1,170+ Interactive Problems**: Vectorized NumPy, PyTorch modules, CUDA & Triton kernels, Transformer architectures, and classic ML.
- **In-Browser WebAssembly Python (Pyodide)**: Zero-server Python execution environment running directly in the browser with live stdout/stderr and sub-millisecond execution checks.
- **Vercel Serverless Backend (`/api`)**: Built-in user authentication (username + password), multi-user profile management, submission tracking, and persistent code draft syncing.
- **20+ Verified Test Cases on Submit**: Thorough evaluation test suites covering numerical tolerances, edge cases, broadcasting dimensions, and boundary values.
- **Technical Interview Tracks**: Comprehensive FAANG-style machine learning engineering interview sets with real-world scenarios and mathematical formulations.
- **Landmark Research Paper Implementations**: Attention Is All You Need, ResNet, BERT, VGG, Vision Transformers, and more with high-resolution interactive architecture diagrams.
- **VS Code Monaco Editor**: Syntax highlighting, autocompletion, bracket matching, and shortcut keybindings.
- **KaTeX Mathematical Typesetting**: Crisp rendering of LaTeX tensor calculus, matrix dimensions, and loss formulations.

---

## 🏗️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router 7
- **Editor & UI**: Monaco Editor (`@monaco-editor/react`), Lucide React Icons, Canvas Confetti
- **Math Rendering**: KaTeX
- **Code Execution**: Pyodide (WebAssembly Python 3.12 + NumPy)
- **Backend & API**: Vercel Serverless Functions (`/api/*`), Node.js Crypto SHA-256
- **Storage / Persistence**: Vercel KV / Cloud Database with dual-mode offline fallback

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/localmaximumx/opentensor.git
cd opentensor
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
```

---

## ☁️ Deployment

### Deploying to Vercel

1. Push your repository to GitHub under `localmaximumx/opentensor`.
2. Go to [Vercel](https://vercel.com/new) and click **Import Git Repository**.
3. Vercel automatically detects the Vite configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.
5. *(Optional for Cloud Sync)*: Go to your Vercel Project Dashboard -> **Storage** -> **Create Database** -> **KV** (or Postgres) to enable multi-device cloud synchronization.

---

## 📄 License

MIT License. Open for the AI and Machine Learning Engineering community.
