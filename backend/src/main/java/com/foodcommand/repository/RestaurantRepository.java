package com.foodcommand.repository;

import com.foodcommand.model.Restaurant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    @Override
    @EntityGraph(attributePaths = "menu")
    List<Restaurant> findAll();

    @EntityGraph(attributePaths = "menu")
    @Query("""
            select distinct r
            from Restaurant r
            left join r.menu m
            where (:query is null or :query = ''
                or lower(r.name) like lower(concat('%', :query, '%'))
                or lower(coalesce(r.description, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(r.address, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(m.name, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(m.description, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(m.category, '')) like lower(concat('%', :query, '%')))
            and (:location is null or :location = ''
                or lower(coalesce(r.address, '')) like lower(concat('%', :location, '%')))
            """)
    List<Restaurant> search(@Param("query") String query, @Param("location") String location);

    @EntityGraph(attributePaths = "menu")
    java.util.Optional<Restaurant> findByOwnerId(Long ownerId);

    @EntityGraph(attributePaths = "menu")
    java.util.Optional<Restaurant> findById(Long id);
}
