# CraftFlow — Artisan Studio Workspace Dashboard

An organic, high-performance project organization tracking application designed specifically for makers, woodworkers, and independent creators to coordinate design logs from raw blueprints to finished pieces. 

Developed by Derrick Mugisha for Advanced Frontend Web Development.

## Live Application Links
- Deployed Live Site: https://github.io
- Video Demonstration: []

## Implemented Core Features
- Core Creation Input: Create artisan steps seamlessly using mouse selections or hotkey inputs.
- Client Validation: Halts form submission on whitespace strings or titles exceeding 100 characters max using on-screen context messages.
- Functional Completion: Custom vector tick checkboxes dim cards and add semantic strikethroughs instantly.
- Safe Delete Dialog: Bypasses standard browser elements using an custom interactive confirm modal window.
- Granular Category Views: Real-time segmentation across All, In Production, and Assembled filter tiers.
- Accurate Count Metrics: Dashboard calculations map correct singular/plural text elements dynamically.
- Bulk State Flush: Single click triggers to clear completed records from tracking arrays simultaneously.
- Persistence Mapping: Local storage preservation keeps your data and chosen active filter saved across browser refreshes.
- Fallback Empty Screen: Descriptive prompt blocks inject smoothly when query parameters return empty results arrays.

## Extra Advanced Features Included
- Production Pipeline Sorting: Categorizes entries using Assembly, Detailing, or Sourcing badges, automatically organizing cards by priority weight.
- Real-Time Query Filter: Input query fields scan title and text contexts to filter visible dashboard nodes on the fly.

## Application Architecture Blueprint
The application relies on a strict single global state array object design, executing mutations against data records before calling a unified rendering system.

```javascript
// State Shape Object Model Specification
{
  id: 1727600000000,
  title: "Sand primary oak structural pillars",
  description: "Run smooth grain sheets along joints to guarantee flawless fittings.",
  priority: "High", // Assembly (High), Detailing (Medium), Sourcing (Low)
  completed: false
}
```

### User Stories Used to Plan Construction
1. As an artisan, I want to add new design targets with detailed step descriptions so I can break complex project steps down clearly.
2. As a maker working inside a fast-paced studio workspace, I want to assign production phase tags to my logs so the high-priority assembly stages automatically sort to the top.
3. As a busy crafter, I want my data logs to survive browser page updates so I never lose my active workspace progress history tracking points.

### Challenges Faced & DevTools Fixes Learned
During initial development, the standalone script environment conflicted with local Vite dependencies when loading configurations from separate stylesheets. By checking the VS Code terminal trace outputs and inspection panels, I caught the module path compilation mismatch. Resolving this helped me separate the CSS tokens properly into my `src/style.css` file while keeping the HTML head layout tags completely clean.

## Running Locally

1. Clone this repository to your local system:
   git clone https://github.com/rithairagena13-spec/week4-todo-app.git

2. Step inside the workspace directory folder:
   cd week4-todo-app

3. Install development requirements and start the Vite local server:
   npm install && npm run dev
