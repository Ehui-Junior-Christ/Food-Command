package com.foodcommand.controller;

import com.foodcommand.model.Restaurant;
import com.foodcommand.model.User;
import com.foodcommand.model.Order;
import com.foodcommand.repository.RestaurantRepository;
import com.foodcommand.repository.UserRepository;
import com.foodcommand.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    RestaurantRepository restaurantRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    OrderRepository orderRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getGlobalStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRestaurants", restaurantRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalRevenue", orderRepository.findAll().stream().mapToDouble(Order::getTotalAmount).sum());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/restaurants")
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    @PostMapping("/restaurants")
    public Restaurant createRestaurant(@RequestBody Restaurant restaurant) {
        return restaurantRepository.save(restaurant);
    }

    @PutMapping("/restaurants/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(@PathVariable Long id, @RequestBody Restaurant details) {
        return restaurantRepository.findById(id)
                .map(restaurant -> {
                    restaurant.setName(details.getName());
                    restaurant.setAddress(details.getAddress());
                    restaurant.setDescription(details.getDescription());
                    restaurant.setImageUrl(details.getImageUrl());
                    return ResponseEntity.ok(restaurantRepository.save(restaurant));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/restaurants/{id}")
    public ResponseEntity<?> deleteRestaurant(@PathVariable Long id) {
        return restaurantRepository.findById(id)
                .map(restaurant -> {
                    restaurantRepository.delete(restaurant);
                    return ResponseEntity.ok().build() ;
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
