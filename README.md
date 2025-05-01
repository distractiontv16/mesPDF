# Bibliothèque PDF PubHTML5

Ce projet est un site web simple permettant de publier et d'afficher facilement des PDF hébergés sur la plateforme PubHTML5.

## Fonctionnalités

- Affichage des PDF intégrés via iframe
- Barre latérale pour naviguer entre les différents PDF
- Formulaire pour ajouter facilement de nouveaux PDF
- Sauvegarde des PDF ajoutés dans le stockage local du navigateur

## Comment utiliser

1. Ouvrez le fichier `index.html` dans votre navigateur web
2. Le PDF par défaut s'affichera dans la zone principale
3. Pour ajouter un nouveau PDF :
   - Obtenez l'URL de votre PDF sur PubHTML5 (format: https://online.pubhtml5.com/xxxx/xxxx/)
   - Entrez un titre pour votre PDF dans le champ "Titre"
   - Collez l'URL PubHTML5 dans le champ "URL PubHTML5"
   - Cliquez sur "Ajouter"
4. Cliquez sur un titre dans la barre latérale pour afficher le PDF correspondant

## Structure des fichiers

- `index.html` : Structure principale du site
- `styles.css` : Styles pour l'interface utilisateur
- `script.js` : Fonctionnalités JavaScript pour la gestion des PDF

## Notes importantes

- Ce site fonctionne uniquement avec des PDF hébergés sur la plateforme PubHTML5
- Les PDF ajoutés sont sauvegardés dans le stockage local de votre navigateur
- Pour partager votre bibliothèque, vous devrez héberger ce site sur un serveur web