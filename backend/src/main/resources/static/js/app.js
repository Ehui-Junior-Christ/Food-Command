// API Data will be fetched from the backend

// Cart State moved to cart.js

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroller();
    initUserProfile();
    renderCategories();
    renderRestaurants();
    simulateAIGeneration();

    const btnSearch = document.getElementById('btn-search');
    const searchInput = document.getElementById('search-input');
    
    if (btnSearch && searchInput) {
        btnSearch.addEventListener('click', () => {
            const searchTerm = searchInput.value.toLowerCase();
            filterRestaurants(searchTerm);
            
            const restSection = document.querySelector('.restaurants-section');
            if(restSection) {
                restSection.scrollIntoView({behavior: 'smooth'});
            }
        });

        // Recherche en temps réel en tapant
        searchInput.addEventListener('input', (e) => {
            filterRestaurants(e.target.value.toLowerCase());
        });
    }
});

function filterRestaurants(term) {
    const cards = document.querySelectorAll('.restaurant-card');
    cards.forEach(card => {
        const title = card.querySelector('.rest-title').textContent.toLowerCase();
        if (title.includes(term)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

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

async function initUserProfile() {
    const userProfileContainer = document.getElementById('user-profile-container');
    const btnLogin = document.getElementById('btn-login');
    const userNameNav = document.getElementById('user-name-nav');
    const userAvatar = document.getElementById('user-avatar');
    const dropdownFullName = document.getElementById('dropdown-full-name');
    const dropdownEmail = document.getElementById('dropdown-email');
    const userProfileTrigger = document.getElementById('user-profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    const btnLogout = document.getElementById('btn-logout');

    const token = localStorage.getItem('user_token');

    if (token) {
        try {
            const user = await api.getCurrentUser();
            
            if (user) {
                // Update UI
                if(userNameNav) userNameNav.textContent = user.fullName ? user.fullName.split(' ')[0] : 'Profil';
                if(dropdownFullName) dropdownFullName.textContent = user.fullName || 'Utilisateur';
                if(dropdownEmail) dropdownEmail.textContent = user.email;
                if(userAvatar) userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=FF5A5F&color=fff`;
                
                if(userProfileContainer) userProfileContainer.style.display = 'flex';
                if(btnLogin) btnLogin.style.display = 'none';

                // Toggle dropdown
                if(userProfileTrigger) {
                    userProfileTrigger.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if(profileDropdown) profileDropdown.classList.toggle('active');
                    });
                }

                // Close dropdown
                document.addEventListener('click', () => {
                    if(profileDropdown) profileDropdown.classList.remove('active');
                });

                // Logout
                if(btnLogout) {
                    btnLogout.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('user_token');
                        localStorage.removeItem('user_role');
                        localStorage.removeItem('user_email');
                        window.location.href = 'index.html';
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }
}
