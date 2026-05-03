const API_BASE_URL = 'http://localhost:8080/api';

function resolveApiBaseUrl() {
    if (window.location.protocol.startsWith('http') && window.location.port === '8080') {
        return `${window.location.origin}/api`;
    }
    return 'http://localhost:8080/api';
}

async function readError(response, fallbackMessage) {
    const message = await response.text();
    return message || fallbackMessage;
}

const api = {
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error(await readError(response, 'Echec de la connexion'));

        const data = await response.json();
        this.setAuthSession(data);
        return data;
    },

    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Echec de l inscription'));
        return response;
    },

    async getRestaurants() {
        const response = await fetch(`${API_BASE_URL}/restaurants`);
        if (!response.ok) throw new Error('Impossible de charger les restaurants');
        return await response.json();
    },

    async searchRestaurants(query = '', location = '') {
        const params = new URLSearchParams();
        if (query.trim()) params.set('query', query.trim());
        if (location.trim()) params.set('location', location.trim());

        const url = params.toString()
            ? `${API_BASE_URL}/restaurants/search?${params.toString()}`
            : `${API_BASE_URL}/restaurants`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Impossible de rechercher les restaurants');
        return await response.json();
    },

    async getCategories() {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Impossible de charger les categories');
        return await response.json();
    },

    async getRestaurantById(id) {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
        if (!response.ok) throw new Error('Restaurant introuvable');
        return await response.json();
    },

    async placeOrder(orderData) {
        const token = this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Impossible de passer la commande'));
        return await response.json();
    },

    async getMyOrders() {
        const token = this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Impossible de charger vos commandes');
        return await response.json();
    },

    // --- NOUVEAU : Gestion des Adresses ---
    async getAddresses() {
        const token = this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Impossible de charger les adresses');
        return await response.json();
    },

    async addAddress(addressData) {
        const token = this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(addressData)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Erreur lors de l ajout de l adresse');
        }
        return await response.json();
    },

    async deleteAddress(id) {
        const token = this.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Impossible de supprimer l adresse');
        return true;
    },

    async getCurrentUser() {
        const token = this.getAuthToken();
        if (!token) return null;

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 401) this.clearAuthSession();
            return null;
        }

        const user = await response.json();
        this.rememberUser(user);
        return user;
    },

    async updateCurrentUser(profileData) {
        const token = this.getAuthToken();
        if (!token) throw new Error('Vous devez etre connecte');

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) throw new Error(await readError(response, 'Impossible de mettre le profil a jour'));

        const user = await response.json();
        this.rememberUser(user);
        return user;
    },

    setAuthSession(data) {
        if (data.token) localStorage.setItem('user_token', data.token);
        if (data.email) localStorage.setItem('user_email', data.email);
        if (data.role) localStorage.setItem('user_role', data.role);
    },

    clearAuthSession() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_avatar');
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
