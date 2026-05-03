package com.foodcommand.repository;

import com.foodcommand.model.Order;
import com.foodcommand.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByClient(User client);
}
