package com.foodcommand.controller;

import com.foodcommand.model.User;
import com.foodcommand.model.UserAddress;
import com.foodcommand.repository.UserAddressRepository;
import com.foodcommand.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/addresses")
public class AddressController {
    @Autowired
    UserAddressRepository addressRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping
    public List<UserAddress> getMyAddresses() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return addressRepository.findByUser(user);
    }

    @PostMapping
    public UserAddress addAddress(@RequestBody UserAddress address) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        
        List<UserAddress> existing = addressRepository.findByUser(user);
        if (existing.size() >= 2) {
            throw new RuntimeException("Limite de 2 adresses atteinte.");
        }

        address.setUser(user);
        return addressRepository.save(address);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id) {
        addressRepository.deleteById(id);
    }
}
