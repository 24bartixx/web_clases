package pl.pwr.edu.student.chess_bros.validationRules;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/validationRules")
public class ValidationRulesController {

    @Autowired
    private AuthorValidationRules authorValidationRules;

    @Autowired
    private BookValidationRules bookValidationRules;

    @GetMapping("/author")
    public ResponseEntity<AuthorValidationRules> getValidationRules() {
        return new ResponseEntity<>(authorValidationRules, HttpStatus.OK);
    }

    @GetMapping("/book")
    public ResponseEntity<BookValidationRules> getBookValidationRules() {
        return new ResponseEntity<>(bookValidationRules, HttpStatus.OK);
    }
}