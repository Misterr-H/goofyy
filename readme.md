# 🎵 GOOFYY – Terminal Music Player

> A sleek command-line music player that streams your favorite songs directly in the terminal! 🎸

## Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Controls](#controls)
- [Technical Details](#️-technical-details)
- [Contributing](#-contributing)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)
- [Made with ❤️ by Himanshu](#-made-with-️-by-himanshu)

## ✨ Features

- 🎧 Stream music directly in your terminal
- 🔍 Search and play songs instantly
- 🎨 Clean and minimal terminal UI
- ⚡️ Fast streaming with yt-dlp
- 🎮 Simple keyboard controls
- 📊 Real-time progress bar
- 🎶 Basic song queuing functionality
- ⏯️ Pause/Resume playback
- ↩️ Intuitive navigation with menu system

## 🚀 Prerequisites

Before installing Goofyy, make sure you have:
- [Node.js](https://nodejs.org/) installed
- [ffmpeg](https://ffmpeg.org/) installed
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed

## 📦 Installation

```bash
npx goofyy
# OR
npm i -g goofyy
```

## 🎮 Usage

```bash
# Start Goofyy with a song
goofyy "shape of you"

# Search and play any song
goofyy "ed sheeran perfect"

# Play with artist and song name
goofyy "bohemian rhapsody queen"
```

### Controls
- **Arrow Keys**: Navigate menus
- **Enter**: Select an option
- **Spacebar**: Pause/Resume playback
- **a**: Add a song to the queue from the search view (when in Music screen)
- **ESC**: Go back to the previous menu / Clear current song / Exit application
- **Ctrl+C**: Exit the application

## 🛠️ Technical Details

Goofyy uses:
- `yt-dlp` for fetching and streaming music
- `ffmpeg` for audio processing
- React Ink for the beautiful terminal UI
- Node.js for backend services
- Redis for caching (backend)

## 🤝 Contributing

Contributions are highly welcome! If you'd like to contribute, please follow these steps:

1.  **Fork the repository.**
2.  **Clone your forked repository** to your local machine.
3.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b bugfix/issue-description`.
4.  **Make your changes** and ensure they adhere to the existing code style.
5.  **Write clear and concise commit messages.**
6.  **Push your branch** to your forked repository.
7.  **Open a Pull Request** to the `main` branch of the original repository.

Feel free to:
- 🐛 Report bugs
- 💡 Suggest new features
- 🔧 Submit pull requests

## 🚀 Future Enhancements

Here are some ideas for future improvements:
- **Full Playlist Management**: Create, save, and load playlists.
- **Improved Queue Management**: Reorder, remove, and save queue.
- **More Robust Playback Controls**: Skip, previous track, volume control.
- **Configuration Options**: Allow users to customize settings directly from the UI.
- **Cross-platform Compatibility**: Ensure seamless experience across different operating systems.
- **Visualizer**: Add a simple audio visualizer.

## 📝 License

MIT License - feel free to use this project however you want!

## 🎵 Made with ❤️ by Himanshu

---

*"Because sometimes the best music player is the one that streams directly in your terminal"* 🎹