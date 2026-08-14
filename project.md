# Buffer

## Browser-Based Node Image Processing Engine

Buffer is a browser-based visual image-processing workspace where users construct image-processing pipelines by connecting nodes and see results in real time.

The MVP is **100% client-side**.

---

# 1. Non-Negotiable Architecture

## NO BACKEND

Do not build or introduce:

* Node.js backend
* Express
* NestJS
* Next.js API routes
* Supabase
* PostgreSQL
* Firebase
* REST API
* GraphQL
* authentication
* cloud storage
* server-side image processing
* remote database
* cloud rendering

Everything runs inside the browser.

Use:

* React
* Zustand
* Canvas
* ImageData
* Web Workers
* IndexedDB
* File API
* Blob API
* browser memory

Images never need to leave the user's device.

Projects are stored locally using IndexedDB.

---

# 2. Product

Users should be able to:

1. Import an image.
2. Add processing nodes.
3. Connect nodes.
4. Configure node parameters.
5. Preview the result.
6. Rearrange the pipeline.
7. Undo/redo.
8. Save projects locally.
9. Inspect processing performance.
10. Export processed images.

Example:

```text
Image
  ↓
Resize
  ↓
Blur
  ↓
Color
  ↓
Export
```

---

# 3. Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* React Flow

## Browser APIs

* Canvas API
* ImageData
* File API
* Blob API
* URL.createObjectURL
* IndexedDB
* Web Workers
* OffscreenCanvas where supported

Do not add unnecessary dependencies.

---

# 4. Project Structure

```text
src/
├── app/
│   └── App.tsx
│
├── components/
│   ├── canvas/
│   ├── editor/
│   ├── nodes/
│   ├── inspector/
│   ├── toolbar/
│   ├── sidebar/
│   ├── profiler/
│   └── ui/
│
├── engine/
│   ├── core/
│   │   ├── pipeline.ts
│   │   ├── executor.ts
│   │   ├── graph.ts
│   │   ├── cache.ts
│   │   ├── scheduler.ts
│   │   └── types.ts
│   │
│   ├── nodes/
│   │   ├── input/
│   │   ├── transform/
│   │   ├── filters/
│   │   ├── color/
│   │   ├── composite/
│   │   └── output/
│   │
│   ├── workers/
│   │   └── image.worker.ts
│   │
│   └── utils/
│
├── store/
│   ├── editor.store.ts
│   ├── pipeline.store.ts
│   ├── project.store.ts
│   └── history.store.ts
│
├── persistence/
│   ├── indexeddb.ts
│   ├── project-storage.ts
│   └── migrations.ts
│
├── hooks/
├── lib/
├── types/
└── styles/
```

Keep engine logic independent from UI logic.

---

# 5. UI Layout

```text
┌───────────────────────────────────────────────────────────────┐
│ BUFFER        File  Edit  View          Undo Redo      Export │
├──────────────┬──────────────────────────────┬─────────────────┤
│   ASSETS     │                              │   INSPECTOR     │
│              │                              │                 │
│ image.png    │                              │ Node: Blur      │
│ texture.png  │          CANVAS              │                 │
│              │                              │ Radius          │
│              │                              │ ─────●────      │
│              │                              │                 │
├──────────────┴──────────────────────────────┴─────────────────┤
│                         NODE GRAPH                            │
│                                                               │
│ [Image] → [Resize] → [Blur] → [Color] → [Export]             │
└───────────────────────────────────────────────────────────────┘
```

Keep the UI functional and dense.

Avoid unnecessary:

* gradients
* glassmorphism
* excessive rounded cards
* decorative animations
* fake statistics
* fake processing states

---

# 6. Node Architecture

Every node should follow a common structure.

```ts
interface ProcessingNode {
  id: string;
  type: string;
  name: string;
  category: NodeCategory;

  inputs: NodePort[];
  outputs: NodePort[];

  parameters: NodeParameter[];

  process(
    input: NodeInput,
    parameters: Record<string, unknown>
  ): Promise<NodeOutput>;
}
```

Adding a new node should not require changes to the core execution engine.

A new node should primarily require:

1. Metadata.
2. Parameters.
3. Processing function.
4. Registration.

---

# 7. Node Categories

```text
Input
Transform
Filter
Color
Composite
Output
```

---

# 8. Input Nodes

## Image

Loads an imported image into the pipeline.

Output:

```text
ImageData
```

---

# 9. Transform Nodes

Implement:

### Resize

Parameters:

* width
* height
* maintain aspect ratio

### Crop

Parameters:

* x
* y
* width
* height

### Rotate

Parameters:

* angle

Support:

* 90°
* 180°
* 270°
* custom angle

### Flip

Parameters:

* horizontal
* vertical

---

# 10. Filter Nodes

Implement:

### Blur

* radius

### Sharpen

* strength

### Grayscale

### Invert

### Brightness

* brightness

### Contrast

* contrast

### Saturation

* saturation

---

# 11. Color Nodes

Implement:

### Hue

* hue rotation

### Exposure

* exposure

### Temperature

* temperature

### Tint

* tint

---

# 12. Composite Nodes

## Blend

Inputs:

```text
Image A
Image B
```

Parameters:

```text
mode
opacity
```

Initial modes:

* normal
* multiply
* screen
* overlay
* darken
* lighten

## Mask

Inputs:

```text
Image
Mask
```

## Opacity

Parameter:

```text
opacity
```

---

# 13. Output Nodes

## Preview

Displays the current pipeline output on the main canvas.

## Export

Support:

* PNG
* JPEG
* WebP

Parameters:

* filename
* dimensions
* quality

---

# 14. Graph Execution

The engine must:

1. Read the graph.
2. Validate it.
3. Detect cycles.
4. Resolve dependencies.
5. Topologically sort nodes.
6. Execute nodes in dependency order.
7. Reuse cached results.
8. Invalidate affected downstream nodes.
9. Produce the final output.

Example:

```text
Image
  ↓
Resize
  ↓
Blur
  ↓
Color
```

If Color changes, do not recalculate Image, Resize, or Blur.

---

# 15. Cycle Detection

Detect:

```text
A → B → C → A
```

Display:

```text
Pipeline Error

Circular dependency detected.

Blur → Color → Resize → Blur
```

The editor must remain usable.

---

# 16. Node Cache

Cache processing results.

Example:

```text
Image
  ↓
Resize
  ↓
Blur
  ↓
Color
```

Changing Color should reuse cached results from:

```text
Image
Resize
Blur
```

Cache identity should account for:

* node type
* parameters
* upstream result identity
* relevant asset identity

Avoid repeatedly hashing massive ImageData buffers if version/identity tracking can solve the problem.

---

# 17. Processing Architecture

```text
Main Thread
     ↓
Pipeline State
     ↓
Scheduler
     ↓
Web Worker
     ↓
Image Processing
     ↓
Result Cache
     ↓
Canvas
```

Heavy processing must not block the UI.

---

# 18. Web Worker

Create:

```text
src/engine/workers/image.worker.ts
```

Jobs should contain:

```ts
{
  jobId,
  nodeType,
  input,
  parameters
}
```

Results should contain:

```ts
{
  jobId,
  result,
  duration
}
```

Use transferable objects where appropriate.

Avoid unnecessary copies of pixel data.

---

# 19. Scheduler

The scheduler manages:

* job queue
* processing priority
* stale jobs
* cancellation where practical
* execution timing

Example:

```text
User changes Blur:
5 → 10 → 20 → 30

Jobs 5, 10 and 20 become obsolete.

Only the latest valid result should reach the canvas.
```

Older worker results must never overwrite newer results.

---

# 20. Canvas

Support:

* zoom
* pan
* fit-to-screen
* 100%
* reset
* transparency checkerboard

Maintain:

```text
zoom
offsetX
offsetY
```

Keep image coordinates and screen coordinates separate.

Do not scatter coordinate calculations across components.

---

# 21. Assets

Support:

* PNG
* JPEG
* WebP

Users can:

* upload images
* view assets
* reuse assets
* delete assets
* drag assets into the graph

Dragging an image onto the graph creates an Image node.

Assets remain local.

---

# 22. Node Interaction

Nodes must support:

* select
* move
* connect
* disconnect
* duplicate
* delete
* edit parameters
* context menu

States:

```text
Idle
Processing
Success
Cached
Error
```

---

# 23. Node Search

Provide:

```text
Add Node

Search...

Blur
Brightness
Contrast
Crop
Grayscale
Hue
Image
Invert
Resize
Rotate
Saturation
Sharpen
```

Support keyboard navigation.

---

# 24. Inspector

Selecting a node displays its parameters.

Example:

```text
BLUR

Radius
────────●──────
8 px
```

The inspector only modifies state.

Processing belongs to the engine.

---

# 25. Undo / Redo

Support:

```text
Ctrl/Cmd + Z
Ctrl/Cmd + Shift + Z
```

Track:

* node creation
* node deletion
* node movement
* connections
* parameter changes
* duplication

Do not store complete ImageData buffers in history.

---

# 26. IndexedDB

Use IndexedDB for local persistence.

Store:

```text
Project
├── metadata
├── nodes
├── edges
├── assets
├── parameters
└── settings
```

Support:

* new project
* save
* load
* delete
* duplicate
* autosave

No remote database.

---

# 27. Project Format

Use a versioned format:

```json
{
  "version": 1,
  "name": "My Image Pipeline",
  "nodes": [],
  "edges": [],
  "assets": [],
  "settings": {}
}
```

Create migrations for future versions.

---

# 28. Large Images

Set a reasonable MVP limit.

Initial target:

```text
4096 × 4096
```

If exceeded, warn the user and offer resizing.

Do not allow accidental memory exhaustion.

---

# 29. Performance Profiler

Build:

```text
PIPELINE PERFORMANCE

Image          0.8 ms
Resize         2.1 ms
Blur          14.8 ms
Color          1.2 ms
Export         4.3 ms
────────────────────
Total         23.2 ms
```

Track:

* execution time
* percentage of total time
* cache hits
* cache misses
* execution count
* image dimensions

Highlight expensive nodes.

Do not invent benchmark numbers.

---

# 30. Performance Requirements

Do not:

* process images during React render
* store huge ImageData objects in Zustand
* duplicate pixel buffers unnecessarily
* block the main thread
* recompute unchanged nodes
* rerender the entire graph for one parameter change

Keep large binary data outside normal React state where practical.

---

# 31. Error Handling

A failed node must not crash the application.

Display:

```text
Node Error

Unable to process image.

Reason:
Unsupported image dimensions.

[Retry]
```

Downstream nodes should become invalid until the problem is fixed.

---

# 32. Export

Export locally.

Formats:

* PNG
* JPEG
* WebP

No server-side processing.

No upload required.

---

# 33. Keyboard Shortcuts

Implement:

```text
Ctrl/Cmd + Z          Undo
Ctrl/Cmd + Shift + Z  Redo
Ctrl/Cmd + S          Save
Delete                Delete node
Ctrl/Cmd + C          Copy
Ctrl/Cmd + V          Paste
Ctrl/Cmd + D          Duplicate
Space                 Pan
```

---

# 34. Command Palette

Commands:

```text
Add Blur Node
Add Resize Node
Fit Canvas
Zoom 100%
Save Project
Export Image
Toggle Profiler
Toggle Inspector
```

---

# 35. State Architecture

Separate:

```text
Editor State
- selected nodes
- viewport
- panels

Pipeline State
- nodes
- edges
- parameters

Project State
- metadata
- assets
- persistence

History State
- undo
- redo

Runtime State
- jobs
- progress
- errors
- cache metadata
```

Do not put everything into one Zustand store.

---

# 36. Testing

Test the engine heavily.

## Graph

* topological sorting
* dependency resolution
* cycle detection
* invalidation
* downstream traversal

## Image Processing

* grayscale
* invert
* brightness
* contrast
* blur
* resize
* crop
* rotate
* saturation

## Cache

* cache hit
* cache miss
* invalidation
* downstream recomputation

## Persistence

* save
* load
* migration
* corrupted project handling

## Worker

* job submission
* success
* errors
* stale result rejection

---

# 37. Development Phases

## Phase 1 — Foundation

Build:

* Vite
* React
* TypeScript
* Tailwind
* Zustand
* React Flow
* editor shell
* node system
* basic canvas
* pipeline state

Done when nodes can be created, moved, connected, selected, and deleted.

---

## Phase 2 — Image Engine

Implement:

* Image
* Resize
* Crop
* Rotate
* Flip
* Blur
* Grayscale
* Brightness
* Contrast
* Saturation
* Invert

Done when a real image can pass through multiple processing nodes.

---

## Phase 3 — Graph Engine

Implement:

* dependency resolution
* topological sorting
* cycle detection
* caching
* invalidation

Done when only affected nodes recompute.

---

## Phase 4 — Web Worker

Implement:

* worker
* message protocol
* transferable data
* scheduler
* stale-job protection
* cancellation where practical

Done when large image processing does not freeze the UI.

---

## Phase 5 — Persistence

Implement:

* IndexedDB
* save
* load
* autosave
* delete
* duplicate
* versioned projects

Done when projects survive browser restarts.

---

## Phase 6 — UX

Implement:

* zoom
* pan
* fit-to-screen
* keyboard shortcuts
* node search
* command palette
* context menus
* drag/drop
* loading states
* error states
* empty states

Done when Buffer feels like a real tool.

---

## Phase 7 — Profiler

Implement:

* node timing
* total timing
* cache statistics
* execution counts
* expensive-node detection

Done when users can identify bottlenecks.

---

## Phase 8 — Export

Implement:

* PNG
* JPEG
* WebP
* quality
* dimensions
* filenames

Done when users can export locally.

---

## Phase 9 — Polish

Implement:

* onboarding
* sample project
* shortcut reference
* accessibility
* responsive behavior
* error boundaries
* polished states

---

# 38. Do Not Build

Do not build:

* backend
* API
* authentication
* Supabase
* PostgreSQL
* Firebase
* cloud storage
* cloud rendering
* billing
* teams
* collaboration
* cloud projects
* social features
* AI image generation
* AI image editing
* mobile app
* video editing
* 3D editing

These are outside the MVP.

---

# 39. Future GPU Architecture

Only after the CPU engine is stable:

```text
ExecutionBackend
       │
       ├── Canvas2D
       ├── WebGL
       └── WebGPU
```

The graph should not need to change when the execution backend changes.

---

# 40. Future Features

Potentially:

* WebGL filters
* WebGPU filters
* advanced masks
* curves
* histogram
* levels
* LUTs
* batch processing
* before/after comparison
* custom nodes
* reusable node presets
* video processing

Do not implement until the MVP is stable.

---

# 41. Landing Page

Only build after the editor works.

Hero:

```text
Buffer

Build image-processing pipelines visually.

Process, inspect, and export images
directly in your browser.

[Open Buffer]
```

Show the actual product.

No fake dashboards or fake metrics.

---

# 42. Sample Project

Include:

```text
Portrait Enhancement

Image
  ↓
Resize
  ↓
Brightness
  ↓
Contrast
  ↓
Saturation
  ↓
Sharpen
  ↓
Export
```

The sample project should work immediately.

---

# 43. Portfolio Demo

Demo flow:

1. Open Buffer.
2. Import image.
3. Add Image node.
4. Add processing nodes.
5. Connect nodes.
6. Preview result.
7. Change parameters.
8. Show graph updating.
9. Open profiler.
10. Change an upstream parameter.
11. Show affected nodes recomputing.
12. Show cache reuse.
13. Export WebP.

The demo must show real functionality.

---

# 44. Portfolio Description

Use:

> **Buffer — A browser-based node image processing engine built with React, TypeScript, Canvas, Web Workers, and graph-based execution.**

Short version:

> **Visual image processing, running entirely in your browser.**

Do not call it a Photoshop clone.

---

# 45. README

Document:

* overview
* live demo
* architecture
* features
* graph execution
* worker architecture
* caching
* stale-job protection
* performance
* architecture decisions
* technical challenges
* future work

Only include real measurements and implemented features.

---

# 46. Claude Development Rules

You are acting as a senior frontend and graphics-engineering developer.

Before implementing a feature:

1. Inspect the repository.
2. Understand the current architecture.
3. Implement the smallest correct solution.
4. Keep engine and UI separate.
5. Run typecheck.
6. Run tests.
7. Run production build.
8. Inspect the UI.
9. Fix regressions.
10. Continue to the next milestone.

Do not randomly rewrite working code.

Do not introduce unnecessary dependencies.

Do not over-engineer simple features.

Do not implement future features early.

---

# 47. Critical Rules

### Rule 1

**No backend.**

### Rule 2

**No fake functionality.**

### Rule 3

**No server dependencies.**

### Rule 4

**No remote image uploads.**

### Rule 5

**No remote database.**

### Rule 6

**Image processing happens locally.**

### Rule 7

**Keep binary data out of React state where possible.**

### Rule 8

**Do not block the main thread with heavy processing.**

### Rule 9

**Do not allow stale worker results to overwrite current results.**

### Rule 10

**Do not sacrifice correctness for visual polish.**

### Rule 11

**Every milestone must leave the application runnable.**

### Rule 12

**Do not move to the next phase until the current phase works.**

---

# 48. MVP Definition of Done

Buffer MVP is complete when:

* [ ] No backend exists.
* [ ] User can import images.
* [ ] User can create Image nodes.
* [ ] User can create processing nodes.
* [ ] Nodes can connect.
* [ ] Pipeline executes correctly.
* [ ] Real image processing occurs.
* [ ] Canvas previews output.
* [ ] Multiple filters can be chained.
* [ ] Graph cycles are detected.
* [ ] Node results are cached.
* [ ] Unaffected nodes are not recomputed.
* [ ] Processing runs in a Web Worker.
* [ ] Stale jobs cannot overwrite current results.
* [ ] Undo/redo works.
* [ ] Projects persist in IndexedDB.
* [ ] Images export locally.
* [ ] Node search works.
* [ ] Command palette works.
* [ ] Keyboard shortcuts work.
* [ ] Performance profiler works.
* [ ] Errors are handled gracefully.
* [ ] TypeScript builds cleanly.
* [ ] Production build works.
* [ ] No major console errors remain.
* [ ] README documents the architecture.
* [ ] Working demo is available.

---

# 49. Start Here

Do **not** implement the entire project at once.

Start with **Phase 1 only**.

First:

1. Inspect the repository.
2. Initialize the project if necessary.
3. Set up the architecture.
4. Build the editor shell.
5. Implement the node system.
6. Implement basic React Flow integration.
7. Implement basic canvas.
8. Implement pipeline state.
9. Verify nodes can be created, moved, connected, selected, and deleted.
10. Run typecheck and production build.

Then stop and verify Phase 1 before continuing.
