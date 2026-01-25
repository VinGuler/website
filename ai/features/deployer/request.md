# Deployer Application Overview

## Purpose

The **Deployer** is a local web application for managing production deployments of monorepo packages. It provides a unified interface to:

- Deploy packages as production apps to various hosting vendors
- Choose between different vendors and pricing plans
- Track deployment history and view deployment statistics
- Monitor app health and deployment status

This is **not an AI-powered deployment tool** — it's a deterministic, safe, and transparent deployment manager that runs locally.

---

## Core Features

### 1. Package Management
- **Automatic scanning** of `/packages` directory
- **Package detection and analysis**:
  - Type: frontend, backend, or full-stack
  - Build tool: Vite, webpack, TypeScript, etc.
  - Framework: Vue, React, Express, etc.
  - Node version requirements
  - Database dependencies
  - Required environment variables

### 2. Vendor & Plan Selection
- **Multiple vendor support**:
  - Frontend: Vercel, Netlify, Cloudflare Pages
  - Backend: Railway, Render, Fly.io
- **Plan comparison**:
  - Cost estimates (monthly ranges)
  - Feature comparisons
  - Performance characteristics
  - Limitations per vendor/plan

### 3. Deployment Execution
- **One-click deployments** with vendor-specific adapters
- **Real-time progress tracking** with status updates
- **Deployment logs** for debugging
- **Environment variable management** (secure, gitignored)

### 4. Deployment Statistics & History
- **Per-package stats**:
  - Total deployment count
  - Last deployment timestamp
  - Current deployment status
  - Deployment URL
- **Full deployment history**:
  - All historical deployments
  - Success/failure tracking
  - Deployment duration
  - Logs archive

---

## Technical Architecture

### Stack
- **Backend**: Express.js + TypeScript
- **Frontend**: HTML + TypeScript (minimal, no heavy framework)
- **Data Storage**: JSON files (local persistence)
- **Deployment**: Vendor CLI/API adapters

### Key Services
1. **Scanner** - Detects packages in monorepo
2. **Analyzer** - Classifies packages and extracts metadata
3. **Planner** - Generates deployment recommendations
4. **Executor** - Executes deployments via vendor adapters
5. **Data Service** - Persists packages and deployment records

### Security
- Environment variables stored in gitignored `.env` file
- No plain-text secrets in deployment records
- Local-only operation (no external AI/cloud dependencies)

---

## User Workflow

1. **Scan** - Analyze monorepo packages
2. **Review** - View detected packages and their characteristics
3. **Plan** - Review suggested vendors and plans for each package
4. **Configure** - Select vendor, set environment variables
5. **Deploy** - Execute deployment with real-time feedback
6. **Monitor** - View deployment stats, history, and app status

---

## Design Principles

- **Deterministic**: Same input = same output, no magic
- **Safe**: Explicit confirmations, no destructive operations
- **Transparent**: Show all steps, logs, and configuration
- **Local-first**: Runs entirely on developer's machine
- **Vendor-agnostic**: Support multiple hosting providers
- **Simple**: Minimal UI, focused functionality
