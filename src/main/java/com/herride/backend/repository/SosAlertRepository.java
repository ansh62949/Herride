package com.herride.backend.repository;

import com.herride.backend.model.entity.SosAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {
    List<SosAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SosAlert> findAllByOrderByCreatedAtDesc();
}

