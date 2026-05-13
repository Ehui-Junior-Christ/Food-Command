# Étape 1 : Construction (Build)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# On copie tout le projet (backend + frontend)
COPY . .

# On compile uniquement le backend
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Étape 2 : Exécution
FROM eclipse-temurin:21-jre
WORKDIR /app

# On récupère le JAR compilé
COPY --from=build /app/backend/target/*.jar app.jar

# On récupère tous les fichiers frontend (pages, css, js, assets, index.html)
COPY --from=build /app/index.html ./index.html
COPY --from=build /app/css ./css
COPY --from=build /app/js ./js
COPY --from=build /app/assets ./assets
COPY --from=build /app/pages ./pages

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
