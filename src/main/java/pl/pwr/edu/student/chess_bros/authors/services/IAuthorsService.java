package pl.pwr.edu.student.chess_bros.authors.services;

import pl.pwr.edu.student.chess_bros.authors.models.Author;

import java.util.Collection;

public interface IAuthorsService {
    public abstract Collection<Author> getAuthors();
    public abstract Author getAuthor(int id);
    Author addAuthor(Author author);
    Author updateAuthor(int id, Author author);
    void deleteAuthor(int id);
}