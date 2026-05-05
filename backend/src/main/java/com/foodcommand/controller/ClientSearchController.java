package com.foodcommand.controller;

import com.foodcommand.dto.SearchResultDto;
import com.foodcommand.model.MenuItem;
import com.foodcommand.model.Restaurant;
import com.foodcommand.repository.MenuItemRepository;
import com.foodcommand.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/client")
public class ClientSearchController {

    @Autowired
    RestaurantRepository restaurantRepository;

    @Autowired
    MenuItemRepository menuItemRepository;

    @GetMapping("/search")
    public List<SearchResultDto> smartSearch(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        String query = keyword.trim().toLowerCase();
        List<SearchResultDto> results = new ArrayList<>();

        // 1. Recherche Restaurants
        List<Restaurant> restaurants = restaurantRepository.findAll().stream()
                .filter(r -> r.getName().toLowerCase().contains(query) || 
                            (r.getDescription() != null && r.getDescription().toLowerCase().contains(query)))
                .collect(Collectors.toList());

        for (Restaurant r : restaurants) {
            Double distance = null;
            if (latitude != null && longitude != null && r.getLatitude() != null && r.getLongitude() != null) {
                distance = calculateDistance(latitude, longitude, r.getLatitude(), r.getLongitude());
            }
            results.add(SearchResultDto.builder()
                    .type("RESTAURANT")
                    .id(r.getId())
                    .name(r.getName())
                    .description(r.getDescription())
                    .imageUrl(r.getImageUrl())
                    .rating(r.getRating())
                    .distance(distance)
                    .build());
        }

        // 2. Recherche Plats (Menu Items)
        List<MenuItem> items = menuItemRepository.findAll().stream()
                .filter(i -> i.getName().toLowerCase().contains(query) || 
                            (i.getDescription() != null && i.getDescription().toLowerCase().contains(query)))
                .collect(Collectors.toList());

        for (MenuItem i : items) {
            Double distance = null;
            Restaurant r = i.getRestaurant();
            if (r != null && latitude != null && longitude != null && r.getLatitude() != null && r.getLongitude() != null) {
                distance = calculateDistance(latitude, longitude, r.getLatitude(), r.getLongitude());
            }
            results.add(SearchResultDto.builder()
                    .type("PLATE")
                    .id(i.getId())
                    .name(i.getName())
                    .description(i.getDescription())
                    .imageUrl(i.getImageUrl())
                    .price(i.getPrice())
                    .category(i.getCategory())
                    .restaurantName(r != null ? r.getName() : null)
                    .restaurantId(r != null ? r.getId() : null)
                    .distance(distance)
                    .build());
        }

        // 3. Tri par distance (si disponible) puis par pertinence (nom contient le mot clé au début)
        return results.stream()
                .sorted((a, b) -> {
                    // Priorité à la distance si elle existe
                    if (a.getDistance() != null && b.getDistance() != null) {
                        return a.getDistance().compareTo(b.getDistance());
                    }
                    if (a.getDistance() != null) return -1;
                    if (b.getDistance() != null) return 1;
                    
                    // Sinon par nom
                    return a.getName().compareToIgnoreCase(b.getName());
                })
                .collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double theta = lon1 - lon2;
        double dist = Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) + 
                      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(deg2rad(theta));
        dist = Math.acos(dist);
        dist = rad2deg(dist);
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344; // Convertir en kilomètres
        return (double) Math.round(dist * 10) / 10; // Arrondi à 1 décimale
    }

    private double deg2rad(double deg) {
        return (deg * Math.PI / 180.0);
    }

    private double rad2deg(double rad) {
        return (rad * 180.0 / Math.PI);
    }
}
