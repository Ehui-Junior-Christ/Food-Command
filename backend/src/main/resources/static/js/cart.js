// Cart Logic Management with LocalStorage
let cart = JSON.parse(localStorage.getItem('food_saas_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initCartSidebar();
    updateCartUI();
});

function initCartSidebar() {
    const cartBtns = document.querySelectorAll('.btn-cart');
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

function addToCart(id, name, price, image) {
    const existingItem = cart.find(i => i.id === id);
    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    
    // Auto open sidebar
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar && !sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
        if(overlay) overlay.classList.add('active');
    }
    
    // Show toast
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
    localStorage.setItem('food_saas_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartBadges = document.querySelectorAll('.cart-badge');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    let totalItems = 0;
    let subtotal = 0;
    
    // Calculate totals
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
    if(cartTotal) cartTotal.textContent = `${subtotal > 0 ? (subtotal + 1000).toLocaleString() : 0} FCFA`;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'var(--text-main)';
    toast.style.color = 'white';
    toast.style.padding = '1rem 2rem';
    toast.style.borderRadius = '30px';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.style.zIndex = '9999';
    toast.style.fontWeight = '500';
    toast.style.animation = 'float 0.3s ease-out';
    toast.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--secondary); margin-right:0.5rem;"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
