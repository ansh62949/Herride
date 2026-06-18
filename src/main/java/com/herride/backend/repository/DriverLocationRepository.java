package com.herride.backend.repository;

import com.herride.backend.model.redis.DriverLocation;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverLocationRepository extends CrudRepository<DriverLocation, Long> {
}
