// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const navLinks = mainNav ? mainNav.querySelectorAll('a') : [];

    // Toggle mobile menu
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mainNav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            mobileMenuToggle.textContent = mainNav.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mainNav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.textContent = '☰';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mainNav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.textContent = '☰';
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.textContent = '☰';
            }
        });
    }
});

