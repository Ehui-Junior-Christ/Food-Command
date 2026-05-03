// Logic to manage authentication state across all pages
document.addEventListener('DOMContentLoaded', () => {
    initUserProfile();
    checkRoleAccess();
});

async function initUserProfile() {
    const container = document.getElementById('user-profile-container');
    const btnLogin = document.getElementById('btn-login');
    const token = localStorage.getItem('user_token');

    if (token) {
        if (container) container.style.display = 'flex';
        if (btnLogin) btnLogin.style.display = 'none';
        
        const nameDisplay = document.getElementById('user-name-nav');
        if (nameDisplay) nameDisplay.textContent = "Mon Profil";
        
        const trigger = document.getElementById('user-profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');
        
        if (trigger && dropdown) {
            trigger.onclick = (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            };
            document.addEventListener('click', () => dropdown.classList.remove('active'));
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.onclick = (e) => {
                e.preventDefault();
                api.clearAuthSession();
                localStorage.removeItem('food_saas_cart');
                const isSubPage = window.location.pathname.includes('/pages/');
                window.location.href = isSubPage ? '../index.html' : 'index.html';
            };
        }

        try {
            if (typeof api !== 'undefined' && api.getCurrentUser) {
                const user = await api.getCurrentUser();
                if (user) {
                    if (nameDisplay) nameDisplay.textContent = user.fullName.split(' ')[0];
                    const dropName = document.getElementById('dropdown-full-name');
                    const dropEmail = document.getElementById('dropdown-email');
                    if (dropName) dropName.textContent = user.fullName;
                    if (dropEmail) dropEmail.textContent = user.email;

                    // Update Navbar links based on role
                    updateNavbarByRole(user.role);
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                api.clearAuthSession();
                location.reload();
            }
        }
    } else {
        if (container) container.style.display = 'none';
        if (btnLogin) btnLogin.style.display = 'inline-block';
    }
}

function updateNavbarByRole(role) {
    const navLinks = document.querySelector('.nav-links');
    const profileDropdown = document.getElementById('profile-dropdown');
    const cartBtn = document.querySelector('.btn-cart');
    
    if (!navLinks) return;

    // Check if we already added role-specific links
    if (document.getElementById('role-link')) return;

    const isSubPage = window.location.pathname.includes('/pages/');
    const prefix = isSubPage ? '' : 'pages/';

    if (role === 'RESTAURANT') {
        // Cacher le panier et le badge (la "bulle") pour les restos
        if (cartBtn) cartBtn.style.display = 'none';
        const cartBadges = document.querySelectorAll('.cart-badge');
        cartBadges.forEach(b => b.style.display = 'none');

        // Ajouter le lien admin dans le menu déroulant
        if (profileDropdown) {
            const hr = document.createElement('hr');
            const adminLink = document.createElement('a');
            adminLink.id = 'role-link';
            adminLink.href = isSubPage ? 'admin.html' : 'pages/admin.html';
            adminLink.innerHTML = '<i class="fa-solid fa-gauge"></i> Tableau de bord Admin';
            adminLink.style.color = 'var(--secondary)';
            adminLink.style.fontWeight = 'bold';
            
            const logoutBtn = document.getElementById('btn-logout');
            profileDropdown.insertBefore(hr, logoutBtn);
            profileDropdown.insertBefore(adminLink, logoutBtn);
        }
    } else if (role === 'COURIER') {
        if (cartBtn) cartBtn.style.display = 'none';
        const cartBadges = document.querySelectorAll('.cart-badge');
        cartBadges.forEach(b => b.style.display = 'none');

        if (profileDropdown) {
            const hr = document.createElement('hr');
            const courierLink = document.createElement('a');
            courierLink.id = 'role-link';
            courierLink.href = isSubPage ? 'courier-dashboard.html' : 'pages/courier-dashboard.html';
            courierLink.innerHTML = '<i class="fa-solid fa-motorcycle"></i> Espace Livreur';
            courierLink.style.color = 'var(--secondary)';
            courierLink.style.fontWeight = 'bold';
            
            const logoutBtn = document.getElementById('btn-logout');
            profileDropdown.insertBefore(hr, logoutBtn);
            profileDropdown.insertBefore(courierLink, logoutBtn);
        }
    }
}

function checkRoleAccess() {
    const path = window.location.pathname;
    const userRole = localStorage.getItem('user_role'); // Assuming role is stored in localStorage after login

    // Page lists
    const courierPages = ['courier-dashboard.html'];
    const restaurantPages = ['admin.html'];
    const clientPages = ['checkout.html', 'tracking.html'];
    const authPages = ['auth.html', 'courier-login.html'];

    const isCourierPage = courierPages.some(p => path.endsWith(p));
    const isRestaurantPage = restaurantPages.some(p => path.endsWith(p));
    const isClientPage = clientPages.some(p => path.endsWith(p));
    const isAuthPage = authPages.some(p => path.endsWith(p));

    if (!userRole) {
        if (isCourierPage || isRestaurantPage || isClientPage) {
            window.location.href = path.includes('/pages/') ? 'auth.html' : 'pages/auth.html';
        }
        return;
    }

    if (isAuthPage) {
        const isSubPage = window.location.pathname.includes('/pages/');
        window.location.href = isSubPage ? '../index.html' : 'index.html';
        return;
    }

    if (isCourierPage && userRole !== 'COURIER') {
        window.location.href = path.includes('/pages/') ? 'auth.html' : 'pages/auth.html';
    } else if (isRestaurantPage && userRole !== 'RESTAURANT') {
        window.location.href = path.includes('/pages/') ? 'auth.html' : 'pages/auth.html';
    } else if (isClientPage && userRole === 'RESTAURANT') {
        // Restaurants shouldn't order?
        // window.location.href = 'admin.html';
    }
}
