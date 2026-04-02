package pl.pwr.edu.student.chess_bros.books.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import pl.pwr.edu.student.chess_bros.books.dto.BookRequest;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.books.repositories.BookRepository;
import pl.pwr.edu.student.chess_bros.authors.models.Author;
import pl.pwr.edu.student.chess_bros.authors.repositories.AuthorsRepository;

import java.util.Collection;

@Service
public class BooksService implements IBooksService {
    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private AuthorsRepository authorsRepository;

    @Override
    public Page<Book> getBooks(Pageable pageable) {
        return bookRepository.findAll(pageable);
    }

    @Override
    public Book getBook(int id) {
        return bookRepository.findById(id).orElse(null);
    }

    @Override
    public Book addBook(BookRequest request) {
        Author author = authorsRepository.findById(request.authorId)
                .orElseThrow(
                        () -> new IllegalArgumentException("Author with ID " + request.authorId + " not found"));

        Book book = new Book(request.title, author, request.pages);
        return bookRepository.save(book);
    }

    @Override
    public Book updateBook(int id, BookRequest request) {
        Book existing = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book with ID " + id + " not found"));
        if (existing != null) {
            Author author = authorsRepository.findById(request.authorId)
                    .orElseThrow(
                            () -> new IllegalArgumentException("Author with ID " + request.authorId + " not found"));

            existing.setTitle(request.title);
            existing.setAuthor(author);
            existing.setPages(request.pages);
            return bookRepository.save(existing);
        }
        return null;
    }

    @Override
    public void deleteBook(int id) {
        bookRepository.deleteById(id);
    }
}
