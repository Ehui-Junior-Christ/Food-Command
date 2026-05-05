package com.foodcommand.controller;

import com.foodcommand.model.Order;
import com.foodcommand.model.User;
import com.foodcommand.repository.OrderRepository;
import com.foodcommand.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/client/orders")
public class ClientOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findByClient(getCurrentUser());
    }

    @GetMapping("/current")
    public List<Order> getCurrentOrders() {
        List<String> activeStatuses = Arrays.asList("PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY");
        return orderRepository.findByClient(getCurrentUser()).stream()
                .filter(order -> activeStatuses.contains(order.getStatus()))
                .collect(Collectors.toList());
    }
}
