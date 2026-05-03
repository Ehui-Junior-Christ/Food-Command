package com.foodcommand.repository;

import com.foodcommand.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    @Query("SELECT m FROM MenuItem m WHERE LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<MenuItem> search(@Param("query") String query);

    List<MenuItem> findByRestaurantId(Long restaurantId);
    long countByRestaurantId(Long restaurantId);
}
