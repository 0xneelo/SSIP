// ========================================
// SOVEREIGN INTENT PROTOCOL - MAIN JS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initSmoothScroll();
    initNavigation();
    initAnimations();
    initDiagram();
});

// Smooth Scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navigation scroll effects
function initNavigation() {
    const nav = document.querySelector('.nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove scrolled class
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// Scroll-triggered animations
function initAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    const animateElements = document.querySelectorAll(
        '.pillar-card, .process-step, .source-card, .chapter-item, .section-header'
    );
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Stagger animation for grid items
    document.querySelectorAll('.pillars-grid, .sources-grid, .chapter-list').forEach(grid => {
        const items = grid.children;
        Array.from(items).forEach((item, index) => {
            item.style.transitionDelay = `${index * 100}ms`;
        });
    });
}

// Interactive Protocol Diagram
function initDiagram() {
    const nodes = document.querySelectorAll('.diagram-node');
    const center = document.querySelector('.diagram-center');
    
    nodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            node.style.transform = 'scale(1.2)';
            center.style.borderColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent-secondary');
        });
        
        node.addEventListener('mouseleave', () => {
            node.style.transform = '';
            center.style.borderColor = '';
        });
    });
}

// Whitepaper navigation highlighting
function initWhitepaperNav() {
    const sections = document.querySelectorAll('.whitepaper-content h2[id]');
    const navLinks = document.querySelectorAll('.whitepaper-nav a');
    
    if (sections.length === 0) return;

    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
}

// Copy code blocks
function initCodeCopy() {
    document.querySelectorAll('pre code').forEach(block => {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.textContent = 'Copy';
        button.addEventListener('click', () => {
            navigator.clipboard.writeText(block.textContent);
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        });
        block.parentElement.style.position = 'relative';
        block.parentElement.appendChild(button);
    });
}

// Initialize whitepaper-specific features if on whitepaper page
if (document.querySelector('.whitepaper-page')) {
    initWhitepaperNav();
    initCodeCopy();
}

// Console Easter Egg
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ◇ SOVEREIGN INTENT PROTOCOL                             ║
║   A Symmetrical Private Law Society                       ║
║                                                           ║
║   "The state is an insolvent counterparty                 ║
║    that cannot be liquidated."                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

