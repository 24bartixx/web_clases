package pl.pwr.edu.student.chess_bros.books.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.books.repositories.BookRepository;

@Configuration
public class DbInit {
    @Bean
    CommandLineRunner initDatabase(BookRepository repository) {
        return args -> {
            repository.save(new Book("Potop", "Henryk Sienkiewicz", 936));
            repository.save(new Book("Wesele", "Stanisław Reymont", 150));
            repository.save(new Book("Dziady", "Adam Mickiewicz", 292));
        };
    }
}