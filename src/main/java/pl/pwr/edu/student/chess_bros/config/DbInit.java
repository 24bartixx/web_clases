package pl.pwr.edu.student.chess_bros.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.pwr.edu.student.chess_bros.authors.models.Author;
import pl.pwr.edu.student.chess_bros.authors.repositories.AuthorsRepository;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.books.repositories.BookRepository;

@Configuration
public class DbInit {
    @Bean
    CommandLineRunner initDatabase(
            AuthorsRepository authorsRepo,
            BookRepository booksRepo) {
        return args -> {

            Author a1 = authorsRepo.save(new Author("Henryk", "Sienkiewicz"));
            Author a2 = authorsRepo.save(new Author("Adam", "Mickiewicz"));

            booksRepo.save(new Book("Quo Vadis", a1, 500));
            booksRepo.save(new Book("Pan Tadeusz", a2, 300));
        };
    }
}