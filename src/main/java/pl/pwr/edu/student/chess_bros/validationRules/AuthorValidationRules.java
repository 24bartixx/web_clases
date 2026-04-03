package pl.pwr.edu.student.chess_bros.validationRules;

import org.springframework.stereotype.Component;
import pl.pwr.edu.student.chess_bros.authors.models.*;;

@Component
public class AuthorValidationRules {
    private final Integer minNameLength = Author.MIN_NAME_LENGTH;
    private final Integer maxNameLength = Author.MAX_NAME_LENGTH;
    private final Integer minSurnameLength = Author.MIN_SURNAME_LENGTH;
    private final Integer maxSurnameLength = Author.MAX_SURNAME_LENGTH;

    public Integer getMinNameLength() {
        return minNameLength;
    }

    public Integer getMaxNameLength() {
        return maxNameLength;
    }

    public Integer getMinSurnameLength() {
        return minSurnameLength;
    }

    public Integer getMaxSurnameLength() {
        return maxSurnameLength;
    }
}