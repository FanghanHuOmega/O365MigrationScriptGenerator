# O365 Migration Script Generator

Vue 3 + Vite single-file component project for creating and managing Omega 365 migration scripts.

## Features

- Two-tab UI:
	- Config tab with initial fields:
		- SourceDB (string)
		- TargetDB (string)
		- WorkflowType (string)
		- ProcessID (number)
	- Migration Script tab powered by Monaco Editor (SQL editing).
- Profile system with custom profile names.
- Per-profile migration script storage (editable manually in Monaco).
- Local persistence in browser localStorage as JSON.

## Tech Stack

- Vue 3 (SFC)
- Vite
- Monaco Editor (@monaco-editor/loader + monaco-editor)

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- src
|   |-- App.vue
|   |-- main.js
|   |-- style.css
|   |-- components
|   |   `-- MonacoEditor.vue
|   `-- lib
|       |-- scriptGenerator.js
|       `-- storage.js
`-- vite.config.js
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## How It Works

- Use the Config tab to enter migration metadata.
- Click Generate Script to create a baseline SQL script.
- Open Migration Script tab to review/edit script contents in Monaco.
- Enter a custom profile name and click Save Profile.
- Profiles are stored under one localStorage key with JSON containing:
	- activeProfileName
	- profiles[profileName].config
	- profiles[profileName].script
	- profiles[profileName].updatedAt

## Notes

- All data is browser-local only (no backend).
- Clearing localStorage or switching browser context removes saved data.
