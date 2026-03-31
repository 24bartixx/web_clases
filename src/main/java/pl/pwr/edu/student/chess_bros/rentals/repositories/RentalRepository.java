package pl.pwr.edu.student.chess_bros.rentals.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.pwr.edu.student.chess_bros.rentals.models.Rental;

import java.util.Optional;

@Repository
public interface RentalRepository extends JpaRepository<Rental, Integer> {
    Optional<Rental> findByBookIdAndReturnDateIsNull(int bookId);
}