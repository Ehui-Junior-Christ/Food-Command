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

let userCoords = null;

function initSearchSuggestions() {
    const searchInput = document.getElementById('search-input');
    const suggestionBox = document.getElementById('search-suggestions');
    if (!searchInput || !suggestionBox) return;

    // Demander la géolocalisation dès le début
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            userCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log("Position détectée:", userCoords);
            renderRestaurants(); // Rafraîchir pour afficher les distances
        });
    }

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 1) {
            suggestionBox.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const results = await api.smartSearch(query, userCoords?.lat, userCoords?.lng);
                
                if (results.length > 0) {
                    suggestionBox.innerHTML = results.slice(0, 8).map(item => `
                        <div class="suggestion-item" onclick="handleSearchClick(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <div class="suggestion-icon">
                                <i class="fa-solid ${item.type === 'RESTAURANT' ? 'fa-shop' : 'fa-utensils'}"></i>
                            </div>
                            <div class="suggestion-info">
                                <h4>${item.name}</h4>
                                <p>${item.type === 'RESTAURANT' ? (item.description || 'Restaurant partenaire') : ('Plat chez ' + item.restaurantName)}</p>
                            </div>
                            ${item.distance ? `<div class="suggestion-meta">${item.distance} km</div>` : ''}
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

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.style.display = 'none';
        }
    });
}

function handleSearchClick(item) {
    if (item.type === 'RESTAURANT') {
        window.location.href = `pages/restaurant.html?id=${item.id}`;
    } else {
        window.location.href = `pages/restaurant.html?id=${item.restaurantId}`;
    }
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
    const searchBtn = document.getElementById('btn-search');

    const triggerSearch = async () => {
        const query = (searchInput?.value || '').trim();
        const grid = document.getElementById('restaurants-grid');
        if (!grid) return;

        try {
            const results = await api.smartSearch(query, userCoords?.lat, userCoords?.lng);
            
            if (results.length === 0) {
                grid.innerHTML = `
                    <div id="no-results-msg" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i>
                        <p>Aucun résultat pour "${query}". Essayez un autre mot-clé.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = results.map(item => `
                <div class="restaurant-card" onclick="handleSearchClick(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    <div class="rest-img">
                        <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'}" alt="${item.name}">
                        ${item.type === 'PLATE' ? '<div class="badge-plate">PLAT</div>' : ''}
                    </div>
                    <div class="rest-info">
                        <div class="rest-header">
                            <h3 class="rest-title">${item.name}</h3>
                            ${item.price ? `<span class="price-tag">${item.price} FCFA</span>` : ''}
                        </div>
                        <div class="rest-meta">
                            ${item.type === 'RESTAURANT' ? `<span><i class="fa-solid fa-star"></i> ${item.rating || '4.5'}</span>` : `<span><i class="fa-solid fa-shop"></i> ${item.restaurantName}</span>`}
                            ${item.distance ? `<span style="margin-left: 10px; color: var(--primary); font-weight: 600;"><i class="fa-solid fa-location-arrow"></i> ${item.distance} km</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            console.error("Search error:", e);
        }
    };

    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(triggerSearch, 500);
        });
    }
    if (searchBtn) searchBtn.addEventListener('click', triggerSearch);
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
        // Au chargement initial, on utilise le smart search sans keyword pour avoir le tri par distance
        const restaurants = await api.smartSearch('', userCoords?.lat, userCoords?.lng);
        grid.innerHTML = restaurants.map(item => `
            <div class="restaurant-card" onclick="handleSearchClick(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div class="rest-img">
                    <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'}" alt="${item.name}">
                </div>
                <div class="rest-info">
                    <div class="rest-header"><h3 class="rest-title">${item.name}</h3></div>
                    <div class="rest-meta">
                        <span><i class="fa-solid fa-star"></i> ${item.rating || '4.5'}</span>
                        ${item.distance ? `<span style="margin-left: 10px; color: var(--primary); font-weight: 600;"><i class="fa-solid fa-location-arrow"></i> ${item.distance} km</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Render restaurants error:", e);
    }
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

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.getElementById('overlay');
    if (navLinks) navLinks.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// Close mobile menu when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    }
});
// Scroll Reveal Animation
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(reveal => observer.observe(reveal));
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    renderActiveOrders();
});

async function renderActiveOrders() {
    const section = document.getElementById('active-orders-section');
    const grid = document.getElementById('active-orders-grid');
    if (!section || !grid) return;

    const token = sessionStorage.getItem('user_token');
    if (!token) return;

    try {
        const orders = await api.getActiveOrders();
        if (orders && orders.length > 0) {
            section.style.display = 'block';
            grid.innerHTML = orders.map(order => {
                let statusLabel = "En attente";
                let statusClass = "status-pending";

                switch(order.status) {
                    case 'ACCEPTED': statusLabel = "Acceptée"; break;
                    case 'PREPARING': statusLabel = "En préparation"; statusClass = "status-preparing"; break;
                    case 'OUT_FOR_DELIVERY': statusLabel = "En livraison"; statusClass = "status-delivery"; break;
                    case 'DELIVERED': statusLabel = "Livrée"; statusClass = "status-delivered"; break;
                }

                return `
                    <div class="order-active-card">
                        <div class="order-active-info">
                            <h4>Commande #${order.id}</h4>
                            <p>${order.restaurant ? order.restaurant.name : 'Restaurant'}</p>
                            <p>Total: ${order.totalAmount.toLocaleString()} FCFA</p>
                        </div>
                        <div class="order-status-badge ${statusClass}">
                            ${statusLabel}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            section.style.display = 'none';
        }
    } catch (e) {
        console.error("Active orders error:", e);
        section.style.display = 'none';
    }
}
