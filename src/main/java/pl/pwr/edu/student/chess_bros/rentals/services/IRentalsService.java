package pl.pwr.edu.student.chess_bros.rentals.services;

import pl.pwr.edu.student.chess_bros.rentals.models.Rental;
import java.util.Collection;

public interface IRentalsService {
    Rental rentBook(int bookId, int readerId);
    Rental returnBook(int bookId);
    Collection<Rental> getActiveRentals();
}