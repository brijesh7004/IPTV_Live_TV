# IPTV Player Web Application

A web-based IPTV player application designed for Android TV and other devices. This application allows users to stream live TV channels from IPTV playlists with an intuitive interface and smooth playback experience.

## Features

- **Channel Browsing**: View and browse through all available channels in a grid layout
- **Video Playback**: Native video player with HLS support for optimal streaming quality
- **Favorites Management**: Save your favorite channels for quick access
- **Search Functionality**: Easily find channels by name or category
- **Customizable Source**: Change the IPTV playlist URL in settings
- **TV Remote Navigation**: Keyboard navigation support for Android TV remote controls
- **Responsive Design**: Works on various screen sizes and devices

## Setup Instructions

1. Clone or download this repository
2. Open the application in a web browser by opening the `index.html` file
3. By default, the application uses Hindi language channels from `https://iptv-org.github.io/iptv/languages/hin.m3u`
4. To use a different playlist, go to Settings and update the playlist URL

## Technical Details

- **HLS.js**: Used for HLS (HTTP Live Streaming) playback support
- **LocalStorage**: Stores user preferences and favorite channels
- **Responsive UI**: CSS Grid and Flexbox for layout
- **No Dependencies**: Pure JavaScript implementation with minimal external libraries

## Deployment

To deploy this application for Android TV:

1. Host the files on a web server
2. Create a WebView-based Android application that loads the hosted URL
3. Configure the WebView to support fullscreen video playback
4. Package and install the application on your Android TV device

Alternatively, you can access the web application directly through the Android TV browser.

## Customization

- Edit `css/style.css` to change the appearance and theme
- Modify `js/app.js` to add additional features or change behavior
- Update the default playlist URL in `index.html` and `js/app.js`

## License

This project is open-source and free to use for personal and commercial purposes.

## Acknowledgements

- [IPTV-ORG](https://github.com/iptv-org/iptv) for providing open-source IPTV playlists
- [HLS.js](https://github.com/video-dev/hls.js/) for HLS playback support
- [Font Awesome](https://fontawesome.com/) for icons
