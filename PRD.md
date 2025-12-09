# Product Requirements Document: Aspire Playground

## Executive Summary

Aspire Playground is a modern, visual-first development tool that enables developers to build, visualize, and manage Aspire distributed applications through an intuitive drag-and-drop interface powered by React Flow. The platform bridges the gap between visual architecture and code generation, allowing developers to visually design their distributed applications and export production-ready Aspire AppHost code with automatic NuGet package discovery.

**Key Innovation**: Resource data is automatically generated from actual Aspire NuGet packages using the `api-ripper` tool, supplemented by official documentation from aspire.dev, ensuring the playground always reflects the latest Aspire APIs and best practices while preventing drift between documentation and implementation.

## Product Vision

Create the most intuitive and powerful visual development environment for Aspire applications, enabling developers to architect distributed systems visually while maintaining full code-level control and best practices.

## Target Users

- **Primary**: C# developers building distributed applications with Aspire
- **Secondary**: Solution architects designing microservice architectures
- **Tertiary**: Teams learning Aspire and distributed application patterns

## Core Features

### 1. Visual Canvas (React Flow)

#### 1.1 Canvas Interface

- **Fullscreen Layout**: Immersive, distraction-free visual workspace
- **Infinite Canvas**: Pan and zoom capabilities for large architectures
- **Grid/Snap**: Optional grid alignment for organized layouts
- **Minimap**: Overview navigation for complex diagrams
- **Dark/Light Themes**: Match VS Code and modern development environments

#### 1.2 Node Types

**Currently Implemented Resources:**

- **Projects** (5 types):
  - C# Project (`AddProject<T>`) - ASP.NET Core API, Web App, or Worker Service
  - Node.js App (`AddNodeApp`) - Node.js applications with npm/yarn/pnpm
  - Vite App (`AddViteApp`) - React, Vue, or Svelte via Vite
  - Python App (`AddPythonApp`) - Python applications with uv/pip/venv
  - Container (`AddContainer`) - Custom Docker container images

- **Databases** (5 types):
  - PostgreSQL (`AddPostgres`) with optional `AddDatabase`
  - SQL Server (`AddSqlServer`) with optional `AddDatabase`
  - MongoDB (`AddMongoDB`) with optional `AddDatabase`
  - MySQL (`AddMySql`) with optional `AddDatabase`
  - Oracle Database (`AddOracle`) with optional `AddDatabase`

- **Caching** (3 types):
  - Redis (`AddRedis`)
  - Valkey (`AddValkey`) - Redis fork
  - Garnet (`AddGarnet`) - Microsoft cache server

- **Messaging** (3 types):
  - RabbitMQ (`AddRabbitMQ`)
  - Apache Kafka (`AddKafka`)
  - NATS (`AddNats`)

- **AI Services** (2 types):
  - OpenAI (`AddConnectionString`) - OpenAI API integration
  - Ollama (`AddOllama`) - Local LLM hosting

**Total: 18 resource types across 5 categories**

#### 1.3 Connections & Relationships ✅ IMPLEMENTED

**Current Implementation:**

- **Directional Flow**: Resources (databases, cache, messaging, AI) connect TO projects
- **Validation**: Projects can reference resources, but not vice versa
- **Visual Feedback**:
  - Animated edges showing active connections
  - Edge colors inherit from source resource color
  - Handles on top (target) and bottom (source) of nodes
- **Code Generation**:
  - Generates `.WithReference(resourceName)` for each connection
  - Automatically adds `.WaitFor(databaseName)` for database dependencies
  - Topological sort ensures correct declaration order in AppHost code
- **Multi-Reference Support**: Projects can reference multiple resources

### 2. Resource Palette

#### 2.1 Component Library ✅ IMPLEMENTED

**Current Implementation (`ResourcePalette.tsx`):**

- **Fixed Left Panel** (300px width)
- **Back Navigation**: Link to main aspire.dev site
- **Search Box**: Real-time filtering by display name or description
- **Category Filters**:
  - All (default)
  - 💻 Projects & Apps
  - 🗄️ Databases
  - ⚡ Caching
  - 📬 Messaging
  - 🧠 AI & ML
  - 🔧 Compute
- **Resource Cards** display:
  - Icon (imported SVG/PNG images)
  - Display name and category
  - Description
  - Supported languages as badges
  - Color-coded left border
- **Interaction**: Both drag-and-drop AND click to add
- **Scrollable List**: Vertical scroll for many resources

#### 2.2 Node Properties Panel ✅ IMPLEMENTED

**Current Implementation (`AspirePlayground.tsx`):**

- **Context Panel**: Appears bottom-right when node selected
- **Editable Properties**:
  - **Instance Name**: Resource variable name (e.g., "api", "cache", "db")
  - **Database Name**: For database resources that support `.AddDatabase()`
  - Auto-sanitization for C# identifier compliance
- **Actions**:
  - Delete Node button (removes node and all connections)
- **Real-time Sync**: Changes immediately reflected in code generation

### 3. Import/Export Functionality

#### 3.1 Import AppHost ⏳ NOT YET IMPLEMENTED

**Planned Features:**

- File upload (drag-and-drop or file picker)
- Roslyn-based C# parser for AppHost analysis
- Extract builder patterns and relationships
- Automatic visual layout generation
- Error handling and validation

#### 3.2 Export to AppHost ✅ FULLY IMPLEMENTED

**Current Implementation (`codeGenerator.ts`):**

1. **Smart Code Generation**:
   - Topological sort (Kahn's algorithm) for correct dependency order
   - Resources declared before projects that use them
   - Automatic variable name sanitization for C# identifiers
   - Database resources split into server + database declarations

2. **Output Format** (Aspire SDK 13.0.0 style):

```csharp
#:sdk Aspire.AppHost.Sdk@13.0.0
#:package Aspire.Hosting.PostgreSQL@13.0.0
#:package Aspire.Hosting.Redis@13.0.0
#:package Aspire.Hosting.NodeJs@13.0.0

var builder = DistributedApplication.CreateBuilder(args);

var postgres12 = builder.AddPostgres("postgres12")
    .WithLifetime(ContainerLifetime.Persistent);
var postgres12db = postgres12.AddDatabase("postgres12db");

var redis5 = builder.AddRedis("redis5");

var vite_app34 = builder.AddViteApp("vite-app34", "../vite-app34")
    .WithHttpEndpoint(env: "PORT")
    .WithReference(postgres12db)
    .WithReference(redis5)
    .WaitFor(postgres12db);

builder.Build().Run();
```

3. **Features**:
   - **SDK Directives**: Modern `#:sdk` and `#:package` format
   - **NuGet Package Discovery**: Automatic tracking of required packages
   - **WithReference()**: Generated for all connections
   - **WaitFor()**: Added for database dependencies
   - **ContainerLifetime.Persistent**: Added to all database resources
   - **Resource-Specific Configuration**:
     - `.WithHttpEndpoint(env: "PORT")` for Vite apps
     - `.WithHttpEndpoint(targetPort: 8080)` for containers
     - Path hints for projects (e.g., `"../${instanceName}"`)

4. **Copy to Clipboard**: Built-in clipboard API integration

### 4. Code View ✅ IMPLEMENTED

#### 4.1 Resizable Side Panel

**Current Implementation (`CodePreview.tsx`):**

- **Toggle Button**: Top-right panel switches between "🎨 Builder" and "💻 View Code"
- **Resizable Panel**:
  - Drag handle for width adjustment (400px - window width minus 600px)
  - Default width: 600px
  - Smooth resize with mouse tracking
- **Real-time Sync**: Code regenerates on every node/edge change
- **Tabbed Interface**:
  - **📝 AppHost.cs**: Generated C# code with copy button
  - **📦 NuGet Packages**: List of required packages with install commands
  - **🚀 Deploy**: Deployment options and commands

#### 4.2 Code Display Features

**AppHost.cs Tab:**

- Monospace font rendering
- Copy to clipboard button
- Helpful tips explaining:
  - Resource declarations
  - Dependency wiring via `.WithReference()`
  - Running with `aspire run`

**NuGet Packages Tab:**

- Visual package list with 📦 icons
- Auto-generated `dotnet add package` commands
- Copy all commands button
- Empty state message when no resources added

**Deploy Tab:**

- **4 Deployment Options**:
  1. 🏃 Run Locally (`aspire run`)
  2. 🐳 Docker Compose (`aspire deploy --format docker-compose`)
  3. ☸️ Kubernetes (`aspire deploy --format kubernetes`)
  4. ☁️ Azure Container Apps (`azd init` + `azd up`)
- Pro tips for each deployment method

**Note:** Syntax highlighting with Shiki planned but not yet implemented

#### 4.3 Templates ⏳ NOT YET IMPLEMENTED

**Planned Features:**

- Pre-built architecture templates
- Quick-start scenarios
- Community template library

### 5. Collaboration Features (Future)

- **Shareable Links**: Generate URLs for canvas state
- **Export as Image**: PNG/SVG export of architecture diagram
- **Comments**: Annotate nodes with notes
- **Version History**: Track changes over time
- **Team Workspaces**: Shared project spaces

## Technical Architecture

### Data Source Strategy 🎯 CORE PRINCIPLE

**Dual Source of Truth: NuGet Packages + Official Documentation**

The Aspire Playground resource data is **automatically generated** from two authoritative sources:
1. **Technical API Data**: Aspire NuGet packages via `api-ripper` (method signatures, types, parameters)
2. **Human-Readable Content**: Official aspire.dev documentation (descriptions, examples, best practices)

This dual-source approach ensures both technical accuracy and developer-friendly presentation.

#### Integration with api-ripper

**api-ripper** (`E:\GitHub\api-ripper`) is a tool that ingests and parses .NET NuGet packages, extracting API metadata including:
- Extension methods (e.g., `AddPostgres()`, `AddRedis()`)
- Type information and parameters
- XML documentation comments
- Package dependencies and versions

**Workflow:**
1. **Build Phase**: Run `api-ripper` against all Aspire.Hosting.* NuGet packages
2. **Parse Output**: Extract relevant builder extension methods from JSON output
3. **Fetch Documentation**: Scrape or fetch resource documentation from aspire.dev
4. **Merge Data**: Combine technical API data with human-readable descriptions
5. **Generate Resource Data**: Transform merged metadata into `aspire-resources.ts` format
6. **Commit Generated File**: Check in the generated resource definitions

**Example api-ripper Command:**
```powershell
# Download and parse Aspire.Hosting.PostgreSQL
node dist/index.js Aspire.Hosting.PostgreSQL@13.0.0 json --eco dotnet --out artifacts/aspire-resources

# Process all Aspire.Hosting.* packages
$packages = @(
    'Aspire.Hosting.PostgreSQL',
    'Aspire.Hosting.SqlServer',
    'Aspire.Hosting.MongoDB',
    'Aspire.Hosting.Redis',
    'Aspire.Hosting.Kafka',
    'Aspire.Hosting.RabbitMQ',
    'Aspire.Hosting.Nats',
    'Aspire.Hosting.NodeJs',
    'Aspire.Hosting.Python',
    'Aspire.Hosting.Ollama'
)

foreach ($pkg in $packages) {
    node dist/index.js "$pkg@13.0.0" json --eco dotnet --out "artifacts/$pkg"
}
```

**Benefits:**
- ✅ **Always Accurate**: Data matches actual NuGet package APIs
- ✅ **Version-Specific**: Can target specific Aspire versions
- ✅ **Automatic Discovery**: New extension methods automatically detected
- ✅ **Documentation Sync**: XML doc comments + aspire.dev content become resource descriptions
- ✅ **Best Practices**: Examples and patterns from official docs
- ✅ **Type Safety**: Parameter types inform UI generation
- ✅ **Maintainability**: No manual updates needed for Aspire releases
- ✅ **Developer-Friendly**: Human-curated content from aspire.dev enhances auto-generated data

**Implementation Details:**

**New Build Script** (`scripts/generate-resources.ts`):
```typescript
// Parse api-ripper JSON output and aspire.dev docs to generate aspire-resources.ts
interface ApiRipperMethod {
  name: string;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  xmlDoc: { summary: string; remarks?: string };
}

interface AspireDevResource {
  name: string;
  description: string;
  category: string;
  icon?: string;
  examples: string[];
  relatedDocs: string[];
}

interface AspireResource {
  id: string;
  name: string;
  displayName: string;
  category: string;
  hostingMethod: string;
  package: string;
  description: string;
  // ... rest of interface
}

async function generateResourceFromMethod(
  method: ApiRipperMethod, 
  packageName: string,
  aspireDevDocs: AspireDevResource[]
): Promise<AspireResource> {
  // 1. Transform API metadata into resource definition
  // 2. Find matching aspire.dev documentation
  // 3. Merge: API technical details + aspire.dev descriptions
  // 4. Use aspire.dev examples as code samples
  // 5. Infer category from package name + docs metadata
  // 6. Generate rich resource definition
}
```

**Generated Data Structure:**
The current `aspire-resources.ts` file would become **generated**, with a header:
```typescript
/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from Aspire NuGet packages via api-ripper
 * Generation date: 2025-11-25
 * Aspire SDK version: 13.0.0
 * 
 * To regenerate: npm run generate-resources
 */

export interface AspireResource {
  // ... (keep existing interface)
}

export const aspireResources: AspireResource[] = [
  // ... (generated from NuGet packages)
];
```

**Update Process:**
1. New Aspire version releases
2. Run: `npm run generate-resources -- --version=13.1.0`
3. Script downloads NuGet packages, runs api-ripper, generates resource data
4. Review diff, commit updated `aspire-resources.ts`
5. Playground automatically supports new resources

**Phase 2 Enhancement:**
- Parse method overloads to generate configuration options
- Extract parameter types for dynamic property panels
- Build type-safe code generation from actual method signatures
- Support custom resource extensions via plugin API

### Frontend Stack ✅ CURRENT IMPLEMENTATION

**Core Technologies:**

- **Framework**: React 18+ with TypeScript
- **Flow Library**: `@xyflow/react` (React Flow v12+)
  - Custom node type: `aspireNode` (`AspireNode.tsx`)
  - Built-in: MiniMap, Controls, Background (dots variant)
  - Features: Pan, zoom, drag-and-drop, keyboard delete
- **State Management**: React hooks (useState, useCallback, useRef)
  - `useNodesState` and `useEdgesState` from React Flow
  - No external state library (Zustand/Redux) currently
- **UI Styling**: Inline styles with CSS-in-JS
  - CSS custom properties for theming (`var(--sl-color-*)`)
  - Starlight design system integration
  - No Tailwind or component library
- **Build Tool**: Vite (assumed from resource data)
- **Asset Management**: SVG/PNG icons imported as modules

**Component Architecture:**

```
src/
├── components/
│   └── playground/
│       ├── AspirePlayground.tsx    (Main container, 500+ lines)
│       ├── AspireNode.tsx          (Custom node component)
│       ├── ResourcePalette.tsx     (Left sidebar)
│       └── CodePreview.tsx         (Right panel)
├── data/
│   └── aspire-resources.ts         (Resource definitions)
└── utils/
    └── codeGenerator.ts            (AppHost code generation)
```

### Code Generation ✅ IMPLEMENTED

**`codeGenerator.ts` Features:**

- Topological sort (Kahn's algorithm) for dependency ordering
- C# identifier sanitization (alphanumeric + underscore)
- Version-specific package references (@13.0.0)
- Automatic `ContainerLifetime.Persistent` for databases
- Smart reference generation with `.WithReference()` and `.WaitFor()`

### Backend/Services ⏳ FUTURE

**Not Yet Implemented:**

- AppHost import parser (would need Roslyn or TypeScript-based parser)
- Server-side API
- File upload/download services
- Collaboration infrastructure

### Data Model ✅ IMPLEMENTED

**Actual TypeScript Interfaces:**

```typescript
// AspireNode.tsx
export interface AspireNodeData {
  label: string;              // Display name (e.g., "PostgreSQL")
  icon: string;               // Icon path or emoji
  color: string;              // Hex color for borders/edges
  category: string;           // 'database' | 'cache' | 'messaging' | 'ai' | 'project' | 'compute'
  resourceType: string;       // Aspire type: 'postgres', 'redis', 'vite-app', etc.
  instanceName?: string;      // User-editable variable name
  databaseName?: string;      // For database resources with AddDatabase()
}

// aspire-resources.ts
export interface AspireResource {
  id: string;                 // Unique resource ID
  name: string;               // Aspire method name (e.g., "postgres")
  displayName: string;        // Human-readable name
  category: 'database' | 'cache' | 'messaging' | 'ai' | 'compute' | 'project';
  icon: any;                  // Imported image or string
  color: string;              // Hex color
  description: string;        // Resource description
  package: string;            // NuGet package name
  hostingMethod: string;      // Builder method (e.g., "AddPostgres")
  languages: string[];        // Supported languages
  connectionMethod?: string;  // Optional sub-method (e.g., "AddDatabase")
  allowsDatabase?: boolean;   // Supports database sub-resources
  exampleCode: string;        // Code snippet
  nugetPackage?: string;      // Client library package
}

// codeGenerator.ts
export interface GeneratedCode {
  appHost: string;            // Complete AppHost.cs content
  nugetPackages: string[];    // Required package list
  deploymentOptions: string[]; // Deployment commands
}

// React Flow types (from @xyflow/react)
type Node<T> = {
  id: string;
  type: string;               // 'aspireNode'
  position: { x: number; y: number };
  data: T;                    // AspireNodeData
};

type Edge = {
  id: string;
  source: string;             // Source node ID
  target: string;             // Target node ID
  animated?: boolean;         // Animated flow
  style?: { stroke: string }; // Edge color
};
```

## User Flows

### Flow 1: Create New Architecture from Scratch

1. User opens Aspire Playground
2. Browses Resource Palette
3. Drags "PostgreSQL" to canvas
4. Drags "Vite App" to canvas
5. Connects Vite App to PostgreSQL
6. Configures database name in properties panel
7. Clicks "View Code" to see generated AppHost
8. Clicks "Export" to download AppHost.cs

### Flow 2: Import Existing AppHost

1. User clicks "Import AppHost"
2. Selects AppHost.cs file from their project
3. System parses file and renders visual architecture
4. User sees all resources and connections on canvas
5. User modifies architecture (adds Redis cache)
6. User exports updated AppHost.cs
7. User copies updated code back to project

### Flow 3: Learning Aspire Patterns

1. User selects "Microservices Template"
2. Canvas loads with sample architecture
3. User explores connections and configurations
4. User views generated code to learn patterns
5. User modifies and experiments
6. User exports as starting point for new project

## Success Metrics

### Primary Metrics

- **Time to First Architecture**: < 2 minutes for basic app
- **Import Success Rate**: > 95% for standard Aspire projects
- **Export Code Quality**: Pass all Aspire linting and build checks
- **User Adoption**: 10,000+ unique users in first 6 months

### Secondary Metrics

- **Canvas Performance**: 60fps with 50+ nodes
- **User Retention**: 40%+ return within 7 days
- **Template Usage**: 30%+ of projects start from template
- **Community Contributions**: 50+ community templates in first year

## Non-Functional Requirements

### Performance

- **Initial Load**: < 2 seconds on modern browsers
- **Canvas Rendering**: Support 100+ nodes without lag
- **Import/Parse**: < 1 second for typical AppHost files
- **Export Generation**: < 500ms for code generation

### Compatibility

- **Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Aspire Versions**: Support Aspire 8.0+
- **Screen Sizes**: Responsive from 1280px width minimum

### Security

- **Client-Side First**: No server upload for code parsing (privacy)
- **Optional Cloud**: Server-side features opt-in only
- **No Code Storage**: Don't persist user code without permission

### Accessibility

- **WCAG 2.1 AA**: Keyboard navigation, screen reader support
- **Contrast**: Pass all color contrast requirements
- **Focus Management**: Clear focus indicators

## Phases & Timeline

### Phase 1: MVP ✅ COMPLETE

- ✅ React Flow canvas with pan/zoom/minimap
- ✅ 18 resource types across 5 categories
- ✅ Drag-and-drop AND click to add from palette
- ✅ Directional connections (resources → projects)
- ✅ Full AppHost code export with SDK directives
- ✅ Dark theme with Starlight design system
- ✅ Node properties panel (instance name, database name)
- ✅ Resizable code preview panel
- ✅ Three-tab code view (AppHost, Packages, Deploy)
- ✅ Real-time code generation with topological sort
- ✅ Copy to clipboard functionality
- ✅ Delete nodes with keyboard shortcut
- ✅ Connection validation

### Phase 2: Import & Polish (NEXT)

**Priority: Data Source Integration**
- 🎯 **Build system integration with api-ripper + aspire.dev**
  - npm script to generate `aspire-resources.ts` from NuGet packages
  - Parse api-ripper JSON output for extension methods
  - Scrape/fetch aspire.dev for resource documentation and examples
  - Merge technical API data with human-readable docs
  - Extract XML docs + aspire.dev descriptions
  - Auto-detect new Aspire resources
- 🎯 **Automated resource discovery**
  - Scan all Aspire.Hosting.* packages
  - Correlate with aspire.dev component pages
  - Generate resource categories from package + docs metadata
  - Use aspire.dev examples as code templates
  - Version-aware resource support

**UI Enhancements**
- ⏳ AppHost import with C# parsing
- ⏳ Auto-layout algorithm for imported graphs
- ⏳ Syntax highlighting in code view (Monaco Editor or Shiki)
- ⏳ Enhanced validation with error messages
- ⏳ Undo/redo functionality
- ⏳ Advanced properties (environment vars, volumes, ports)
- ⏳ Connection labels and types
- ✅ Search within palette (IMPLEMENTED)
- ⏳ Light theme support

### Phase 3: Advanced Features (FUTURE)

- 🔲 Template library (quick-start architectures)
- 🔲 Export as image/SVG
- 🔲 Local storage persistence (save/load projects)
- 🔲 Custom resource definitions
- 🔲 Multi-select and bulk operations
- 🔲 Canvas alignment tools
- 🔲 Connection routing preferences
- 🔲 Performance optimizations for 100+ nodes
- 🔲 Keyboard shortcuts panel
- 🔲 Tour/onboarding flow

### Phase 4: Collaboration (FUTURE)

- 🔲 Shareable links (URL-based state)
- 🔲 Export/import JSON format
- 🔲 Real-time collaboration (WebSocket)
- 🔲 Comments and annotations on nodes
- 🔲 Version history
- 🔲 Team workspaces
- 🔲 Template marketplace

## Open Questions

1. **Hosting Strategy**: Client-side only (GitHub Pages) or hybrid with backend API?
2. **Parser Implementation**: Browser-based WASM parser or server-side Roslyn?
3. **Persistence**: Local storage, cloud save, or both?
4. **Monetization**: Free tier limits, premium features, or fully open-source?
5. **Community Features**: How to handle template sharing and moderation?

## Dependencies & Risks

### Dependencies

#### External Tools & Data Sources
- **api-ripper** (`E:\GitHub\api-ripper`): 
  - NuGet package parser and API extractor
  - Provides technical API data for resource definitions
  - Node.js/TypeScript based tool
  - Currently supports .NET with stubs for npm, Java, Python
- **aspire.dev**: 
  - Official Aspire documentation site
  - Provides human-readable descriptions, examples, and best practices
  - Component reference pages for each Aspire.Hosting package
  - Integration guides and tutorials

#### Libraries
- **React Flow** (@xyflow/react): Visual canvas and node graph library
- **Aspire SDK**: Target version 13.0.0+ for code generation
- **NuGet Packages**: All Aspire.Hosting.* packages for resource discovery

### Risks

#### Technical Risks
- **api-ripper Dependency**: If api-ripper doesn't parse a package correctly, resources may be missing
  - *Mitigation*: Contribute fixes to api-ripper, maintain fallback manual definitions
- **API Complexity**: Aspire extension methods may be too complex to automatically categorize
  - *Mitigation*: Use package naming conventions to infer categories, allow manual overrides
- **Version Compatibility**: Different Aspire versions may have incompatible APIs
  - *Mitigation*: Support multiple Aspire SDK versions, clear version selector in UI
- **Performance**: Parsing many NuGet packages during build may slow development
  - *Mitigation*: Cache parsed results, only regenerate on version updates

#### Product Risks
- **Maintenance**: Keeping up with Aspire updates and new resource types
  - *Mitigation*: **ELIMINATED by api-ripper integration** - automatic discovery
- **Complexity**: Aspire patterns may be too diverse to fully automate
  - *Mitigation*: Start with common patterns, expand based on usage
- **Browser Performance**: Large architectures may challenge browser rendering
  - *Mitigation*: Virtualization and optimization for large canvases
- **Adoption**: Developers may prefer code-first approaches
  - *Mitigation*: Clear value proposition: speed + learning + visualization

### Mitigations Summary

✅ **Primary Mitigation**: The api-ripper integration **eliminates the maintenance burden** of keeping resource data in sync with Aspire releases. This is the core architectural decision that makes the project sustainable long-term.

## Appendix

### Competitive Analysis

- **aspire.dev Official Docs**: Excellent documentation but no visual design tool (we complement, not compete)
- **Azure Portal Resource Visualizer**: Limited to Azure resources, no Aspire-specific support
- **AWS Application Composer**: AWS-specific, not .NET/C# focused
- **Terraform Graph**: View-only, no visual editing
- **Diagrams.net**: Generic diagramming, no Aspire code generation

**Aspire Playground Differentiators:**
- Only tool purpose-built for Aspire
- Bidirectional: visual → code AND code → visual (planned)
- Auto-synced with NuGet packages + aspire.dev docs
- Integrated with official aspire.dev ecosystem

### Aspire Resource Reference (Currently Implemented)

**Builder Methods Supported:**

**Projects:**

- `AddProject<T>()` - C# projects
- `AddNodeApp(name, path)` - Node.js apps
- `AddViteApp(name, path)` - Vite-based frontends
- `AddPythonApp(name, path, script)` - Python apps
- `AddContainer(name, image, tag)` - Docker containers

**Databases:**

- `AddPostgres(name)` + `.AddDatabase(dbName)`
- `AddSqlServer(name)` + `.AddDatabase(dbName)`
- `AddMongoDB(name)` + `.AddDatabase(dbName)`
- `AddMySql(name)` + `.AddDatabase(dbName)`
- `AddOracle(name)` + `.AddDatabase(dbName)`

**Caching:**

- `AddRedis(name)`
- `AddValkey(name)`
- `AddGarnet(name)`

**Messaging:**

- `AddRabbitMQ(name)`
- `AddKafka(name)`
- `AddNats(name)`

**AI:**

- `AddConnectionString(name)` - OpenAI
- `AddOllama(name)`

**Chaining Methods (Auto-Generated):**

- `.WithReference(resource)` - All connections
- `.WaitFor(resource)` - Database dependencies
- `.WithLifetime(ContainerLifetime.Persistent)` - All databases
- `.WithHttpEndpoint(env: "PORT")` - Vite apps
- `.WithHttpEndpoint(targetPort: 8080)` - Containers

**NuGet Packages (Aspire SDK 13.0.0):**

- Aspire.AppHost.Sdk@13.0.0
- Aspire.Hosting.PostgreSQL@13.0.0
- Aspire.Hosting.SqlServer@13.0.0
- Aspire.Hosting.MongoDB@13.0.0
- Aspire.Hosting.MySql@13.0.0
- Aspire.Hosting.Oracle@13.0.0
- Aspire.Hosting.Redis@13.0.0
- Aspire.Hosting.Valkey@13.0.0
- Aspire.Hosting.Garnet@13.0.0
- Aspire.Hosting.RabbitMQ@13.0.0
- Aspire.Hosting.Kafka@13.0.0
- Aspire.Hosting.Nats@13.0.0
- Aspire.Hosting.NodeJs@13.0.0
- Aspire.Hosting.Python@13.0.0
- Aspire.Hosting.Ollama@13.0.0

---

**Document Version**: 2.0  
**Last Updated**: November 25, 2025  
**Owner**: Engineering Team  
**Status**: Updated with Current Implementation Details
