package com.foodcommand.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackingUpdate {
    private Long orderId;
    private Double lat;
    private Double lng;
    private String status;
}
