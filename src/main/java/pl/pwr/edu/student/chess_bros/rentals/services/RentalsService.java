package pl.pwr.edu.student.chess_bros.rentals.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.books.repositories.BookRepository;
import pl.pwr.edu.student.chess_bros.readers.models.Reader;
import pl.pwr.edu.student.chess_bros.readers.repositories.ReaderRepository;
import pl.pwr.edu.student.chess_bros.rentals.models.Rental;
import pl.pwr.edu.student.chess_bros.rentals.repositories.RentalRepository;

import java.util.Collection;
import java.util.stream.Collectors;

@Service
public class RentalsService implements IRentalsService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private ReaderRepository readerRepository;

    @Autowired
    private RentalRepository rentalRepository;

    @Override
    public Rental rentBook(int bookId, int readerId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book ID " + bookId + " not found"));

        Reader reader = readerRepository.findById(readerId)
                .orElseThrow(() -> new IllegalArgumentException("Reader ID " + readerId + " not found"));

        if (book.isRented()) {
            throw new IllegalStateException("Book '" + book.getTitle() + "' is already rented");
        }

        book.setRented(true);
        bookRepository.save(book);

        Rental rental = new Rental(book, reader);
        return rentalRepository.save(rental);
    }

    // @Override
    // public Rental returnBook(int bookId) {
    //     Rental activeRental = rentalRepository.findAll().stream()
    //             .filter(r -> r.getBook().getId() == bookId && r.getReturnDate() == null)
    //             .findFirst()
    //             .orElseThrow(() -> new IllegalArgumentException("No active rental found for book ID " + bookId));

    //     activeRental.setReturnDate(java.time.LocalDate.now());

    //     Book book = activeRental.getBook();
    //     book.setRented(false);
    //     bookRepository.save(book);

    //     return rentalRepository.save(activeRental);
    // }

    @Override
    public Collection<Rental> getRents() {
        return rentalRepository.findAll();
    }

    @Override
    public Rental getRent(int id) {
        return rentalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rental ID " + id + " not found"));
    }

    @Override
    public void deleteRental(int id) {
        Rental rental = rentalRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Rental ID " + id + " not found"));

        Book book = rental.getBook();
        if (book != null && rental.getReturnDate() == null) {
            book.setRented(false);
            bookRepository.save(book);
        }

        rentalRepository.delete(rental);
    }
}