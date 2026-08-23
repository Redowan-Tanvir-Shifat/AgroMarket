# 🌿 AgroMarket - Team Git Branching & Workflow Guide

This guide details the 3-tier branching strategy for team collaboration: personal development on your personal branch (`redowan`), integration on the shared team branch (`dev`), and production deployment on `main`.

---

## 🔀 3-Tier Branching Strategy

| Branch | Purpose | Who Works Here |
| :--- | :--- | :--- |
| **`redowan`** | Personal Feature Branch (Daily Coding) | You |
| **`dev`** | Shared Team Integration Branch | You + Teammates |
| **`main`** | Production Release Branch | Project Lead |

---

## 💻 Step 1: Daily Development (Working on `redowan`)

Always work on your personal branch `redowan`:

```bash
# Check current active branch
git branch

# Switch to redowan branch
git checkout redowan

# Stage, commit & push your daily work to your remote redowan branch
git add .
git commit -m "Implement feature X"
git push origin redowan
```

---

## 🤝 Step 2: Merge Your Work into Shared `dev` Branch (Team Integration)

When a feature on `redowan` is complete and ready to share with your teammate:

```bash
# A. Make sure redowan is up to date
git checkout redowan
git add .
git commit -m "Finalize feature before merging to dev"
git push origin redowan

# B. Switch to dev branch and pull latest team updates
git checkout dev
git pull origin dev

# C. Merge redowan into dev
git merge redowan

# D. Push updated dev branch to GitHub so your teammate gets your changes
git push origin dev

# E. Switch back to your redowan branch to continue coding
git checkout redowan
```

---

## 🚀 Step 3: Merge `dev` into `main` (Production Release)

When all team features on `dev` are tested and ready for production release:

```bash
# A. Switch to main and pull latest main
git checkout main
git pull origin main

# B. Merge dev into main
git merge dev

# C. Push to main on GitHub
git push origin main

# D. Switch back to redowan branch
git checkout redowan
```

---

## 🛠 Useful Helper Commands

* **Check current active branch**: `git branch`
* **Check status & modified files**: `git status`
* **Sync your `redowan` branch with latest team `dev`**:
  ```bash
  git checkout redowan
  git merge dev
  ```
