document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFiltersContainer = document.getElementById('category-filters');
    
    // Elementos do Carrinho Lateral
    const cartButton = document.querySelector('.cart-button');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeSidebarButton = document.querySelector('.close-sidebar');
    const overlay = document.getElementById('overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const cartCountSpan = document.getElementById('cart-count');
    const checkoutButton = document.getElementById('checkout-button');
    const addressInput = document.getElementById('address');
    const paymentMethodSelect = document.getElementById('payment-method');
    const trocoParaInput = document.getElementById('troco-para');

    let allProducts = [];
    let cart = [];

    // --- Funções de Carregamento e Exibição de Produtos ---
    async function fetchProducts() {
        try {
            const response = await fetch('produtos.json');
            allProducts = await response.json();
            displayProducts(allProducts);
            createCategoryFilters();
            loadCartFromLocalStorage();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    }

    function displayProducts(products) {
        productGrid.innerHTML = '';
        if (products.length === 0) {
            productGrid.innerHTML = '<p>Nenhum produto encontrado para sua busca.</p>';
            return;
        }
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.imagem}" alt="${product.nome}">
                <h3>${product.nome}</h3>
                <p class="price">R$ ${product.preco.toFixed(2)}</p>
                <button>Adicionar ao Carrinho</button>
            `;
            // Adicionamos o evento de clique diretamente aqui
            productCard.querySelector('button').addEventListener('click', () => addToCart(product.id));
            productGrid.appendChild(productCard);
        });
    }

    function createCategoryFilters() {
        const categories = ['todos', ...new Set(allProducts.map(p => p.categoria))];
        categoryFiltersContainer.innerHTML = '';
        categories.forEach(category => {
            const button = document.createElement('button');
            button.innerText = category.charAt(0).toUpperCase() + category.slice(1);
            button.classList.add('category-filter-btn');
            button.addEventListener('click', () => {
                filterByCategory(category);
                document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
            categoryFiltersContainer.appendChild(button);
        });
        const allButton = categoryFiltersContainer.querySelector('.category-filter-btn');
        if (allButton) allButton.classList.add('active');
    }

    // --- Funções de Filtro e Busca ---
    function filterByName() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => p.nome.toLowerCase().includes(searchTerm));
        displayProducts(filtered);
    }

    function filterByCategory(category) {
        if (category === 'todos') {
            displayProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p => p.categoria === category);
            displayProducts(filtered);
        }
    }
    
    searchInput.addEventListener('input', filterByName);

    // --- Lógica do Carrinho ---
    function addToCart(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;
        const cartItem = cart.find(item => item.id === productId);

        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCartToLocalStorage();
        updateCartDisplay();
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCartToLocalStorage();
        updateCartDisplay();
    }

    function updateItemQuantity(productId, change) {
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += change;
            if (cartItem.quantity <= 0) {
                removeFromCart(productId);
            } else {
                saveCartToLocalStorage();
                updateCartDisplay();
            }
        }
    }
    
    // =======================================================================
    // AQUI ESTÁ A CORREÇÃO PRINCIPAL
    // =======================================================================
    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Seu carrinho está vazio.</p>';
        } else {
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                // Removemos os 'onclick' daqui
                itemElement.innerHTML = `
                    <img src="${item.imagem}" alt="${item.nome}">
                    <div class="cart-item-details">
                        <h4>${item.nome}</h4>
                        <p class="price">R$ ${(item.preco * item.quantity).toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn decrease-btn">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase-btn">+</button>
                        <button class="remove-btn"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;

                // E adicionamos os eventos de clique diretamente aos botões aqui
                itemElement.querySelector('.decrease-btn').addEventListener('click', () => updateItemQuantity(item.id, -1));
                itemElement.querySelector('.increase-btn').addEventListener('click', () => updateItemQuantity(item.id, 1));
                itemElement.querySelector('.remove-btn').addEventListener('click', () => removeFromCart(item.id));
                
                cartItemsContainer.appendChild(itemElement);
                total += item.preco * item.quantity;
                count += item.quantity;
            });
        }

        cartTotalSpan.innerText = `R$ ${total.toFixed(2)}`;
        cartCountSpan.innerText = count;
    }

    function saveCartToLocalStorage() {
        localStorage.setItem('deliveryCart', JSON.stringify(cart));
    }

    function loadCartFromLocalStorage() {
        const storedCart = localStorage.getItem('deliveryCart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
            updateCartDisplay();
        }
    }

    // --- Lógica do Carrinho Lateral (Sidebar) ---
    cartButton.addEventListener('click', () => {
        cartSidebar.classList.add('open');
        overlay.style.display = 'block';
    });

    closeSidebarButton.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        overlay.style.display = 'none';
    });

    overlay.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        overlay.style.display = 'none';
    });

    // --- Lógica de Pagamento (Campo de Troco) ---
    paymentMethodSelect.addEventListener('change', () => {
        if (paymentMethodSelect.value === 'dinheiro') {
            trocoParaInput.classList.remove('hidden');
        } else {
            trocoParaInput.classList.add('hidden');
            trocoParaInput.value = '';
        }
    });

    // --- Finalizar Pedido e Enviar para o WhatsApp ---
    checkoutButton.addEventListener('click', () => {
        const address = addressInput.value.trim();
        const paymentMethod = paymentMethodSelect.value;
        const trocoPara = trocoParaInput.value.trim();

        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        if (!address) {
            alert('Por favor, preencha o endereço de entrega.');
            return;
        }

        let message = `*Pedido de Delivery - Distribuidora Ramos*\n\n`;
        message += `*Itens:*\n`;
        cart.forEach(item => {
            message += `- ${item.nome} (x${item.quantity}) - R$ ${(item.preco * item.quantity).toFixed(2)}\n`;
        });
        message += `\n*Total do Pedido:* ${cartTotalSpan.innerText}\n`;
        message += `*Forma de Pagamento:* ${
            paymentMethod === 'pix' ? 'PIX' : 
            paymentMethod === 'dinheiro' ? `Dinheiro ${trocoPara ? '(Troco para R$ ' + parseFloat(trocoPara).toFixed(2) + ')' : ''}` :
            'Cartão na Entrega'
        }\n`;
        message += `*Endereço de Entrega:* ${address}\n\n`;
        message += `_Obrigado pelo seu pedido!_`;
        
        const phoneNumber = '5599000000000'; // **SUBSTITUA PELO NÚMERO DA SUA LOJA**
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    });

    // --- Inicialização ---
    fetchProducts();
});