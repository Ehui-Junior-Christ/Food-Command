package com.foodcommand.dto;

import com.foodcommand.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String role;
    private String profileImageUrl;
    private Integer loyaltyPoints;

    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getProfileImageUrl(),
                user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0
        );
    }
}
