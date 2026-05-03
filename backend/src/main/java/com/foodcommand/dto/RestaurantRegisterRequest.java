package com.foodcommand.dto;

import lombok.Data;

@Data
public class RestaurantRegisterRequest {
    private String name;
    private String address;
    private String cuisineType;
    private String ownerName;
    private String email;
    private String phone;
    private String password;
}
