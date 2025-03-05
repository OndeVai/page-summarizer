# Page Summarizer Chrome Extension

A Chrome extension that uses Claude AI to generate concise summaries of web pages.

## Features

- Clean, modern UI with collapsible prompt customization
- Secure API key storage with client-side encryption
- Customizable summarization instructions
- Loading indicators and error handling
- Works on any webpage

## Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd page-summarizer
   ```

2. **Install Dependencies**

   - No external dependencies required
   - The extension uses Chrome's built-in APIs

3. **Generate Extension Icons**

   - Install ImageMagick if not already installed:
     ```bash
     brew install imagemagick
     ```
   - The extension includes pre-generated icons in the `icons/` directory:
     - `icon16.png` (16x16)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)
   - If you need to regenerate icons:
     ```bash
     cd icons
     magick icon.svg -resize 16x16 -filter Lanczos icon16.png
     magick icon.svg -resize 48x48 -filter Lanczos icon48.png
     magick icon.svg -resize 128x128 -filter Lanczos icon128.png
     ```

4. **Load the Extension in Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `page-summarizer` directory

5. **Get a Claude API Key**

   - Sign up for an Anthropic account at [https://console.anthropic.com/](https://console.anthropic.com/)
   - Generate an API key in the console
   - The API key will be securely stored in your browser's local storage

6. **Configure the Extension**
   - Click the extension icon in your Chrome toolbar
   - Enter your Claude API key in the popup
   - (Optional) Click "Change Instructions" to customize the summarization prompt

## Security Features

- API key is encrypted using AES-GCM before storage
- Encryption key is stored locally and never synced
- All data is stored in Chrome's local storage
- No data is sent to any servers except Claude's API

## Usage

1. Navigate to any webpage you want to summarize
2. Click the extension icon in your Chrome toolbar
3. Click "Summarize Page" to generate a summary
4. The summary will appear in the popup window

## Customization

You can customize the summarization instructions by:

1. Clicking the "Change Instructions" button in the popup
2. Entering your preferred prompt
3. The custom prompt will be saved automatically

## Development

The extension is built using:

- Manifest V3
- Vanilla JavaScript
- Chrome Extension APIs
- Web Crypto API for encryption

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup UI
- `popup.js` - Popup functionality
- `content.js` - Page content extraction
- `background.js` - Background service worker
- `crypto.js` - Encryption utilities
- `styles.css` - UI styling
- `icons/` - Extension icons in various sizes

## Privacy

- No data is collected or stored on external servers
- API keys are encrypted and stored locally
- Page content is only sent to Claude's API when explicitly requested
- All data is cleared when the extension is uninstalled

## Support

For issues or feature requests, please open an issue in the repository.

## License

MIT License - See LICENSE file for details
