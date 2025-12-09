# Aspire Playground

Visual-first development tool for Aspire distributed applications. Build your Aspire architectures visually and export production-ready code.

## ✨ Features

### Phase 1: Core Playground ✅
- 🎨 **Visual Canvas**: Drag-and-drop interface powered by React Flow v12
- 📚 **Resource Palette**: Browse and search 18+ Aspire resources across 5 categories
- ⚡ **Real-time Code Generation**: Instant C# AppHost code updates with topological sort
- 📋 **Code Export**: Copy generated code to clipboard
- 🌙 **Dark Theme**: Matches Starlight design system from aspire.dev

### Phase 2: Enhanced Interactions ✅
- ⚙️ **Configuration Panel**: Double-click nodes to configure env vars, ports, volumes, replicas
- 🔗 **Connection Validation**: Prevents invalid connections (database-to-database)
- ⌨️ **Keyboard Shortcuts**: Delete, Ctrl+Z/Y (Undo/Redo), Ctrl+C/V (Copy/Paste)
- 🎯 **Multi-Select**: Select and manipulate multiple nodes at once
- 📜 **Undo/Redo History**: Full change tracking

### Phase 3: Templates & Code Generation ✅
- 📋 **Template Gallery**: 6 pre-built architecture patterns
  - Web API + PostgreSQL, Microservices, Full Stack, AI Chatbot, Event-Driven, Multi-Database
- 📦 **Enhanced Code Generation**: Program.cs, appsettings.json, Dockerfile, Azure manifest
- 🚀 **Deployment Options**: Local, Docker Compose, Kubernetes, Azure Container Apps

### Phase 4: Documentation & Validation ✅
- 📖 **Documentation Panel**: Integrated docs with examples and Microsoft Learn links
- ✅ **Real-time Validation**: Architecture quality checks (errors, warnings, suggestions)
- 🎯 **Best Practices**: Security, performance, reliability recommendations
- 🚨 **Anti-pattern Detection**: Circular dependencies, unused resources, missing configs

### Phase 5: Advanced Features ✅
- 💾 **Import/Export**: Save and load playground configurations as JSON
- 🎭 **Template System**: One-click architecture deployment
- 🔧 **API-Ripper Integration**: Auto-generate resource definitions from NuGet packages
- 🎯 **Dual-Source Strategy**: Technical data from packages + human-curated content

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the playground.

### Build

```bash
npm run build
```

## 🎮 Usage Guide

### Building Your First Architecture

1. **Browse Resources**: Use the left panel to explore available Aspire resources
   - Search by name or description
   - Filter by category (Projects, Database, Cache, Messaging, AI)
   - Click "📖 View Docs" to see detailed documentation

2. **Add Resources**: Drag resources from the palette onto the canvas
   - Each resource becomes a node
   - Double-click to configure (name, env vars, ports, etc.)

3. **Create Connections**: Drag from the right handle of one node to the left handle of another
   - Valid connections are automatically validated
   - Invalid connections (e.g., database-to-database) are prevented

4. **Configure Nodes**: Double-click any node to open the configuration panel
   - Set instance names
   - Add environment variables
   - Configure port mappings (for containers)
   - Mount volumes
   - Set replica count
   - Enable persistent storage (for databases)

5. **View Generated Code**: Check the right panel for:
   - **Program.cs**: AppHost code with dependencies
   - **Packages**: Required NuGet packages
   - **Settings**: appsettings.json configuration
   - **Dockerfile**: Container definitions
   - **Azure**: Azure Container Apps manifest
   - **Deploy**: Deployment commands

6. **Use Templates**: Click "📋 Templates" to start with pre-built architectures
   - Web API + Database
   - Microservices patterns
   - Full-stack applications
   - AI/ML scenarios

7. **Validate Your Design**: Enable validation to see real-time feedback
   - Errors (must fix)
   - Warnings (should fix)
   - Suggestions (nice to have)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected nodes/edges |
| `Ctrl+Z` | Undo last change |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Copy selected nodes |
| `Ctrl+V` | Paste copied nodes |
| Double-click node | Open configuration panel |

### Tips & Tricks

- **Multi-Select**: Click and drag to select multiple nodes, or hold Ctrl and click
- **Pan Canvas**: Click and drag on empty space, or use middle mouse button
- **Zoom**: Use mouse wheel or zoom controls in bottom-right
- **Mini-Map**: Toggle mini-map for navigation (bottom-left)
- **Validation**: Click "✓ Validation" button to toggle validation panel
- **Export/Import**: Save your work with Export button, restore with Import

### Generate Resource Data

To regenerate resource definitions from Aspire NuGet packages:

```bash
npm run generate-resources
```

## Project Structure

```
src/
├── components/
│   └── playground/
│       ├── AspirePlayground.tsx    # Main container
│       ├── AspireNode.tsx          # Custom node component
│       ├── ResourcePalette.tsx     # Left sidebar
│       └── CodePreview.tsx         # Right panel
├── data/
│   └── aspire-resources.ts         # Resource definitions (auto-generated)
├── utils/
│   └── codeGenerator.ts            # AppHost code generation
└── main.tsx                        # Entry point
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **@xyflow/react** - Visual canvas
- **api-ripper** - NuGet package parser

## Documentation

See [PRD.md](./PRD.md) for the full product requirements document.

## Related Projects

- [Aspire](https://aspire.dev/docs) - Official documentation
- [aspire.dev](https://aspire.dev) - Official Aspire site
- [api-ripper](https://github.com/yourusername/api-ripper) - NuGet package parser

## License

MIT
