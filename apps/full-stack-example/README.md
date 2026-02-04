# Full-Stack Example

A simple full-stack Todo application demonstrating a complete TypeScript-based client-server architecture.

## Overview

This example includes:

- **Server**: Express-based REST API with todo CRUD operations
- **Client**: Vanilla TypeScript frontend that consumes the API
- **TypeScript**: Both client and server are written in TypeScript

## Features

- Add, complete, and delete todos
- In-memory data storage (resets on server restart)
- Clean, modern UI with gradient background
- Type-safe API communication

## Project Structure

```
packages/full-stack-example/
├── src/
│   ├── server/
│   │   └── index.ts          # Express server with REST API
│   └── client/
│       ├── app.ts            # Client-side TypeScript
│       └── tsconfig.json     # Client TypeScript config
├── public/
│   ├── index.html            # HTML template
│   └── styles.css            # Styles
├── package.json
└── tsconfig.json             # Server TypeScript config
```

## Getting Started

### Install dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

This will:

1. Build the client TypeScript to JavaScript
2. Start the server in watch mode
3. Automatically rebuild the server on changes

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
  - Body: `{ "text": "Todo text" }`
- `PUT /api/todos/:id` - Update a todo
  - Body: `{ "completed": true/false }`
- `DELETE /api/todos/:id` - Delete a todo

## Scripts

- `dev` - Start development server with watch mode
- `build` - Build both client and server for production
- `build:server` - Build server only
- `build:client` - Build client only
- `start` - Start production server
- `type-check` - Run TypeScript type checking

## Technologies

- **Runtime**: Node.js
- **Language**: TypeScript
- **Server Framework**: Express
- **Build Tool**: TypeScript Compiler (tsc)
- **Dev Tools**: tsx (for watch mode)
