// Mock Data
const categories = [
    { icon: '🍔', name: 'Fast Food' },
    { icon: '🍕', name: 'Pizza' },
    { icon: '🥘', name: 'Africain' },
    { icon: '🥗', name: 'Healthy' },
    { icon: '🍣', name: 'Sushi' },
    { icon: '🍰', name: 'Desserts' }
];

const restaurants = [
    {
        id: 1,
        name: 'Burger Palace',
        image: 'assets/burger.png',
        rating: 4.8,
        reviews: 245,
        time: '20-30 min',
        fee: '500 FCFA',
        tags: ['Burger', 'Fast Food'],
        featured: true
    },
    {
        id: 2,
        name: 'Mama Africa',
        image: 'assets/african.png',
        rating: 4.9,
        reviews: 128,
        time: '30-45 min',
        fee: 'Gratuit',
        tags: ['Africain', 'Traditionnel']
    },
    {
        id: 3,
        name: 'Sushi Zen',
        image: 'assets/sushi.png',
        rating: 4.7,
        reviews: 89,
        time: '40-50 min',
        fee: '1000 FCFA',
        tags: ['Japonais', 'Sushi']
    },
    {
        id: 4,
        name: 'Pizza Romana',
        image: 'assets/pizza.png',
        rating: 4.6,
        reviews: 312,
        time: '25-35 min',
        fee: '500 FCFA',
        tags: ['Pizza', 'Italien']
    }
];

// Cart State moved to cart.js

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroller();
    renderCategories();
    renderRestaurants();
    simulateAIGeneration();

    const btnSearch = document.getElementById('btn-search');
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            const restSection = document.querySelector('.restaurants-section');
            if(restSection) {
                restSection.scrollIntoView({behavior: 'smooth'});
            }
        });
    }
});

function initNavbarScroller() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    grid.innerHTML = categories.map(cat => `
        <div class="category-card">
            <div class="category-icon">${cat.icon}</div>
            <h3>${cat.name}</h3>
        </div>
    `).join('');
}

function renderRestaurants() {
    const grid = document.getElementById('restaurants-grid');
    if (!grid) return;

    grid.innerHTML = restaurants.map(rest => `
        <div class="restaurant-card" onclick="window.location.href='pages/restaurant.html'">
            <div class="rest-img">
                <img src="${rest.image}" alt="${rest.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'" style="width:100%; height:100%; object-fit:cover;">
                ${rest.featured ? '<div class="rest-badges"><span class="badge" style="color:var(--primary)">Populaire</span></div>' : ''}
            </div>
            <div class="rest-info">
                <div class="rest-header">
                    <h3 class="rest-title">${rest.name}</h3>
                    <div class="rest-rating">
                        <i class="fa-solid fa-star"></i> ${rest.rating}
                    </div>
                </div>
                <div class="rest-meta">
                    <span><i class="fa-regular fa-clock"></i> ${rest.time}</span>
                    <span><i class="fa-solid fa-motorcycle"></i> ${rest.fee}</span>
                </div>
                <div class="quick-filters">
                    ${rest.tags.map(tag => `<span class="badge" style="background:var(--bg-light);color:var(--text-muted);font-weight:normal;padding:0.2rem 0.5rem;font-size:0.75rem">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}



function simulateAIGeneration() {
    const btn = document.querySelector('.mockup-card .btn-primary');
    const imgContainer = document.getElementById('ai-demo-img');
    
    if(btn && imgContainer) {
        btn.addEventListener('click', () => {
            imgContainer.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-primary"></i>';
            setTimeout(() => {
                imgContainer.innerHTML = '<img src="assets/ai_food_demo.png" onerror="this.src=\\'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=400&auto=format&fit=crop\\'" alt="Generated Food" style="animation: fadeIn 0.5s ease; width:100%; height:100%; object-fit:cover;">';
            }, 2000);
        });
    }
}
