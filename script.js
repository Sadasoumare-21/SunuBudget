// ==========================================
// 1. DONNÉES & LOCALSTORAGE
// ==========================================
let depenses = JSON.parse(localStorage.getItem('depenses')) || [];
let budgetTotalGlobal = Number(localStorage.getItem('budgetTotal')) || 0;

// Les mots-clés sont comparés comme des mots entiers pour éviter les faux positifs
// (par exemple « transport » ne doit pas détecter « sport »).
const REGLES_CATEGORIES = {
    'Alimentation': ['alimentation', 'manger', 'resto', 'restaurant', 'fastfood', 'supermarché', 'nourriture', 'pain', 'repas', 'dîner', 'déjeuner', 'boisson', 'café', 'courses', 'snack', 'fruit', 'légume', 'poisson', 'viande'],
    'Transport': ['transport', 'taxi', 'essence', 'carburant', 'uber', 'yango', 'péage', 'parking', 'billet', 'train', 'vol', 'bus', 'clando', 'moto', 'scooter', 'trajet', 'déplacement', 'métro', 'tramway'],
    'Internet': ['internet', 'forfait', 'data', 'wifi', 'abonnement', 'recharge téléphone', 'fibre', 'téléphone', 'pass internet'],
    'Logement': ['logement', 'loyer', 'facture eau', 'facture électricité', 'électricité', 'senelec', 'sde', 'gaz', 'meuble', 'maison', 'appartement', 'plomberie', 'charges locatives'],
    'Études': ['étude', 'études', 'scolarité', 'école', 'formation', 'stylo', 'cahier', 'inscription', 'université', 'fourniture scolaire', 'livre scolaire', 'examen'],
    'Loisirs': ['loisir', 'jeu', 'gaming', 'netflix', 'spotify', 'sport', 'sortie', 'vacances', 'cinéma', 'concert', 'musique', 'divertissement', 'playstation']
};

// ==========================================
// 2. SÉLECTION DES ÉLÉMENTS DU DOM
// ==========================================
const boutonTheme = document.getElementById('theme-toggle');

const affichageBudgetTotal = document.getElementById('display-budget');
const affichageTotalDepenses = document.getElementById('display-expenses');
const affichageReste = document.getElementById('display-rest');
const alerteBudget = document.getElementById('budget-alert');
const statHero = document.getElementById('rest-stat');

const conteneurBarre = document.getElementById('budget-progress');
const remplissageBarre = document.getElementById('budget-progress-fill');
const textePourcentage = document.getElementById('budget-percent');
const invitationBudget = document.getElementById('budget-invitation');

const formulaireBudget = document.getElementById('budget-form');
const champBudgetInput = document.getElementById('input-budget');

const formulaire = document.getElementById('formulaire');
const champDescription = document.getElementById('description');
const champMontant = document.getElementById('montant');
const champCategorie = document.getElementById('categorie');
const champDate = document.getElementById('date');
const elementMessage = document.getElementById('message');

const champRecherche = document.getElementById('search-input');
const filtreCategorie = document.getElementById('filter-category');
const zoneAffichage = document.getElementById('affichage');
const affichageMois = document.getElementById('month-name');

// ==========================================
// 3. FONCTIONS UTILITAIRES
// ==========================================
function sauvegarderDonnees() {
    localStorage.setItem('depenses', JSON.stringify(depenses));
    localStorage.setItem('budgetTotal', budgetTotalGlobal);
}

function afficherMessage(texte, type = 'success') {
    elementMessage.textContent = texte;
    elementMessage.className = `message message-${type}`;
}

// Le HTML affiche déjà l'unité FCFA dans une balise dédiée : cette fonction ne renvoie que le nombre.
function formaterMontant(montant) {
    const valeur = Number(montant);
    return (Number.isFinite(valeur) ? Math.round(valeur) : 0).toLocaleString('fr-FR');
}

function dateAujourdhui() {
    // Utilise la date locale pour éviter le décalage d'un jour lié à la conversion UTC.
    const aujourdHui = new Date();
    const annee = aujourdHui.getFullYear();
    const mois = String(aujourdHui.getMonth() + 1).padStart(2, '0');
    const jour = String(aujourdHui.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
}

function normaliserTexte(texte) {
    return String(texte || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function correspondMotCle(descriptionNormalisee, motCle) {
    const motsDescription = descriptionNormalisee.split(' ').filter(Boolean);
    const motsCle = normaliserTexte(motCle).split(' ').filter(Boolean);
    if (motsCle.length === 0) return false;

    for (let debut = 0; debut <= motsDescription.length - motsCle.length; debut += 1) {
        const correspond = motsCle.every((mot, index) => {
            const motSaisi = motsDescription[debut + index];
            const dernierMot = index === motsCle.length - 1;
            return motSaisi === mot
                || (dernierMot && (motSaisi === `${mot}s` || motSaisi === `${mot}x`))
                || (dernierMot && mot.length > 3 && (mot === `${motSaisi}s` || mot === `${motSaisi}x`));
        });
        if (correspond) return true;
    }
    return false;
}

function categoriesDetectees(description) {
    const descNormalisee = normaliserTexte(description);
    return Object.entries(REGLES_CATEGORIES)
        .filter(([, motsCles]) => motsCles.some((mot) => correspondMotCle(descNormalisee, mot)))
        .map(([categorie]) => categorie);
}

// Bloque une catégorie incompatible sans confirmation « enregistrer quand même ».
function validerCoherenceCategorie(description, categorieSelectionnee) {
    const suggestions = categoriesDetectees(description);
    if (suggestions.length > 0 && !suggestions.includes(categorieSelectionnee)) {
        return { valide: false, suggeree: suggestions[0] };
    }
    return { valide: true };
}

// ==========================================
// 4. THÈME
// ==========================================
function initialiserTheme() {
    const themeSauvegarde = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', themeSauvegarde);
    if (boutonTheme) {
        boutonTheme.textContent = themeSauvegarde === 'dark' ? '☀️' : '🌙';
    }
}

if (boutonTheme) {
    boutonTheme.addEventListener('click', () => {
        const themeActuel = document.documentElement.getAttribute('data-theme');
        const nouveauTheme = themeActuel === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nouveauTheme);
        localStorage.setItem('theme', nouveauTheme);
        boutonTheme.textContent = nouveauTheme === 'dark' ? '☀️' : '🌙';
    });
}

// ==========================================
// 5. GESTION DU BUDGET & BARRE DE PROGRESSION
// ==========================================
formulaireBudget.addEventListener('submit', (e) => {
    e.preventDefault();
    const montantBudget = Number(champBudgetInput.value);

    if (montantBudget <= 0 || isNaN(montantBudget)) {
        afficherMessage('Veuillez entrer un budget valide supérieur à 0 FCFA.', 'error');
        return;
    }

    budgetTotalGlobal = montantBudget;
    champBudgetInput.value = '';
    sauvegarderDonnees();
    afficherMessage('Budget mensuel mis à jour !', 'success');
    afficherDepenses();
});

function mettreAJourBudgetEtBarre() {
    const moisActuel = dateAujourdhui().slice(0, 7);

    const totalDepenses = depenses
        .filter(depense => typeof depense.date === 'string' && depense.date.startsWith(moisActuel))
        .reduce((somme, depense) => somme + (Number(depense.montant) || 0), 0);

    const reste = budgetTotalGlobal - totalDepenses;

    // Mise à jour des montants
    affichageBudgetTotal.textContent = formaterMontant(budgetTotalGlobal);
    affichageTotalDepenses.textContent = formaterMontant(totalDepenses);
    affichageReste.textContent = formaterMontant(reste);

    if (statHero) {
        if (reste < 0) {
            statHero.classList.add('negative');
        } else {
            statHero.classList.remove('negative');
        }
    }

    if (budgetTotalGlobal <= 0) {
        if (invitationBudget) invitationBudget.hidden = false;
        if (remplissageBarre) remplissageBarre.style.transform = 'scaleX(0)';
        if (conteneurBarre) conteneurBarre.setAttribute('aria-valuenow', '0');
        if (textePourcentage) textePourcentage.textContent = '0 % utilisé';
        if (alerteBudget) alerteBudget.hidden = true;
        return;
    }

    if (invitationBudget) invitationBudget.hidden = true;

    // Garde la valeur réelle précise : 500 FCFA sur 1 500 000 valent 0,03 %, pas 0 %.
    const ratio = Math.min(Math.max(totalDepenses / budgetTotalGlobal, 0), 1);
    const pourcentageReel = (totalDepenses / budgetTotalGlobal) * 100;
    const pourcentageAffiche = new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 2
    }).format(pourcentageReel);
    // Donne un minimum visuel aux petites dépenses tout en conservant le vrai ratio accessible.
    const ratioVisuel = ratio > 0 ? Math.max(ratio, 0.006) : 0;

    if (remplissageBarre) {
        remplissageBarre.style.transform = `scaleX(${ratioVisuel})`;
    }

    if (conteneurBarre) {
        conteneurBarre.setAttribute('aria-valuenow', String(Math.min(pourcentageReel, 100)));
        conteneurBarre.setAttribute('aria-valuetext', `${pourcentageAffiche} % utilisé`);
        conteneurBarre.classList.remove('is-ok', 'is-accent', 'is-loss');
        if (pourcentageReel > 100) {
            conteneurBarre.classList.add('is-loss');
        } else if (pourcentageReel >= 70) {
            conteneurBarre.classList.add('is-accent');
        } else {
            conteneurBarre.classList.add('is-ok');
        }
    }

    if (textePourcentage) {
        textePourcentage.textContent = `${pourcentageAffiche} % utilisé`;
    }

    if (alerteBudget) {
        if (reste < 0) {
            alerteBudget.textContent = `⚠️ Dépassement de budget de ${formaterMontant(Math.abs(reste))} FCFA`;
            alerteBudget.hidden = false;
        } else {
            alerteBudget.hidden = true;
        }
    }
}

// ==========================================
// 6. GESTION DES DÉPENSES
// ==========================================
formulaire.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = champDescription.value.trim();
    const montant = Number(champMontant.value);
    const categorie = champCategorie.value;
    const date = champDate.value;

    if (!description || !montant || montant <= 0 || !categorie || !date) {
        afficherMessage('Veuillez remplir correctement tous les champs.', 'error');
        return;
    }

    if (date > dateAujourdhui()) {
        afficherMessage('La date ne peut pas être postérieure à aujourd’hui.', 'error');
        champDate.focus();
        return;
    }

    const verification = validerCoherenceCategorie(description, categorie);
    if (!verification.valide) {
        afficherMessage(
            `Dépense non enregistrée : « ${description} » semble correspondre à « ${verification.suggeree} », pas à « ${categorie} ».`,
            'error'
        );
        champCategorie.setAttribute('aria-invalid', 'true');
        champCategorie.focus();
        return;
    }
    champCategorie.removeAttribute('aria-invalid');

    const nouvelleDepense = {
        id: Date.now(),
        description: description,
        montant: montant,
        categorie: categorie,
        date: date
    };

    depenses.push(nouvelleDepense);
    sauvegarderDonnees();

    // Après l'ajout, les champs sont vidés ; la date sera choisie pour la prochaine dépense.
    formulaire.reset();
    
    afficherMessage('Dépense ajoutée avec succès !', 'success');
    afficherDepenses();
});

function supprimerDepense(id) {
    depenses = depenses.filter(depense => depense.id !== id);
    sauvegarderDonnees();
    afficherMessage('Dépense supprimée.', 'success');
    afficherDepenses();
}

window.supprimerDepense = supprimerDepense;

// ==========================================
// 7. AFFICHAGE ET FILTRAGE
// ==========================================
function afficherDepenses() {
    zoneAffichage.innerHTML = '';

    const termeRecherche = champRecherche.value.toLowerCase().trim();
    const categorieChoisie = filtreCategorie.value;

    if (affichageMois) {
        const optionsMois = { month: 'long', year: 'numeric' };
        affichageMois.textContent = new Date().toLocaleDateString('fr-FR', optionsMois);
    }

    const depensesFiltrees = depenses.filter(depense => {
        const correspondTexte = depense.description.toLowerCase().includes(termeRecherche);
        const correspondCat = (categorieChoisie === 'Toutes' || depense.categorie === categorieChoisie);
        return correspondTexte && correspondCat;
    });

    depensesFiltrees.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (depensesFiltrees.length === 0) {
        zoneAffichage.innerHTML = '<p class="empty-state">Aucune dépense enregistrée pour le moment.</p>';
    } else {
        depensesFiltrees.forEach(depense => {
            const article = document.createElement('article');
            article.className = 'expense-item';

            // Le titre vient toujours du champ description et le sous-texte de la catégorie stockée.
            const details = document.createElement('div');
            const titre = document.createElement('h3');
            titre.textContent = depense.description;
            const sousTexte = document.createElement('p');
            sousTexte.textContent = `${depense.categorie} • ${depense.date}`;
            details.append(titre, sousTexte);

            const categoriesDeLaDescription = categoriesDetectees(depense.description);
            if (categoriesDeLaDescription.length > 0 && !categoriesDeLaDescription.includes(depense.categorie)) {
                const avertissement = document.createElement('div');
                avertissement.className = 'expense-warning';
                const badge = document.createElement('span');
                badge.className = 'badge-warning';
                badge.textContent = '⚠ Catégorie à vérifier';
                const boutonCorriger = document.createElement('button');
                boutonCorriger.type = 'button';
                boutonCorriger.className = 'expense-fix-btn';
                boutonCorriger.textContent = `Corriger en ${categoriesDeLaDescription[0]}`;
                boutonCorriger.addEventListener('click', () => {
                    depense.categorie = categoriesDeLaDescription[0];
                    sauvegarderDonnees();
                    afficherMessage(`Catégorie corrigée en ${depense.categorie}.`, 'success');
                    afficherDepenses();
                });
                avertissement.append(badge, boutonCorriger);
                details.appendChild(avertissement);
            }

            const actions = document.createElement('div');
            actions.className = 'expense-actions';
            const montantAffiche = document.createElement('strong');
            montantAffiche.textContent = `${formaterMontant(depense.montant)} FCFA`;
            const boutonSupprimer = document.createElement('button');
            boutonSupprimer.type = 'button';
            boutonSupprimer.className = 'expense-delete-btn';
            boutonSupprimer.textContent = 'Supprimer';
            boutonSupprimer.addEventListener('click', () => supprimerDepense(depense.id));
            actions.append(montantAffiche, boutonSupprimer);

            article.append(details, actions);
            zoneAffichage.appendChild(article);
        });
    }

    mettreAJourBudgetEtBarre();
}

champRecherche.addEventListener('input', afficherDepenses);
filtreCategorie.addEventListener('change', afficherDepenses);

// ==========================================
// 8. INITIALISATION
// ==========================================
initialiserTheme();
champDate.max = dateAujourdhui();
champDate.value = dateAujourdhui();
afficherDepenses();