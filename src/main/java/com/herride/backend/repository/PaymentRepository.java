package com.herride.backend.repository;

import com.herride.backend.model.entity.Payment;
import com.herride.backend.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReference(String reference);
    Optional<Payment> findByTripId(Long tripId);
    boolean existsByTripIdAndStatus(Long tripId, PaymentStatus status);
}
