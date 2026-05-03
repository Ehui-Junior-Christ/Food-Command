package com.foodcommand.controller;

import com.foodcommand.dto.TrackingUpdate;
import com.foodcommand.model.Order;
import com.foodcommand.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class TrackingController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private OrderRepository orderRepository;

    @MessageMapping("/update-location")
    public void updateLocation(@Payload TrackingUpdate update) {
        // Mettre à jour l'ordre dans la base de données (optionnel pour la performance, mais mieux pour la persistance)
        Order order = orderRepository.findById(update.getOrderId()).orElse(null);
        if (order != null) {
            if (update.getLat() != null) order.setCourierLat(update.getLat());
            if (update.getLng() != null) order.setCourierLng(update.getLng());
            if (update.getStatus() != null) order.setStatus(update.getStatus());
            orderRepository.save(order);
        }

        // Diffuser la mise à jour aux abonnés de cet ordre
        messagingTemplate.convertAndSend("/topic/order/" + update.getOrderId(), update);
    }
}
