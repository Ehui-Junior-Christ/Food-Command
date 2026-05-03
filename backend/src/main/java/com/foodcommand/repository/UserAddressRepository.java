package com.foodcommand.repository;

import com.foodcommand.model.User;
import com.foodcommand.model.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUser(User user);
}
