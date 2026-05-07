package com.foodcommand.controller;

import com.foodcommand.model.Order;
import com.foodcommand.model.User;
import com.foodcommand.repository.OrderRepository;
import com.foodcommand.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/orders/available")
    @PreAuthorize("hasRole('DELIVERY') or hasRole('COURIER')")
    public List<Order> getAvailableOrders() {
        // Les commandes prêtes à être livrées sont celles avec le statut 'ACCEPTED' ou 'PREPARING' ou 'READY'
        // Pour cet exemple, on considère que 'PREPARING' ou un nouveau statut 'READY' est le déclencheur.
        // On va utiliser 'ACCEPTED' pour l'instant comme dans le OrderController existant, 
        // mais le plus logique serait 'PREPARING' terminé.
        return orderRepository.findByStatus("ACCEPTED");
    }

    @GetMapping("/orders/my-deliveries")
    @PreAuthorize("hasRole('DELIVERY') or hasRole('COURIER')")
    public List<Order> getMyDeliveries() {
        User courier = getCurrentUser();
        return orderRepository.findByCourier(courier);
    }

    @PostMapping("/orders/{id}/accept")
    @PreAuthorize("hasRole('DELIVERY') or hasRole('COURIER')")
    public Order acceptOrder(@PathVariable Long id) {
        User courier = getCurrentUser();
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        
        if (order.getCourier() != null) {
            throw new RuntimeException("Cette commande est déjà prise par un autre livreur");
        }

        order.setCourier(courier);
        order.setStatus("OUT_FOR_DELIVERY");
        Order saved = orderRepository.save(order);
        
        // Notification WebSocket pour le client
        messagingTemplate.convertAndSend("/topic/order/" + id, saved);
        
        return saved;
    }

    @PostMapping("/orders/{id}/deliver")
    @PreAuthorize("hasRole('DELIVERY') or hasRole('COURIER')")
    public Order markAsDelivered(@PathVariable Long id) {
        User courier = getCurrentUser();
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        
        if (!order.getCourier().getId().equals(courier.getId())) {
            throw new RuntimeException("Vous n'êtes pas le livreur assigné à cette commande");
        }

        order.setStatus("DELIVERED");
        Order saved = orderRepository.save(order);
        
        // Notification WebSocket pour le client
        messagingTemplate.convertAndSend("/topic/order/" + id, saved);
        
        return saved;
    }

    @PostMapping("/orders/{id}/location")
    @PreAuthorize("hasRole('DELIVERY') or hasRole('COURIER')")
    public void updateLocation(@PathVariable Long id, @RequestParam Double lat, @RequestParam Double lng) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        order.setCourierLat(lat);
        order.setCourierLng(lng);
        orderRepository.save(order);
        
        // On envoie juste les coordonnées au client pour fluidité
        messagingTemplate.convertAndSend("/topic/order/" + id, order);
    }
}
