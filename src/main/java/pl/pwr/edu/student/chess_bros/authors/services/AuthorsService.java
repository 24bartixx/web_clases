package pl.pwr.edu.student.chess_bros.authors.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import pl.pwr.edu.student.chess_bros.authors.models.Author;
import pl.pwr.edu.student.chess_bros.authors.repositories.AuthorsRepository;

@Service
public class AuthorsService implements IAuthorsService {
    @Autowired
    private AuthorsRepository authorsRepository;

    @Override
    public Page<Author> getAuthors(Pageable pageable) {
        return authorsRepository.findAll(pageable);
    }

    @Override
    public Author getAuthor(int id) {
        return authorsRepository.findById(id).orElse(null);
    }

    @Override
    public Author addAuthor(Author author) {
        return authorsRepository.save(author);
    }

    @Override
    public Author updateAuthor(int id, Author author) {
        Author existing = authorsRepository.findById(id).orElse(null);
        if (existing != null) {
            existing.setName(author.getName());
            existing.setSurname(author.getSurname());
            return authorsRepository.save(existing); // książki pozostają nietknięte
        }
        return null;
    }

    @Override
    public void deleteAuthor(int id) {
        authorsRepository.deleteById(id);
    }
}
