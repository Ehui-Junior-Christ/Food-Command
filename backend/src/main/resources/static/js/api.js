const API_BASE_URL = 'http://localhost:8080/api';

function resolveApiBaseUrl() {
    if (window.location.protocol.startsWith('http') && (window.location.port === '8080' || window.location.port === '5500')) {
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
    async request(endpoint, options = {}) {
        const url = `${resolveApiBaseUrl()}${endpoint}`;
        const token = this.getAuthToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Ne pas envoyer de token pour les routes d'authentification publiques
        const isAuthRoute = endpoint.includes('/auth/signin') || endpoint.includes('/auth/signup');
        const isPublicGet = options.method === 'GET' && (endpoint.includes('/restaurants') || endpoint.includes('/menu-items'));

        if (token && !isAuthRoute && !isPublicGet && token !== 'null' && token !== 'undefined') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            if (!window.location.pathname.includes('auth.html')) {
                this.clearAuthSession();
            }
        }

        return response;
    },

    async login(email, password) {
        const response = await this.request('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error(await readError(response, 'Echec de la connexion'));

        const data = await response.json();
        this.setAuthSession(data);
        return data;
    },

    async register(userData) {
        const response = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Echec de l\'inscription'));
        return response;
    },

    async getRestaurants() {
        const response = await this.request('/restaurants');
        if (!response.ok) throw new Error('Impossible de charger les restaurants');
        return await response.json();
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
        if (!response.ok) throw new Error('Impossible de charger les catégories');
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
        if (!response.ok) throw new Error(await readError(response, 'Erreur lors de l\'ajout de l\'adresse'));
        return await response.json();
    },

    async deleteAddress(id) {
        const response = await this.request(`/addresses/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Impossible de supprimer l\'adresse');
        return true;
    },

    async getCurrentUser() {
        const token = this.getAuthToken();
        if (!token) return null;

        const response = await this.request('/auth/me');
        if (!response.ok) return null;

        const user = await response.json();
        this.rememberUser(user);
        return user;
    },

    async updateCurrentUser(profileData) {
        const response = await this.request('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Impossible de mettre le profil à jour'));

        const user = await response.json();
        this.rememberUser(user);
        return user;
    },

    setAuthSession(data) {
        if (data.token) sessionStorage.setItem('user_token', data.token);
        if (data.id) sessionStorage.setItem('user_id', data.id);
        if (data.email) sessionStorage.setItem('user_email', data.email);
        if (data.role) sessionStorage.setItem('user_role', data.role);
        if (data.fullName) sessionStorage.setItem('user_name', data.fullName);
        sessionStorage.setItem('currentUser', JSON.stringify(data));
    },

    clearAuthSession() {
        sessionStorage.removeItem('user_token');
        sessionStorage.removeItem('user_email');
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_name');
        sessionStorage.removeItem('user_avatar');
        sessionStorage.removeItem('user_id');
        sessionStorage.removeItem('currentUser');
    },

    getAuthToken() {
        return sessionStorage.getItem('user_token');
    },

    rememberUser(user) {
        if (!user) return;
        if (user.email) sessionStorage.setItem('user_email', user.email);
        if (user.role) sessionStorage.setItem('user_role', user.role);
        if (user.fullName) sessionStorage.setItem('user_name', user.fullName);
        if (user.profileImageUrl) sessionStorage.setItem('user_avatar', user.profileImageUrl);
        if (user.id) sessionStorage.setItem('user_id', user.id);
    },

    getProfileImageUrl(user) {
        if (user && user.profileImageUrl) return user.profileImageUrl;
        const name = (user && (user.fullName || user.email)) || sessionStorage.getItem('user_name') || 'User';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF5A5F&color=fff`;
    },

    getLocalUser() {
        const email = sessionStorage.getItem('user_email') || '';
        const fullName = sessionStorage.getItem('user_name') || email || 'Utilisateur';
        const role = sessionStorage.getItem('user_role') || '';
        const profileImageUrl = sessionStorage.getItem('user_avatar') || '';
        return { email, fullName, role, profileImageUrl };
    },

    // --- DELIVERY SPACE ---
    async getDeliveryAvailableOrders() {
        const response = await this.request('/delivery/orders/available');
        if (!response.ok) return [];
        return response.json();
    },

    async getMyDeliveries() {
        const response = await this.request('/delivery/orders/my-deliveries');
        if (!response.ok) return [];
        return response.json();
    },

    async deliveryAcceptOrder(orderId) {
        const response = await this.request(`/delivery/orders/${orderId}/accept`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error(await readError(response, 'Impossible d\'accepter cette commande'));
        return response.json();
    },

    async deliveryMarkAsDelivered(orderId) {
        const response = await this.request(`/delivery/orders/${orderId}/deliver`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error(await readError(response, 'Impossible de valider la livraison'));
        return response.json();
    },

    async updateDeliveryLocation(orderId, lat, lng) {
        return this.request(`/delivery/orders/${orderId}/location?lat=${lat}&lng=${lng}`, {
            method: 'POST'
        });
    }
};

(function handleOAuthCallback() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) return;

    api.setAuthSession({ token, role: 'CLIENT' });
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

    // Si on n'est pas déjà sur l'index, redirection
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        const homeUrl = window.location.origin && window.location.origin !== 'null'
            ? `${window.location.origin}/index.html`
            : 'index.html';
        window.location.replace(homeUrl);
    } else {
        if (typeof initUserProfile === 'function') {
            initUserProfile();
        }
    }
})();
