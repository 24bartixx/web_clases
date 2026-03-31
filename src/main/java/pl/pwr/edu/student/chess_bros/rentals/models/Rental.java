package pl.pwr.edu.student.chess_bros.rentals.models;

import jakarta.persistence.*;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.readers.models.Reader;
import java.time.LocalDate;

@Entity
public class Rental {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "book_id")
    private Book book;

    @ManyToOne
    @JoinColumn(name = "reader_id")
    private Reader reader;

    private LocalDate rentalDate;

    private LocalDate returnDate;

    public Rental() {}

    public Rental(Book book, Reader reader) {
        this.book = book;
        this.reader = reader;
        this.rentalDate = LocalDate.now();
    }

    // Геттеры
    public int getId() { return id; }
    public Book getBook() { return book; }
    public Reader getReader() { return reader; }
    public LocalDate getRentalDate() { return rentalDate; }

    public LocalDate getReturnDate() { return returnDate; }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }
}