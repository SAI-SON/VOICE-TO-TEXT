# Voice to Text Converter

A simple web application that converts speech to text using the browser's built-in speech recognition API. This application works entirely in your browser without requiring any external API keys.

## Features

- Real-time speech-to-text conversion
- Continuous recording with auto-restart
- Support for multiple languages
- Download text as file
- Copy to clipboard functionality
- Simple and responsive user interface

## How to Use

1. Clone or download this repository to your local machine
2. Open `index.html` in a supported web browser (Chrome, Edge, or Safari recommended)
3. Select your preferred language from the dropdown menu
4. Click "Start Recording" to begin speech recognition
5. Speak clearly into your microphone
6. Click "Stop Recording" when you're done
7. Use "Copy Text" to copy the text to your clipboard
8. Use "Download Text" to save the text as a file
9. Use "Clear Text" to start over

## Requirements

- Modern web browser with speech recognition support (Chrome, Edge, or Safari recommended)
- Microphone access permission

## Supported Languages

The application supports various languages including:
- English (US & UK)
- Spanish
- French
- German
- Italian
- Portuguese (Brazil)
- Russian
- Japanese
- Korean
- Chinese (Simplified)
- Hindi
- Tamil

## Technical Details

This application uses:
- Web Speech API for speech recognition
- HTML, CSS, and JavaScript
- No external API dependencies
- No server-side processing required

## Privacy Notice

This application:
- Only records audio when the "Start Recording" button is pressed
- Does not send any data to external servers
- Does not store any data beyond your current browser session
- All processing happens directly in your browser