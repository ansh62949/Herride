package com.herride.backend.service.impl;

import com.herride.backend.exception.AppException;
import com.herride.backend.kafka.producer.TripEventProducer;
import com.herride.backend.model.dto.request.IncidentReportRequest;
import com.herride.backend.model.dto.request.SosAlertRequest;
import com.herride.backend.model.dto.request.TrustedContactRequest;
import com.herride.backend.model.dto.response.IncidentReportResponse;
import com.herride.backend.model.dto.response.SosAlertResponse;
import com.herride.backend.model.dto.response.TrustedContactResponse;
import com.herride.backend.model.entity.*;
import com.herride.backend.model.enums.TripStatus;
import com.herride.backend.model.enums.VerificationStatus;
import com.herride.backend.model.redis.DriverLocation;
import com.herride.backend.repository.*;
import com.herride.backend.service.SafetyService;
import com.herride.backend.service.SmsService;
import com.herride.backend.websocket.WebSocketNotificationService;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyServiceImpl implements SafetyService {

    private final TrustedContactRepository trustedContactRepository;
    private final SosAlertRepository sosAlertRepository;
    private final IncidentReportRepository incidentReportRepository;
    private final SafetyCheckinRepository safetyCheckinRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final RiderProfileRepository riderProfileRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final SmsService smsService;
    private final TripEventProducer tripEventProducer;
    private final WebSocketNotificationService webSocketNotificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MeterRegistry meterRegistry;

    @Value("${app.safety.check-in-threshold-minutes:30}")
    private int checkInThresholdMinutes;

    @Value("${app.safety.check-in-timeout-minutes:5}")
    private int checkInTimeoutMinutes;

    @Override
    @Transactional
    public SosAlertResponse triggerSos(String email, SosAlertRequest request) {
        User user = getUser(email);
        Trip trip = request.getRideId() != null
                ? tripRepository.findById(request.getRideId()).orElse(null)
                : null;

        SosAlert alert = SosAlert.builder()
                .user(user)
                .trip(trip)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status("ACTIVE")
                .build();

        sosAlertRepository.save(alert);

        // Record custom metric
        meterRegistry.counter("ride.safety.sos.total").increment();

        SosAlertResponse response = toSosResponse(alert);

        // Publish event to Kafka
        tripEventProducer.publishSosTriggered(response);

        // Notify Trusted Contacts via SMS
        List<TrustedContact> contacts = trustedContactRepository.findByUserId(user.getId());
        String locationUrl = String.format("https://maps.google.com/?q=%f,%f", request.getLatitude(), request.getLongitude());
        String message = String.format("EMERGENCY: %s %s has triggered an SOS on HerRide. Last location: %s",
                user.getFirstName(), user.getLastName(), locationUrl);

        for (TrustedContact contact : contacts) {
            try {
                smsService.sendSms(contact.getPhone(), message);
            } catch (Exception e) {
                log.error("Failed to send SOS SMS to contact {}: {}", contact.getName(), e.getMessage());
            }
        }

        // Notify Admin dashboard via WebSocket
        messagingTemplate.convertAndSend("/topic/admin/sos", response);

        log.warn("SOS ALERT TRIGGERED by user {} at ({}, {})", email, request.getLatitude(), request.getLongitude());
        return response;
    }

    @Override
    public List<SosAlertResponse> getSosHistory(String email) {
        User user = getUser(email);
        List<SosAlert> alerts;
        if ("admin@herride.com".equals(user.getEmail())) {
            alerts = sosAlertRepository.findAllByOrderByCreatedAtDesc();
        } else {
            alerts = sosAlertRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }
        return alerts.stream().map(this::toSosResponse).toList();
    }

    @Override
    @Transactional
    public void resolveSos(Long id, String email) {
        SosAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new AppException("SOS alert not found", HttpStatus.NOT_FOUND));

        User user = getUser(email);
        boolean isAdmin = "admin@herride.com".equals(user.getEmail());
        boolean isOwner = alert.getUser().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new AppException("Access denied. You cannot resolve this SOS alert.", HttpStatus.FORBIDDEN);
        }

        alert.setStatus("RESOLVED");
        sosAlertRepository.save(alert);
        log.info("SOS alert {} resolved by {}", id, email);
    }

    @Override
    @Transactional
    public IncidentReportResponse reportIncident(String email, IncidentReportRequest request) {
        User user = getUser(email);
        
        Trip trip = null;
        if (request.getTripId() != null) {
            Trip t = tripRepository.findById(request.getTripId()).orElse(null);
            if (t != null) {
                boolean isRider = t.getRider().getId().equals(user.getId());
                boolean isDriver = t.getDriver() != null && t.getDriver().getId().equals(user.getId());
                if (isRider || isDriver) {
                    trip = t;
                }
            }
        }
        
        if (trip == null) {
            if (user.getRole() == com.herride.backend.model.enums.Role.RIDER) {
                List<Trip> trips = tripRepository.findByRiderIdOrderByCreatedAtDesc(user.getId());
                if (!trips.isEmpty()) {
                    trip = trips.get(0);
                }
            } else if (user.getRole() == com.herride.backend.model.enums.Role.DRIVER) {
                List<Trip> trips = tripRepository.findByDriverIdOrderByCreatedAtDesc(user.getId());
                if (!trips.isEmpty()) {
                    trip = trips.get(0);
                }
            }
        }

        if (trip == null) {
            throw new AppException("No recent trip found to report an incident for", HttpStatus.BAD_REQUEST);
        }

        IncidentReport report = IncidentReport.builder()
                .trip(trip)
                .reporter(user)
                .category(request.getCategory())
                .description(request.getDescription())
                .status("OPEN")
                .build();

        incidentReportRepository.save(report);

        // Trigger safety score recalculation immediately
        calculateSafetyScores();

        return toIncidentResponse(report);
    }

    @Override
    public List<IncidentReportResponse> getIncidents(String email) {
        User user = getUser(email);
        List<IncidentReport> reports;
        if ("admin@herride.com".equals(user.getEmail())) {
            reports = incidentReportRepository.findAllByOrderByCreatedAtDesc();
        } else {
            reports = incidentReportRepository.findByReporterIdOrderByCreatedAtDesc(user.getId());
        }
        return reports.stream().map(this::toIncidentResponse).toList();
    }

    @Override
    @Transactional
    public void resolveIncident(Long id) {
        IncidentReport report = incidentReportRepository.findById(id)
                .orElseThrow(() -> new com.herride.backend.exception.AppException("Incident report not found", HttpStatus.NOT_FOUND));
        report.setStatus("RESOLVED");
        incidentReportRepository.save(report);
        log.info("Incident report {} resolved", id);
    }

    @Override
    @Transactional
    public TrustedContactResponse addContact(String email, TrustedContactRequest request) {
        User user = getUser(email);

        TrustedContact contact = TrustedContact.builder()
                .user(user)
                .name(request.getName())
                .phone(request.getPhone())
                .relationship(request.getRelationship())
                .build();

        return toContactResponse(trustedContactRepository.save(contact));
    }

    @Override
    @Transactional
    public TrustedContactResponse updateContact(String email, Long contactId, TrustedContactRequest request) {
        User user = getUser(email);
        TrustedContact contact = trustedContactRepository.findById(contactId)
                .orElseThrow(() -> new AppException("Contact not found", HttpStatus.NOT_FOUND));

        if (!contact.getUser().getId().equals(user.getId())) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        contact.setName(request.getName());
        contact.setPhone(request.getPhone());
        contact.setRelationship(request.getRelationship());

        return toContactResponse(trustedContactRepository.save(contact));
    }

    @Override
    @Transactional
    public void removeContact(String email, Long contactId) {
        User user = getUser(email);
        TrustedContact contact = trustedContactRepository.findById(contactId)
                .orElseThrow(() -> new AppException("Contact not found", HttpStatus.NOT_FOUND));

        if (!contact.getUser().getId().equals(user.getId())) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        trustedContactRepository.delete(contact);
    }

    @Override
    public List<TrustedContactResponse> getContacts(String email) {
        User user = getUser(email);
        return trustedContactRepository.findByUserId(user.getId())
                .stream()
                .map(this::toContactResponse)
                .toList();
    }

    @Override
    @Transactional
    public void respondToCheckin(String email, Long tripId, boolean safe) {
        User user = getUser(email);
        SafetyCheckin checkin = safetyCheckinRepository.findByTripIdAndStatus(tripId, "PENDING")
                .orElseThrow(() -> new AppException("No pending safety check-in found for this trip", HttpStatus.NOT_FOUND));

        if (!checkin.getTrip().getRider().getId().equals(user.getId())) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        if (safe) {
            checkin.setStatus("RESPONDED");
            safetyCheckinRepository.save(checkin);
            log.info("Rider confirmed they are safe for trip {}", tripId);
        } else {
            // Trigger emergency SOS
            checkin.setStatus("RESPONDED");
            safetyCheckinRepository.save(checkin);

            SosAlertRequest alertRequest = SosAlertRequest.builder()
                    .rideId(tripId)
                    .latitude(checkin.getTrip().getPickupLatitude())
                    .longitude(checkin.getTrip().getPickupLongitude())
                    .build();

            // Try to resolve live coordinates from driver location
            if (checkin.getTrip().getDriver() != null) {
                driverProfileRepository.findByUserId(checkin.getTrip().getDriver().getId())
                        .flatMap(profile -> driverLocationRepository.findById(profile.getId()))
                        .ifPresent(loc -> {
                            alertRequest.setLatitude(loc.getLatitude());
                            alertRequest.setLongitude(loc.getLongitude());
                        });
            }

            triggerSos(email, alertRequest);
        }
    }

    // --- Scheduled Tasks ---

    @Scheduled(fixedRate = 60000) // Runs every minute
    @Transactional
    public void checkInOnActiveTrips() {
        LocalDateTime now = LocalDateTime.now();
        List<Trip> activeTrips = tripRepository.findAll().stream()
                .filter(trip -> trip.getStatus() == TripStatus.IN_PROGRESS && trip.getStartedAt() != null)
                .toList();

        for (Trip trip : activeTrips) {
            long durationMinutes = Duration.between(trip.getStartedAt(), now).toMinutes();

            if (durationMinutes >= checkInThresholdMinutes) {
                // Check if safety check-in has already been initiated for this trip
                if (!safetyCheckinRepository.existsByTripId(trip.getId())) {
                    SafetyCheckin checkin = SafetyCheckin.builder()
                            .trip(trip)
                            .status("PENDING")
                            .expiresAt(now.plusMinutes(checkInTimeoutMinutes))
                            .build();

                    safetyCheckinRepository.save(checkin);

                    // Notify Rider via WebSocket
                    messagingTemplate.convertAndSendToUser(
                            trip.getRider().getId().toString(),
                            "/queue/safety-checkin",
                            "Please confirm you are safe. Trip duration exceeds threshold."
                    );

                    // Notify Rider via SMS
                    try {
                        String smsMsg = "HerRide Safety Check: Your ride has exceeded the expected duration. Please confirm you are safe. Reply to this number or check your app.";
                        smsService.sendSms(trip.getRider().getPhone(), smsMsg);
                    } catch (Exception e) {
                        log.error("Failed to send safety check-in SMS to rider: {}", e.getMessage());
                    }

                    log.info("Safety check-in sent for trip {}", trip.getId());
                }
            }
        }
    }

    @Scheduled(fixedRate = 30000) // Runs every 30 seconds
    @Transactional
    public void processExpiredCheckins() {
        LocalDateTime now = LocalDateTime.now();
        List<SafetyCheckin> expiredCheckins = safetyCheckinRepository.findByStatusAndExpiresAtBefore("PENDING", now);

        for (SafetyCheckin checkin : expiredCheckins) {
            checkin.setStatus("TIMEOUT");
            safetyCheckinRepository.save(checkin);

            // Fetch last known location
            Double lat = checkin.getTrip().getDestinationLatitude();
            Double lng = checkin.getTrip().getDestinationLongitude();

            if (checkin.getTrip().getDriver() != null) {
                var locOpt = driverProfileRepository.findByUserId(checkin.getTrip().getDriver().getId())
                        .flatMap(profile -> driverLocationRepository.findById(profile.getId()));
                if (locOpt.isPresent()) {
                    lat = locOpt.get().getLatitude();
                    lng = locOpt.get().getLongitude();
                }
            }

            // Auto-trigger SOS on behalf of user
            SosAlertRequest request = SosAlertRequest.builder()
                    .rideId(checkin.getTrip().getId())
                    .latitude(lat)
                    .longitude(lng)
                    .build();

            triggerSos(checkin.getTrip().getRider().getEmail(), request);
            log.warn("Safety check-in TIMED OUT for trip {}. Auto-triggering SOS alert.", checkin.getTrip().getId());
        }
    }

    @Scheduled(cron = "0 */10 * * * *") // Runs every 10 minutes
    @Transactional
    @Override
    public void calculateSafetyScores() {
        log.info("Executing safety score calculations");

        // Drivers safety scores
        List<DriverProfile> drivers = driverProfileRepository.findAll();
        for (DriverProfile driver : drivers) {
            double score = 100.0;

            // 1. Completion Rate
            long completed = tripRepository.findAll().stream()
                    .filter(t -> t.getDriver() != null && t.getDriver().getId().equals(driver.getUser().getId()) && t.getStatus() == TripStatus.COMPLETED)
                    .count();
            long cancelledByDriver = tripRepository.findAll().stream()
                    .filter(t -> t.getDriver() != null && t.getDriver().getId().equals(driver.getUser().getId()) && t.getStatus() == TripStatus.CANCELLED && t.getCancellationReason() != null)
                    .count();
            long total = completed + cancelledByDriver;
            if (total > 0) {
                double completionRate = (double) completed / total;
                score -= (1.0 - completionRate) * 30.0;
            }

            // 2. Ratings
            if (driver.getTotalRatings() > 0 && driver.getRating() > 0.0) {
                score -= (5.0 - driver.getRating()) * 10.0;
            }

            // 3. Incident reports (Active or Investigating)
            long incidents = incidentReportRepository.findAll().stream()
                    .filter(r -> r.getTrip().getDriver() != null &&
                            r.getTrip().getDriver().getId().equals(driver.getUser().getId()) &&
                            !"RESOLVED".equalsIgnoreCase(r.getStatus()))
                    .count();
            score -= incidents * 15.0;

            // 4. Verification Status
            if (driver.getVerificationStatus() == VerificationStatus.SUSPENDED || driver.getVerificationStatus() == VerificationStatus.REJECTED) {
                score = 0.0;
            }

            driver.setSafetyScore(Math.max(0.0, Math.min(100.0, score)));
            driverProfileRepository.save(driver);
        }

        // Passengers safety scores
        List<RiderProfile> riders = riderProfileRepository.findAll();
        for (RiderProfile rider : riders) {
            double score = 100.0;

            // 1. Ratings
            if (rider.getTotalRatings() > 0 && rider.getRating() > 0.0) {
                score -= (5.0 - rider.getRating()) * 10.0;
            }

            // 2. Incident reports reported *against* rider or related
            long incidents = incidentReportRepository.findAll().stream()
                    .filter(r -> r.getTrip().getRider().getId().equals(rider.getUser().getId()) &&
                            !"RESOLVED".equalsIgnoreCase(r.getStatus()) &&
                            r.getReporter().getRole() == com.herride.backend.model.enums.Role.DRIVER)
                    .count();
            score -= incidents * 15.0;

            rider.setSafetyScore(Math.max(0.0, Math.min(100.0, score)));
            riderProfileRepository.save(rider);
        }
    }

    // --- Helper Mappers ---

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
    }

    private SosAlertResponse toSosResponse(SosAlert alert) {
        return SosAlertResponse.builder()
                .id(alert.getId())
                .rideId(alert.getTrip() != null ? alert.getTrip().getId() : null)
                .userId(alert.getUser().getId())
                .riderName(alert.getUser().getFirstName() + " " + alert.getUser().getLastName())
                .phone(alert.getUser().getPhone())
                .latitude(alert.getLatitude())
                .longitude(alert.getLongitude())
                .status(alert.getStatus())
                .createdAt(alert.getCreatedAt())
                .build();
    }

    private IncidentReportResponse toIncidentResponse(IncidentReport report) {
        return IncidentReportResponse.builder()
                .id(report.getId())
                .rideId(report.getTrip().getId())
                .reporterId(report.getReporter().getId())
                .category(report.getCategory())
                .description(report.getDescription())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .build();
    }

    private TrustedContactResponse toContactResponse(TrustedContact contact) {
        return TrustedContactResponse.builder()
                .id(contact.getId())
                .userId(contact.getUser().getId())
                .name(contact.getName())
                .phone(contact.getPhone())
                .relationship(contact.getRelationship())
                .build();
    }
}


