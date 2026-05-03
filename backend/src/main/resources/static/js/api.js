const API_BASE_URL = '/api';

const api = {
    // Authentification
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Échec de la connexion');
        const data = await response.ok ? await response.json() : null;
        if (data) {
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('user_email', data.email);
            localStorage.setItem('user_role', data.role);
        }
        return data;
    },

    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Échec de l\'inscription');
        return response;
    },

    // Restaurants
    async getRestaurants() {
        const response = await fetch(`${API_BASE_URL}/restaurants`);
        return await response.json();
    },

    async getCategories() {
        const response = await fetch(`${API_BASE_URL}/categories`);
        return await response.json();
    },

    async getRestaurantById(id) {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
        return await response.json();
    },

    // Commandes
    async placeOrder(orderData) {
        const token = localStorage.getItem('user_token');
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        return await response.json();
    },

    async getMyOrders() {
        const token = localStorage.getItem('user_token');
        const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getCurrentUser() {
        const token = localStorage.getItem('user_token');
        if (!token) return null;
        
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 401) localStorage.removeItem('user_token');
            return null;
        }
        return await response.json();
    }
};

// Gestion automatique du token OAuth2 (Google)
(function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // 1. Sauvegarder le token
        localStorage.setItem('user_token', token);
        localStorage.setItem('user_role', 'CLIENT');
        
        console.log("Connecté avec succès via Google !");
        
        // 2. Rediriger vers la page d'accueil (pour activer le script de profil)
        window.location.href = '/index.html';
    }
})();
