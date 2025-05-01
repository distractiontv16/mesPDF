document.addEventListener('DOMContentLoaded', function() {
    // Récupération des éléments du DOM
    const pdfList = document.getElementById('pdf-list');
    const pdfFrame = document.getElementById('pdf-frame');
    const addPdfForm = document.getElementById('add-pdf-form');
    const pdfTitleInput = document.getElementById('pdf-title');
    const pdfUrlInput = document.getElementById('pdf-url');
    const addPdfSection = document.querySelector('.add-pdf');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const loginOverlay = document.getElementById('login-overlay');
    const accessCodeInput = document.getElementById('access-code');
    const loginButton = document.getElementById('login-button');
    const accessError = document.getElementById('access-error');
    
    // Variables pour stocker les données
    let bdData = null;
    let correctCode = '';
    let isAuthenticated = localStorage.getItem('bd_authenticated') === 'true';
    
    // Charger les données depuis le fichier JSON
    fetch('bdlinks.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Impossible de charger les données');
            }
            return response.json();
        })
        .then(data => {
            bdData = data;
            correctCode = data.codeAcces;
            
            // Initialiser la liste des BDs
            if (data.bds && Array.isArray(data.bds)) {
                loadBdsFromJSON(data.bds);
            }
            
            // Vérifier si l'utilisateur est déjà authentifié
            if (isAuthenticated) {
                hideLoginOverlay();
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données:', error);
        });
    
    // Fonctionnalité du menu hamburger pour mobile
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Fermer le menu au clic sur un lien (pour mobile)
    pdfList.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Gestion de l'authentification avec code d'accès
    loginButton.addEventListener('click', function() {
        const enteredCode = accessCodeInput.value.trim();
        
        if (enteredCode === correctCode) {
            // Code correct
            localStorage.setItem('bd_authenticated', 'true');
            hideLoginOverlay();
        } else {
            // Code incorrect
            accessError.textContent = "Code d'accès incorrect. Veuillez réessayer.";
            accessCodeInput.value = '';
            accessCodeInput.focus();
        }
    });
    
    // Permettre de soumettre avec la touche Entrée
    accessCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginButton.click();
        }
    });
    
    // Fonction pour cacher l'écran de connexion
    function hideLoginOverlay() {
        loginOverlay.style.display = 'none';
        // Charger la première BD si disponible
        if (pdfList.querySelector('a')) {
            pdfList.querySelector('a').click();
        }
    }
    
    // Gestion de l'affichage du formulaire d'administration
    // Par défaut, on cache le formulaire d'ajout pour les utilisateurs normaux
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    // Cacher le formulaire d'ajout si non admin
    if (!isAdmin) {
        addPdfSection.style.display = 'none';
    }
    
    // Ajouter une fonction pour activer le mode admin avec un code secret (double-clic sur le titre)
    const mainTitle = document.querySelector('.sidebar h2');
    let clickCount = 0;
    let clickTimer;
    
    mainTitle.addEventListener('click', function() {
        clickCount++;
        
        if (clickCount === 1) {
            clickTimer = setTimeout(function() {
                clickCount = 0;
            }, 1000);
        } else if (clickCount === 5) {
            clearTimeout(clickTimer);
            clickCount = 0;
            
            // Demander un code secret
            const secretCode = prompt("Entrez le code administrateur:");
            if (secretCode === "admin1234") { // Changez ce code selon vos besoins
                localStorage.setItem('isAdmin', 'true');
                addPdfSection.style.display = 'block';
                alert("Mode administrateur activé!");
            }
        }
    });
    
    // Ajouter un bouton de déconnexion pour l'admin
    if (isAdmin) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = "Quitter le mode admin";
        logoutBtn.classList.add('logout-btn');
        logoutBtn.addEventListener('click', function() {
            localStorage.setItem('isAdmin', 'false');
            addPdfSection.style.display = 'none';
            logoutBtn.remove();
            alert("Mode administrateur désactivé!");
            location.reload();
        });
        addPdfSection.appendChild(logoutBtn);
    }
    
    // Ajouter un écouteur d'événements pour le formulaire d'ajout de PDF
    addPdfForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = pdfTitleInput.value.trim();
        const url = pdfUrlInput.value.trim();
        
        if (title && url) {
            // Ajouter la nouvelle BD à la liste
            addPdfToList(title, url);
            
            // Mettre à jour le fichier JSON (en mode réel, vous auriez besoin d'une API backend pour cela)
            if (bdData && bdData.bds) {
                bdData.bds.push({
                    titre: title,
                    url: url
                });
                
                // En situation réelle, vous feriez un appel API pour sauvegarder dans le fichier JSON
                // Pour cette démonstration, on utilise le stockage local
                saveBdsToLocalStorage();
            }
            
            // Réinitialiser le formulaire
            pdfTitleInput.value = '';
            pdfUrlInput.value = '';
        }
    });
    
    // Ajouter un écouteur d'événements pour la liste de PDF
    pdfList.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            
            // Retirer la classe active de tous les liens
            const links = pdfList.querySelectorAll('a');
            links.forEach(link => link.classList.remove('active'));
            
            // Ajouter la classe active au lien cliqué
            e.target.classList.add('active');
            
            // Mettre à jour l'iframe avec l'URL de la BD sélectionnée
            const pdfUrl = e.target.getAttribute('data-pdf-url');
            pdfFrame.src = pdfUrl;
        }
    });
    
    // Fonction pour ajouter une BD à la liste
    function addPdfToList(title, url) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        
        a.href = '#';
        a.textContent = title;
        a.setAttribute('data-pdf-url', url);
        
        li.appendChild(a);
        pdfList.appendChild(li);
        
        // Sélectionner automatiquement la nouvelle BD ajoutée
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        a.dispatchEvent(event);
    }
    
    // Fonction pour charger les BDs depuis le JSON
    function loadBdsFromJSON(bds) {
        // Vider la liste actuelle
        pdfList.innerHTML = '';
        
        // Ajouter chaque BD à la liste
        bds.forEach(bd => {
            addPdfToList(bd.titre, bd.url);
        });
    }
    
    // Fonction pour sauvegarder les BDs dans le stockage local
    function saveBdsToLocalStorage() {
        const bds = [];
        const links = pdfList.querySelectorAll('a');
        
        links.forEach(link => {
            bds.push({
                titre: link.textContent,
                url: link.getAttribute('data-pdf-url')
            });
        });
        
        localStorage.setItem('bdData', JSON.stringify({
            codeAcces: bdData.codeAcces,
            bds: bds
        }));
    }
    
    // Fonction pour charger les BDs depuis le stockage local
    function loadBdsFromLocalStorage() {
        const storedData = JSON.parse(localStorage.getItem('bdData'));
        
        if (storedData && storedData.bds && storedData.bds.length > 0) {
            loadBdsFromJSON(storedData.bds);
        }
    }
    
    // Charger les BDs depuis le stockage local en complément
    const storedData = JSON.parse(localStorage.getItem('bdData'));
    if (storedData && storedData.bds && storedData.bds.length > 0) {
        loadBdsFromJSON(storedData.bds);
    }
});