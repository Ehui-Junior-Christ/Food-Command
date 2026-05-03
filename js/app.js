// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavbarScroller();
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
                const response = await fetch(`${resolveApiBaseUrl()}/menu-items/search?query=${encodeURIComponent(query)}`);
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
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('btn-search');

    const filterAction = () => {
        const term = (searchInput?.value || '').toLowerCase().trim();
        const loc = (locationInput?.value || '').toLowerCase().trim();
        
        document.querySelectorAll('.restaurant-card').forEach(card => {
            const title = card.querySelector('.rest-title').textContent.toLowerCase();
            const address = card.dataset.address?.toLowerCase() || '';
            
            const matchTitle = !term || title.includes(term);
            const matchLoc = !loc || address.includes(loc);
            
            card.style.display = (matchTitle && matchLoc) ? 'block' : 'none';
        });

        // Show empty message if nothing found
        const grid = document.getElementById('restaurants-grid');
        const visibleCards = grid.querySelectorAll('.restaurant-card[style="display: block;"]').length;
        const noResults = document.getElementById('no-results-msg');
        
        if (visibleCards === 0 && (term || loc)) {
            if (!noResults) {
                const msg = document.createElement('div');
                msg.id = 'no-results-msg';
                msg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);';
                msg.innerHTML = '<i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i><p>Aucun restaurant ne correspond à votre recherche.</p>';
                grid.appendChild(msg);
            }
        } else if (noResults) {
            noResults.remove();
        }
    };

    if (searchInput) searchInput.addEventListener('input', filterAction);
    if (locationInput) locationInput.addEventListener('input', filterAction);
    if (searchBtn) searchBtn.addEventListener('click', filterAction);
}


// ... (Reste des fonctions renderCategories et renderRestaurants inchangées)
async function renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    try {
        const categories = await api.getCategories();
        grid.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="document.getElementById('search-input').value='${cat.name}'; document.getElementById('search-input').dispatchEvent(new Event('input')); document.getElementById('restaurants').scrollIntoView({behavior: 'smooth'});">
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
            <div class="restaurant-card" data-address="${rest.address || ''}" onclick="window.location.href='pages/restaurant.html?id=${rest.id}'">
                <div class="rest-img"><img src="${rest.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'}"></div>
                <div class="rest-info">
                    <div class="rest-header"><h3 class="rest-title">${rest.name}</h3></div>
                    <div class="rest-meta">
                        <span><i class="fa-solid fa-star"></i> ${rest.rating || '4.5'}</span>
                        <span style="margin-left: 10px;"><i class="fa-solid fa-location-dot"></i> ${rest.address || 'Abidjan'}</span>
                    </div>
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
