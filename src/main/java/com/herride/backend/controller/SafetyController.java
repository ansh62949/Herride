package com.herride.backend.controller;

import com.herride.backend.model.dto.request.IncidentReportRequest;
import com.herride.backend.model.dto.request.SosAlertRequest;
import com.herride.backend.model.dto.request.TrustedContactRequest;
import com.herride.backend.model.dto.response.ApiResponse;
import com.herride.backend.model.dto.response.IncidentReportResponse;
import com.herride.backend.model.dto.response.SosAlertResponse;
import com.herride.backend.model.dto.response.TrustedContactResponse;
import com.herride.backend.service.SafetyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/safety")
@RequiredArgsConstructor
public class SafetyController {

    private final SafetyService safetyService;

    // --- SOS Alerts ---

    @PostMapping("/sos")
    public ResponseEntity<ApiResponse<SosAlertResponse>> triggerSos(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SosAlertRequest request) {
        SosAlertResponse response = safetyService.triggerSos(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("SOS Alert triggered and escalated successfully", response));
    }

    @GetMapping("/sos/history")
    public ResponseEntity<ApiResponse<List<SosAlertResponse>>> getSosHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<SosAlertResponse> response = safetyService.getSosHistory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("SOS Alert history retrieved", response));
    }

    @PostMapping("/sos/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveSos(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        safetyService.resolveSos(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("SOS Alert resolved successfully", null));
    }

    // --- Incident Reports ---

    @PostMapping("/incident")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> reportIncident(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody IncidentReportRequest request) {
        IncidentReportResponse response = safetyService.reportIncident(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident report submitted successfully", response));
    }

    @GetMapping("/incident")
    public ResponseEntity<ApiResponse<List<IncidentReportResponse>>> getIncidents(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IncidentReportResponse> response = safetyService.getIncidents(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Incident reports retrieved", response));
    }

    @PostMapping("/incident/{id}/resolve")
    @
            PreAuthorize("hasRole('ADMIN') and principal.username == 'admin@herride.com'")
    public ResponseEntity<ApiResponse<Void>> resolveIncident(@PathVariable Long id) {
        safetyService.resolveIncident(id);
        return ResponseEntity.ok(ApiResponse.success("Incident report resolved successfully", null));
    }

    // --- Trusted Contacts ---

    @PostMapping("/contacts")
    public ResponseEntity<ApiResponse<TrustedContactResponse>> addContact(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TrustedContactRequest request) {
        TrustedContactResponse response = safetyService.addContact(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trusted contact added", response));
    }

    @PutMapping("/contacts/{id}")
    public ResponseEntity<ApiResponse<TrustedContactResponse>> updateContact(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody TrustedContactRequest request) {
        TrustedContactResponse response = safetyService.updateContact(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Trusted contact updated", response));
    }

    @DeleteMapping("/contacts/{id}")
    public ResponseEntity<ApiResponse<Void>> removeContact(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        safetyService.removeContact(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Trusted contact removed", null));
    }

    @GetMapping("/contacts")
    public ResponseEntity<ApiResponse<List<TrustedContactResponse>>> getContacts(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<TrustedContactResponse> response = safetyService.getContacts(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Trusted contacts retrieved", response));
    }

    // --- Safety Check-in Respond ---

    @PostMapping("/check-in/respond")
    public ResponseEntity<ApiResponse<Void>> respondToCheckin(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long tripId,
            @RequestParam boolean safe) {
        safetyService.respondToCheckin(userDetails.getUsername(), tripId, safe);
        return ResponseEntity.ok(ApiResponse.success("Response recorded successfully", null));
    }
}


