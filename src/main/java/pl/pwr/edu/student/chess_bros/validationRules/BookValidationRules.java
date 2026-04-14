package pl.pwr.edu.student.chess_bros.validationRules;
import pl.pwr.edu.student.chess_bros.books.models.Book;

public class BookValidationRules {
    public Integer getMinTitleLength() {
        return Book.MIN_TITLE_LENGTH;
    }

    public Integer getMaxTitleLength() {
        return Book.MAX_TITLE_LENGTH;
    }

    public Integer getMinPages() {
        return Book.MIN_PAGES;
    }

    public Integer getMaxPages() {
        return Book.MAX_PAGES;
    }
}
