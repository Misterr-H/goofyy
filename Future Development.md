# Future Development Ideas for Goofyy

This document outlines potential features and improvements for the Goofyy music player.

## 1. Playback History

-   **Description**: Save a list of the most recently played songs. A new "History" option in the main menu will allow users to view this list and select a song to play again.
-   **Implementation**: 
    -   **Backend**: Use a Redis list to store the history of played songs. Create a new endpoint (`/history`) to retrieve this list.
    -   **Client**: Add a "History" option to the menu. When selected, fetch the list from the backend and display it in a new selectable menu.

## 2. Top Charts / Popular Songs

-   **Description**: Add a "Top Charts" option to the menu that displays a list of currently trending songs, turning Goofyy into a music discovery tool.
-   **Implementation**:
    -   **Backend**: Create a new endpoint (`/charts`) that returns a curated list of popular songs. This could be a static list initially, with the potential to fetch from a public API later.
    -   **Client**: Add a "Top Charts" option to the menu that fetches and displays the list for the user to choose from.

## 3. In-Playback Controls (Pause/Resume)

-   **Description**: Allow the user to pause and resume the currently playing song.
-   **Implementation**:
    -   **Client**: Modify the `MusicPlayerService` to handle pausing and resuming the audio stream. The `speaker` library supports this. The UI will need to be updated to show the current state (playing/paused).
    -   **Input**: Use the `Spacebar` as a toggle for pause/resume.

## 4. Song Queue

-   **Description**: Allow users to add multiple songs to a queue for continuous playback.
-   **Implementation**:
    -   **Client**: Manage a queue of songs in the client's state. When one song finishes, the next one in the queue automatically starts.
    -   **UI**: Add options to view and manage the queue.
