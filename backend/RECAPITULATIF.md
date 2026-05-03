# 📒 Récapitulatif : Création du Backend Food-Command

Voici un résumé complet de toutes les étapes que nous avons accomplies pour créer votre backend Spring Boot.

## 1. Création du Projet (Fondation)
Nous avons initialisé un projet **Spring Boot 3.2.5** avec les dépendances suivantes :
- **Spring Web** : Pour créer les APIs REST.
- **Spring Data JPA** : Pour la liaison avec la base de données.
- **MySQL Driver** : Pour communiquer avec MySQL (Aiven).
- **Spring Security & JWT** : Pour sécuriser l'application avec des jetons de connexion.
- **Lombok** : Pour simplifier le code (génération automatique des getters/setters).
- **Swagger (OpenAPI)** : Pour tester les APIs via une interface web.

## 2. Architecture des Données (Models)
Nous avons créé les "objets" qui seront stockés en base de données :
- **User** : Gère les utilisateurs (Clients, Restaurateurs, Admins).
- **Restaurant** : Gère les informations des restaurants.
- **MenuItem** : Gère les plats des menus.
- **Order** : Gère les commandes passées par les clients.
- **Role** : Une énumération pour définir les droits (ADMIN, CLIENT, etc.).

## 3. Sécurité et Authentification (JWT)
C'est la partie la plus complexe que nous avons mise en place :
- **JwtUtils** : Génère et vérifie les jetons (tokens) de sécurité.
- **WebSecurityConfig** : Définit quelles pages sont publiques (ex: Inscription) et lesquelles nécessitent d'être connecté.
- **AuthTokenFilter** : Vérifie le token à chaque requête envoyée par l'utilisateur.

## 4. Points d'entrée (Controllers)
Nous avons créé les routes pour votre application :
- `/api/auth/signup` : Pour créer un nouveau compte.
- `/api/auth/signin` : Pour se connecter et recevoir un token.
- `/api/restaurants` : Pour lister les restaurants et leurs menus.
- `/api/orders` : Pour passer et consulter des commandes.

## 5. Connexion à la Base de Données (Cloud)
Nous avons configuré le fichier `application.properties` pour qu'il se connecte à votre base de données **Aiven** :
- Utilisation du protocole **JDBC**.
- Activation du mode **SSL** (`ssl-mode=REQUIRED`) car Aiven l'exige pour la sécurité.
- Les tables sont créées automatiquement au démarrage grâce à `spring.jpa.hibernate.ddl-auto=update`.

## 6. Données de Test (Auto-Fill)
Nous avons ajouté un `DataInitializer` qui remplit votre base de données vide avec un restaurant exemple ("Pizza Deluxe") et des utilisateurs de test dès le premier lancement.

---

### 🚀 Comment continuer ?
1. **Lancer** : `mvn spring-boot:run`
2. **Tester** : Allez sur `http://localhost:8080/swagger-ui/index.html`
3. **Postman** : Importez le lien `http://localhost:8080/v3/api-docs` dans Postman pour avoir toutes les requêtes prêtes.

*Ce fichier sert de mémoire pour votre projet. Gardez-le précieusement !*
