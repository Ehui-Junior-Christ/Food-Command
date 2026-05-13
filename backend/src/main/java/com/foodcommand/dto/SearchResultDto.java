package com.foodcommand.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultDto {
    private String type; // "RESTAURANT" or "PLATE"
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private Double rating;
    private Double distance;
    private String restaurantName;
    private Long restaurantId;
    private Double price;
    private String category;
    private String address;
}
