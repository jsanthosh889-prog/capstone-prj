package com.poapp.dto;

import java.math.BigDecimal;

public class PurchaseOrderRequest {
    private String title;
    private String description;
    private String vendorName;
    private BigDecimal amount;

    // Constructors
    public PurchaseOrderRequest() {}

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
