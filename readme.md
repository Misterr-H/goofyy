# 🎵 GOOFYY – Terminal Music Player

> A sleek command-line music player that streams your favorite songs directly in the terminal! 🎸

## Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation & Usage](#-installation--usage)
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

Before installing Goofyy, make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (includes npm)
- [ffmpeg](https://ffmpeg.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Redis](https://redis.io/docs/getting-started/installation/) (local installation required for caching)

## 📦 Installation & Usage

To set up the development environment and run Goofyy, follow these steps:

1.  **Run the setup script:**
    Open your terminal, navigate to the root directory of the Goofyy project, and run the `setup.sh` script. This script will handle dependency checks, Redis server management, Node.js package installations, and start both the backend and client development servers.

    ```bash
    ./setup.sh
    ```

    **About `setup.sh`:**
    This script automates the setup and development environment for Goofyy. It performs the following actions:
    -   **Dependency Checks:** Verifies the presence of `node`, `npm`, `yt-dlp`, `ffmpeg`, and `redis-server`. If any are missing, it provides instructions for manual installation.
    -   **Redis Server Management:** Checks if a local Redis server is running. If not, it attempts to start one in the background. Ensure Redis is properly installed and accessible.
    -   **Node.js Dependencies:** Installs `npm` packages for both the `backend` and `client` components if they are not already installed.
    -   **Environment Setup:** Creates a `.env` file for the backend from `.env.example` if it doesn't exist, prompting the user to configure it (e.g., for `POSTHOG_API_KEY`).
    -   **Server Startup:** Launches the backend (Express.js server) and client (React Ink development server) in the background.
    -   **Graceful Shutdown:** Configures a `Ctrl+C` trap to ensure both the backend and client processes are terminated cleanly when you exit the script.

2.  **Start the Goofyy Client:**
    After `setup.sh` has successfully started the backend and client development servers, open a *new* terminal window. Navigate to the root directory of the Goofyy project and execute the following command:

    ```bash
    node packages/client/dist/cli.js
    ```

    This command directly runs the compiled client application, ensuring you see the latest changes and the interactive menu. If you want to search for a song immediately, you can provide a query:

    ```bash
    node packages/client/dist/cli.js "your song query here"
    ```

## Controls
- **Left/Right Arrow Keys**: Navigate menus
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