package com.poapp.repository;

import com.poapp.entity.ApprovalHistory;
import com.poapp.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {
    List<ApprovalHistory> findByPurchaseOrder(PurchaseOrder purchaseOrder);
}
