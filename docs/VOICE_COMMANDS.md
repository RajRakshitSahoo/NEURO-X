# NEURO-X Voice Command Reference

## Activation

- Press **Ctrl+V** to open the Voice Command overlay
- Click the sidebar 🎙 button
- Click the microphone icon and speak clearly

## Requirements

Voice commands use the **Web Speech API**, available in:
- Chrome 33+
- Edge 79+
- Safari 14.1+ (partial)

Firefox does **not** support the Web Speech API. Use Chrome or Edge.

## Command List

| Voice Command | Action | Notes |
|--------------|--------|-------|
| `"scan network"` | Opens Network Analyzer, triggers backend scan | Plays scan sweep sound |
| `"show active ports"` | Switches to System Monitor | Displays open port list |
| `"start deep analysis"` | Opens AI Engine, triggers deep reasoning | Sends `deep_analysis` to backend |
| `"enable stealth monitor"` | Activates passive monitoring mode | Reduces noise in terminal |
| `"show threats"` | Returns to Dashboard | Highlights active threat feed |
| `"export logs"` | Downloads threat log as `.txt` | Saves all detected threats |

## Tips

- Speak at normal volume, clearly and slowly
- Commands are **case-insensitive** — say "SCAN NETWORK" or "scan network"
- Partial matches work: "show ports" triggers "show active ports"
- The transcript shows what was recognized before executing

## Extending Voice Commands

Add new commands in `frontend/src/pages/App.jsx` inside `handleVoiceCommand()`:

```js
const handleVoiceCommand = useCallback((cmd) => {
  const c = cmd.toLowerCase()
  
  // Add your custom command here:
  if (c.includes('your phrase')) {
    // your action
    addNotification('Custom command executed', 'INFO')
  }
  // ...
}, [])
```

## Troubleshooting

**"Browser does not support Speech Recognition"**
→ Switch to Chrome or Edge

**"ERROR: not-allowed"**
→ Grant microphone permission in browser settings

**Command not recognized**
→ Check the transcript shown in the overlay and rephrase
→ The keyword matching is substring-based — "scan" matches "scan network"
