package com.poapp.dto;

public class ApprovalRequest {
    private String comments;

    // Constructors
    public ApprovalRequest() {}

    public ApprovalRequest(String comments) {
        this.comments = comments;
    }

    // Getters and Setters
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
}
