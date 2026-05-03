# 🍔 Food-Command Backend - Guide Récapitulatif

Ce document contient toutes les informations nécessaires pour comprendre, faire fonctionner et déployer le backend de votre application **Food-Command**.

## 🏗️ Structure du Projet
Le projet est construit avec **Spring Boot 3** et suit une architecture standard :

*   `src/main/java/com/foodcommand/`
    *   `controller/` : Gère les requêtes HTTP (les points d'entrée de l'API).
    *   `model/` : Définit les objets de la base de données (`User`, `Restaurant`, `Order`, etc.).
    *   `repository/` : Interface pour communiquer avec la base de données (JPA).
    *   `security/` : Configuration de la sécurité et gestion des tokens **JWT**.
    *   `dto/` : Objets simples pour les échanges de données (ex: Requête de connexion).
    *   `util/` : Outils divers comme le `DataInitializer` pour les données de test.

## 🚀 Lancement Local
1.  **Prérequis** : Avoir Java 21 et MySQL installés.
2.  **Base de données** : Créez une DB nommée `food_command` dans MySQL.
3.  **Lancer** :
    ```powershell
    cd backend
    mvn spring-boot:run
    ```

## 🧪 Tester l'API (Swagger)
Une fois le serveur lancé, accédez à l'interface de test interactive :
👉 [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

### Comptes de Test par défaut :
| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Admin** | `admin@foodcommand.com` | `admin123` |
| **Restaurateur** | `owner@pizzeria.com` | `owner123` |

## 🔑 Sécurité & JWT
L'application utilise des tokens **JWT**. 
1.  Connectez-vous via `/api/auth/signin`.
2.  Récupérez le `token`.
3.  Pour les requêtes protégées, ajoutez le header : `Authorization: Bearer <votre_token>`.

## 🌐 Déploiement (Cloud Ready)
L'application est prête à être déployée. Vous devez configurer ces variables d'environnement sur votre hébergeur :
*   `SPRING_DATASOURCE_URL` : URL JDBC de votre base en ligne.
*   `SPRING_DATASOURCE_USERNAME` : Utilisateur DB.
*   `SPRING_DATASOURCE_PASSWORD` : Mot de passe DB.
*   `APP_JWT_SECRET` : Une longue phrase secrète aléatoire.

## 🛠️ Commandes Utiles
*   **Nettoyer et compiler** : `mvn clean install`
*   **Générer le JAR de prod** : `mvn clean package -DskipTests`
*   **Lancer les tests** : `mvn test`

---
*Créé par Antigravity pour Food-Command.*
