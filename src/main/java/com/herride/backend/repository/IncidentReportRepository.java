package com.herride.backend.repository;

import com.herride.backend.model.entity.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {
    List<IncidentReport> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
    List<IncidentReport> findAllByOrderByCreatedAtDesc();
}

