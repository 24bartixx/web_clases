package pl.pwr.edu.student.chess_bros.books.services;

import pl.pwr.edu.student.chess_bros.books.models.Book;

import java.util.Collection;

public interface IBooksService {
    public abstract Collection<Book> getBooks();
    public abstract Book getBook(int id);
}