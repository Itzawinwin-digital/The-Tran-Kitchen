document.addEventListener('DOMContentLoaded', () => {
    const languageButtons = document.querySelectorAll('[data-language-switch]');
    const translatedNodes = document.querySelectorAll('[data-i18n], [data-i18n-html]');
    const translatedPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
    const translationScript = document.getElementById('site-translations');
    const carouselRoots = document.querySelectorAll('[data-carousel]');
    const inquiryForm = document.getElementById('inquiryForm');
    const cartRoots = document.querySelectorAll('[data-cart-root]');
    const cartStorageKey = 'tran-kitchen-cart';
    const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const translations = translationScript ? JSON.parse(translationScript.textContent) : null;

    const escapeHtml = (value) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const getCart = () => {
        try {
            return JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
        } catch {
            return [];
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    };

    const formatMoney = (amount) => moneyFormatter.format(amount);

    const renderCart = (root) => {
        const itemsContainer = root.querySelector('[data-cart-items]');
        const totalNode = root.querySelector('[data-cart-total]');
        const phoneNode = root.querySelector('[data-zelle-display]');
        const countNode = root.querySelector('[data-cart-count]');
        const drawer = root.querySelector('[data-cart-drawer]');
        const overlay = root.querySelector('[data-cart-overlay]');
        const toggleButton = root.querySelector('[data-cart-toggle]');
        const cart = getCart();

        if (!itemsContainer || !totalNode) {
            return;
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        if (!cart.length) {
            itemsContainer.innerHTML = '<p class="cart-empty">Your cart is empty. Add items from the gallery above.</p>';
        } else {
            itemsContainer.innerHTML = cart.map((item) => `
                <article class="cart-item" data-cart-item-id="${escapeHtml(item.id)}">
                    <div class="cart-item-meta">
                        <strong>${escapeHtml(item.name)}</strong>
                        <span>${formatMoney(item.price)} each</span>
                    </div>
                    <div class="cart-item-controls">
                        <button type="button" class="cart-step-btn" data-cart-action="decrease" aria-label="Decrease ${escapeHtml(item.name)}">−</button>
                        <span class="cart-qty">${item.qty}</span>
                        <button type="button" class="cart-step-btn" data-cart-action="increase" aria-label="Increase ${escapeHtml(item.name)}">+</button>
                        <button type="button" class="cart-remove-btn" data-cart-action="remove">Remove</button>
                    </div>
                </article>
            `).join('');
        }

        totalNode.textContent = formatMoney(total);

        if (countNode) {
            countNode.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0));
        }

        if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', drawer?.classList.contains('is-open') ? 'true' : 'false');
        }

        if (overlay && drawer) {
            overlay.classList.toggle('is-open', drawer.classList.contains('is-open'));
        }

        if (phoneNode) {
            phoneNode.textContent = root.dataset.zellePhone || 'your Zelle phone number';
        }
    };

    const renderAllCarts = () => {
        cartRoots.forEach((root) => renderCart(root));
    };

    const addToCart = ({ id, name, price }) => {
        const cart = getCart();
        const existing = cart.find((item) => item.id === id);

        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id, name, price, qty: 1 });
        }

        saveCart(cart);
        renderAllCarts();
    };

    const changeCartItemQty = (itemId, delta) => {
        const cart = getCart();
        const item = cart.find((entry) => entry.id === itemId);

        if (!item) {
            return;
        }

        item.qty += delta;

        const nextCart = cart.filter((entry) => entry.qty > 0);
        saveCart(nextCart);
        renderAllCarts();
    };

    const removeCartItem = (itemId) => {
        saveCart(getCart().filter((entry) => entry.id !== itemId));
        renderAllCarts();
    };

    const clearCart = () => {
        saveCart([]);
        renderAllCarts();
    };

    document.querySelectorAll('[data-add-cart]').forEach((button) => {
        button.addEventListener('click', () => {
            addToCart({
                id: button.dataset.itemId,
                name: button.dataset.itemName,
                price: Number(button.dataset.itemPrice),
            });
        });
    });

    cartRoots.forEach((root) => {
        const cartItems = root.querySelector('[data-cart-items]');
        const clearButton = root.querySelector('[data-cart-clear]');
        const checkoutForm = root.querySelector('[data-cart-checkout]');
        const drawer = root.querySelector('[data-cart-drawer]');
        const overlay = root.querySelector('[data-cart-overlay]');
        const toggleButton = root.querySelector('[data-cart-toggle]');
        const closeButton = root.querySelector('[data-cart-close]');

        const setDrawerOpen = (isOpen) => {
            if (!drawer) {
                return;
            }

            drawer.classList.toggle('is-open', isOpen);
            overlay?.classList.toggle('is-open', isOpen);
            root.classList.toggle('is-open', isOpen);
            toggleButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        toggleButton?.addEventListener('click', () => {
            setDrawerOpen(!drawer?.classList.contains('is-open'));
        });

        closeButton?.addEventListener('click', () => setDrawerOpen(false));

        overlay?.addEventListener('click', () => setDrawerOpen(false));

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                setDrawerOpen(false);
            }
        });

        cartItems?.addEventListener('click', (event) => {
            const control = event.target.closest('[data-cart-action]');
            const itemNode = event.target.closest('[data-cart-item-id]');

            if (!control || !itemNode) {
                return;
            }

            const itemId = itemNode.dataset.cartItemId;
            const action = control.dataset.cartAction;

            if (action === 'increase') {
                changeCartItemQty(itemId, 1);
            } else if (action === 'decrease') {
                changeCartItemQty(itemId, -1);
            } else if (action === 'remove') {
                removeCartItem(itemId);
            }
        });

        clearButton?.addEventListener('click', clearCart);

        checkoutForm?.addEventListener('submit', (event) => {
            event.preventDefault();

            const cart = getCart();
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const customerName = checkoutForm.elements.customerName?.value.trim();
            const customerPhone = checkoutForm.elements.customerPhone?.value.trim();
            const customerEmail = checkoutForm.elements.customerEmail?.value.trim();

            if (!cart.length) {
                alert('Your cart is empty. Add at least one item before submitting.');
                return;
            }

            if (!customerName || !customerPhone || !customerEmail) {
                return;
            }

            const zellePhone = root.dataset.zellePhone || 'your Zelle phone number';
            const languageIsVietnamese = document.documentElement.lang === 'vi';
            const message = languageIsVietnamese
                ? `Cảm ơn ${customerName}! Tổng đơn hàng của bạn là ${formatMoney(total)}. Vui lòng Zelle số tiền này đến ${zellePhone}. Chúng tôi sẽ liên hệ qua ${customerPhone} và ${customerEmail}.`
                : `Thank you, ${customerName}! Your cart total is ${formatMoney(total)}. Please Zelle this amount to ${zellePhone}. We will contact you at ${customerPhone} and ${customerEmail}.`;

            alert(message);
            checkoutForm.reset();
            clearCart();
            setDrawerOpen(false);
        });
    });

    renderAllCarts();

    const applyTranslations = (language) => {
        const dictionary = translations && translations[language] ? translations[language] : null;

        localStorage.setItem('tran-kitchen-language', language);
        document.documentElement.lang = language;

        if (dictionary) {
            if (dictionary['document.title']) {
                document.title = dictionary['document.title'];
            }

            translatedNodes.forEach((node) => {
                const key = node.dataset.i18nHtml || node.dataset.i18n;
                const value = dictionary[key];

                if (value !== undefined) {
                    if (node.dataset.i18nHtml) {
                        node.innerHTML = value;
                    } else {
                        node.textContent = value;
                    }
                }
            });

            translatedPlaceholders.forEach((field) => {
                const key = field.dataset.i18nPlaceholder;
                const value = dictionary[key];

                if (value !== undefined) {
                    field.placeholder = value;
                }
            });
        }

        languageButtons.forEach((button) => {
            const isActive = button.dataset.languageSwitch === language;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };

    const savedLanguage = localStorage.getItem('tran-kitchen-language') || 'en';
    applyTranslations(savedLanguage);

    languageButtons.forEach((button) => {
        button.addEventListener('click', () => applyTranslations(button.dataset.languageSwitch));
    });

    carouselRoots.forEach((root) => {
        const track = root.querySelector('[data-carousel-track]');
        const prevButton = root.querySelector('[data-carousel-prev]');
        const nextButton = root.querySelector('[data-carousel-next]');
        const slides = Array.from(track ? track.children : []);

        if (!track || slides.length === 0) {
            return;
        }

        const scrollBySlide = (direction) => {
            const slide = slides[0];
            const slideWidth = slide.getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
            const offset = slideWidth + gap;
            const maxScrollLeft = track.scrollWidth - track.clientWidth;
            const nextLeft = direction > 0 ? track.scrollLeft + offset : track.scrollLeft - offset;

            if (direction > 0 && nextLeft >= maxScrollLeft - 2) {
                track.scrollLeft = 0;
                return;
            }

            if (direction < 0 && track.scrollLeft <= 2) {
                track.scrollLeft = maxScrollLeft;
                return;
            }

            track.scrollLeft = nextLeft;
        };

        let autoPlayId = window.setInterval(() => scrollBySlide(1), 3500);
        const pauseAutoPlay = () => window.clearInterval(autoPlayId);
        const resumeAutoPlay = () => {
            pauseAutoPlay();
            autoPlayId = window.setInterval(() => scrollBySlide(1), 3500);
        };

        prevButton?.addEventListener('click', () => {
            scrollBySlide(-1);
            resumeAutoPlay();
        });

        nextButton?.addEventListener('click', () => {
            scrollBySlide(1);
            resumeAutoPlay();
        });

        root.addEventListener('mouseenter', pauseAutoPlay);
        root.addEventListener('mouseleave', resumeAutoPlay);
        root.addEventListener('focusin', pauseAutoPlay);
        root.addEventListener('focusout', resumeAutoPlay);
    });

    if (inquiryForm) {
        inquiryForm.addEventListener('submit', (e) => {
            // Prevent the page from reloading
            e.preventDefault();
            
            // In a real application, you would send this data to a server here.
            const isVietnamese = document.documentElement.lang === 'vi';
            alert(isVietnamese
                ? 'Cảm ơn bạn! Yêu cầu của bạn đã được gửi đến The Tran\'s Kitchen. Chúng tôi sẽ liên hệ sớm.'
                : "Thank you! Your inquiry has been sent to The Tran's Kitchen. We will be in touch shortly.");
            
            // Clear the form
            inquiryForm.reset();
        });
    }
});