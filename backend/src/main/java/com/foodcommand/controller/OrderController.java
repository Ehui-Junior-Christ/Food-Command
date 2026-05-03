package com.foodcommand.controller;

import com.foodcommand.model.Order;
import com.foodcommand.model.User;
import com.foodcommand.repository.OrderRepository;
import com.foodcommand.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        
        // Ensure bidirectional relationship is set for JPA
        if (order.getItems() != null) {
            order.getItems().forEach(item -> item.setOrder(order));
        }
        
        return orderRepository.save(order);
    }
}
