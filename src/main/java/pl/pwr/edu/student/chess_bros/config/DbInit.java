package pl.pwr.edu.student.chess_bros.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pl.pwr.edu.student.chess_bros.authors.models.Author;
import pl.pwr.edu.student.chess_bros.authors.repositories.AuthorsRepository;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.books.repositories.BookRepository;
import pl.pwr.edu.student.chess_bros.readers.models.Reader;
import pl.pwr.edu.student.chess_bros.readers.repositories.ReaderRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Configuration
public class DbInit {
    @Bean
    CommandLineRunner initDatabase(
            AuthorsRepository authorsRepo,
            BookRepository booksRepo,
            ReaderRepository readersRepo) {
        return args -> {

            Random random = new Random();
            List<Author> savedAuthors = new ArrayList<>();

            String[] firstNames = {"Jan", "Maria", "Stanisław", "Anna", "Krzysztof", "Elena", "Victor", "Julia"};
            String[] lastNames = {"Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Szymański", "Zając", "Dąbrowski"};

            for (int i = 1; i <= 50; i++) {
                String fName = firstNames[random.nextInt(firstNames.length)] + i;
                String lName = lastNames[random.nextInt(lastNames.length)];

                Author author = authorsRepo.save(new Author(fName, lName));
                savedAuthors.add(author);
            }

            for (int i = 1; i <= 100; i++) {
                String title = "Book Title #" + i;
                int pages = 2 + random.nextInt(1000);

                Author randomAuthor = savedAuthors.get(random.nextInt(savedAuthors.size()));

                booksRepo.save(new Book(title, randomAuthor, pages));
            }

            readersRepo.save(new Reader("Jan", "Kowalski", "jan.kowalski@pwr.edu.pl"));
            readersRepo.save(new Reader("Anna", "Nowak", "anna.nowak@pwr.edu.pl"));

            System.out.println("System initialized: Authors, Books, and Readers are ready.");
        };
    }
}