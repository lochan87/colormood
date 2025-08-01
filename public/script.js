// === GLOBAL STATE ===
class ColorMoodApp {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.currentMoodEntry = null;
        this.currentGeneratedContent = null;
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
        this.loadGallery();
        this.loadStats();
    }

    // === EVENT LISTENERS ===
    setupEventListeners() {
        // Mood form submission
        document.getElementById('moodForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeMood();
        });

        // Tab navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Art actions
        document.getElementById('regenerateArt')?.addEventListener('click', () => {
            this.regenerateArt();
        });

        document.getElementById('downloadArt')?.addEventListener('click', () => {
            this.downloadArt();
        });

        // Rating system
        document.querySelectorAll('.rating-stars').forEach(starGroup => {
            this.setupRating(starGroup);
        });

        // Modal handling
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', this.closeModal);
        });

        // Gallery item clicks
        document.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('.gallery-item');
            if (galleryItem) {
                this.showArtModal(galleryItem.dataset.id);
            }
        });
    }

    setupTabs() {
        // Set initial active tab
        this.switchTab('home');
    }

    setupRating(starGroup) {
        const stars = starGroup.querySelectorAll('i');
        const type = starGroup.dataset.type;
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.setRating(type, index + 1, starGroup);
            });
            
            star.addEventListener('mouseenter', () => {
                this.highlightStars(starGroup, index + 1);
            });
        });
        
        starGroup.addEventListener('mouseleave', () => {
            this.resetStarHighlights(starGroup);
        });
    }

    // === TAB MANAGEMENT ===
    switchTab(tabName) {
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load data for specific tabs
        switch(tabName) {
            case 'gallery':
                this.loadGallery();
                break;
            case 'stats':
                this.loadStats();
                break;
        }
    }

    // === MOOD ANALYSIS ===
    async analyzeMood() {
        const moodDescription = document.getElementById('moodDescription').value.trim();
        
        if (!moodDescription) {
            this.showToast('Please describe your mood first', 'warning');
            return;
        }

        this.showLoading(true);
        this.setButtonLoading('analyzeBtn', true);

        try {
            // Analyze mood
            const moodResponse = await this.apiRequest('/api/mood/analyze', 'POST', {
                moodDescription,
                sessionId: this.sessionId
            });

            if (!moodResponse.success) {
                throw new Error(moodResponse.error || 'Failed to analyze mood');
            }

            this.currentMoodEntry = moodResponse.moodEntry;
            this.displayMoodResults(moodResponse.moodEntry);

            // Generate content in parallel
            await Promise.all([
                this.generateArt(moodResponse.moodEntry.id),
                this.generateMusicAndPrompts(moodResponse.moodEntry.id)
            ]);

            this.showToast('Your personalized content is ready!', 'success');
            
        } catch (error) {
            console.error('Error analyzing mood:', error);
            this.showToast(error.message || 'Failed to analyze mood. Please try again.', 'error');
        } finally {
            this.showLoading(false);
            this.setButtonLoading('analyzeBtn', false);
        }
    }

    displayMoodResults(moodEntry) {
        // Show results section
        document.getElementById('moodResults').classList.remove('hidden');
        document.getElementById('moodResults').scrollIntoView({ behavior: 'smooth' });

        // Display mood summary
        const summaryContent = document.getElementById('moodSummaryContent');
        summaryContent.innerHTML = `
            <div class="mood-stat">
                <span class="mood-stat-label">Primary Emotion</span>
                <span class="mood-stat-value">${this.capitalizeFirst(moodEntry.primaryEmotion)}</span>
            </div>
            <div class="mood-stat">
                <span class="mood-stat-label">Intensity</span>
                <span class="mood-stat-value">${moodEntry.emotionIntensity}/10</span>
            </div>
            <div class="mood-stat">
                <span class="mood-stat-label">Energy Level</span>
                <span class="mood-stat-value">${this.formatEnergyLevel(moodEntry.energyLevel)}</span>
            </div>
            ${moodEntry.secondaryEmotions && moodEntry.secondaryEmotions.length > 0 ? `
                <div class="mood-stat">
                    <span class="mood-stat-label">Secondary Emotions</span>
                    <div class="emotion-tags">
                        ${moodEntry.secondaryEmotions.map(emotion => 
                            `<span class="emotion-tag">${this.capitalizeFirst(emotion)}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            ${moodEntry.moodColors && moodEntry.moodColors.length > 0 ? `
                <div class="mood-stat">
                    <span class="mood-stat-label">Mood Colors</span>
                    <div class="color-palette">
                        ${moodEntry.moodColors.map(color => 
                            `<div class="color-swatch" style="background-color: ${color}"></div>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    // === ART GENERATION ===
    async generateArt(moodEntryId) {
        try {
            const artResponse = await this.apiRequest('/api/art/generate', 'POST', {
                moodEntryId,
                sessionId: this.sessionId
            });

            if (!artResponse.success) {
                throw new Error(artResponse.error || 'Failed to generate art');
            }

            this.displayGeneratedArt(artResponse.art);
            
        } catch (error) {
            console.error('Error generating art:', error);
            this.showToast('Failed to generate art: ' + error.message, 'error');
        }
    }

    displayGeneratedArt(art) {
        const artContainer = document.getElementById('generatedArt');
        const artDescription = document.getElementById('artDescription');
        
        artContainer.innerHTML = art.svg;
        artDescription.innerHTML = `
            <h4>Art Interpretation</h4>
            <p>${art.description}</p>
            <div class="art-meta">
                <strong>Style:</strong> ${this.capitalizeFirst(art.style)} | 
                <strong>Colors:</strong> ${art.colorPalette.length} unique colors
            </div>
        `;
    }

    async regenerateArt() {
        if (!this.currentMoodEntry) {
            this.showToast('No mood entry found. Please analyze your mood first.', 'warning');
            return;
        }

        const btn = document.getElementById('regenerateArt');
        this.setButtonLoading('regenerateArt', true, 'Regenerating...');
        
        try {
            await this.generateArt(this.currentMoodEntry.id);
            this.showToast('Art regenerated successfully!', 'success');
        } catch (error) {
            this.showToast('Failed to regenerate art', 'error');
        } finally {
            this.setButtonLoading('regenerateArt', false);
        }
    }

    downloadArt() {
        const svg = document.querySelector('#generatedArt svg');
        if (!svg) {
            this.showToast('No art to download', 'warning');
            return;
        }

        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            canvas.width = 800;
            canvas.height = 600;
            
            img.onload = () => {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                const link = document.createElement('a');
                link.download = `colormood-art-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                
                this.showToast('Art downloaded successfully!', 'success');
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Failed to download art', 'error');
        }
    }

    // === MUSIC & PROMPTS ===
    async generateMusicAndPrompts(moodEntryId) {
        try {
            const response = await this.apiRequest('/api/music/generate', 'POST', {
                moodEntryId,
                sessionId: this.sessionId
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to generate music and prompts');
            }

            this.displayMusicPlaylist(response.content.musicPlaylist);
            this.displayJournalingPrompts(response.content.journalingPrompts);
            this.currentGeneratedContent = response.content;
            
        } catch (error) {
            console.error('Error generating music and prompts:', error);
            this.showToast('Failed to generate music and prompts: ' + error.message, 'error');
        }
    }

    displayMusicPlaylist(playlist) {
        const playlistContent = document.getElementById('playlistContent');
        
        if (!playlist || playlist.length === 0) {
            playlistContent.innerHTML = '<p class="text-muted">No music recommendations available.</p>';
            return;
        }

        playlistContent.innerHTML = playlist.map(track => `
            <div class="track-item">
                <div class="track-info">
                    <div class="track-name">${this.escapeHtml(track.trackName)}</div>
                    <div class="track-artist">${this.escapeHtml(track.artist)} • ${this.escapeHtml(track.genre || 'Unknown')}</div>
                </div>
                <div class="track-actions">
                    ${track.previewUrl ? `
                        <button class="play-btn" onclick="app.playPreview('${track.previewUrl}')" title="Play Preview">
                            <i class="fas fa-play"></i>
                        </button>
                    ` : ''}
                    ${track.spotifyUrl ? `
                        <button class="spotify-btn" onclick="window.open('${track.spotifyUrl}', '_blank')" title="Open in Spotify">
                            <i class="fab fa-spotify"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    displayJournalingPrompts(prompts) {
        const promptsContent = document.getElementById('promptsContent');
        
        if (!prompts || prompts.length === 0) {
            promptsContent.innerHTML = '<p class="text-muted">No journaling prompts available.</p>';
            return;
        }

        promptsContent.innerHTML = prompts.map(prompt => `
            <div class="prompt-item">
                <div class="prompt-text">${this.escapeHtml(prompt.prompt)}</div>
                <div class="prompt-meta">
                    <span class="prompt-category">${this.capitalizeFirst(prompt.category)}</span>
                    <span class="prompt-difficulty">${this.capitalizeFirst(prompt.difficulty)} level</span>
                </div>
            </div>
        `).join('');
    }

    playPreview(previewUrl) {
        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        try {
            this.currentAudio = new Audio(previewUrl);
            this.currentAudio.play();
            this.showToast('Playing preview...', 'success');
            
            this.currentAudio.addEventListener('ended', () => {
                this.currentAudio = null;
            });
        } catch (error) {
            this.showToast('Failed to play preview', 'error');
        }
    }

    // === RATING SYSTEM ===
    setRating(type, rating, starGroup) {
        if (!this.currentGeneratedContent) {
            this.showToast('Please generate content first', 'warning');
            return;
        }

        this.saveRating(type, rating);
        
        // Update visual state
        const stars = starGroup.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    async saveRating(type, rating) {
        if (!this.currentGeneratedContent) return;

        try {
            const endpoint = type === 'art' ? 
                `/api/art/${this.currentGeneratedContent.id}/rate` :
                type === 'music' ? 
                `/api/music/${this.currentGeneratedContent.id}/rate-music` :
                `/api/music/${this.currentGeneratedContent.id}/rate-prompts`;

            await this.apiRequest(endpoint, 'POST', {
                sessionId: this.sessionId,
                rating: rating
            });

            this.showToast(`${this.capitalizeFirst(type)} rating saved!`, 'success');
        } catch (error) {
            console.error('Error saving rating:', error);
            this.showToast('Failed to save rating', 'error');
        }
    }

    highlightStars(starGroup, count) {
        const stars = starGroup.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < count) {
                star.style.color = 'var(--accent-color)';
            } else {
                star.style.color = 'var(--gray-300)';
            }
        });
    }

    resetStarHighlights(starGroup) {
        const stars = starGroup.querySelectorAll('i');
        stars.forEach(star => {
            star.style.color = star.classList.contains('active') ? 
                'var(--accent-color)' : 'var(--gray-300)';
        });
    }

    // === GALLERY ===
    async loadGallery(page = 1) {
        try {
            const response = await this.apiRequest(`/api/art/gallery/${this.sessionId}?page=${page}&limit=12`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load gallery');
            }

            this.displayGallery(response.gallery, response.pagination);
        } catch (error) {
            console.error('Error loading gallery:', error);
            document.getElementById('galleryGrid').innerHTML = 
                '<p class="text-muted">Failed to load gallery. Please try again.</p>';
        }
    }

    displayGallery(artPieces, pagination) {
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (!artPieces || artPieces.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images fa-3x" style="color: var(--gray-300); margin-bottom: var(--spacing-md);"></i>
                    <h3>No Art Yet</h3>
                    <p>Start by describing your mood to create your first piece of art!</p>
                    <button class="btn btn-primary" onclick="app.switchTab('home')">
                        <i class="fas fa-plus"></i>
                        Create Your First Art
                    </button>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = artPieces.map(piece => `
            <div class="gallery-item" data-id="${piece.id}">
                <div class="gallery-artwork">
                    ${piece.thumbnail}
                </div>
                <div class="gallery-info">
                    <div class="gallery-mood">
                        <div class="mood-icon" style="background-color: ${piece.colorPalette[0] || 'var(--primary-color)'}"></div>
                        <span>${this.capitalizeFirst(piece.mood)} (${piece.intensity}/10)</span>
                    </div>
                    <div class="gallery-date">
                        ${this.formatDate(piece.createdAt)}
                    </div>
                    ${piece.rating ? `
                        <div class="gallery-rating">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="fas fa-star ${i < piece.rating ? 'active' : ''}"></i>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        this.displayPagination(pagination, 'galleryPagination', (page) => this.loadGallery(page));
    }

    // === STATISTICS ===
    async loadStats() {
        try {
            const response = await this.apiRequest(`/api/mood/stats/${this.sessionId}`);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to load statistics');
            }

            this.displayStats(response.stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('statsContent').innerHTML = 
                '<p class="text-muted">Failed to load statistics. Please try again.</p>';
        }
    }

    displayStats(stats) {
        const statsContent = document.getElementById('statsContent');
        
        if (!stats || stats.totalEntries === 0) {
            statsContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line fa-3x" style="color: var(--gray-300); margin-bottom: var(--spacing-md);"></i>
                    <h3>No Data Yet</h3>
                    <p>Track your emotional journey by describing your moods regularly.</p>
                    <button class="btn btn-primary" onclick="app.switchTab('home')">
                        <i class="fas fa-plus"></i>
                        Start Tracking
                    </button>
                </div>
            `;
            return;
        }

        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${stats.totalEntries}</span>
                    <span class="stat-label">Mood Entries</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.moodDiversity}</span>
                    <span class="stat-label">Unique Emotions</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.averageIntensity.toFixed(1)}/10</span>
                    <span class="stat-label">Average Intensity</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${this.capitalizeFirst(stats.mostCommonMood || 'N/A')}</span>
                    <span class="stat-label">Most Common Mood</span>
                </div>
            </div>

            <div class="mood-distribution">
                <h3>Mood Distribution</h3>
                ${stats.moodDistribution.map(mood => {
                    const percentage = Math.round((mood.count / stats.totalEntries) * 100);
                    return `
                        <div class="distribution-item">
                            <span>${this.capitalizeFirst(mood._id)}</span>
                            <div class="distribution-bar">
                                <div class="distribution-fill" style="width: ${percentage}%"></div>
                            </div>
                            <span>${mood.count} (${percentage}%)</span>
                        </div>
                    `;
                }).join('')}
            </div>

            ${stats.recentMoods.length > 0 ? `
                <div class="mood-distribution">
                    <h3>Recent Mood Trend</h3>
                    <div class="mood-timeline">
                        ${stats.recentMoods.map(mood => `
                            <div class="timeline-item">
                                <span class="timeline-date">${this.formatDate(mood.timestamp)}</span>
                                <span class="timeline-mood">${this.capitalizeFirst(mood.primaryEmotion)}</span>
                                <span class="timeline-intensity">${mood.emotionIntensity}/10</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    // === MODAL HANDLING ===
    async showArtModal(artId) {
        const modal = document.getElementById('artModal');
        const modalContent = document.getElementById('modalArtContent');
        
        try {
            // This would require additional API endpoint to get full art details
            // For now, show a placeholder
            modalContent.innerHTML = `
                <h3>Artwork Details</h3>
                <p>Loading artwork details...</p>
            `;
            
            modal.classList.add('show');
        } catch (error) {
            this.showToast('Failed to load artwork details', 'error');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // === PAGINATION ===
    displayPagination(pagination, containerId, onPageClick) {
        const container = document.getElementById(containerId);
        
        if (!pagination || pagination.total <= 1) {
            container.innerHTML = '';
            return;
        }

        const pages = [];
        const current = pagination.current;
        const total = pagination.total;

        // Previous button
        pages.push(`
            <button ${!pagination.hasPrev ? 'disabled' : ''} 
                    onclick="${pagination.hasPrev ? `${onPageClick.name}(${current - 1})` : ''}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `);

        // Page numbers
        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
            pages.push(`
                <button class="${i === current ? 'active' : ''}" 
                        onclick="${onPageClick.name}(${i})">
                    ${i}
                </button>
            `);
        }

        // Next button
        pages.push(`
            <button ${!pagination.hasNext ? 'disabled' : ''} 
                    onclick="${pagination.hasNext ? `${onPageClick.name}(${current + 1})` : ''}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `);

        container.innerHTML = pages.join('');
    }

    // === UTILITY METHODS ===
    async apiRequest(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    setButtonLoading(buttonId, loading, text = 'Loading...') {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            const loadingText = button.querySelector('.btn-loading');
            if (loadingText) {
                loadingText.textContent = text;
            }
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);

        // Manual close on click
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatEnergyLevel(level) {
        const levels = {
            'very-low': 'Very Low',
            'low': 'Low',
            'moderate': 'Moderate',
            'high': 'High',
            'very-high': 'Very High'
        };
        return levels[level] || level;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// === INITIALIZATION ===
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new ColorMoodApp();
    
    // Global error handling
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        if (app) {
            app.showToast('Something went wrong. Please refresh the page.', 'error');
        }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        if (app) {
            app.showToast('Something went wrong. Please try again.', 'error');
        }
    });
});

// === GLOBAL FUNCTIONS (for inline event handlers) ===
function switchTab(tabName) {
    if (app) app.switchTab(tabName);
}

function loadGallery(page) {
    if (app) app.loadGallery(page);
}
