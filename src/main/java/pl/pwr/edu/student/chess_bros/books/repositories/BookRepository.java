package pl.pwr.edu.student.chess_bros.books.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.pwr.edu.student.chess_bros.books.models.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Integer> {
}