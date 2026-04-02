package pl.pwr.edu.student.chess_bros.books.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pl.pwr.edu.student.chess_bros.books.dto.BookRequest;
import pl.pwr.edu.student.chess_bros.books.models.Book;

import java.util.Collection;

public interface IBooksService {
    public abstract Page<Book> getBooks(Pageable pageable);
    public abstract Book getBook(int id);
    Book addBook(BookRequest book);
    Book updateBook(int id, BookRequest book);
    void deleteBook(int id);
}