package pl.pwr.edu.student.chess_bros.validationRules;

import pl.pwr.edu.student.chess_bros.authors.models.*;;

public class AuthorValidationRules {

    public Integer getMinNameLength() {
        return Author.MIN_NAME_LENGTH;
    }

    public Integer getMaxNameLength() {
        return Author.MAX_NAME_LENGTH;
    }

    public Integer getMinSurnameLength() {
        return Author.MIN_SURNAME_LENGTH;
    }

    public Integer getMaxSurnameLength() {
        return Author.MAX_SURNAME_LENGTH;
    }
}