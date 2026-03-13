/**
 * Theme Toggle Script
 * Handles switching between Light and Dark mode
 */

const themeToggle = {
    init() {
        // Check for saved theme preference or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        }
        
        // Find toggle buttons in the page
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        toggleButtons.forEach(btn => {
            // Set initial icon based on theme
            this.updateIcon(btn);
            
            btn.addEventListener('click', () => {
                document.body.classList.toggle('light-mode');
                const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
                localStorage.setItem('theme', currentTheme);
                this.updateIcon(btn);
            });
        });
    },

    updateIcon(btn) {
        const isLight = document.body.classList.contains('light-mode');
        // Assuming we are using Feather Icons or Lucide (common in these premium designs)
        // Adjusting to use simple emoji icons if no library is specified, 
        // but let's check for Lucide first or just use Font Awesome / Phosphor if available.
        // For now, let's use standard emoji as fallback icons.
        btn.innerHTML = isLight ? '🌙' : '☀️';
        btn.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }
};

// Initialize after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    themeToggle.init();
});
