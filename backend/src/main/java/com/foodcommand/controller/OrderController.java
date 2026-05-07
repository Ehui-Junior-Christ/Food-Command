package com.foodcommand.controller;

import com.foodcommand.model.Order;
import com.foodcommand.model.User;
import com.foodcommand.repository.OrderRepository;
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
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/my-orders")
    public List<Order> getMyOrders() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).get();
        return orderRepository.findByClient(user);
    }

    @PostMapping
    public Order placeOrder(@RequestBody Order order) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername()).get();
        order.setClient(user);
        order.setStatus("PENDING");
        
        if (order.getItems() != null) {
            order.getItems().forEach(item -> item.setOrder(order));
        }
        
        Order savedOrder = orderRepository.save(order);

        // Notification WebSocket pour le restaurant
        if (savedOrder.getRestaurant() != null) {
            messagingTemplate.convertAndSend("/topic/orders/" + savedOrder.getRestaurant().getId(), savedOrder);
        }

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
        return orderRepository.findByStatus("ACCEPTED");
    }

    @PostMapping("/{id}/accept")
    public Order acceptOrder(@PathVariable Long id) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User courier = userRepository.findByEmail(userDetails.getUsername()).get();
        
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        order.setCourier(courier);
        order.setStatus("OUT_FOR_DELIVERY");
        Order saved = orderRepository.save(order);
        
        // Notification WebSocket
        messagingTemplate.convertAndSend("/topic/order/" + id, saved);
        
        return saved;
    }
}
