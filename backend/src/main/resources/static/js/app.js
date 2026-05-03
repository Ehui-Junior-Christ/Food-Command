// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroller();
    initUserProfile(); // On lance le profil immédiatement
    renderCategories();
    renderRestaurants().then(() => {
        initSearchLogic();
        initSearchSuggestions();
    });
    simulateAIGeneration();
});

function initSearchSuggestions() {
    const searchInput = document.getElementById('search-input');
    const suggestionBox = document.getElementById('search-suggestions');
    if (!searchInput || !suggestionBox) return;

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 2) {
            suggestionBox.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/menu-items/search?query=${encodeURIComponent(query)}`);
                const items = await response.json();
                
                if (items.length > 0) {
                    suggestionBox.innerHTML = items.map(item => `
                        <div class="suggestion-item" onclick="window.location.href='pages/restaurant.html?id=${item.restaurantId || item.restaurant?.id}'">
                            <div class="suggestion-icon"><i class="fa-solid fa-utensils"></i></div>
                            <div class="suggestion-info">
                                <h4>${item.name}</h4>
                                <p>${item.description || 'Plat délicieux'}</p>
                            </div>
                        </div>
                    `).join('');
                    suggestionBox.style.display = 'block';
                } else {
                    suggestionBox.style.display = 'none';
                }
            } catch (error) {
                console.error('Erreur suggestions:', error);
            }
        }, 300);
    });

    // Fermer si clic ailleurs
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.style.display = 'none';
        }
    });
}

function initNavbarScroller() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

function initSearchLogic() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            document.querySelectorAll('.restaurant-card').forEach(card => {
                const title = card.querySelector('.rest-title').textContent.toLowerCase();
                card.style.display = title.includes(term) ? 'block' : 'none';
            });
        });
    }
}

async function initUserProfile() {
    const container = document.getElementById('user-profile-container');
    const btnLogin = document.getElementById('btn-login');
    const token = localStorage.getItem('user_token');

    if (token) {
        // AFFICHAGE IMMÉDIAT (Pas d'attente)
        container.style.display = 'flex';
        if(btnLogin) btnLogin.style.display = 'none';
        
        const nameDisplay = document.getElementById('user-name-nav');
        nameDisplay.textContent = "Mon Profil"; // Simple et direct
        
        // On rend le clic fonctionnel TOUT DE SUITE
        const trigger = document.getElementById('user-profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');
        
        trigger.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        };

        document.addEventListener('click', () => dropdown.classList.remove('active'));

        document.getElementById('btn-logout').onclick = (e) => {
            e.preventDefault();
            api.clearAuthSession();
            localStorage.removeItem('food_saas_cart'); // Optionnel: vider panier à la déconnexion ?
            const homePath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
            window.location.href = homePath;
        };

        // Optionnel : On essaie quand même de charger le vrai nom en arrière-plan
        try {
            const user = await api.getCurrentUser();
            if (user) {
                document.getElementById('user-name-nav').textContent = user.fullName.split(' ')[0];
                document.getElementById('dropdown-full-name').textContent = user.fullName;
                document.getElementById('dropdown-email').textContent = user.email;
                const avatarImg = user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=FF5A5F&color=fff`;
                document.getElementById('user-avatar').src = avatarImg;
            }
        } catch (e) { console.log("Mode invité actif"); }
    }
}

// ... (Reste des fonctions renderCategories et renderRestaurants inchangées)
async function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    try {
        const categories = await api.getCategories();
        grid.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="document.getElementById('search-input').value='${cat.name}'; document.getElementById('search-input').dispatchEvent(new Event('input'));">
                <div class="category-icon">${cat.icon}</div>
                <h3>${cat.name}</h3>
            </div>
        `).join('');
    } catch (e) {}
}

async function renderRestaurants() {
    const grid = document.getElementById('restaurants-grid');
    if (!grid) return;
    try {
        const restaurants = await api.getRestaurants();
        grid.innerHTML = restaurants.map(rest => `
            <div class="restaurant-card" onclick="window.location.href='pages/restaurant.html?id=${rest.id}'">
                <div class="rest-img"><img src="${rest.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'}"></div>
                <div class="rest-info">
                    <div class="rest-header"><h3 class="rest-title">${rest.name}</h3></div>
                    <div class="rest-meta"><span><i class="fa-solid fa-star"></i> ${rest.rating || '4.5'}</span></div>
                </div>
            </div>
        `).join('');
    } catch (e) {}
}

function runAIDemo() {
    const textEl = document.getElementById('ai-typing-text');
    const imgEl = document.getElementById('ai-demo-img');
    const prompt = "Générer une photo premium d'un Burger Gourmet au Garba croustillant...";
    let i = 0;

    textEl.innerHTML = "";
    imgEl.style.opacity = "0.3";
    imgEl.style.filter = "blur(10px)";

    function typeWriter() {
        if (i < prompt.length) {
            textEl.innerHTML += prompt.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        } else {
            setTimeout(() => {
                imgEl.src = "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800";
                imgEl.style.opacity = "1";
                imgEl.style.filter = "blur(0)";
                textEl.innerHTML = "✨ Photo générée avec succès !";
                textEl.style.color = "#00D1C1";
            }, 1000);
        }
    }
    typeWriter();
}

function simulateAIGeneration() {
    const btn = document.querySelector('.mockup-card .btn-primary');
    if(btn) {
        btn.onclick = () => {
            const img = document.getElementById('ai-demo-img');
            img.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-primary"></i>';
            setTimeout(() => {
                img.innerHTML = '<img src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d" style="width:100%; height:100%; object-fit:cover;">';
            }, 1000);
        };
    }
}
