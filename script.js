document.addEventListener('DOMContentLoaded', function() {
    // Récupération des éléments du DOM
    const pdfList = document.getElementById('pdf-list');
    const pdfFrame = document.getElementById('pdf-frame');
    const pdfContainer = document.getElementById('pdf-container');
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
    let isAuthenticated = false; // Toujours initialiser à false à chaque chargement
    
    // S'assurer que l'interface est en mode non-authentifié
    resetAuthenticationState();
    
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
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données:', error);
        });
    
    // Fonction pour réinitialiser l'état d'authentification
    function resetAuthenticationState() {
        // Vider l'iframe
        pdfFrame.src = 'about:blank';
        
        // Cacher la liste des BDs
        if (sidebar) {
            sidebar.style.visibility = 'hidden';
        }
        
        // Ajouter la classe de non-authentification au conteneur
        pdfContainer.classList.add('not-authenticated');
        
        // Afficher l'écran de connexion
        loginOverlay.style.display = 'flex';
        
        // Vider le champ de saisie du code
        accessCodeInput.value = '';
    }
    
    // Fonctionnalité du menu hamburger pour mobile
    menuToggle.addEventListener('click', function() {
        if (!isAuthenticated) return; // Désactiver si non authentifié
        
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
    
    // Bloquer l'accès au menu contextuel et l'inspection pour rendre plus difficile l'accès aux URLs
    document.addEventListener('contextmenu', function(e) {
        if (!isAdmin) {
            e.preventDefault();
            return false;
        }
    });
    
    // Bloquer la possibilité de faire un glisser-déposer sur l'iframe
    pdfFrame.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Gestion de l'authentification avec code d'accès
    loginButton.addEventListener('click', function() {
        validateAccessCode();
    });
    
    // Permettre de soumettre avec la touche Entrée
    accessCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            validateAccessCode();
        }
    });
    
    // Fonction de validation du code d'accès
    function validateAccessCode() {
        const enteredCode = accessCodeInput.value.trim();
        
        if (enteredCode === correctCode) {
            // Code correct
            isAuthenticated = true;
            
            // Afficher la liste et charger les BDs
            sidebar.style.visibility = 'visible';
            if (bdData && bdData.bds) {
                loadBdsFromJSON(bdData.bds);
            }
            
            // Retirer la classe de non-authentification
            pdfContainer.classList.remove('not-authenticated');
            
            hideLoginOverlay();
        } else {
            // Code incorrect
            accessError.textContent = "Code d'accès incorrect. Veuillez réessayer.";
            accessCodeInput.value = '';
            accessCodeInput.focus();
            
            // Bloquer temporairement après 3 tentatives incorrectes consécutives
            const attempts = parseInt(sessionStorage.getItem('login_attempts') || '0') + 1;
            sessionStorage.setItem('login_attempts', attempts);
            
            if (attempts >= 3) {
                loginButton.disabled = true;
                accessCodeInput.disabled = true;
                accessError.textContent = "Trop de tentatives. Veuillez réessayer dans 30 secondes.";
                
                setTimeout(function() {
                    loginButton.disabled = false;
                    accessCodeInput.disabled = false;
                    accessError.textContent = "";
                    sessionStorage.setItem('login_attempts', '0');
                }, 30000);
            }
        }
    }
    
    // Fonction pour cacher l'écran de connexion
    function hideLoginOverlay() {
        loginOverlay.style.display = 'none';
        // Charger la première BD si disponible
        if (pdfList.querySelector('a')) {
            pdfList.querySelector('a').click();
        }
    }
    
    // Ajouter un bouton de déconnexion
    const logoutButtonContainer = document.createElement('div');
    logoutButtonContainer.className = 'logout-container';
    const logoutUserBtn = document.createElement('button');
    logoutUserBtn.textContent = "Déconnexion";
    logoutUserBtn.className = 'logout-user-btn';
    logoutUserBtn.addEventListener('click', function() {
        // Réinitialiser l'état d'authentification
        isAuthenticated = false;
        resetAuthenticationState();
        // Supprimer le bouton de déconnexion
        if (logoutButtonContainer.parentNode) {
            logoutButtonContainer.parentNode.removeChild(logoutButtonContainer);
        }
    });
    
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
        if (!isAuthenticated) return; // Empêcher l'accès au mode admin si non authentifié
        
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
                
                // Ajouter un bouton de déconnexion pour l'admin seulement après authentification réussie
                const logoutBtn = document.createElement('button');
                logoutBtn.textContent = "Quitter le mode admin";
                logoutBtn.classList.add('logout-btn');
                logoutBtn.addEventListener('click', function() {
                    localStorage.setItem('isAdmin', 'false');
                    addPdfSection.style.display = 'none';
                    logoutBtn.remove();
                    alert("Mode administrateur désactivé!");
                });
                addPdfSection.appendChild(logoutBtn);
            }
        }
    });
    
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
    
    // Protection de l'iframe
    pdfFrame.onload = function() {
        if (!isAuthenticated) {
            pdfFrame.src = 'about:blank';
            pdfContainer.classList.add('not-authenticated');
        }
    };
    
    // Ajouter un écouteur d'événements pour la liste de PDF
    pdfList.addEventListener('click', function(e) {
        if (!isAuthenticated) return; // Ne rien faire si non authentifié
        
        if (e.target.tagName === 'A') {
            e.preventDefault();
            
            // Retirer la classe active de tous les liens
            const links = pdfList.querySelectorAll('a');
            links.forEach(link => link.classList.remove('active'));
            
            // Ajouter la classe active au lien cliqué
            e.target.classList.add('active');
            
            // Mettre à jour l'iframe avec l'URL de la BD sélectionnée
            const pdfUrl = e.target.getAttribute('data-pdf-url');
            
            // Vérifier à nouveau l'authentification avant de charger l'iframe
            if (isAuthenticated) {
                pdfFrame.src = pdfUrl;
                
                // Ajouter le bouton de déconnexion s'il n'est pas déjà présent
                if (!document.body.contains(logoutButtonContainer)) {
                    document.body.appendChild(logoutButtonContainer);
                    logoutButtonContainer.appendChild(logoutUserBtn);
                }
            }
        }
    });
    
    // Fonction pour ajouter une BD à la liste
    function addPdfToList(title, url) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        
        a.href = '#';
        a.textContent = title;
        
        // Stocker l'URL directement
        a.setAttribute('data-pdf-url', url);
        
        li.appendChild(a);
        pdfList.appendChild(li);
        
        // Sélectionner automatiquement la nouvelle BD ajoutée si authentifié
        if (isAuthenticated) {
            const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            a.dispatchEvent(event);
        }
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
    
    // Observer les changements sur l'iframe pour bloquer l'accès direct
    const frameObserver = new MutationObserver(function(mutations) {
        if (!isAuthenticated && pdfFrame.src !== 'about:blank' && pdfFrame.src !== '') {
            pdfFrame.src = 'about:blank';
            pdfContainer.classList.add('not-authenticated');
        }
    });
    
    // Configurer l'observateur pour surveiller les changements d'attributs de l'iframe
    frameObserver.observe(pdfFrame, { attributes: true, attributeFilter: ['src'] });
    
    // Bloquer le clic droit sur l'iframe
    pdfContainer.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Ajouter un écouteur d'événements pour détecter les changements de visibilité de la page
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // La page est redevenue visible (par exemple après changement d'onglet)
            // Réinitialiser l'authentification
            isAuthenticated = false;
            resetAuthenticationState();
            
            // Supprimer le bouton de déconnexion
            if (logoutButtonContainer.parentNode) {
                logoutButtonContainer.parentNode.removeChild(logoutButtonContainer);
            }
        }
    });
});