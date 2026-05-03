package com.foodcommand.controller;

import com.foodcommand.model.MenuItem;
import com.foodcommand.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/menu-items")
public class MenuItemController {
    @Autowired
    MenuItemRepository menuItemRepository;

    @Autowired
    com.foodcommand.repository.RestaurantRepository restaurantRepository;

    @GetMapping("/search")
    public List<MenuItem> search(@RequestParam String query) {
        if (query.trim().length() < 2) return List.of();
        return menuItemRepository.search(query.trim());
    }

    @GetMapping("/restaurant/{restaurantId}")
    public List<MenuItem> getByRestaurant(@PathVariable Long restaurantId) {
        return menuItemRepository.findByRestaurantId(restaurantId);
    }

    @PostMapping
    public MenuItem create(@RequestBody MenuItem item, @RequestParam Long restaurantId) {
        com.foodcommand.model.Restaurant restaurant = restaurantRepository.findById(restaurantId).get();
        item.setRestaurant(restaurant);
        return menuItemRepository.save(item);
    }

    @PutMapping("/{id}")
    public MenuItem update(@PathVariable Long id, @RequestBody MenuItem itemDetails) {
        MenuItem item = menuItemRepository.findById(id).get();
        item.setName(itemDetails.getName());
        item.setDescription(itemDetails.getDescription());
        item.setPrice(itemDetails.getPrice());
        item.setCategory(itemDetails.getCategory());
        item.setImageUrl(itemDetails.getImageUrl());
        return menuItemRepository.save(item);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
    }
}
