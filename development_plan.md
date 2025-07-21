# Development Plan: Implementing a Sophisticated Menu and Enhanced Controls

## Objective
To add an interactive, keyboard-navigable menu to the client-side application, allowing users to select different application views, and to implement comprehensive keyboard controls for music playback and application navigation.

## Assumptions
*   The menu will be a primary navigation element.
*   Initial menu actions will simply change the application's current view/screen.
*   The application is an Ink-based terminal UI.
*   True pause/resume for audio is not feasible with the current `speaker` library; a stop/restart mechanism will be used for Spacebar.

## Steps

1.  **Enhance `Menu.tsx` for Interactivity and Visual Feedback:**
    *   **Props:** `Menu.tsx` will accept `items: MenuItem[]` and `selectedIndex: number` as props.
    *   **Visuals:** Implement logic to highlight the menu item corresponding to `selectedIndex` (e.g., change text color, add a `>` prefix).
    *   **No Direct Input:** `Menu.tsx` will remain a presentational component; input handling will occur in `app.tsx`.

2.  **Implement Input Handling and Menu State in `app.tsx`:**
    *   **State:** Add `selectedIndex: number`, `currentScreen: 'home' | 'music' | 'settings' | 'about'`, `songQueue: SongInfo[]`, and `message: string | null` to `app.tsx`'s state.
    *   **`useInput`:** Use Ink's `useInput` hook to capture `up arrow`, `down arrow`, `enter`, `spacebar`, `a`, and `escape` key presses.
    *   **Navigation (Arrow Keys):** On `up arrow`/`down arrow`, update `selectedIndex` (with bounds checking) when not in search mode.
    *   **Selection (Enter):** On `enter`, update `currentScreen` based on `selectedIndex`.
    *   **Pause/Resume (Spacebar):** If `currentScreen` is 'music' and a song is playing, call `musicPlayer.togglePlayback()` and update `isPlaying` state. Display a temporary message.
    *   **Add to Queue ('a' key):** If `currentScreen` is 'music', a song is playing, and not searching, add the `currentSong` to `songQueue`. Display a temporary message.
    *   **Go Back (ESC):**
        *   If `currentScreen` is not 'music', switch to 'music' screen and reset menu selection.
        *   If `currentScreen` is 'music' and a song is playing, stop playback, clear current song, and clear search input. Display a temporary message.
        *   If `currentScreen` is 'music' and no song is playing, exit the application.
    *   **Exit (Ctrl+C):** Existing `exit()` functionality remains.

3.  **Define Menu Actions and View Management in `app.tsx`:**
    *   **Menu Items Array:** Create an array of menu item objects (e.g., `{ label: 'Home', screen: 'home' }`) to easily map `selectedIndex` to `currentScreen`.
    *   **Conditional Rendering:** Use the `currentScreen` state to conditionally render different components or content below the menu (e.g., the existing music player UI for the 'music' screen, placeholder text for 'home', 'settings', 'about').
    *   **Display Queue:** Render the `songQueue` when on the 'music' screen and the queue is not empty.
    *   **Display Messages:** Render temporary `message` state for user feedback.

4.  **Update `musicPlayer.ts`:**
    *   Add `togglePlayback()` method to handle stopping and restarting playback (simulating pause/resume).
    *   Add `getIsPlaying()` method to expose the internal playback state.
    *   Ensure `cleanup()` properly stops all audio and clears intervals.

## Execution Notes
*   Ensure smooth keyboard navigation and clear visual feedback.
*   Maintain existing code style and conventions.
*   Do NOT run `npm install` or `npm run build` unless explicitly instructed.
