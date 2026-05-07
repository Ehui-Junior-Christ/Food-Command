// Cart Logic Management with LocalStorage
let cart = JSON.parse(sessionStorage.getItem('food_saas_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initCartSidebar();
    updateCartUI();
});

function initCartSidebar() {
    const cartBtns = document.querySelectorAll('.btn-cart, .btn-cart-nav, #cart-trigger');
    const closeBtn = document.getElementById('close-cart');
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');

    const toggleCart = (e) => {
        if(e) e.preventDefault();
        if(sidebar) sidebar.classList.toggle('open');
        if(overlay) overlay.classList.toggle('active');
    };

    cartBtns.forEach(btn => btn.addEventListener('click', toggleCart));
    if(closeBtn) closeBtn.addEventListener('click', toggleCart);
    if(overlay) overlay.addEventListener('click', toggleCart);
}

function addToCart(id, name, price, image, restaurantId, restaurantName) {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role && user.role.toUpperCase() === 'RESTAURANT') {
            alert("En tant que Restaurateur, vous ne pouvez pas passer de commande.");
            return;
        }
    }

    const existingItem = cart.find(i => i.id === id);
    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        // Vérification multi-restaurant
        if (cart.length > 0 && cart[0].restaurantId !== restaurantId) {
            if (confirm(`Votre panier contient déjà des plats de "${cart[0].restaurantName}". Voulez-vous vider le panier pour commander chez "${restaurantName}" ?`)) {
                cart = [];
            } else {
                return;
            }
        }
        cart.push({ id, name, price, image, restaurantId, restaurantName, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar && !sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
        if(overlay) overlay.classList.add('active');
    }
    
    showToast(`${name} ajouté au panier`);
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if(item) {
        item.quantity += delta;
        if(item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    sessionStorage.setItem('food_saas_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartBadges = document.querySelectorAll('.cart-badge');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.querySelector('#cart-sidebar .btn-primary');
    
    let totalItems = 0;
    let subtotal = 0;
    
    cart.forEach(item => {
        totalItems += item.quantity;
        subtotal += item.price * item.quantity;
    });
    
    cartBadges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    
    if(cartItemsContainer) {
        if(cart.length === 0) {
            cartItemsContainer.innerHTML = '<div style="text-align:center; padding:3rem 1rem; color:var(--text-muted)"><i class="fa-solid fa-basket-shopping" style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"></i><br>Votre panier est vide</div>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${item.price.toLocaleString()} FCFA</div>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)"><i class="fa-solid fa-minus" style="font-size:0.6rem"></i></button>
                            <span style="min-width: 20px; text-align:center; font-weight:600;">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)"><i class="fa-solid fa-plus" style="font-size:0.6rem"></i></button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    if(cartSubtotal) cartSubtotal.textContent = `${subtotal.toLocaleString()} FCFA`;
    
    const deliveryEl = document.getElementById('cart-delivery');
    const deliveryFee = subtotal > 0 ? 1000 : 0;
    if(deliveryEl) deliveryEl.textContent = `${deliveryFee.toLocaleString()} FCFA`;

    // Checkout Button Logic
    if(checkoutBtn) {
        checkoutBtn.onclick = () => {
            if(cart.length === 0) return alert('Votre panier est vide !');
            const path = window.location.pathname.includes('/pages/') ? 'checkout.html' : 'pages/checkout.html';
            window.location.href = path;
        };
    }

    // Loyalty Discount logic
    let discount = 0;
    const token = sessionStorage.getItem('user_token');
    
    if (token && subtotal > 0) {
        api.getCurrentUser().then(user => {
            if (user && user.loyaltyPoints >= 100) {
                const reductionPercent = Math.floor(user.loyaltyPoints / 100) * 2;
                discount = Math.round(subtotal * (reductionPercent / 100));
                
                let discountRow = document.getElementById('cart-discount-row');
                if (!discountRow) {
                    const totalRow = document.getElementById('cart-total').parentElement;
                    discountRow = document.createElement('div');
                    discountRow.id = 'cart-discount-row';
                    discountRow.className = 'summary-row';
                    discountRow.style.color = '#00a699';
                    discountRow.style.fontWeight = '700';
                    totalRow.parentNode.insertBefore(discountRow, totalRow);
                }
                
                discountRow.innerHTML = `<span>Réduction Fidélité (${reductionPercent}%)</span> <span>-${discount.toLocaleString()} FCFA</span>`;
                const finalTotal = subtotal - discount + deliveryFee;
                if(cartTotal) cartTotal.textContent = `${finalTotal.toLocaleString()} FCFA`;
            } else {
                if(cartTotal) cartTotal.textContent = `${(subtotal + deliveryFee).toLocaleString()} FCFA`;
            }
        });
    } else {
        if(cartTotal) cartTotal.textContent = `${(subtotal + deliveryFee).toLocaleString()} FCFA`;
        const discRow = document.getElementById('cart-discount-row');
        if(discRow) discRow.remove();
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#2D3748';
    toast.style.color = 'white';
    toast.style.padding = '1rem 2rem';
    toast.style.borderRadius = '30px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
    toast.style.zIndex = '9999';
    toast.style.fontWeight = '500';
    toast.innerHTML = `<i class="fa-solid fa-check-circle" style="color:#FF5A5F; margin-right:0.5rem;"></i> ${message}`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
