package pl.pwr.edu.student.chess_bros.authors.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pl.pwr.edu.student.chess_bros.authors.models.Author;

public interface IAuthorsService {
    public abstract Page<Author> getAuthors(Pageable pageable);
    public abstract Author getAuthor(int id);
    Author addAuthor(Author author);
    Author updateAuthor(int id, Author author);
    void deleteAuthor(int id);
}