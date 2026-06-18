package com.herride.backend.controller;

import com.herride.backend.exception.AppException;
import com.herride.backend.model.dto.response.ApiResponse;
import com.herride.backend.model.dto.response.UserResponse;
import com.herride.backend.model.entity.User;
import com.herride.backend.model.enums.Role;
import com.herride.backend.model.enums.TripStatus;
import com.herride.backend.model.entity.Trip;
import com.herride.backend.repository.UserRepository;
import com.herride.backend.repository.TripRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') and principal.username == 'anshptk949@gmail.com'")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> response = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.RIDER)
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("All riders retrieved", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') and principal.username == 'anshptk949@gmail.com'")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (user.getRole() != Role.RIDER) {
            throw new AppException("Only rider accounts can be deleted", HttpStatus.BAD_REQUEST);
        }

        // Delete RideShareTokens referencing rider's trips
        entityManager.createQuery("DELETE FROM RideShareToken r WHERE r.trip.id IN (SELECT t.id FROM Trip t WHERE t.rider.id = :id)")
                .setParameter("id", id)
                .executeUpdate();

        // Delete SafetyCheckins referencing rider's trips
        entityManager.createQuery("DELETE FROM SafetyCheckin s WHERE s.trip.id IN (SELECT t.id FROM Trip t WHERE t.rider.id = :id)")
                .setParameter("id", id)
                .executeUpdate();

        // Delete Payments referencing rider's trips or rider
        entityManager.createQuery("DELETE FROM Payment p WHERE p.trip.id IN (SELECT t.id FROM Trip t WHERE t.rider.id = :id) OR p.rider.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        // Delete IncidentReports referencing rider's trips or reported by rider
        entityManager.createQuery("DELETE FROM IncidentReport i WHERE i.trip.id IN (SELECT t.id FROM Trip t WHERE t.rider.id = :id) OR i.reporter.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        // Delete SosAlerts referencing rider's trips or user
        entityManager.createQuery("DELETE FROM SosAlert s WHERE s.trip.id IN (SELECT t.id FROM Trip t WHERE t.rider.id = :id) OR s.user.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        // Delete TrustedContacts referencing user
        entityManager.createQuery("DELETE FROM TrustedContact c WHERE c.user.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        // Delete RiderProfile referencing user
        entityManager.createQuery("DELETE FROM RiderProfile rp WHERE rp.user.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        // Delete Trips referencing rider
        entityManager.createQuery("DELETE FROM Trip t WHERE t.rider.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        // Finally delete User
        userRepository.delete(user);

        return ResponseEntity.ok(ApiResponse.success("Rider account deleted successfully", null));
    }

    private UserResponse toResponse(User user) {
        List<Trip> trips = tripRepository.findByRiderIdOrderByCreatedAtDesc(user.getId());
        int totalRides = trips.size();
        double totalSpent = trips.stream()
                .filter(t -> t.getStatus() == TripStatus.COMPLETED && t.getActualFare() != null)
                .mapToDouble(Trip::getActualFare)
                .sum();

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .gender(user.getGender())
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .totalRides(totalRides)
                .totalSpent(totalSpent)
                .build();
    }
}

