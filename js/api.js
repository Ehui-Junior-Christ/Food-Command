const API_BASE_URL = 'http://localhost:8080/api';

function resolveApiBaseUrl() {
    if (window.location.protocol.startsWith('http') && window.location.port === '8080') {
        return `${window.location.origin}/api`;
    }
    return 'http://localhost:8080/api';
}

async function readError(response, fallbackMessage) {
    try {
        const text = await response.text();
        return text || fallbackMessage;
    } catch (e) {
        return fallbackMessage;
    }
}

const api = {
    // Helper pour centraliser les requêtes et les headers
    async request(endpoint, options = {}) {
        const url = `${resolveApiBaseUrl()}${endpoint}`;
        const token = this.getAuthToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token && token !== 'null' && token !== 'undefined') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Si on reçoit une erreur 401, on nettoie la session sauf si on est déjà sur la page auth
            if (!window.location.pathname.includes('auth.html')) {
                this.clearAuthSession();
                // On ne redirige pas forcément ici pour éviter les boucles, mais on renvoie l'erreur
            }
        }

        return response;
    },

    async login(email, password) {
        const response = await fetch(`${resolveApiBaseUrl()}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Email ou mot de passe incorrect');
        }

        const data = await response.json();
        this.setAuthSession(data);
        return data;
    },

    async register(userData) {
        const response = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Echec de l inscription'));
        return response;
    },

    async registerRestaurant(data) {
        const response = await this.request('/restaurants/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(await readError(response, 'Echec de l inscription du restaurant'));
        return response;
    },

    async getRestaurants() {
        const response = await this.request('/restaurants');
        if (!response.ok) throw new Error('Impossible de charger les restaurants');
        return await response.json();
    },

    async getRestaurant(id) {
        const response = await this.request(`/restaurants/${id}`);
        if (!response.ok) throw new Error('Restaurant non trouvé');
        return await response.json();
    },

    async getRestaurantStats(restaurantId) {
        const response = await this.request(`/restaurants/${restaurantId}/stats`);
        if (!response.ok) throw new Error('Erreur stats');
        return response.json();
    },

    async createRestaurant(data) {
        const response = await this.request('/restaurants', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erreur lors de la création du restaurant');
        return response.json();
    },

    async updateRestaurant(id, data) {
        const response = await this.request(`/restaurants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Erreur mise à jour restaurant');
        return response.json();
    },

    async searchRestaurants(query = '', location = '') {
        const params = new URLSearchParams();
        if (query.trim()) params.set('query', query.trim());
        if (location.trim()) params.set('location', location.trim());

        const endpoint = params.toString() ? `/restaurants/search?${params.toString()}` : '/restaurants';
        const response = await this.request(endpoint);
        if (!response.ok) throw new Error('Impossible de rechercher les restaurants');
        return await response.json();
    },

    async getCategories() {
        const response = await this.request('/categories');
        if (!response.ok) throw new Error('Impossible de charger les categories');
        return await response.json();
    },

    async getRestaurantById(id) {
        const response = await this.request(`/restaurants/${id}`);
        if (!response.ok) throw new Error('Restaurant introuvable');
        return await response.json();
    },

    async placeOrder(orderData) {
        const response = await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Impossible de passer la commande'));
        return await response.json();
    },

    async getMyOrders() {
        const response = await this.request('/orders/my-orders');
        if (!response.ok) throw new Error('Impossible de charger vos commandes');
        return await response.json();
    },

    async getClientOrders() {
        const response = await this.request('/client/orders');
        if (!response.ok) throw new Error('Impossible de charger l\'historique des commandes');
        return await response.json();
    },

    async getActiveOrders() {
        const response = await this.request('/client/orders/current');
        if (!response.ok) throw new Error('Impossible de charger les commandes en cours');
        return await response.json();
    },

    async getAddresses() {
        const response = await this.request('/addresses');
        if (!response.ok) throw new Error('Impossible de charger les adresses');
        return await response.json();
    },

    async addAddress(addressData) {
        const response = await this.request('/addresses', {
            method: 'POST',
            body: JSON.stringify(addressData)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Erreur lors de l ajout de l adresse');
        }
        return await response.json();
    },

    async deleteAddress(id) {
        const response = await this.request(`/addresses/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Impossible de supprimer l adresse');
        return true;
    },

    async getCurrentUser() {
        const token = this.getAuthToken();
        if (!token) return null;

        const response = await this.request('/auth/me');
        if (!response.ok) {
            return null;
        }

        const user = await response.json();
        this.rememberUser(user);
        return user;
    },

    async updateCurrentUser(profileData) {
        const response = await this.request('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Impossible de mettre le profil a jour'));

        const user = await response.json();
        this.rememberUser(user);
        return user;
    },

    setAuthSession(data) {
        if (data.token) localStorage.setItem('user_token', data.token);
        if (data.id) localStorage.setItem('user_id', data.id);
        if (data.email) localStorage.setItem('user_email', data.email);
        if (data.role) localStorage.setItem('user_role', data.role);
        if (data.fullName) localStorage.setItem('user_name', data.fullName);
        localStorage.setItem('currentUser', JSON.stringify(data));
    },

    clearAuthSession() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_avatar');
        localStorage.removeItem('user_id');
        localStorage.removeItem('currentUser');
    },

    getAuthToken() {
        return localStorage.getItem('user_token');
    },

    rememberUser(user) {
        if (!user) return;
        if (user.email) localStorage.setItem('user_email', user.email);
        if (user.role) localStorage.setItem('user_role', user.role);
        if (user.fullName) localStorage.setItem('user_name', user.fullName);
        if (user.profileImageUrl) localStorage.setItem('user_avatar', user.profileImageUrl);
        if (user.id) localStorage.setItem('user_id', user.id);
    },

    getProfileImageUrl(user) {
        if (user && user.profileImageUrl) return user.profileImageUrl;
        const name = (user && (user.fullName || user.email)) || localStorage.getItem('user_name') || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF5A5F&color=fff`;
    },

    getLocalUser() {
        const email = localStorage.getItem('user_email') || '';
        const fullName = localStorage.getItem('user_name') || email || 'Utilisateur';
        const role = localStorage.getItem('user_role') || '';
        const profileImageUrl = localStorage.getItem('user_avatar') || '';
        return { email, fullName, role, profileImageUrl };
    },

    async getRestaurantByOwner(ownerId) {
        const response = await this.request(`/restaurants/owner/${ownerId}`);
        if (!response.ok) return null;
        return response.json();
    },

    async getMenuItemsByRestaurant(restaurantId) {
        const response = await this.request(`/menu-items/restaurant/${restaurantId}`);
        if (!response.ok) return [];
        return response.json();
    },

    async createMenuItem(restaurantId, item) {
        const response = await this.request(`/menu-items?restaurantId=${restaurantId}`, {
            method: 'POST',
            body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Impossible de créer le plat');
        return response.json();
    },

    async updateMenuItem(id, item) {
        const response = await this.request(`/menu-items/${id}`, {
            method: 'PUT',
            body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Impossible de mettre à jour le plat');
        return response.json();
    },

    async deleteMenuItem(id) {
        const response = await this.request(`/menu-items/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Impossible de supprimer le plat');
    },

    async getOrder(id) {
        const response = await this.request(`/orders/${id}`);
        if (!response.ok) return null;
        return response.json();
    },

    async getOrdersByRestaurant(restaurantId) {
        const response = await this.request(`/orders/restaurant/${restaurantId}`);
        if (!response.ok) return [];
        return response.json();
    },

    async updateOrderStatus(orderId, status) {
        const response = await this.request(`/orders/${orderId}/status?status=${status}`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Erreur mise à jour statut');
        return response.json();
    },

    async getAvailableOrders() {
        const response = await this.request('/orders/available');
        if (!response.ok) return [];
        return response.json();
    },

    async acceptOrder(orderId) {
        const response = await this.request(`/orders/${orderId}/accept`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Impossible d accepter cette commande');
        return response.json();
    },

    async smartSearch(keyword, lat, lng) {
        let url = `/client/search?keyword=${encodeURIComponent(keyword)}`;
        if (lat && lng) {
            url += `&latitude=${lat}&longitude=${lng}`;
        }
        const response = await this.request(url);
        if (!response.ok) throw new Error('Erreur recherche');
        return response.json();
    },

    // --- ADMIN SPECIFIC ---
    async getAdminStats() {
        const response = await this.request('/admin/stats');
        if (!response.ok) throw new Error('Erreur stats admin');
        return response.json();
    },

    async getAllAdminRestaurants() {
        const response = await this.request('/admin/restaurants');
        if (!response.ok) throw new Error('Erreur restaurants admin');
        return response.json();
    },

    async getAllAdminUsers() {
        const response = await this.request('/admin/users');
        if (!response.ok) throw new Error('Erreur utilisateurs admin');
        return response.json();
    },

    async getAllAdminOrders() {
        const response = await this.request('/admin/orders');
        if (!response.ok) throw new Error('Erreur commandes admin');
        return response.json();
    },

    async adminDeleteRestaurant(id) {
        const response = await this.request(`/admin/restaurants/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erreur suppression restaurant');
        return true;
    }
};

(function handleOAuthCallback() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) return;

    api.setAuthSession({ token, role: 'CLIENT' });
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

    const homeUrl = window.location.origin && window.location.origin !== 'null'
        ? `${window.location.origin}/index.html`
        : 'index.html';
    window.location.replace(homeUrl);
})();
