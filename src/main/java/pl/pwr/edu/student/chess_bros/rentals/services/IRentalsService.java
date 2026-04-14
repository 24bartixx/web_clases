package pl.pwr.edu.student.chess_bros.rentals.services;

import pl.pwr.edu.student.chess_bros.rentals.models.Rental;
import java.util.Collection;

public interface IRentalsService {
    public abstract Collection<Rental> getRents();
    public abstract Rental getRent(int id);
    void deleteRental(int id);

    Rental rentBook(int bookId, int readerId);
    // Rental returnBook(int bookId);
}