package com.poapp.service;

import com.poapp.dto.ApprovalRequest;
import com.poapp.dto.PurchaseOrderRequest;
import com.poapp.dto.PurchaseOrderResponse;
import com.poapp.entity.ApprovalHistory;
import com.poapp.entity.PurchaseOrder;
import com.poapp.entity.User;
import com.poapp.exception.ResourceNotFoundException;
import com.poapp.repository.ApprovalHistoryRepository;
import com.poapp.repository.PurchaseOrderRepository;
import com.poapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.poapp.dto.PagedResponse;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final ApprovalHistoryRepository approvalRepository;
    private final UserRepository userRepository;

    public PurchaseOrderService(PurchaseOrderRepository poRepository, 
                                ApprovalHistoryRepository approvalRepository, 
                                UserRepository userRepository) {
        this.poRepository = poRepository;
        this.approvalRepository = approvalRepository;
        this.userRepository = userRepository;
    }

    private PurchaseOrderResponse mapToResponse(PurchaseOrder po) {
        return new PurchaseOrderResponse(
                po.getId(),
                po.getPoNumber(),
                po.getTitle(),
                po.getDescription(),
                po.getVendorName(),
                po.getAmount(),
                po.getCreatedBy().getId(),
                po.getCreatedBy().getName(),
                po.getStatus(),
                po.getCreatedAt(),
                po.getUpdatedAt()
        );
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getRole().equals("REQUESTER") && !user.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Only Requesters or Admins can create Purchase Orders.");
        }

        if (request.getTitle() == null || request.getTitle().trim().isEmpty() ||
            request.getVendorName() == null || request.getVendorName().trim().isEmpty() ||
            request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Title, Vendor Name, and valid Amount are required.");
        }

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        po.setTitle(request.getTitle());
        po.setDescription(request.getDescription());
        po.setVendorName(request.getVendorName());
        po.setAmount(request.getAmount());
        po.setCreatedBy(user);
        po.setStatus("DRAFT");

        PurchaseOrder savedPo = poRepository.save(po);
        return mapToResponse(savedPo);
    }

    public List<PurchaseOrderResponse> getPurchaseOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<PurchaseOrder> pos;
        if (user.getRole().equals("REQUESTER")) {
            pos = poRepository.findByCreatedBy(user);
        } else {
            // Approvers & Admins see all POs (or we can return all to display on dashboard/approval list)
            pos = poRepository.findAll();
        }

        return pos.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PagedResponse<PurchaseOrderResponse> getPurchaseOrdersPaginated(
            String userEmail, int page, int size, String status, String search) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Long filterUserId = null;
        if (user.getRole().equals("REQUESTER")) {
            filterUserId = user.getId();
        }

        String filterStatus = (status == null || status.equalsIgnoreCase("ALL")) ? null : status.toUpperCase();
        String searchText = (search == null || search.trim().isEmpty()) ? null : search.trim();

        Pageable pageable = PageRequest.of(page, size);
        Page<PurchaseOrder> poPage = poRepository.searchPurchaseOrders(
                filterUserId, filterStatus, searchText, pageable
        );

        List<PurchaseOrderResponse> content = poPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                content,
                poPage.getNumber(),
                poPage.getTotalPages(),
                poPage.getTotalElements(),
                poPage.getSize()
        );
    }

    public List<PurchaseOrderResponse> getPendingPurchaseOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole().equals("REQUESTER")) {
            throw new IllegalArgumentException("Requesters do not have access to view all pending approval lists.");
        }

        return poRepository.findByStatus("PENDING_APPROVAL").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PurchaseOrderResponse getPurchaseOrderById(Long id, String userEmail) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Requesters can only view their own POs
        if (user.getRole().equals("REQUESTER") && !po.getCreatedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access Denied to view this Purchase Order.");
        }

        return mapToResponse(po);
    }

    @Transactional
    public PurchaseOrderResponse updatePurchaseOrder(Long id, PurchaseOrderRequest request, String userEmail) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!po.getCreatedBy().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Only the creator or Admin can update this Purchase Order.");
        }

        if (!po.getStatus().equals("DRAFT")) {
            throw new IllegalArgumentException("Only DRAFT Purchase Orders can be updated.");
        }

        po.setTitle(request.getTitle());
        po.setDescription(request.getDescription());
        po.setVendorName(request.getVendorName());
        po.setAmount(request.getAmount());
        po.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(poRepository.save(po));
    }

    @Transactional
    public void deletePurchaseOrder(Long id, String userEmail) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!po.getCreatedBy().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Only the creator or Admin can delete this Purchase Order.");
        }

        if (!po.getStatus().equals("DRAFT")) {
            throw new IllegalArgumentException("Only DRAFT Purchase Orders can be deleted.");
        }

        poRepository.delete(po);
    }

    @Transactional
    public PurchaseOrderResponse submitPurchaseOrder(Long id, String userEmail) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!po.getCreatedBy().getId().equals(user.getId()) && !user.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Only the creator or Admin can submit this Purchase Order.");
        }

        if (!po.getStatus().equals("DRAFT")) {
            throw new IllegalArgumentException("Only DRAFT Purchase Orders can be submitted for approval.");
        }

        po.setStatus("PENDING_APPROVAL");
        po.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(poRepository.save(po));
    }

    @Transactional
    public PurchaseOrderResponse approvePurchaseOrder(Long id, ApprovalRequest request, String userEmail) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Role check
        if (!user.getRole().equals("APPROVER") && !user.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Only Approvers or Admins can approve Purchase Orders.");
        }

        // Status check
        if (!po.getStatus().equals("PENDING_APPROVAL")) {
            throw new IllegalArgumentException("Purchase Order must be in PENDING_APPROVAL status to be approved.");
        }

        // Process Approval
        po.setStatus("APPROVED");
        po.setUpdatedAt(LocalDateTime.now());
        PurchaseOrder savedPo = poRepository.save(po);

        // Record Approval History
        ApprovalHistory history = new ApprovalHistory(
                savedPo,
                user,
                "APPROVED",
                request != null ? request.getComments() : ""
        );
        approvalRepository.save(history);

        return mapToResponse(savedPo);
    }

    @Transactional
    public PurchaseOrderResponse rejectPurchaseOrder(Long id, ApprovalRequest request, String userEmail) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Role check
        if (!user.getRole().equals("APPROVER") && !user.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Only Approvers or Admins can reject Purchase Orders.");
        }

        // Status check
        if (!po.getStatus().equals("PENDING_APPROVAL")) {
            throw new IllegalArgumentException("Purchase Order must be in PENDING_APPROVAL status to be rejected.");
        }

        // Comment validation (Mandatory for rejection)
        if (request == null || request.getComments() == null || request.getComments().trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection comments/reason is mandatory.");
        }

        // Process Rejection
        po.setStatus("REJECTED");
        po.setUpdatedAt(LocalDateTime.now());
        PurchaseOrder savedPo = poRepository.save(po);

        // Record Approval History
        ApprovalHistory history = new ApprovalHistory(
                savedPo,
                user,
                "REJECTED",
                request.getComments()
        );
        approvalRepository.save(history);

        return mapToResponse(savedPo);
    }
}
