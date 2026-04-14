package pl.pwr.edu.student.chess_bros.books.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import pl.pwr.edu.student.chess_bros.authors.models.Author;

@Entity
public class Book {
    public static final int MIN_TITLE_LENGTH = 2;
    public static final int MAX_TITLE_LENGTH = 20;
    public static final int MIN_PAGES = 1;
    public static final int MAX_PAGES = 10000;


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private int id;

    @Size(min = MIN_TITLE_LENGTH, max = MAX_TITLE_LENGTH)
    private String title;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private Author author;

    @Min(MIN_PAGES)
    @Max(MAX_PAGES)
    private int pages;

    private boolean isRented = false;

    public Book() {
    }

    public Book(String title, Author author, int pages) {
        this.title = title;
        this.author = author;
        this.pages = pages;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Author getAuthor() {
        return author;
    }

    public void setAuthor(Author author) {
        this.author = author;
    }

    public int getPages() {
        return pages;
    }

    public void setPages(int pages) {
        this.pages = pages;
    }

    public boolean isRented() { return isRented; }
    public void setRented(boolean rented) { isRented = rented; }
}