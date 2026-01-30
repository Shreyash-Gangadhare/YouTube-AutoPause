# YouTube Auto Pause Extension

Automatically pauses YouTube videos when you switch tabs/apps and resumes when you return.

## Installation (Development)

1. Download/clone this repository
2. Open Microsoft Edge
3. Navigate to `edge://extensions/`
4. Enable "Developer mode" (toggle in left sidebar)
5. Click "Load unpacked"
6. Select the `youtube-auto-pause` folder
7. Extension is now active

## Installation (Production)

Package as `.crx` or submit to Microsoft Edge Add-ons store.

## Usage

No configuration required. Works automatically on all YouTube pages.

**Behavior:**
- Video pauses when you switch tabs
- Video pauses when you switch to another app/window
- Video resumes when you return (only if it was playing before auto-pause)
- Manual pauses by user are respected (won't auto-resume)

## Testing

1. Open YouTube video and start playback
2. Switch to another tab → video pauses
3. Return to YouTube tab → video resumes
4. Switch to another application → video pauses
5. Return to browser → video resumes
6. Manually pause video → switching tabs does NOT auto-resume

## Troubleshooting

**Video doesn't pause/resume:**
- Refresh the YouTube page
- Check extension is enabled in `edge://extensions/`
- Open DevTools Console for error messages

**Multiple videos on page:**
- Extension targets primary video player first
- Handles YouTube's single-video-at-a-time behavior

## Architecture

- **background.js**: Tab/window focus event coordinator
- **content.js**: Video element interaction and state management
- **Page Visibility API**: Primary detection mechanism
- **Tab/Window events**: Secondary detection for cross-app switching

## Compatibility

- Microsoft Edge (Chromium-based, v88+)
- Windows, macOS
- Manifest V3 compliant

## License

MIT