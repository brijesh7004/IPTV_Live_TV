/**
 * IPTV Player Application
 * This script handles the core functionality of the IPTV player application,
 * including loading and parsing M3U playlists, channel management, and video playback.
 */

// Application state
const appState = {
    channels: [],
    favorites: [],
    currentChannel: null,
    mainPlaylistUrl: 'https://iptv-org.github.io/iptv/index.category.m3u',
    playlistUrl: '',
    selectedCategory: '',
    categories: [],
    isLoading: true
};

// DOM Elements
const elements = {
    appContainer: document.querySelector('.app-container'),
    playerView: document.getElementById('player-view'),
    channelsContainer: document.getElementById('channels-container'),
    favoritesContainer: document.getElementById('favorites-container'),
    categoriesContainer: document.getElementById('categories-container'),
    videoPlayer: document.getElementById('video-player'),
    videoOverlay: document.querySelector('.video-overlay'),
    channelTitle: document.getElementById('channel-title'),
    channelInfo: document.getElementById('channel-info'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    mainPlaylistInput: document.getElementById('main-playlist-url'),
    playlistUrlInput: document.getElementById('playlist-url'),
    loadCategoriesButton: document.getElementById('load-categories'),
    selectedCategoryDisplay: document.getElementById('selected-category'),
    addToFavoritesButton: document.getElementById('add-to-favorites'),
    closePlayerButton: document.getElementById('close-player'),
    backToChannelsButton: document.getElementById('back-to-channels'),
    menuItems: document.querySelectorAll('.menu-item'),
    views: document.querySelectorAll('.view')
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('IPTV Player initializing...');
    
    // Load saved settings from localStorage
    loadSavedSettings();
    loadFavorites();
    
    // Make sure the player view is hidden on startup
    elements.playerView.classList.add('hidden');
    
    // Show the channels view by default and load channels if we have a selected category
    switchView('all-channels');
    if (appState.playlistUrl) {
        loadChannels(appState.playlistUrl);
    }
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Load saved settings from localStorage
 */
function loadSavedSettings() {
    const savedMainUrl = localStorage.getItem('mainPlaylistUrl');
    const savedPlaylistUrl = localStorage.getItem('playlistUrl');
    const savedCategory = localStorage.getItem('selectedCategory');
    
    if (savedMainUrl) {
        appState.mainPlaylistUrl = savedMainUrl;
        elements.mainPlaylistInput.value = savedMainUrl;
    }
    
    if (savedPlaylistUrl) {
        appState.playlistUrl = savedPlaylistUrl;
        elements.playlistUrlInput.value = savedPlaylistUrl;
    }
    
    if (savedCategory) {
        appState.selectedCategory = savedCategory;
        elements.selectedCategoryDisplay.textContent = `Selected: ${savedCategory}`;
    }
}

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // Menu navigation
    elements.menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewId = item.getAttribute('data-view');
            switchView(viewId);
            
            // Update active menu item
            elements.menuItems.forEach(menuItem => menuItem.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Search functionality
    elements.searchButton.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Load categories
    elements.loadCategoriesButton.addEventListener('click', () => {
        const mainUrl = elements.mainPlaylistInput.value.trim();
        if (mainUrl) {
            // Reset state when changing main playlist URL
            appState.mainPlaylistUrl = mainUrl;
            appState.selectedCategory = '';
            appState.playlistUrl = '';
            appState.channels = [];
            
            // Update UI
            elements.selectedCategoryDisplay.textContent = 'No category selected';
            elements.playlistUrlInput.value = '';
            elements.channelsContainer.innerHTML = '<div class="loading">Select a category to load channels</div>';
            
            // Save main URL and clear other stored settings
            localStorage.setItem('mainPlaylistUrl', mainUrl);
            localStorage.removeItem('selectedCategory');
            localStorage.removeItem('playlistUrl');
            
            // Load categories from new URL
            loadCategories(mainUrl);
        }
    });
    
    // Player controls
    elements.closePlayerButton.addEventListener('click', closePlayer);
    elements.backToChannelsButton.addEventListener('click', closePlayer);
    elements.addToFavoritesButton.addEventListener('click', toggleFavorite);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.playerView.classList.contains('hidden')) {
            closePlayer();
        }
    });
}

/**
 * Load and parse categories from the main M3U playlist
 * @param {string} url - The URL of the main M3U playlist
 */
function loadCategories(url) {
    console.log('Loading categories from:', url);
    elements.categoriesContainer.innerHTML = `
        <div class="loading-categories">
            <i class="fas fa-spinner fa-pulse"></i>
            <div>Loading categories...</div>
        </div>
    `;
    
    // Add loading state to button
    elements.loadCategoriesButton.disabled = true;
    elements.loadCategoriesButton.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Loading...';
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load categories (${response.status})`);
            }
            return response.text();
        })
        .then(data => {
            console.log('Categories playlist loaded, parsing...');
            if (!data.includes('#EXTINF') && !data.includes('#EXTGRP')) {
                throw new Error('Invalid playlist format');
            }
            
            const categories = parseCategories(data);
            if (categories.length === 0) {
                throw new Error('No categories found in playlist');
            }
            
            appState.categories = categories;
            renderCategories(categories);
            
            // If we have a previously selected category, highlight it
            if (appState.selectedCategory) {
                const categoryCards = elements.categoriesContainer.querySelectorAll('.category-card');
                categoryCards.forEach(card => {
                    if (card.textContent.trim() === appState.selectedCategory) {
                        card.classList.add('active');
                    }
                });
            }
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.innerHTML = `<i class="fas fa-check"></i> Loaded ${categories.length} categories`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            elements.categoriesContainer.innerHTML = `
                <div class="loading-categories error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Error loading categories</div>
                    <p>${error.message}</p>
                    <button onclick="loadCategories('${url}')">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
            
            // Show error message
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        })
        .finally(() => {
            // Reset button state
            elements.loadCategoriesButton.disabled = false;
            elements.loadCategoriesButton.innerHTML = '<i class="fas fa-list"></i> Load Categories';
        });
}

/**
 * Parse categories from M3U playlist content
 * @param {string} content - The M3U playlist content
 * @returns {Array} - Array of category objects
 */
function parseCategories(content) {
    const lines = content.split('\n');
    const categories = new Set();
    
    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            // Try to extract category from group-title
            const groupMatch = line.match(/group-title="([^"]+)"/);
            if (groupMatch) {
                categories.add(groupMatch[1]);
            }
        } else if (line.startsWith('#EXTGRP:')) {
            // Also check for EXTGRP tags
            const category = line.substring(8).trim();
            if (category) {
                categories.add(category);
            }
        }
    });
    
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

/**
 * Render category cards in the categories container
 * @param {Array} categories - Array of category names
 */
function renderCategories(categories) {
    if (categories.length === 0) {
        elements.categoriesContainer.innerHTML = `
            <div class="loading-categories">
                <i class="fas fa-info-circle"></i>
                <div>No categories found</div>
            </div>
        `;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        if (category === appState.selectedCategory) {
            card.classList.add('active');
        }
        
        card.innerHTML = `
            <i class="fas fa-folder"></i>
            <div>${category}</div>
        `;
        
        card.addEventListener('click', () => selectCategory(category));
        fragment.appendChild(card);
    });
    
    elements.categoriesContainer.innerHTML = '';
    elements.categoriesContainer.appendChild(fragment);
}

/**
 * Select a category and load its channels
 * @param {string} category - The selected category name
 */
function selectCategory(category) {
    console.log('Selected category:', category);
    
    // Update UI
    const categoryCards = elements.categoriesContainer.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        if (card.textContent.trim() === category) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    // Update state
    appState.selectedCategory = category;
    localStorage.setItem('selectedCategory', category);
    elements.selectedCategoryDisplay.textContent = `Selected: ${category}`;
    
    // Generate and save playlist URL
    const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const categoryUrl = `https://iptv-org.github.io/iptv/categories/${categorySlug}.m3u`;
    appState.playlistUrl = categoryUrl;
    localStorage.setItem('playlistUrl', categoryUrl);
    elements.playlistUrlInput.value = categoryUrl;
    
    // Switch to all channels view and load channels
    switchView('all-channels');
    loadChannels(categoryUrl);
}

/**
 * Switch between different views (all channels, favorites, settings)
 * @param {string} viewId - ID of the view to switch to
 */
function switchView(viewId) {
    console.log('Switching to view:', viewId);
    
    // Hide all views
    elements.views.forEach(view => view.classList.add('hidden'));
    
    // Show the selected view
    const selectedView = document.getElementById(`${viewId}-view`);
    if (selectedView) {
        selectedView.classList.remove('hidden');
        
        // If switching to all channels view, ensure channels are displayed
        if (viewId === 'all-channels') {
            if (appState.channels.length > 0) {
                console.log('Rendering channels in all-channels view');
                renderChannels(appState.channels);
            } else if (!appState.isLoading) {
                console.log('No channels available, loading from URL');
                loadChannels(appState.playlistUrl);
            }
        } else if (viewId === 'favorites') {
            console.log('Rendering favorites view');
            renderFavorites();
        } else if (viewId === 'categories') {
            console.log('Rendering categories view');
            renderCategories(appState.categories);
        }
    }
    
    // Update menu active state
    elements.menuItems.forEach(item => {
        const itemViewId = item.getAttribute('data-view');
        if (itemViewId === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Load and parse the M3U playlist from the given URL
 * @param {string} url - The URL of the M3U playlist
 */
function loadChannels(url) {
    appState.isLoading = true;
    elements.channelsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i>Loading channels...</div>';
    
    console.log('Loading channels from:', url);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            console.log('Playlist loaded successfully, parsing...');
            const channels = parseM3U(data);
            appState.channels = channels;
            appState.isLoading = false;
            console.log(`Found ${channels.length} channels`);
            
            // Switch to all channels view and render channels
            switchView('all-channels');
            
            // Update menu active state
            elements.menuItems.forEach(item => {
                if (item.getAttribute('data-view') === 'all-channels') {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        })
        .catch(error => {
            console.error('Error loading playlist:', error);
            appState.isLoading = false;
            elements.channelsContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error loading channels. Please check the URL and try again.
                    <p>${error.message}</p>
                </div>
            `;
        });
}

/**
 * Parse M3U playlist content into channel objects
 * @param {string} content - The M3U playlist content
 * @returns {Array} - Array of channel objects
 */
function parseM3U(content) {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel = null;
    
    lines.forEach(line => {
        line = line.trim();
        
        if (line.startsWith('#EXTINF:')) {
            // Extract channel info
            currentChannel = {
                id: channels.length,
                name: 'Unknown Channel',
                logo: '',
                group: '',
                url: ''
            };
            
            // Parse channel name
            const nameMatch = line.match(/,(.+)$/);
            if (nameMatch && nameMatch[1]) {
                currentChannel.name = nameMatch[1].trim();
            }
            
            // Parse channel logo
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            if (logoMatch && logoMatch[1]) {
                currentChannel.logo = logoMatch[1];
            }
            
            // Parse channel group
            const groupMatch = line.match(/group-title="([^"]+)"/);
            if (groupMatch && groupMatch[1]) {
                currentChannel.group = groupMatch[1];
            }
        } else if (line.startsWith('http') && currentChannel) {
            // Set channel URL
            currentChannel.url = line;
            channels.push(currentChannel);
            currentChannel = null;
        }
    });
    
    return channels;
}

/**
 * Render channels in the channels container
 * @param {Array} channels - Array of channel objects to render
 */
function renderChannels(channels) {
    console.log('Rendering channels:', channels.length);
    
    if (channels.length === 0) {
        elements.channelsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-tv"></i>
                No channels available
            </div>
        `;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    channels.forEach(channel => {
        fragment.appendChild(createChannelCard(channel));
    });
    
    elements.channelsContainer.innerHTML = '';
    elements.channelsContainer.appendChild(fragment);
}

/**
 * Create a channel card element
 * @param {Object} channel - Channel object
 * @returns {HTMLElement} Channel card element
 */
function createChannelCard(channel) {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.innerHTML = `
        <h3>${channel.name}</h3>
        <p>${channel.group || 'Uncategorized'}</p>
    `;
    
    // Add click event listener to open the player
    card.addEventListener('click', () => {
        console.log('Channel card clicked:', channel.name);
        playChannel(channel);
    });
    
    return card;
}

/**
 * Play a channel in the video player
 * @param {Object} channel - Channel object to play
 */
function playChannel(channel) {
    console.log('Playing channel:', channel.name, channel.url);
    appState.currentChannel = channel;
    
    // Show player view and hide main container
    elements.playerView.classList.remove('hidden');
    elements.appContainer.style.display = 'none';
    
    // Update player header
    elements.channelTitle.textContent = channel.name;
    elements.channelInfo.innerHTML = `
        <div>Category: ${channel.group || 'Uncategorized'}</div>
    `;
    
    // Update favorite button
    const isFavorite = appState.favorites.some(fav => fav.url === channel.url);
    elements.addToFavoritesButton.innerHTML = isFavorite ? 
        '<i class="fas fa-heart"></i>' : 
        '<i class="far fa-heart"></i>';
    
    // Show loading overlay
    elements.videoOverlay.classList.remove('hidden');
    elements.videoOverlay.innerHTML = `
        <div class="video-message">
            <i class="fas fa-spinner fa-pulse"></i>
            <div>Loading stream...</div>
        </div>
    `;
    
    // Set up video player
    const video = elements.videoPlayer;
    video.innerHTML = ''; // Clear any previous error messages
    
    // Cleanup any existing HLS instance
    if (window.hls) {
        window.hls.destroy();
        window.hls = null;
    }
    
    // Check if the URL is an HLS stream
    if (channel.url.includes('.m3u8')) {
        if (Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                enableWorker: true,
                debug: false,
                // Add more robust error recovery
                maxBufferHole: 0.5,
                highBufferWatchdogPeriod: 2,
                nudgeOffset: 0.1,
                nudgeMaxRetry: 5
            });
            
            // Store HLS instance for cleanup
            window.hls = hls;
            
            hls.loadSource(channel.url);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS manifest parsed, attempting playback');
                elements.videoOverlay.classList.add('hidden');
                video.play()
                    .catch(error => {
                        console.error('Error playing video:', error);
                        showPlaybackError(error);
                    });
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Network error, attempting recovery...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media error, attempting recovery...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error('Fatal error, stopping playback');
                            showPlaybackError(new Error('Stream playback error: ' + data.details));
                            break;
                    }
                }
            });
            
            // Add quality level switching
            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                console.log('Quality level switched to:', data.level);
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            console.log('Using native HLS support');
            video.src = channel.url;
            video.addEventListener('loadedmetadata', () => {
                elements.videoOverlay.classList.add('hidden');
                video.play()
                    .catch(error => {
                        console.error('Error playing video:', error);
                        showPlaybackError(error);
                    });
            });
        } else {
            console.error('HLS is not supported');
            showPlaybackError(new Error('Your browser does not support HLS streaming'));
            return;
        }
    } else {
        // Regular video URL
        console.log('Using regular video URL');
        video.src = channel.url;
        video.play()
            .then(() => {
                elements.videoOverlay.classList.add('hidden');
            })
            .catch(error => {
                console.error('Error playing video:', error);
                showPlaybackError(error);
            });
    }
    
    // Add event listeners for video errors and status
    video.addEventListener('error', () => {
        console.error('Video error:', video.error);
        showPlaybackError(video.error || new Error('Error playing stream'));
    });
    
    video.addEventListener('waiting', () => {
        elements.videoOverlay.classList.remove('hidden');
        elements.videoOverlay.innerHTML = `
            <div class="video-message">
                <i class="fas fa-spinner fa-pulse"></i>
                <div>Buffering...</div>
            </div>
        `;
    });
    
    video.addEventListener('playing', () => {
        elements.videoOverlay.classList.add('hidden');
    });
}

/**
 * Close the video player and return to channel list
 */
function closePlayer() {
    const video = elements.videoPlayer;
    
    // Stop any HLS instance if it exists
    if (window.hls) {
        window.hls.destroy();
        window.hls = null;
    }
    
    // Stop video playback
    video.pause();
    video.src = '';
    video.load();
    
    // Hide player view and show channels view
    elements.playerView.classList.add('hidden');
    elements.appContainer.style.display = 'flex';
    
    // Reset state
    appState.currentChannel = null;
}

/**
 * Show playback error message
 * @param {Error} error - Error object
 */
function showPlaybackError(error) {
    elements.videoOverlay.classList.add('hidden');
    elements.channelInfo.innerHTML += `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            Error playing stream. Please try another channel.
            ${error.message ? `<br>${error.message}` : ''}
        </div>
    `;
}

/**
 * Toggle favorite status for the current channel
 */
function toggleFavorite() {
    if (!appState.currentChannel) return;
    
    const channel = appState.currentChannel;
    const isFavorite = appState.favorites.some(fav => fav.url === channel.url);
    
    if (isFavorite) {
        // Remove from favorites
        appState.favorites = appState.favorites.filter(fav => fav.url !== channel.url);
        elements.addToFavoritesButton.innerHTML = '<i class="far fa-heart"></i>';
    } else {
        // Add to favorites
        appState.favorites.push(channel);
        elements.addToFavoritesButton.innerHTML = '<i class="fas fa-heart"></i>';
    }
    
    // Save favorites to localStorage
    saveFavorites();
    
    // Update favorites view if it's visible
    if (document.getElementById('favorites-view').classList.contains('hidden') === false) {
        renderFavorites();
    }
    
    // Update channel cards in the all channels view
    updateChannelCards();
}

/**
 * Save favorites to localStorage
 */
function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(appState.favorites));
}

/**
 * Load favorites from localStorage
 */
function loadFavorites() {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        try {
            appState.favorites = JSON.parse(savedFavorites);
        } catch (e) {
            console.error('Error loading favorites:', e);
            appState.favorites = [];
        }
    }
}

/**
 * Render favorite channels
 */
function renderFavorites() {
    if (appState.favorites.length === 0) {
        elements.favoritesContainer.innerHTML = '<div class="no-favorites"><i class="far fa-heart"></i>No favorite channels yet.</div>';
        return;
    }
    
    elements.favoritesContainer.innerHTML = '';
    
    appState.favorites.forEach(channel => {
        const channelCard = createChannelCard(channel);
        elements.favoritesContainer.appendChild(channelCard);
    });
}

/**
 * Update channel cards to reflect favorite status
 */
function updateChannelCards() {
    const channelCards = elements.channelsContainer.querySelectorAll('.channel-card');
    
    channelCards.forEach(card => {
        const channelId = parseInt(card.dataset.channelId);
        const channel = appState.channels.find(ch => ch.id === channelId);
        
        if (channel) {
            const isFavorite = appState.favorites.some(fav => fav.url === channel.url);
            const favoriteIndicator = card.querySelector('.favorite-indicator');
            
            if (isFavorite && !favoriteIndicator) {
                const thumbnail = card.querySelector('.channel-thumbnail');
                const indicator = document.createElement('div');
                indicator.className = 'favorite-indicator';
                indicator.innerHTML = '<i class="fas fa-heart"></i>';
                thumbnail.appendChild(indicator);
            } else if (!isFavorite && favoriteIndicator) {
                favoriteIndicator.remove();
            }
        }
    });
}

/**
 * Perform search on channels
 */
function performSearch() {
    const query = elements.searchInput.value.trim().toLowerCase();
    
    if (!query) {
        renderChannels(appState.channels);
        return;
    }
    
    const filteredChannels = appState.channels.filter(channel => 
        channel.name.toLowerCase().includes(query) || 
        (channel.group && channel.group.toLowerCase().includes(query))
    );
    
    renderChannels(filteredChannels);
}

/**
 * Handle keyboard navigation for TV remote control
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardNavigation(e) {
    // Handle navigation with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        const focusableElements = document.querySelectorAll('button, input, .channel-card');
        const currentElement = document.activeElement;
        
        // If no element is focused, focus the first menu item
        if (currentElement === document.body) {
            focusableElements[0].focus();
            return;
        }
        
        // Handle navigation based on key
        navigateWithKeys(e.key, currentElement, focusableElements);
    }
    
    // Handle selection with Enter key
    if (e.key === 'Enter' && document.activeElement.classList.contains('channel-card')) {
        const channelId = parseInt(document.activeElement.dataset.channelId);
        const channel = appState.channels.find(ch => ch.id === channelId);
        if (channel) {
            playChannel(channel);
        }
    }
    
    // Handle back with Escape key
    if (e.key === 'Escape') {
        if (!elements.playerModal.classList.contains('hidden')) {
            closePlayer();
        }
    }
}

/**
 * Navigate between elements using arrow keys
 * @param {string} key - Arrow key pressed
 * @param {Element} currentElement - Currently focused element
 * @param {NodeList} focusableElements - All focusable elements
 */
function navigateWithKeys(key, currentElement, focusableElements) {
    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    let nextIndex = currentIndex;
    
    // Simple grid navigation logic
    switch (key) {
        case 'ArrowUp':
            nextIndex = Math.max(0, currentIndex - 4); // Assuming 4 items per row
            break;
        case 'ArrowDown':
            nextIndex = Math.min(focusableElements.length - 1, currentIndex + 4);
            break;
        case 'ArrowLeft':
            nextIndex = Math.max(0, currentIndex - 1);
            break;
        case 'ArrowRight':
            nextIndex = Math.min(focusableElements.length - 1, currentIndex + 1);
            break;
    }
    
    if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
    }
}
