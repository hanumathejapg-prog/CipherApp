# syntax=docker/dockerfile:1

# Build stage
FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /app

# Copy Maven descriptor first for better layer caching
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn -B clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]