package com.poapp.controller;

import com.poapp.dto.ApprovalRequest;
import com.poapp.dto.PurchaseOrderRequest;
import com.poapp.dto.PurchaseOrderResponse;
import com.poapp.dto.PagedResponse;
import com.poapp.service.PurchaseOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    public PurchaseOrderController(PurchaseOrderService poService) {
        this.poService = poService;
    }

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private ResponseEntity<Map<String, String>> buildErrorResponse(Exception e, HttpStatus status) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.status(status).body(error);
    }

    @PostMapping
    public ResponseEntity<?> createPurchaseOrder(@RequestBody PurchaseOrderRequest request) {
        try {
            PurchaseOrderResponse response = poService.createPurchaseOrder(request, getCurrentUserEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping
    public ResponseEntity<?> getPurchaseOrders(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", defaultValue = "ALL") String status,
            @RequestParam(name = "search", defaultValue = "") String search) {
        try {
            PagedResponse<PurchaseOrderResponse> response = poService.getPurchaseOrdersPaginated(
                    getCurrentUserEmail(), page, size, status, search
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingPurchaseOrders() {
        try {
            List<PurchaseOrderResponse> response = poService.getPendingPurchaseOrders(getCurrentUserEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseOrderById(@PathVariable Long id) {
        try {
            PurchaseOrderResponse response = poService.getPurchaseOrderById(id, getCurrentUserEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchaseOrder(@PathVariable Long id, @RequestBody PurchaseOrderRequest request) {
        try {
            PurchaseOrderResponse response = poService.updatePurchaseOrder(id, request, getCurrentUserEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchaseOrder(@PathVariable Long id) {
        try {
            poService.deletePurchaseOrder(id, getCurrentUserEmail());
            Map<String, String> success = new HashMap<>();
            success.put("message", "Purchase Order deleted successfully.");
            return ResponseEntity.ok(success);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitPurchaseOrder(@PathVariable Long id) {
        try {
            PurchaseOrderResponse response = poService.submitPurchaseOrder(id, getCurrentUserEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approvePurchaseOrder(@PathVariable Long id, @RequestBody(required = false) ApprovalRequest request) {
        try {
            PurchaseOrderResponse response = poService.approvePurchaseOrder(id, request, getCurrentUserEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectPurchaseOrder(@PathVariable Long id, @RequestBody ApprovalRequest request) {
        try {
            PurchaseOrderResponse response = poService.rejectPurchaseOrder(id, request, getCurrentUserEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return buildErrorResponse(e, HttpStatus.BAD_REQUEST);
        }
    }
}
