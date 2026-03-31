package pl.pwr.edu.student.chess_bros.readers.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.pwr.edu.student.chess_bros.readers.models.Reader;

@Repository
public interface ReaderRepository extends JpaRepository<Reader, Integer> {
}