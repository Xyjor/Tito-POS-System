# Shop POS System

A modern, offline-first desktop Point of Sale (POS) system built with Tauri, React, TypeScript, and Tailwind CSS. Designed for small businesses like educational supply stores and sari-sari shops to manage inventory and process sales locally without internet dependency.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-2-orange.svg)

## Features

### Point of Sale
- **Fast Checkout** - Category filters, search, and quick add to cart
- **Flexible Payments** - Cash checkout with automatic change calculation
- **Discount Support** - Apply discounts per transaction
- **Receipt Printing** - Print and reprint receipts in 80mm format

### Inventory Management
- **Product Management** - Add, edit, and manage product information
- **Stock Tracking** - Real-time inventory adjustments
- **Product Categories** - Organize products by category
- **Deactivation** - Deactivate products without deleting data

### Sales & Analytics
- **Sales History** - View all completed transactions
- **Receipt Reprinting** - Reprint any historical receipt
- **Transaction Details** - Track items, quantities, and discounts

### System Features
- **Offline Operation** - Works completely offline with local SQLite database
- **Cross-Platform** - Windows, macOS, Linux support via Tauri
- **Configurable** - Shop settings for receipt headers and customization
- **Data Persistence** - Automatic data synchronization with local database

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Tailwind CSS v4
- **Desktop Framework**: Tauri 2
- **Routing**: React Router v7
- **Database**: SQLite
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (AppLayout, Sidebar)
│   ├── pos/            # POS-specific components
│   └── ui/             # Generic UI components
├── pages/              # Page components
│   ├── PosPage         # Main POS interface
│   ├── ProductsPage    # Product management
│   ├── SalesPage       # Sales history
│   └── SettingsPage    # Application settings
├── context/            # React context (CartContext)
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
├── assets/             # Static assets
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── styles.css          # Global styles
```

## Installation

### Prerequisites
- Node.js 16+ and npm
- Rust (for Tauri development)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Shop POS System"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

## Development

### Start Development Server
```bash
npm run dev          # Start Vite dev server
npm run tauri:dev    # Start with Tauri dev window
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint         # Check for issues
npm run lint:fix     # Fix issues automatically

# Formatting
npm run format       # Format code with Prettier

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Build for Production

```bash
# Full build with checks
npm run build

# Tauri desktop build
npm run tauri:build
```

Installers are generated in `src-tauri/target/release/bundle/` (MSI, NSIS for Windows, DMG for macOS, AppImage for Linux).

## Database

The SQLite database is stored in the application data directory:
- **Windows**: `%APPDATA%\com.shoppos.desktop\shop_pos.db`
- **macOS**: `~/Library/Application Support/com.shoppos.desktop/shop_pos.db`
- **Linux**: `~/.local/share/com.shoppos.desktop/shop_pos.db`

### Default Seed Data
The application ships with:
- 7 product categories
- 15 sample products covering educational items and general store goods

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run tauri:dev` | Start development with Tauri window |
| `npm run build` | Build for production |
| `npm run tauri:build` | Build desktop application installers |
| `npm run type-check` | Check TypeScript types |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests with Vitest |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Generate test coverage |

## Configuration Files

- **vite.config.ts** - Vite build configuration with path aliases and optimizations
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.js** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration
- **.eslintrc.js** - ESLint rules
- **.prettierrc** - Prettier formatting options
- **vitest.config.ts** - Vitest testing configuration

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) guide for details on:
- Code style and standards
- Testing requirements
- Commit message conventions
- Pull request process

## Browser Support

This desktop application runs on:
- Windows 10+
- macOS 10.13+
- Linux (Ubuntu 16.04+, Debian, Fedora, etc.)

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on the project repository.

## Roadmap

Future features under consideration:
- Mobile app version
- Cloud synchronization
- Advanced reporting
- Multi-user support with authentication
- Barcode scanning integration
- Multiple payment methods
- Inventory forecasting

---

Made with ❤️ for small businesses
