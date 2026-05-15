package com.foodcommand.controller;

import com.foodcommand.dto.CourierLocationUpdate;
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

    /**
     * Reçoit la position du livreur et la diffuse au client via /topic/order/{id}
     */
    @MessageMapping("/update-location")
    public void updateLocation(@Payload CourierLocationUpdate update) {
        // Optionnel : Mettre à jour la base de données pour persister la dernière position connue
        orderRepository.findById(update.getOrderId()).ifPresent(order -> {
            order.setCourierLat(update.getLat());
            order.setCourierLng(update.getLng());
            if (update.getStatus() != null) {
                order.setStatus(update.getStatus());
            }
            orderRepository.save(order);
        });

        // Diffuser la mise à jour à tous les abonnés de cette commande (Client + Restaurant)
        messagingTemplate.convertAndSend("/topic/order/" + update.getOrderId(), update);
    }
}
