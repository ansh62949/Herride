package com.herride.backend.repository;

import com.herride.backend.model.entity.RideShareToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RideShareTokenRepository extends JpaRepository<RideShareToken, Long> {
    Optional<RideShareToken> findByToken(String token);
    Optional<RideShareToken> findByTripId(Long tripId);
}

