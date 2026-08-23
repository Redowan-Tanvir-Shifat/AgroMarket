# 🌿 AgroMarket - Git Branching & Merge Workflow Guide

This guide details the step-by-step process for working on the `dev` branch daily, committing changes safely, and merging into the production `main` branch when features are tested and approved.

---

## 🔀 Overview of Branching Strategy

* **`dev` Branch**: Your primary active working branch. All day-to-day coding, feature building, and UI fixes happen here.
* **`main` Branch**: Production-ready code only. Updated by merging from `dev`.

---

## 💻 Step-by-Step Daily Workflow

### 1. Daily Development (Working on `dev`)
Always ensure you are on the `dev` branch before starting work:

```bash
# Check current active branch
git branch

# Switch to dev branch if not already on it
git checkout dev
```

---

### 2. Save & Push Work to `dev` Branch
At the end of a work section or day, commit and push your changes to `dev`:

```bash
# Step A: Stage all modified files
git add .

# Step B: Commit changes with a descriptive message
git commit -m "Add Day 2 features and UI updates"

# Step C: Push commits to GitHub dev branch
git push origin dev
```

---

## 🚀 How to Merge `dev` into `main` (When Everything is Ready)

When all features on `dev` are tested, verified, and ready for production release, follow these 4 steps:

### Step 1: Ensure `dev` is clean and committed
```bash
git checkout dev
git add .
git commit -m "Finalize Day 2 updates"
git push origin dev
```

### Step 2: Switch to `main` branch
```bash
git checkout main
```

### Step 3: Merge `dev` into `main`
```bash
git merge dev
```
*(This brings all commits from `dev` directly into `main`)*

### Step 4: Push updated `main` to GitHub
```bash
git push origin main
```

---

## 🔁 Return to `dev` for Next Day's Work

Once `main` is updated, **always switch back to `dev`** to continue building new features:

```bash
git checkout dev
```

---

## 🛠 Useful Git Helper Commands

* **Check current status & modified files**: `git status`
* **Check commit history**: `git log --oneline -n 5`
* **List local and remote branches**: `git branch -a`
