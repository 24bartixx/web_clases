package pl.pwr.edu.student.chess_bros.books.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.books.repositories.BookRepository;

import java.util.Collection;

@Service
public class BooksService implements IBooksService {
    @Autowired
    private BookRepository bookRepository;

    @Override
    public Collection<Book> getBooks() {
        return bookRepository.findAll();
    }

    @Override
    public Book getBook(int id) {
        return bookRepository.findById(id).orElse(null);
    }

    @Override
    public Book addBook(Book book) {
        return bookRepository.save(book);
    }

    @Override
    public Book updateBook(int id, Book book) {
        if (bookRepository.existsById(id)) {
            book.setId(id); // Ustawiamy ID z URL do obiektu, żeby JPA zrobiło UPDATE zamiast INSERT
            return bookRepository.save(book);
        }
        return null;
    }

    @Override
    public void deleteBook(int id) {
        bookRepository.deleteById(id);
    }
}
