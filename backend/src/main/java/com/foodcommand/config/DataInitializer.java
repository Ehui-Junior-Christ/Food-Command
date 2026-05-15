package com.foodcommand.config;

import com.foodcommand.model.Category;
import com.foodcommand.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private com.foodcommand.repository.CategoryRepository categoryRepository;

    @Autowired
    private com.foodcommand.repository.RestaurantRepository restaurantRepository;

    @Autowired
    private com.foodcommand.repository.MenuItemRepository menuItemRepository;

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            List<Category> categories = Arrays.asList(
                Category.builder().name("Pizza").icon("🍕").build(),
                Category.builder().name("Burger").icon("🍔").build(),
                Category.builder().name("Sushi").icon("🍣").build(),
                Category.builder().name("Africain").icon("🍲").build(),
                Category.builder().name("Desserts").icon("🍰").build(),
                Category.builder().name("Boissons").icon("🥤").build()
            );
            categoryRepository.saveAll(categories);
            System.out.println("Categories seeded successfully!");
        }

        if (restaurantRepository.count() == 0) {
            com.foodcommand.model.Restaurant rest = com.foodcommand.model.Restaurant.builder()
                .name("Burger Palace")
                .description("Les meilleurs burgers gourmets de la ville.")
                .address("Cocody, Abidjan")
                .rating(4.8)
                .imageUrl("https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800")
                .build();
            restaurantRepository.save(rest);

            List<com.foodcommand.model.MenuItem> items = Arrays.asList(
                com.foodcommand.model.MenuItem.builder()
                    .name("Classic Smash")
                    .description("Double steak, cheddar, sauce maison.")
                    .price(4500.0)
                    .imageUrl("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400")
                    .restaurant(rest)
                    .build(),
                com.foodcommand.model.MenuItem.builder()
                    .name("Frites Maison")
                    .description("Croustillantes et dorées.")
                    .price(1500.0)
                    .imageUrl("https://images.unsplash.com/photo-1573082833947-3e93b01c6119?q=80&w=400")
                    .restaurant(rest)
                    .build()
            );
            menuItemRepository.saveAll(items);
            System.out.println("Test restaurant and menu items seeded!");
        }
    }
}
