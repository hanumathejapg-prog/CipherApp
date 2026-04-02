package com.cipher;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.nio.file.Paths;

@SpringBootApplication
public class CipherBackendApplication {

    public static void main(String[] args) {
        // Load environment variables from .env file in parent directory
        String envPath = Paths.get("../.env").toAbsolutePath().toString();
        Dotenv dotenv = Dotenv.configure()
                .directory(new java.io.File("..").getAbsolutePath())
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));
        
        SpringApplication.run(CipherBackendApplication.class, args);
    }
}
