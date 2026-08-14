package com.poapp.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PurchaseOrderResponse {
    private Long id;
    private String poNumber;
    private String title;
    private String description;
    private String vendorName;
    private BigDecimal amount;
    private Long createdById;
    private String createdByUsername;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public PurchaseOrderResponse() {}

    public PurchaseOrderResponse(Long id, String poNumber, String title, String description, 
                                 String vendorName, BigDecimal amount, Long createdById, 
                                 String createdByUsername, String status, LocalDateTime createdAt, 
                                 LocalDateTime updatedAt) {
        this.id = id;
        this.poNumber = poNumber;
        this.title = title;
        this.description = description;
        this.vendorName = vendorName;
        this.amount = amount;
        this.createdById = createdById;
        this.createdByUsername = createdByUsername;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
