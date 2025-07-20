# 🎵 Goofyy - The Terminal Music Player

This is a monorepo for Goofyy, a command-line music player that streams your favorite songs directly in the terminal.

##  Architecture

The project is a monorepo managed with npm workspaces, containing two main packages:

-   `packages/client`: A command-line interface (CLI) built with React Ink that allows you to search for and play music.
-   `packages/backend`: A Node.js Express server that handles fetching music metadata and streaming audio from YouTube using `yt-dlp` and `ffmpeg`. It uses Redis for caching to provide a faster experience.

## ✨ Features

- 🎧 Stream music directly in your terminal
- 🔍 Search and play songs instantly
- ⚡️ Fast streaming with `yt-dlp` and Redis caching
- 🎨 Clean and minimal terminal UI using React Ink
- 🐳 Dockerized development environment
- 📜 Playback History
- 📈 Top Charts
- ⏯️ Pause and Resume playback
- 🇶 Song Queue

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher)
-   [Docker](https://www.docker.com/)
-   [npm](https://www.npmjs.com/) (or another package manager)

### Development Setup

A shell script is provided to streamline the development setup.

1.  **Run the development script:**

    ```bash
    ./run-dev.sh
    ```

    This script will:
    1.  Check if Docker is running.
    2.  Start a Redis container using Docker.
    3.  Create a `.env` file for the backend if it doesn't exist.
    4.  Install npm dependencies for the backend.
    5.  Start the backend development server on `http://localhost:3000`.

2.  **Run the Client:**

    In a new terminal window, you can run the client. First, install the dependencies for the client:

    ```bash
    npm install --workspace=packages/client
    ```

    Then, you can run the client in development mode:

    ```bash
    npm run dev --workspace=packages/client
    ```

    Or build and run the production version:
    ```bash
    npm run build --workspace=packages/client
    ./packages/client/dist/cli.js "your song"
    ```

## 🎮 Usage

Once the backend server is running, you can use the client to play music.

**Note:** Using `npx` will download the latest version of `goofyy` and run it without a global installation.

```bash
# Start Goofyy with a song
npx goofyy "shape of you"

# Or run without a song to open the menu
npx goofyy
```

### Controls

-   **Arrow Keys**: Navigate menus
-   **Enter**: Select an option
-   **Spacebar**: Pause/Resume playback
-   **a**: Add a song to the queue from the search view
-   **ESC**: Go back to the previous menu
-   **Ctrl+C**: Exit the application

## 🛠️ NPM Scripts

The following scripts are available in the root `package.json`:

-   `npm run backend:dev`: Starts the backend server in development mode with auto-reloading.
-   `npm run backend:build`: Builds the backend server for production.
-   `npm run backend:start`: Starts the built backend server.

For client-specific scripts, see `packages/client/package.json`.

## 💻 Technologies Used

-   **Backend**: Node.js, Express, TypeScript, Redis, Docker, `yt-dlp`, `ffmpeg`
-   **Client**: React, Ink, TypeScript, `got`, `speaker`
-   **Monorepo**: npm Workspaces
