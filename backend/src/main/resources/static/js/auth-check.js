// Role-Based Access Control and Session Check
document.addEventListener('DOMContentLoaded', () => {
    initUserProfile();
    checkRoleAccess();
});

async function initUserProfile() {
    const userProfileContainer = document.getElementById('user-profile-container');
    const btnLogin = document.getElementById('btn-login');
    
    if (!userProfileContainer || !btnLogin) return;

    const token = sessionStorage.getItem('user_token');
    
    if (token && token !== 'null' && token !== 'undefined') {
        try {
            if (typeof api !== 'undefined' && api.getCurrentUser) {
                const user = await api.getCurrentUser();
                if (user) {
                    // Update UI for logged in user
                    btnLogin.style.display = 'none';
                    userProfileContainer.style.display = 'flex';
                    
                    const avatarImg = document.getElementById('user-avatar');
                    const nameNav = document.getElementById('user-name-nav');
                    const dropFullName = document.getElementById('dropdown-full-name');
                    const dropEmail = document.getElementById('dropdown-email');
                    
                    if (avatarImg) avatarImg.src = api.getProfileImageUrl(user);
                    if (nameNav) nameNav.innerText = user.fullName || user.email.split('@')[0];
                    if (dropFullName) dropFullName.innerText = user.fullName || 'Utilisateur';
                    if (dropEmail) dropEmail.innerText = user.email;

                    // Setup logout
                    const btnLogout = document.getElementById('btn-logout');
                    if (btnLogout) {
                        btnLogout.onclick = (e) => {
                            e.preventDefault();
                            api.clearAuthSession();
                            window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
                        };
                    }
                } else {
                    api.clearAuthSession();
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
        btnLogin.style.display = 'block';
        userProfileContainer.style.display = 'none';
    }
}

function checkRoleAccess() {
    const path = window.location.pathname;
    const userRole = sessionStorage.getItem('user_role');
    
    const authPages = ['auth.html', 'partner-register.html', 'courier.html'];
    const adminPages = ['admin.html', 'super-admin.html'];
    const restaurantPages = ['admin.html'];
    const courierPages = ['courier-dashboard.html'];
    const clientPages = ['profile.html', 'checkout.html'];

    const isAuthPage = authPages.some(p => path.endsWith(p));
    const isAdminPage = adminPages.some(p => path.endsWith(p));
    const isRestaurantPage = restaurantPages.some(p => path.endsWith(p));
    const isCourierPage = courierPages.some(p => path.endsWith(p));
    const isClientPage = clientPages.some(p => path.endsWith(p));

    if (!userRole) {
        if (isCourierPage || isRestaurantPage || isClientPage || isAdminPage) {
            window.location.href = path.includes('/pages/') ? 'auth.html' : 'pages/auth.html';
        }
        return;
    }

    if (isAuthPage) {
        const isSubPage = window.location.pathname.includes('/pages/');
        window.location.href = isSubPage ? '../index.html' : 'index.html';
        return;
    }

    if (isAdminPage && userRole !== 'ADMIN') {
        window.location.href = path.includes('/pages/') ? 'auth.html' : 'pages/auth.html';
    } else if (isRestaurantPage && userRole !== 'RESTAURANT') {
        window.location.href = path.includes('/pages/') ? 'auth.html' : 'pages/auth.html';
    } else if (isCourierPage && userRole !== 'COURIER') {
        window.location.href = path.includes('/pages/') ? 'auth.html' : 'pages/auth.html';
    }
}
