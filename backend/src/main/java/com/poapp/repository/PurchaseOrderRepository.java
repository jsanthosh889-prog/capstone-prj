package com.poapp.repository;

import com.poapp.entity.PurchaseOrder;
import com.poapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByCreatedBy(User createdBy);
    List<PurchaseOrder> findByStatus(String status);

    @Query("SELECT p FROM PurchaseOrder p WHERE " +
           "(:userId IS NULL OR p.createdBy.id = :userId) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(COALESCE(:search, '') = '' OR " +
           " LOWER(p.poNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.vendorName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<PurchaseOrder> searchPurchaseOrders(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );
}
