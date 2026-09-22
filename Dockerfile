# Stage 1: Build Spring Boot application with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy project files
COPY . .

# Build jar with frontend embedded
RUN mvn clean package -DskipTests -f backend/pom.xml

# Stage 2: Lean JRE runtime
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy executable jar
COPY --from=build /app/backend/target/po-approval-system-0.0.1-SNAPSHOT.jar app.jar

# Ensure local database directory exists
RUN mkdir -p database

# Default PORT (Render overrides this automatically)
ENV PORT=8082
EXPOSE 8082

# Run application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
