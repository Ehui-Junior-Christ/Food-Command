package com.foodcommand.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantStatsResponse {
    private long dailyOrders;
    private double dailyRevenue;
    private long totalItems;
    private double averageRating;
}
