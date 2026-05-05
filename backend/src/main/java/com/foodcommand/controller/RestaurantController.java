package com.foodcommand.controller;

import com.foodcommand.dto.RestaurantRegisterRequest;
import com.foodcommand.dto.RestaurantStatsResponse;
import com.foodcommand.model.Order;
import com.foodcommand.model.Restaurant;
import com.foodcommand.model.Role;
import com.foodcommand.model.User;
import com.foodcommand.repository.MenuItemRepository;
import com.foodcommand.repository.OrderRepository;
import com.foodcommand.repository.RestaurantRepository;
import com.foodcommand.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    @Autowired
    RestaurantRepository restaurantRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    MenuItemRepository menuItemRepository;

    @Autowired
    PasswordEncoder encoder;

    @GetMapping
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    @GetMapping("/search")
    public List<Restaurant> searchRestaurants(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "") String location) {
        return restaurantRepository.search(query.trim(), location.trim());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@PathVariable Long id) {
        return restaurantRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<Restaurant> getByOwner(@PathVariable Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Restaurant> createRestaurant(@RequestBody Restaurant restaurant) {
        org.springframework.security.core.userdetails.UserDetails userDetails = 
            (org.springframework.security.core.userdetails.UserDetails) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).get();
        
        restaurant.setOwner(user);
        if (restaurant.getRating() == null) restaurant.setRating(4.0);
        
        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerRestaurant(@RequestBody RestaurantRegisterRequest request) {
        try {
            User user;
            String rawPassword = request.getPassword();
            if (rawPassword == null || rawPassword.trim().isEmpty()) {
                rawPassword = "password123";
            } else {
                rawPassword = rawPassword.trim();
            }

            String email = request.getEmail().trim().toLowerCase();

            if (userRepository.existsByEmail(email)) {
                user = userRepository.findByEmail(email).get();
                user.setRole(Role.RESTAURANT);
                user.setPassword(encoder.encode(rawPassword));
                if (request.getOwnerName() != null) user.setFullName(request.getOwnerName().trim());
                if (request.getPhone() != null) user.setPhone(request.getPhone().trim());
            } else {
                user = User.builder()
                        .email(email)
                        .password(encoder.encode(rawPassword))
                        .fullName(request.getOwnerName() != null ? request.getOwnerName().trim() : "Propriétaire")
                        .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                        .role(Role.RESTAURANT)
                        .loyaltyPoints(0)
                        .build();
            }

            user = userRepository.save(user);

            // 2. Créer ou mettre à jour le restaurant
            Restaurant restaurant = restaurantRepository.findByOwnerId(user.getId()).orElse(new Restaurant());
            restaurant.setName(request.getName());
            restaurant.setAddress(request.getAddress());
            restaurant.setDescription(request.getCuisineType());
            restaurant.setOwner(user);
            
            if (restaurant.getRating() == null) restaurant.setRating(4.0);
            if (restaurant.getDeliveryTime() == null) restaurant.setDeliveryTime("30-45 min");

            restaurantRepository.save(restaurant);
            return ResponseEntity.ok("Restaurant enregistré avec succès !");
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur lors de l'enregistrement: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(@PathVariable Long id, @RequestBody Restaurant restaurantDetails) {
        return restaurantRepository.findById(id)
                .map(restaurant -> {
                    if (restaurantDetails.getName() != null) restaurant.setName(restaurantDetails.getName());
                    if (restaurantDetails.getAddress() != null) restaurant.setAddress(restaurantDetails.getAddress());
                    if (restaurantDetails.getDescription() != null) restaurant.setDescription(restaurantDetails.getDescription());
                    if (restaurantDetails.getImageUrl() != null) restaurant.setImageUrl(restaurantDetails.getImageUrl());
                    return ResponseEntity.ok(restaurantRepository.save(restaurant));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<RestaurantStatsResponse> getStats(@PathVariable Long id) {
        return restaurantRepository.findById(id)
                .map(restaurant -> {
                    List<Order> orders = orderRepository.findByRestaurantId(id);
                    double revenue = orders.stream().mapToDouble(Order::getTotalAmount).sum();
                    long menuCount = menuItemRepository.countByRestaurantId(id);
                    
                    return ResponseEntity.ok(RestaurantStatsResponse.builder()
                            .dailyOrders(orders.size())
                            .dailyRevenue(revenue)
                            .totalItems(menuCount)
                            .averageRating(restaurant.getRating() != null ? restaurant.getRating() : 4.5)
                            .build());
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
