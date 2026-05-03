// API Data will be fetched from the backend

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

async function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    try {
        const categories = await api.getCategories();
        
        if (categories.length === 0) {
            grid.innerHTML = '<p>Aucune catégorie disponible.</p>';
            return;
        }

        grid.innerHTML = categories.map(cat => `
            <div class="category-card">
                <div class="category-icon">${cat.icon}</div>
                <h3>${cat.name}</h3>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function renderRestaurants() {
    const grid = document.getElementById('restaurants-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Chargement des restaurants...</div>';

    try {
        const restaurants = await api.getRestaurants();
        
        if (restaurants.length === 0) {
            grid.innerHTML = '<p>Aucun restaurant disponible pour le moment.</p>';
            return;
        }

        grid.innerHTML = restaurants.map(rest => {
            const defaultImg = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop';
            const restImg = rest.imageUrl || defaultImg;
            
            return `
                <div class="restaurant-card" onclick="window.location.href='pages/restaurant.html?id=${rest.id}'">
                    <div class="rest-img">
                        <img src="${restImg}" 
                             alt="${rest.name}" 
                             onerror="this.src='${defaultImg}'"
                             style="width:100%; height:100%; object-fit:cover;">
                        ${rest.rating > 4.5 ? '<div class="rest-badges"><span class="badge" style="color:var(--primary)">Populaire</span></div>' : ''}
                    </div>
                    <div class="rest-info">
                        <div class="rest-header">
                            <h3 class="rest-title">${rest.name}</h3>
                            <div class="rest-rating">
                                <i class="fa-solid fa-star"></i> ${rest.rating || '4.5'}
                            </div>
                        </div>
                        <div class="rest-meta">
                            <span><i class="fa-regular fa-clock"></i> ${rest.deliveryTime || '20-30 min'}</span>
                            <span><i class="fa-solid fa-motorcycle"></i> Gratuit</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        grid.innerHTML = '<p class="error-msg">Impossible de charger les restaurants. Veuillez vérifier que le serveur est lancé.</p>';
    }
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
