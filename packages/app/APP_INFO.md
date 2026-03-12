# JSON Parser Tool

An interactive, real-time JSON parser built into the Synflo frontend app. Accessible from the Home screen without authentication.

---

## Features

### Real-Time Parsing & Validation
- Validates JSON as you type or paste
- Displays clear error messages with line and column numbers for invalid JSON
- Visual status indicator (green check for valid, red X for invalid)

### Three Output Views
- **Tree View** — Collapsible, interactive tree with type badges (string, number, boolean, null, object, array). Nodes show inline values for primitives and summaries for containers (e.g. `{3 keys}`, `[5 items]`). Clicking a node reveals its JSON path.
- **Formatted View** — Pretty-printed JSON with syntax highlighting. Colors: keys (indigo), strings (green), numbers (amber), booleans (blue), null (red).
- **Minified View** — Compact single-line representation for copying into configs or APIs.

### Statistics Panel
When JSON is valid, displays:
- **Size** — Document size in bytes/KB/MB
- **Total Keys** — Number of object keys across the entire document
- **Max Depth** — Deepest nesting level
- **Type Distribution** — Visual bar chart showing counts of each data type
- **Arrays** — List of all arrays with their paths and lengths

### Search
- Case-insensitive search across all keys and values
- 200ms debounced input for responsive filtering
- Results show match type (key vs value), JSON path, and matched text
- Clicking a result selects it and displays its path

### JSON Path Display
- Clicking any node in the tree view shows its full JSON path (e.g. `$.users[0].name`)
- One-click copy for any displayed path

### Copy Actions
- Copy formatted (pretty-printed) JSON
- Copy minified JSON
- Copy selected JSON path

### Clipboard Paste
- One-click "Paste" button reads directly from the system clipboard

---

## File Structure

```
packages/app/src/
├── JsonParserScreen.tsx                        # Main screen component
└── components/json-parser/
    ├── types.ts                                # Shared TypeScript types
    ├── utils.ts                                # Parsing, tree building, stats, search
    ├── SyntaxHighlight.tsx                     # JSON syntax highlighting via regex tokenization
    ├── JsonTreeView.tsx                        # Recursive collapsible tree component
    ├── JsonStats.tsx                           # Statistics panel with type distribution
    └── JsonSearch.tsx                          # Debounced search with match results
```

---

## Architecture

### State Management
All state lives in `JsonParserScreen.tsx` — no context or external state library needed. Derived values (parsed result, tree, stats, search matches, formatted/minified strings) are computed via `useMemo` for performance.

### Key Types (`types.ts`)

| Type | Purpose |
|------|---------|
| `JsonNode` | Tree node with key, value, type, path, depth, and optional children |
| `JsonStats` | Aggregated stats: key count, depth, type distribution, size, array lengths |
| `JsonValidationResult` | Parse result with valid flag, data, or error with line/column |
| `OutputTab` | `'tree' \| 'formatted' \| 'minified'` |
| `SearchMatch` | Match result with path, key, value, and match type |

### Utility Functions (`utils.ts`)

| Function | Description |
|----------|-------------|
| `parseJson(input)` | Wraps `JSON.parse`, extracts error position as line/column |
| `buildTree(value, key, path, depth)` | Recursively builds a `JsonNode` tree from parsed data |
| `computeStats(input, rootNode)` | Walks the tree to compute all statistics |
| `searchJson(node, query)` | Case-insensitive recursive search on keys and values |
| `formatJson(data)` | `JSON.stringify(data, null, 2)` |
| `minifyJson(data)` | `JSON.stringify(data)` |

### Performance
- `useMemo` on all derived computations — only recomputes when dependencies change
- `React.memo` on tree nodes to avoid unnecessary re-renders
- Tree nodes are only rendered when expanded (lazy rendering)
- No external dependencies — uses native `JSON.parse` and regex tokenization

---

## Navigation

- **Home screen** has a "JSON Parser Tool" link
- **JSON Parser header** has a back arrow to return to Home
- Added as the `'json-parser'` view in `App.tsx`
- Public page — no authentication required

---

## Responsive Design

- Desktop (`lg+`): Side-by-side panels — input on left, output on right
- Mobile/tablet: Stacked vertically — input on top, output below
- Full dark mode support via `ThemeContext`
