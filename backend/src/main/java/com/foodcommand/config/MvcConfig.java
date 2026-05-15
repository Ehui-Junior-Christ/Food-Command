package com.foodcommand.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Auto-detect root: when running from IDE, CWD is Food-Command/ (has index.html)
        // When running from Maven, CWD is Food-Command/backend/ (need ../)
        Path currentDir = Paths.get(".").toAbsolutePath().normalize();
        Path rootPath;
        
        if (Files.exists(currentDir.resolve("index.html"))) {
            // CWD is the project root (IDE mode)
            rootPath = currentDir;
        } else {
            // CWD is the backend folder (Maven mode), go up one level
            rootPath = currentDir.getParent();
        }
        
        String rootLocation = "file:" + rootPath.toString().replace("\\", "/") + "/";
        System.out.println("[MvcConfig] Serving static files from: " + rootLocation);

        registry.addResourceHandler("/**")
                .addResourceLocations(rootLocation)
                .setCachePeriod(0);
    }
}
