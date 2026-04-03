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

    @GetMapping("/author")
    public ResponseEntity<AuthorValidationRules> getValidationRules() {
        return new ResponseEntity<>(authorValidationRules, HttpStatus.OK);
    }
}