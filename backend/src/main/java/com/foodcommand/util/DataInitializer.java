package com.foodcommand.util;

import com.foodcommand.model.*;
import com.foodcommand.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    UserRepository userRepository;

    @Autowired
    RestaurantRepository restaurantRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            categoryRepository.save(Category.builder().name("Fast Food").icon("🍔").build());
            categoryRepository.save(Category.builder().name("Pizza").icon("🍕").build());
            categoryRepository.save(Category.builder().name("Africain").icon("🥘").build());
            categoryRepository.save(Category.builder().name("Healthy").icon("🥗").build());
            categoryRepository.save(Category.builder().name("Sushi").icon("🍣").build());
            categoryRepository.save(Category.builder().name("Desserts").icon("🍰").build());
        }

        if (userRepository.count() == 0) {
            // Create Admin
            User admin = User.builder()
                    .email("admin@foodcommand.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Admin User")
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);

            // Create a Restaurant Owner
            User owner = User.builder()
                    .email("owner@pizzeria.com")
                    .password(passwordEncoder.encode("owner123"))
                    .fullName("Mario Rossi")
                    .role(Role.RESTAURANT)
                    .build();
            userRepository.save(owner);

            // Create a Restaurant
            Restaurant pizzaPlace = Restaurant.builder()
                    .name("Pizza Deluxe")
                    .description("The best Italian pizzas in town")
                    .address("123 Pizza Street")
                    .imageUrl("https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop")
                    .rating(4.8)
                    .deliveryTime("20-30 min")
                    .owner(owner)
                    .build();

            // Create Menu Items
            List<MenuItem> menu = new ArrayList<>();
            menu.add(MenuItem.builder()
                    .name("Margherita")
                    .description("Tomato, mozzarella, basil")
                    .price(12.0)
                    .imageUrl("https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?q=80&w=400&auto=format&fit=crop")
                    .category("Pizza")
                    .restaurant(pizzaPlace)
                    .build());
            menu.add(MenuItem.builder()
                    .name("Pepperoni")
                    .description("Tomato, mozzarella, pepperoni")
                    .price(14.5)
                    .imageUrl("https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400&auto=format&fit=crop")
                    .category("Pizza")
                    .restaurant(pizzaPlace)
                    .build());

            pizzaPlace.setMenu(menu);
            restaurantRepository.save(pizzaPlace);

            System.out.println("Demo data initialized!");
        }
    }
}
