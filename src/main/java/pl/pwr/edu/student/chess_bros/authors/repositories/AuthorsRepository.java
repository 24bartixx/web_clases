package pl.pwr.edu.student.chess_bros.authors.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.pwr.edu.student.chess_bros.authors.models.Author;

@Repository
public interface AuthorsRepository extends JpaRepository<Author, Integer> {
}