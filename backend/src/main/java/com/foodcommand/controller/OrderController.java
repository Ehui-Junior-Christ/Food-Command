package com.foodcommand.controller;

import com.foodcommand.model.Order;
import com.foodcommand.model.Restaurant;
import com.foodcommand.model.User;
import com.foodcommand.repository.OrderRepository;
import com.foodcommand.repository.RestaurantRepository;
import com.foodcommand.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    OrderRepository orderRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RestaurantRepository restaurantRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;
        if (principal instanceof UserDetails) {
            email = ((UserDetails) principal).getUsername();
        } else if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            email = ((org.springframework.security.oauth2.core.user.OAuth2User) principal).getAttribute("email");
        } else {
            throw new RuntimeException("Utilisateur non authentifié");
        }
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    @GetMapping("/my-orders")
    public List<Order> getMyOrders() {
        return orderRepository.findByClient(getCurrentUser());
    }

    @PostMapping
    public Order placeOrder(@RequestBody Order order) {
        User user = getCurrentUser();
        order.setClient(user);
        
        // Priorité à l'adresse fournie dans la commande, sinon celle du profil
        if (order.getDeliveryAddress() == null || order.getDeliveryAddress().trim().isEmpty()) {
            order.setDeliveryAddress(user.getAddress());
        }
        
        order.setStatus("PENDING");
        
        // Validation et récupération du restaurant
        if (order.getRestaurant() != null && order.getRestaurant().getId() != null) {
            com.foodcommand.model.Restaurant restaurant = restaurantRepository.findById(order.getRestaurant().getId())
                    .orElseThrow(() -> new RuntimeException("Restaurant non trouvé"));
            order.setRestaurant(restaurant);
        } else {
            throw new RuntimeException("Le restaurant est obligatoire pour passer une commande");
        }
        
        // Initialisation des coordonnées de destination (simulation si non fournies)
        if (order.getDestinationLat() == null) {
            order.setDestinationLat(5.3484); // Abidjan par défaut
            order.setDestinationLng(-3.9783);
        }
        
        if (order.getItems() != null) {
            order.getItems().forEach(item -> item.setOrder(order));
        }
        
        Order savedOrder = orderRepository.save(order);

        // Notification WebSocket pour le restaurant
        messagingTemplate.convertAndSend("/topic/orders/" + savedOrder.getRestaurant().getId(), savedOrder);

        // SYSTÈME DE POINTS : Si > 10 commandes dans le mois, +100 points
        java.time.LocalDateTime oneMonthAgo = java.time.LocalDateTime.now().minusMonths(1);
        long ordersInMonth = orderRepository.findByClient(user).stream()
                .filter(o -> o.getOrderDate() != null && o.getOrderDate().isAfter(oneMonthAgo))
                .count();

        if (ordersInMonth >= 10) {
            user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + 100);
            userRepository.save(user);
        }
        
        return savedOrder;
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public List<Order> getOrdersByRestaurant(@PathVariable Long restaurantId) {
        return orderRepository.findByRestaurantId(restaurantId);
    }

    @PutMapping("/{id}/status")
    public Order updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        Order order = orderRepository.findById(id).get();
        order.setStatus(status);
        Order saved = orderRepository.save(order);
        
        // Notification WebSocket
        messagingTemplate.convertAndSend("/topic/order/" + id, saved);
        
        // Si la commande est prête pour livraison, on notifie les livreurs
        if ("ACCEPTED".equals(status)) {
            messagingTemplate.convertAndSend("/topic/available-orders", saved);
        }
        
        return saved;
    }

    @GetMapping("/available")
    public List<Order> getAvailableOrders() {
        // Pour les tests, on affiche les commandes en attente ET acceptées
        List<Order> orders = orderRepository.findByStatus("ACCEPTED");
        orders.addAll(orderRepository.findByStatus("PENDING"));
        return orders;
    }

    @GetMapping("/my-deliveries")
    public List<Order> getMyDeliveries() {
        return orderRepository.findByCourier(getCurrentUser()).stream()
                .filter(o -> "OUT_FOR_DELIVERY".equals(o.getStatus()) || "DELIVERED".equals(o.getStatus()))
                .toList();
    }

    @PostMapping("/{id}/accept")
    public Order acceptOrder(@PathVariable Long id) {
        User courier = getCurrentUser();
        
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        order.setCourier(courier);
        order.setStatus("OUT_FOR_DELIVERY");
        Order saved = orderRepository.save(order);
        
        // Notification WebSocket
        messagingTemplate.convertAndSend("/topic/order/" + id, saved);
        
        return saved;
    }

    @PostMapping("/{id}/cancel")
    public Order cancelOrder(@PathVariable Long id) {
        User user = getCurrentUser();
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        if (!order.getClient().getId().equals(user.getId())) throw new RuntimeException("Non autorisé");
        if (!"PENDING".equals(order.getStatus())) throw new RuntimeException("Trop tard pour annuler");
        order.setStatus("CANCELLED");
        Order saved = orderRepository.save(order);
        messagingTemplate.convertAndSend("/topic/order/" + id, saved);
        return saved;
    }

    @PostMapping("/{id}/refuse")
    public Order refuseOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        if ("OUT_FOR_DELIVERY".equals(order.getStatus())) {
            order.setCourier(null);
            order.setStatus("ACCEPTED");
            Order saved = orderRepository.save(order);
            messagingTemplate.convertAndSend("/topic/available-orders", saved);
            messagingTemplate.convertAndSend("/topic/order/" + id, saved);
            return saved;
        }
        return order;
    }
}
