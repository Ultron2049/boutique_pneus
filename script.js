// ============================
// VARIABLES GLOBALES
// ============================
let cart = [];
let products = [];

const productContainer = document.querySelector(".produits");
const cartList = document.querySelector(".cart-list");
const cartCounter = document.querySelector(".cart-btn-counter");
const totalPriceEl = document.querySelector(".total-price"); // à ajouter dans le HTML panier si absent

// ============================
// CHARGER/SAUVEGARDER PANIER
// ============================
function loadCart() {
    const saved = localStorage.getItem("cart");
    if (saved) cart = JSON.parse(saved);
}
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}
loadCart();

// ============================
// AFFICHER LES PRODUITS
// ============================
function displayProducts() {
    productContainer.innerHTML = "";
    products.forEach(item => {
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
            <div class="img-box"><img src="${item.img}" alt="${item.nom}"></div>
            <h1 class="title">${item.nom}</h1>
            <p class="price">
                <span class="old">${item.prix_initial} FCFA</span><br>
                <span class="new">${item.prix_promo} FCFA</span>
            </p>
            <div class="add">
                <button class="add-btn" data-id="${item.id}">Ajouter</button>
            </div>
        `;
        productContainer.appendChild(div);
    });
    attachAddEvents();
    updateAddButtons();
}

// ============================
// OUVRIR/FERMER PANIER
// ============================
let showhide = document.querySelector('.cart-btn');
let viewcart = document.querySelector('.cart');
let closeBtn = document.querySelector('.close');

showhide.addEventListener("click", () => {
    viewcart.classList.add("open");
    document.body.classList.add("no-scroll");
});

closeBtn.addEventListener("click", () => {
    viewcart.classList.remove("open");
    document.body.classList.remove("no-scroll");
});

window.addEventListener("wheel", (e) => {
    if (viewcart.classList.contains("open")) {
        let rect = viewcart.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            viewcart.classList.remove("open");
            document.body.classList.remove("no-scroll");
        }
    }
});

// ============================
// AJOUTER AU PANIER (AVEC POPUP)
// ============================
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const popup = document.getElementById("confirmPopup");
    document.getElementById("popupProductName").textContent = product.nom;

    // Ouvre le popup
    popup.classList.add("active");

    // Nettoyage complet des anciens écouteurs
    const newConfirm = document.getElementById("confirmBtn").cloneNode(true);
    const newCancel = document.getElementById("cancelBtn").cloneNode(true);
    document.getElementById("confirmBtn").replaceWith(newConfirm);
    document.getElementById("cancelBtn").replaceWith(newCancel);

    const closePopup = () => popup.classList.remove("active");

    newConfirm.onclick = () => {
        // Si déjà dans le panier → on augmente la quantité
        const existing = cart.find(p => p.id === id);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }
        updateCartDisplay();
        updateAddButtons();
        saveCart();
        closePopup();
    };

    newCancel.onclick = closePopup;
    popup.onclick = (e) => { if (e.target === popup) closePopup(); };
}

// Attacher les boutons "Ajouter"
function attachAddEvents() {
    document.querySelectorAll(".add-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });
}

// ============================
// MISE À JOUR DU PANIER
// ============================
function updateCartDisplay() {
    cartList.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        total += item.prix_promo * item.qty;

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <div class="item-image"><img src="${item.img}" alt="${item.nom}"></div>
            <div class="item-name">${item.nom}</div>
            <div class="total-price-item">${item.prix_promo * item.qty} FCFA</div>
            <div class="quantity">
                <span class="moins" data-id="${item.id}">−</span>
                <span class="qty">${item.qty}</span>
                <span class="plus" data-id="${item.id}">+</span>
            </div>
            <span class="del" data-id="${item.id}">Supprimer</span>
        `;
        cartList.appendChild(div);
    });

    cartCounter.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
    if (totalPriceEl) totalPriceEl.textContent = total + " FCFA";

    // Ré-attacher les événements + − ×
    document.querySelectorAll(".plus").forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            cart.find(p => p.id === id).qty += 1;
            updateCartDisplay();
            saveCart();
        };
    });

    document.querySelectorAll(".moins").forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const prod = cart.find(p => p.id === id);
            if (prod.qty > 1) {
                prod.qty -= 1;
            } else {
                cart = cart.filter(p => p.id !== id);
            }
            updateCartDisplay();
            updateAddButtons();
            saveCart();
        };
    });

    document.querySelectorAll(".del").forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            cart = cart.filter(p => p.id !== id);
            updateCartDisplay();
            updateAddButtons();
            saveCart();
        };
    });
}

// ============================
// BOUTONS "AJOUTER" → "Dans le panier"
// ============================
function updateAddButtons() {
    document.querySelectorAll(".add-btn").forEach(btn => {
        const id = parseInt(btn.dataset.id);
        if (cart.some(p => p.id === id)) {
            btn.textContent = "Dans le panier ✓";
            btn.disabled = true;
            btn.style.background = "#4CAF50";
        } else {
            btn.textContent = "Ajouter";
            btn.disabled = false;
            btn.style.background = "black";
        }
    });
}

// ============================
// CHARGER LES PRODUITS
// ============================
fetch("produits.json")
    .then(res => res.json())
    .then(data => {
        products = data;
        displayProducts();
        updateCartDisplay();
    });

/// ============================
// COMMANDE WHATSAPP + INFOS CLIENT + VALIDATION BF + VIDAGE PANIER
// ============================
const clientPopup = document.getElementById("clientInfoPopup");

document.querySelector(".get-items").addEventListener("click", () => {
    if (cart.length === 0) {
        alert("Votre panier est vide !");
        return;
    }

    clientPopup.classList.add("active");

    // Nettoyage propre des écouteurs
    const confirmBtn = document.getElementById("clientConfirmBtn");
    const cancelBtn  = document.getElementById("clientCancelBtn");
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel  = cancelBtn.cloneNode(true);
    confirmBtn.replaceWith(newConfirm);
    cancelBtn.replaceWith(newCancel);

    const closeClientPopup = () => clientPopup.classList.remove("active");

    // Bouton Annuler
    newCancel.onclick = closeClientPopup;

    // Bouton Commander → tout le traitement
    newConfirm.onclick = () => {
        const nom    = document.getElementById("clientNom").value.trim();
        const prenom = document.getElementById("clientPrenom").value.trim();
        let tel      = document.getElementById("clientTel").value.trim();

        // Champs obligatoires
        if (!nom || !prenom || !tel) {
            alert("Tous les champs sont obligatoires !");
            return;
        }

        // Nom & prénom pas trop courts
        if (nom.length < 2 || prenom.length < 2) {
            alert("Nom et prénom trop courts !");
            return;
        }

        // Nettoyage du numéro (on garde que les chiffres)
        tel = tel.replace(/[^0-9]/g, '');

        // Validation BURKINA FASO : exactement 8 chiffres + commence par 01, 05, 06 ou 07
        const regexBF = /^(01|05|06|07)[0-9]{6}$/;
        if (!regexBF.test(tel)) {
            alert("Numéro invalide !\n\nDoit être un numéro burkinabè à 8 chiffres.\nExemples valides :\n• 07123456\n• 05 12 34 56\n• 07 12 34 56");
            return;
        }

        // Formatage joli du numéro
        const telFormate = tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

        // Construction du message WhatsApp
        let msg = `*NOUVELLE COMMANDE - Abdul Pneus*%0A%0A`;
        msg += `*Client :* ${prenom} ${nom}%0A`;
        msg += `*Téléphone :* ${telFormate}%0A%0A`;
        msg += `*Détail de la commande :*%0A`;

        cart.forEach(item => {
            msg += `• ${item.nom} × ${item.qty} = ${item.prix_promo * item.qty} FCFA%0A`;
        });

        const total = cart.reduce((s, i) => s + i.prix_promo * i.qty, 0);
        msg += `%0A*Total : ${total} FCFA*%0A`;
        msg += `%0AMerci et à très bientôt !`;

        // Envoi WhatsApp
        window.open(`https://wa.me/22607158478?text=${msg}`, "_blank");

        // VIDAGE DU PANIER APRÈS COMMANDE
        closeClientPopup();
        cart = [];
        updateCartDisplay();
        updateAddButtons();
        saveCart();
    };

    // Fermer en cliquant à l'extérieur
    clientPopup.onclick = (e) => {
        if (e.target === clientPopup) closeClientPopup();
    };
});