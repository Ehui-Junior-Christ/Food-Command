package com.foodcommand.repository;

import com.foodcommand.model.Order;
import com.foodcommand.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"client", "restaurant"})
    List<Order> findByClient(User client);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"client", "restaurant"})
    List<Order> findByRestaurantId(Long restaurantId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"client", "restaurant"})
    List<Order> findByStatus(String status);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"client", "restaurant"})
    List<Order> findByCourier(User courier);
}
