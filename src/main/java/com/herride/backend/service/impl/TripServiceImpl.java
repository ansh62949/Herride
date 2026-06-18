package com.herride.backend.service.impl;

import com.herride.backend.exception.AppException;
import com.herride.backend.kafka.producer.TripEventProducer;
import com.herride.backend.model.dto.request.CancelTripRequest;
import com.herride.backend.model.dto.request.RatingRequest;
import com.herride.backend.model.dto.request.TripRequest;
import com.herride.backend.model.dto.response.FareEstimateResponse;
import com.herride.backend.model.dto.response.TripResponse;
import com.herride.backend.model.entity.DriverProfile;
import com.herride.backend.model.entity.RideShareToken;
import com.herride.backend.model.entity.Trip;
import com.herride.backend.model.entity.User;
import com.herride.backend.model.enums.*;
import com.herride.backend.repository.DriverProfileRepository;
import com.herride.backend.repository.TripRepository;
import com.herride.backend.repository.UserRepository;
import com.herride.backend.service.PricingService;
import com.herride.backend.service.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PricingService pricingService;
    private final TripEventProducer tripEventProducer;
    private final com.herride.backend.service.LocationService locationService;
    private final io.micrometer.core.instrument.MeterRegistry meterRegistry;
    private final com.herride.backend.repository.RideShareTokenRepository rideShareTokenRepository;
    private final com.herride.backend.repository.DriverLocationRepository driverLocationRepository;

    @Override
    public FareEstimateResponse estimateFare(Double pickupLat, Double pickupLng,
                                             Double destLat, Double destLng,
                                             VehicleType vehicleType) {
        return pricingService.estimateFare(pickupLat, pickupLng, destLat, destLng, vehicleType);
    }

    @Override
    @Transactional
    public TripResponse requestTrip(String riderEmail, TripRequest request) {
        User rider = getUser(riderEmail);

        // Safety constraint: only female passengers
        if (rider.getGender() != Gender.FEMALE) {
            throw new AppException("Only female passengers are permitted to request rides", HttpStatus.BAD_REQUEST);
        }

        // Check rider has no active trip
        tripRepository.findActiveRiderTrip(rider.getId()).ifPresent(t -> {
            if (t.getStatus() == TripStatus.REQUESTED || t.getStatus() == TripStatus.SEARCHING_DRIVER) {
                log.info("Automatically cancelling stuck trip {} for rider {}", t.getId(), riderEmail);
                t.setStatus(TripStatus.CANCELLED);
                t.setCancellationReason(CancellationReason.RIDER_CANCELLED);
                t.setCancellationNote("System-cancelled due to new booking request");
                t.setCancelledAt(LocalDateTime.now());
                tripRepository.save(t);
            } else {
                throw new AppException("You already have an active trip", HttpStatus.CONFLICT);
            }
        });

        RideType rideType = request.getRideType() != null ? request.getRideType() : RideType.INSTANT;
        if (rideType == RideType.SCHEDULED) {
            if (request.getScheduledPickupTime() == null) {
                throw new AppException("Scheduled pickup time is required for scheduled rides", HttpStatus.BAD_REQUEST);
            }
            if (request.getScheduledPickupTime().isBefore(LocalDateTime.now().plusMinutes(29))) {
                throw new AppException("Scheduled rides must be booked at least 30 minutes in advance", HttpStatus.BAD_REQUEST);
            }
        }

        FareEstimateResponse fare = pricingService.estimateFare(
                request.getPickupLatitude(), request.getPickupLongitude(),
                request.getDestinationLatitude(), request.getDestinationLongitude(),
                request.getVehicleType()
        );

        Trip trip = Trip.builder()
                .rider(rider)
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .pickupAddress(request.getPickupAddress())
                .destinationLatitude(request.getDestinationLatitude())
                .destinationLongitude(request.getDestinationLongitude())
                .destinationAddress(request.getDestinationAddress())
                .vehicleType(request.getVehicleType())
                .estimatedFare(fare.getEstimatedFare())
                .distanceKm(fare.getDistanceKm())
                .surgeApplied(fare.getSurgeApplied())
                .surgeMultiplier(fare.getSurgeMultiplier())
                .status(rideType == RideType.SCHEDULED ? TripStatus.REQUESTED : TripStatus.SEARCHING_DRIVER)
                .paymentStatus(PaymentStatus.PENDING)
                .rideType(rideType)
                .scheduledPickupTime(request.getScheduledPickupTime())
                .build();

        tripRepository.save(trip);
        
        // Custom Metric
        meterRegistry.counter("ride.requests.total", "type", rideType.name()).increment();

        if (rideType == RideType.INSTANT) {
            assignSmartDriver(trip);
        }

        tripEventProducer.publishTripRequested(toResponse(trip));
        log.info("Trip {} requested by rider {}", trip.getId(), rider.getEmail());
        return toResponse(trip);
    }

    @Override
    @Transactional
    public TripResponse acceptTrip(String driverEmail, Long tripId) {
        User driver = getUser(driverEmail);
        
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new AppException("Trip not found", HttpStatus.NOT_FOUND));

        if (trip.getStatus() == TripStatus.DRIVER_ASSIGNED && trip.getDriver() != null && trip.getDriver().getId().equals(driver.getId())) {
            log.info("Driver {} is already assigned to trip {}. Returning success.", driverEmail, tripId);
            return toResponse(trip);
        }

        // Safety constraint: only female drivers
        if (driver.getGender() != Gender.FEMALE) {
            throw new AppException("Only female drivers are permitted to accept rides", HttpStatus.FORBIDDEN);
        }

        DriverProfile profile = driverProfileRepository.findByUserId(driver.getId())
                .orElseThrow(() -> new AppException("Driver profile not found", HttpStatus.NOT_FOUND));

        // Safety constraint: driver must be verified by admin
        if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new AppException("Driver profile must be verified by admin before accepting trips", HttpStatus.FORBIDDEN);
        }

        if (profile.getDriverStatus() != DriverStatus.ONLINE) {
            throw new AppException("Driver must be online to accept trips", HttpStatus.BAD_REQUEST);
        }

        if (tripRepository.countActiveTripsForDriverExcludingTrip(driver.getId(), trip.getId()) > 0) {
            throw new AppException("You already have an active trip", HttpStatus.CONFLICT);
        }

        if (trip.getStatus() != TripStatus.REQUESTED && trip.getStatus() != TripStatus.SEARCHING_DRIVER) {
            throw new AppException("Trip is no longer available", HttpStatus.CONFLICT);
        }

        trip.setDriver(driver);
        trip.setStatus(TripStatus.DRIVER_ASSIGNED);
        trip.setAcceptedAt(LocalDateTime.now());

        // Update driver status
        profile.setDriverStatus(DriverStatus.ON_TRIP);
        driverProfileRepository.save(profile);

        tripRepository.save(trip);
        tripEventProducer.publishTripAccepted(toResponse(trip));
        log.info("Trip {} accepted by driver {}", tripId, driverEmail);
        return toResponse(trip);
    }

    @Override
    @Transactional
    public TripResponse updateTripStatus(String driverEmail, Long tripId, String action) {
        User driver = getUser(driverEmail);
        Trip trip = tripRepository.findByIdAndDriverId(tripId, driver.getId())
                .orElseThrow(() -> new AppException("Trip not found or not assigned to you",
                        HttpStatus.NOT_FOUND));

        switch (action.toUpperCase()) {
            case "EN_ROUTE", "ARRIVING" -> {
                validateTransition(trip.getStatus(), TripStatus.DRIVER_ASSIGNED, TripStatus.DRIVER_ARRIVING);
                trip.setStatus(TripStatus.DRIVER_ARRIVING);
                trip.setDriverEnRouteAt(LocalDateTime.now());
            }
            case "ARRIVED", "PICKED", "PICKUP" -> {
                validateTransition(trip.getStatus(), TripStatus.DRIVER_ARRIVING, TripStatus.RIDER_PICKED);
                trip.setStatus(TripStatus.RIDER_PICKED);
                trip.setArrivedAt(LocalDateTime.now());
            }
            case "START" -> {
                validateTransition(trip.getStatus(), TripStatus.RIDER_PICKED, TripStatus.IN_PROGRESS);
                trip.setStatus(TripStatus.IN_PROGRESS);
                trip.setStartedAt(LocalDateTime.now());
            }
            case "COMPLETE" -> {
                validateTransition(trip.getStatus(), TripStatus.IN_PROGRESS, TripStatus.COMPLETED);
                completeTrip(trip, driver);
            }
            default -> throw new AppException("Invalid action: " + action, HttpStatus.BAD_REQUEST);
        }

        tripRepository.save(trip);

        TripResponse response = toResponse(trip);

        // Publish Kafka event for every status transition
        switch (trip.getStatus()) {
            case DRIVER_ARRIVING, RIDER_PICKED, IN_PROGRESS ->
                    tripEventProducer.publishTripStatusUpdated(response);
            case COMPLETED ->
                    tripEventProducer.publishTripCompleted(response);
        }

        log.info("Trip {} status updated to {} by driver {}", tripId, trip.getStatus(), driverEmail);
        return response;
    }

    @Override
    @Transactional
    public TripResponse cancelTrip(String email, Long tripId, CancelTripRequest request) {
        User user = getUser(email);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new AppException("Trip not found", HttpStatus.NOT_FOUND));

        // Validate ownership
        boolean isRider = trip.getRider().getId().equals(user.getId());
        boolean isDriver = trip.getDriver() != null && trip.getDriver().getId().equals(user.getId());

        if (!isRider && !isDriver) {
            throw new AppException("You are not part of this trip", HttpStatus.FORBIDDEN);
        }

        // Can only cancel before IN_PROGRESS
        if (trip.getStatus() == TripStatus.IN_PROGRESS ||
                trip.getStatus() == TripStatus.COMPLETED ||
                trip.getStatus() == TripStatus.CANCELLED) {
            throw new AppException("Trip cannot be cancelled at this stage", HttpStatus.BAD_REQUEST);
        }

        trip.setStatus(TripStatus.CANCELLED);
        trip.setCancellationReason(request.getReason());
        trip.setCancellationNote(request.getNote());
        trip.setCancelledAt(LocalDateTime.now());

        // Free up driver if one was assigned
        if (trip.getDriver() != null) {
            driverProfileRepository.findByUserId(trip.getDriver().getId())
                    .ifPresent(profile -> {
                        profile.setDriverStatus(DriverStatus.ONLINE);
                        profile.setIdleSince(LocalDateTime.now());
                        driverProfileRepository.save(profile);
                    });
        }

        tripRepository.save(trip);
        tripEventProducer.publishTripCancelled(toResponse(trip));
        log.info("Trip {} cancelled by {}", tripId, email);
        return toResponse(trip);
    }

    @Override
    @Transactional
    public TripResponse rateTrip(String email, Long tripId, RatingRequest request) {
        User user = getUser(email);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new AppException("Trip not found", HttpStatus.NOT_FOUND));

        if (trip.getStatus() != TripStatus.COMPLETED) {
            throw new AppException("Can only rate completed trips", HttpStatus.BAD_REQUEST);
        }

        boolean isRider = trip.getRider().getId().equals(user.getId());
        boolean isDriver = trip.getDriver() != null && trip.getDriver().getId().equals(user.getId());

        if (isRider) {
            if (trip.getDriverRating() != null) {
                throw new AppException("You have already rated this trip", HttpStatus.CONFLICT);
            }
            trip.setDriverRating(request.getRating());
            trip.setDriverReview(request.getReview());
            updateDriverRating(trip.getDriver().getId(), request.getRating());
        } else if (isDriver) {
            if (trip.getRiderRating() != null) {
                throw new AppException("You have already rated this trip", HttpStatus.CONFLICT);
            }
            trip.setRiderRating(request.getRating());
            trip.setRiderReview(request.getReview());
        } else {
            throw new AppException("You are not part of this trip", HttpStatus.FORBIDDEN);
        }

        tripRepository.save(trip);
        return toResponse(trip);
    }

    @Override
    public TripResponse getTripById(Long tripId, String email) {
        User user = getUser(email);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new AppException("Trip not found", HttpStatus.NOT_FOUND));

        boolean isRider = trip.getRider().getId().equals(user.getId());
        boolean isDriver = trip.getDriver() != null && trip.getDriver().getId().equals(user.getId());

        if (!isRider && !isDriver) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        return toResponse(trip);
    }

    @Override
    public List<TripResponse> getMyTrips(String email) {
        User user = getUser(email);
        List<Trip> trips = user.getRole() == Role.RIDER
                ? tripRepository.findByRiderIdOrderByCreatedAtDesc(user.getId())
                : tripRepository.findByDriverIdOrderByCreatedAtDesc(user.getId());
        return trips.stream().map(this::toResponse).toList();
    }

    @Override
    public List<TripResponse> getAllTrips() {
        return tripRepository.findAll().stream()
                .sorted((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    // --- Smart Driver Assignment & Scheduler ---

    @Transactional
    public void assignSmartDriver(Trip trip) {
        if (trip.getDriver() != null) {
            log.info("Trip {} already has a proposed driver candidate: {}", trip.getId(), trip.getDriver().getEmail());
            return;
        }

        log.info("Searching smart driver for trip {}", trip.getId());
        List<com.herride.backend.model.dto.response.NearbyDriverResponse> nearby =
                locationService.findNearbyDrivers(trip.getPickupLatitude(), trip.getPickupLongitude(), 10.0, trip.getVehicleType());

        DriverProfile bestDriver = null;
        double highestScore = -1.0;

        for (var nearbyDriver : nearby) {
            DriverProfile profile = driverProfileRepository.findById(nearbyDriver.getDriverId()).orElse(null);
            if (profile == null) continue;

            if (profile.getVerificationStatus() != VerificationStatus.VERIFIED) continue;
            if (profile.getUser().getGender() != Gender.FEMALE) continue;
            if (profile.getDriverStatus() != DriverStatus.ONLINE) continue;

            double distanceKm = nearbyDriver.getDistanceKm();
            double distanceScore = 100.0 / (1.0 + distanceKm);
            double ratingScore = profile.getRating() * 20.0;
            double acceptanceRateScore = profile.getAcceptanceRate();
            double idleMinutes = 0.0;
            if (profile.getIdleSince() != null) {
                idleMinutes = Duration.between(profile.getIdleSince(), LocalDateTime.now()).toMinutes();
            }
            double idleScore = Math.min(100.0, idleMinutes * 2.0);

            double totalScore = 0.4 * distanceScore + 0.3 * ratingScore + 0.2 * acceptanceRateScore + 0.1 * idleScore;

            if (totalScore > highestScore) {
                highestScore = totalScore;
                bestDriver = profile;
            }
        }

        if (bestDriver == null) {
            log.info("No nearby driver found. Falling back to default driver@herride.com");
            User fallbackDriver = userRepository.findByEmail("driver@herride.com").orElse(null);
            if (fallbackDriver != null) {
                bestDriver = driverProfileRepository.findByUserId(fallbackDriver.getId()).orElse(null);
            }
        }

        if (bestDriver != null) {
            // Set driver candidate, but do not set status to DRIVER_ASSIGNED or set driver status to ON_TRIP.
            // Status remains SEARCHING_DRIVER so that the driver is requested and must explicitly accept.
            trip.setDriver(bestDriver.getUser());
            tripRepository.save(trip);
            log.info("Smart proposed candidate driver {} for trip {}", bestDriver.getUser().getEmail(), trip.getId());
        } else {
            log.warn("No suitable driver found (even fallback) for trip {}", trip.getId());
        }
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void runScheduledMatching() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Process SCHEDULED rides that are within 15 mins of scheduled pickup
        List<Trip> scheduledTrips = tripRepository.findAll().stream()
                .filter(t -> t.getRideType() == RideType.SCHEDULED &&
                        t.getStatus() == TripStatus.REQUESTED &&
                        t.getScheduledPickupTime() != null &&
                        Duration.between(now, t.getScheduledPickupTime()).toMinutes() <= 15)
                .toList();

        for (Trip trip : scheduledTrips) {
            trip.setStatus(TripStatus.SEARCHING_DRIVER);
            tripRepository.save(trip);
            log.info("Scheduled trip {} window opened. Transitioning to SEARCHING_DRIVER.", trip.getId());
        }

        // 2. Process all SEARCHING_DRIVER trips
        List<Trip> searchingTrips = tripRepository.findAll().stream()
                .filter(t -> t.getStatus() == TripStatus.SEARCHING_DRIVER)
                .toList();

        for (Trip trip : searchingTrips) {
            assignSmartDriver(trip);
        }
    }

    // --- Private helpers ---

    private void completeTrip(Trip trip, User driver) {
        trip.setStatus(TripStatus.COMPLETED);
        trip.setCompletedAt(LocalDateTime.now());

        Double actualFare = pricingService.calculateActualFare(
                trip.getDistanceKm(), trip.getVehicleType(),
                trip.getSurgeApplied(), trip.getSurgeMultiplier());

        trip.setActualFare(actualFare);
        trip.setDriverEarnings(Math.round(actualFare * 0.80 * 100.0) / 100.0);
        trip.setPlatformFee(Math.round(actualFare * 0.20 * 100.0) / 100.0);
        trip.setPaymentStatus(PaymentStatus.PENDING);

        // Update driver stats
        driverProfileRepository.findByUserId(driver.getId()).ifPresent(profile -> {
            profile.setDriverStatus(DriverStatus.ONLINE);
            profile.setIdleSince(LocalDateTime.now());
            profile.setTotalTrips(profile.getTotalTrips() + 1);
            profile.setTotalEarnings(profile.getTotalEarnings() + trip.getDriverEarnings());
            driverProfileRepository.save(profile);
        });
    }

    private void validateTransition(TripStatus current, TripStatus expected, TripStatus next) {
        if (current != expected) {
            throw new AppException(
                    String.format("Cannot transition to %s from %s", next, current),
                    HttpStatus.BAD_REQUEST);
        }
    }

    private void updateDriverRating(Long driverUserId, Integer newRating) {
        driverProfileRepository.findByUserId(driverUserId).ifPresent(profile -> {
            int total = profile.getTotalRatings() + 1;
            double avg = ((profile.getRating() * profile.getTotalRatings()) + newRating) / total;
            profile.setRating(Math.round(avg * 10.0) / 10.0);
            profile.setTotalRatings(total);
            driverProfileRepository.save(profile);
        });
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
    }

    private TripResponse toResponse(Trip trip) {
        DriverProfile driverProfile = trip.getDriver() != null
                ? driverProfileRepository.findByUserId(trip.getDriver().getId()).orElse(null)
                : null;

        return TripResponse.builder()
                .id(trip.getId())
                .riderId(trip.getRider().getId())
                .riderName(trip.getRider().getFirstName() + " " + trip.getRider().getLastName())
                .riderPhone(trip.getRider().getPhone())
                .driverId(trip.getDriver() != null ? trip.getDriver().getId() : null)
                .driverName(trip.getDriver() != null
                        ? trip.getDriver().getFirstName() + " " + trip.getDriver().getLastName()
                        : null)
                .driverPhone(trip.getDriver() != null ? trip.getDriver().getPhone() : null)
                .driverEarnings(trip.getDriverEarnings())
                .plateNumber(driverProfile != null ? driverProfile.getPlateNumber() : null)
                .pickupLatitude(trip.getPickupLatitude())
                .pickupLongitude(trip.getPickupLongitude())
                .pickupAddress(trip.getPickupAddress())
                .destinationLatitude(trip.getDestinationLatitude())
                .destinationLongitude(trip.getDestinationLongitude())
                .destinationAddress(trip.getDestinationAddress())
                .status(trip.getStatus())
                .cancellationReason(trip.getCancellationReason())
                .cancellationNote(trip.getCancellationNote())
                .vehicleType(trip.getVehicleType())
                .estimatedFare(trip.getEstimatedFare())
                .actualFare(trip.getActualFare())
                .distanceKm(trip.getDistanceKm())
                .surgeApplied(trip.getSurgeApplied())
                .surgeMultiplier(trip.getSurgeMultiplier())
                .paymentStatus(trip.getPaymentStatus())
                .riderRating(trip.getRiderRating())
                .driverRating(trip.getDriverRating())
                .rideType(trip.getRideType())
                .scheduledPickupTime(trip.getScheduledPickupTime())
                .createdAt(trip.getCreatedAt())
                .acceptedAt(trip.getAcceptedAt())
                .completedAt(trip.getCompletedAt())
                .cancelledAt(trip.getCancelledAt())
                .build();
    }

    @Override
    @Transactional
    public String generateShareToken(String email, Long tripId) {
        User user = getUser(email);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new AppException("Trip not found", HttpStatus.NOT_FOUND));

        if (!trip.getRider().getId().equals(user.getId())) {
            throw new AppException("Access denied", HttpStatus.FORBIDDEN);
        }

        // Active share token can only be generated for active trips
        if (trip.getStatus() == TripStatus.COMPLETED || trip.getStatus() == TripStatus.CANCELLED) {
            throw new AppException("Cannot share completed or cancelled trips", HttpStatus.BAD_REQUEST);
        }

        // Check if token already exists
        return rideShareTokenRepository.findByTripId(tripId)
                .map(RideShareToken::getToken)
                .orElseGet(() -> {
                    String token = java.util.UUID.randomUUID().toString();
                    RideShareToken shareToken = RideShareToken.builder()
                            .trip(trip)
                            .token(token)
                            .expiresAt(LocalDateTime.now().plusHours(2))
                            .build();
                    rideShareTokenRepository.save(shareToken);
                    return token;
                });
    }

    @Override
    public com.herride.backend.model.dto.response.RideShareDetailsResponse getRideShareDetails(String token) {
        RideShareToken shareToken = rideShareTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException("Invalid or expired tracking link", HttpStatus.NOT_FOUND));

        if (shareToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException("Tracking link has expired", HttpStatus.GONE);
        }

        Trip trip = shareToken.getTrip();
        if (trip.getStatus() == TripStatus.COMPLETED || trip.getStatus() == TripStatus.CANCELLED) {
            throw new AppException("This trip has already finished", HttpStatus.GONE);
        }

        DriverProfile driverProfile = trip.getDriver() != null
                ? driverProfileRepository.findByUserId(trip.getDriver().getId()).orElse(null)
                : null;

        Double lat = null;
        Double lng = null;
        if (driverProfile != null) {
            var loc = driverLocationRepository.findById(driverProfile.getId()).orElse(null);
            if (loc != null) {
                lat = loc.getLatitude();
                lng = loc.getLongitude();
            }
        }

        double eta = 0.0;
        if (lat != null && lng != null) {
            // mock ETA based on distance to destination or pickup
            double dist = trip.getDistanceKm() != null ? trip.getDistanceKm() : 5.0;
            eta = Math.round((dist / 40.0) * 60.0); // 40 km/h avg speed
        }

        return com.herride.backend.model.dto.response.RideShareDetailsResponse.builder()
                .tripId(trip.getId())
                .status(trip.getStatus())
                .riderName(trip.getRider().getFirstName())
                .driverName(trip.getDriver() != null ? trip.getDriver().getFirstName() + " " + trip.getDriver().getLastName() : null)
                .driverPhone(trip.getDriver() != null ? trip.getDriver().getPhone() : null)
                .vehicleMake(driverProfile != null ? driverProfile.getVehicleMake() : null)
                .vehicleModel(driverProfile != null ? driverProfile.getVehicleModel() : null)
                .vehicleColor(driverProfile != null ? driverProfile.getVehicleColor() : null)
                .plateNumber(driverProfile != null ? driverProfile.getPlateNumber() : null)
                .driverRating(driverProfile != null ? driverProfile.getRating() : null)
                .currentLatitude(lat)
                .currentLongitude(lng)
                .pickupAddress(trip.getPickupAddress())
                .destinationAddress(trip.getDestinationAddress())
                .distanceKm(trip.getDistanceKm())
                .etaMinutes(eta)
                .build();
    }
}
