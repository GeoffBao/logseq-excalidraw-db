# Logseq Excalidraw DB
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A premium, Apple-style Excalidraw integration for Logseq, designed for the future Database version. It stores drawings efficiently and provides a seamless, native experience.

## 🖼️ Showcase

### Dashboard
![Dashboard](https://raw.githubusercontent.com/GeoffBao/logseq-excalidraw-db/main/screenshots/dashboard.png)

### Editor
![Editor](https://raw.githubusercontent.com/GeoffBao/logseq-excalidraw-db/main/screenshots/editor.png)


## ✨ Features

- **Store in DB**: Drawings are stored as independent entities in the Logseq sandbox, keeping your graph clean and performant.
- **Apple-Style UI**: A completely redesigned, minimalist interface with glassmorphism effects, matching the modern macOS/iOS aesthetic.
- **Native Experience**:
  - **Spotlight Search**: Press `Cmd+Shift+E` (or custom shortcut) to open a global dashboard to search and manage all drawings.
  - **Today's Journal**: Quickly insert a new drawing into today's journal with one click.
  - **Reference links**: Copy/paste drawing references anywhere in your graph.
- **Chinese Font Support**: Built-in support for "ZCOOL KuaiLe" handwritten font, solving the long-standing issue of Chinese characters looking plain in Excalidraw.
- **Dark Mode**: Fully compatible with Logseq's theme system.
- **1:1 Functionality**: Restores full Excalidraw features including Image support, Library, and Export (SVG/PNG).

## 🚀 Installation

1.  Open Logseq **Settings** > **Advanced** > Ensure **Plug-in system** is enabled.
2.  Go to **Plugins** (icon in header) > **Marketplace**.
3.  Search for `Excalidraw DB` and click **Install**.

## 📖 Usage

### Dashboard
- Click the **Excalidraw** icon in the toolbar.
- Or use command `Excalidraw: Open Dashboard`.
- From the dashboard, you can **Create**, **Search**, **Edit**, and **Delete** drawings.

### Insert to Graph
- **To Current Block**: Type `/Excalidraw` to insert a drawing at the current cursor position.
- **To Today's Journal**: In the Dashboard or Editor menu, select "Insert to Today's Journal".
- **Copy Reference**: In the Dashboard, hover over a drawing and click the "Copy" icon to get a renderer code (e.g., `{{renderer excalidraw, <uuid>}}`) to paste anywhere.

### Keymaps
| Key | Action |
| --- | --- |
| `Esc` | Close Excalidraw Editor/Dashboard |
| `Cmd+Shift+E` | Open Excalidraw Dashboard |

## 🛠 Configuration
Go to **Settings** > **Plugin Settings** > **Excalidraw DB** to configure:
- Auto-save interval
- Default drawing tag
- UI preferences

## 🤝 Contributing
Issues and Pull Requests are welcome!

## 📄 License
MIT License
