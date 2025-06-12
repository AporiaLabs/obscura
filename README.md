# Obscura: Protect Your Attention

![Obscura Logo](icons/vz_500.png)

Obscura is a browser extension that filters online content based on your long-term goals to protect your attention from distractions and low-value content.

## Overview

In an age of information overload and AI-generated content, Obscura acts as your personal content filter, analyzing web content in real-time and hiding items that don't align with your goals and interests. By leveraging AI to fight AI, Obscura helps you stay focused on what truly matters to you.

## Features

- **Goal-Based Filtering**: Define your long-term goals and interests, and Obscura will filter content accordingly
- **Platform Support**:
  - ✅ YouTube: Filter videos based on title and channel
  - 🔄 Twitter/X: Filter tweets (under development)
  - 🔄 Reddit: Filter posts (under development)
- **Customizable Settings**:
  - Platform-specific content preferences
  - Adjustable probability threshold for filtering
  - Enable/disable filtering per platform
- **Visual Indicators**: Clear visual feedback when content is being analyzed or has been filtered

## How It Works

1. You define your goals and content preferences in the extension settings
2. When you browse supported websites, Obscura analyzes content in real-time
3. Content is evaluated for its relevance to your goals using AI
4. Low-value content is hidden, while valuable content remains visible
5. You can adjust the filtering threshold to make it more or less strict

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Load the extension in your browser:
   - Chrome: Go to `chrome://extensions/`, enable Developer mode, and click "Load unpacked"
   - Firefox: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file in the extension directory

## Configuration

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Click on the Obscura icon in your browser toolbar
3. Enter your OpenRouter API key in the settings
4. Define your global goals and platform-specific preferences
5. Adjust the probability threshold for each platform as needed

## Development

### Prerequisites

- Node.js and npm

### Setup

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes during development
npm run watch
```

### Project Structure

- `manifest.json`: Extension configuration
- `src/`: Source code
  - `api/`: API integration (OpenRouter)
  - `config/`: Configuration and settings
  - `content/`: Content processing logic
  - `sites/`: Site-specific modules (YouTube, Twitter, Reddit)
  - `ui/`: User interface components
  - `utils/`: Utility functions
- `icons/`: Extension icons
- `popup.html`: Extension popup UI
- `welcome.html`: Welcome page with manifesto

## Philosophy

Obscura was created with a mission to protect human attention in an increasingly AI-dominated world. The project believes that:

1. The greatest threat to our potential is the capture of our attention by hyper-stimulating content
2. AI can be used to protect against this threat by filtering content based on our true goals
3. By being intentional about what we consume online, we can focus on what truly matters

Read the full manifesto in the extension's welcome page.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

MIT

---

_"You are what you consume. Protect your attention."_
