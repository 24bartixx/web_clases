package pl.pwr.edu.student.chess_bros.validationRules;

import org.springframework.stereotype.Component;
import pl.pwr.edu.student.chess_bros.readers.models.Reader;

@Component
public class ReaderValidationRules {

    public Integer getMinNameLength() {
        return Reader.MIN_NAME_LENGTH;
    }

    public Integer getMaxNameLength() {
        return Reader.MAX_NAME_LENGTH;
    }

    public Integer getMinSurnameLength() {
        return Reader.MIN_SURNAME_LENGTH;
    }

    public Integer getMaxSurnameLength() {
        return Reader.MAX_SURNAME_LENGTH;
    }
}
