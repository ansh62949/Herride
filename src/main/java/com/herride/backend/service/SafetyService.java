package com.herride.backend.service;

import com.herride.backend.model.dto.request.IncidentReportRequest;
import com.herride.backend.model.dto.request.SosAlertRequest;
import com.herride.backend.model.dto.request.TrustedContactRequest;
import com.herride.backend.model.dto.response.IncidentReportResponse;
import com.herride.backend.model.dto.response.SosAlertResponse;
import com.herride.backend.model.dto.response.TrustedContactResponse;

import java.util.List;

public interface SafetyService {
    // SOS Alerts
    SosAlertResponse triggerSos(String email, SosAlertRequest request);
    List<SosAlertResponse> getSosHistory(String email);
    void resolveSos(Long id, String email);

    // Incident Reporting
    IncidentReportResponse reportIncident(String email, IncidentReportRequest request);
    List<IncidentReportResponse> getIncidents(String email);
    void resolveIncident(Long id);

    // Trusted Contacts
    TrustedContactResponse addContact(String email, TrustedContactRequest request);
    TrustedContactResponse updateContact(String email, Long contactId, TrustedContactRequest request);
    void removeContact(String email, Long contactId);
    List<TrustedContactResponse> getContacts(String email);

    // Safety Check-In response
    void respondToCheckin(String email, Long tripId, boolean safe);

    // Score engine
    void calculateSafetyScores();
}

