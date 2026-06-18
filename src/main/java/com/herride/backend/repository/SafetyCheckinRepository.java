package com.herride.backend.repository;

import com.herride.backend.model.entity.SafetyCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SafetyCheckinRepository extends JpaRepository<SafetyCheckin, Long> {
    Optional<SafetyCheckin> findByTripIdAndStatus(Long tripId, String status);
    List<SafetyCheckin> findByStatusAndExpiresAtBefore(String status, LocalDateTime time);
    
    @Query("SELECT COUNT(s) > 0 FROM SafetyCheckin s WHERE s.trip.id = :tripId")
    boolean existsByTripId(Long tripId);
}

