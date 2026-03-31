package pl.pwr.edu.student.chess_bros.authors.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.pwr.edu.student.chess_bros.authors.models.Author;
import pl.pwr.edu.student.chess_bros.authors.services.IAuthorsService;

@RestController
@RequestMapping("/api/authors")
public class AuthorsController {
    @Autowired
    IAuthorsService authorsService;

    @RequestMapping(value = "/", method = RequestMethod.GET)
    public ResponseEntity<Object> getAuthors(){
        return new ResponseEntity<>(authorsService.getAuthors(), HttpStatus.OK);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Object> getAuthor(@PathVariable int id){
        Author toReturn = authorsService.getAuthor(id);
        if(toReturn == null) return new ResponseEntity<>("Author not found", HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(toReturn, HttpStatus.OK);
    }

    @PostMapping("/")
    public ResponseEntity<Object> createAuthor(@RequestBody Author author) {
        authorsService.addAuthor(author);
        return new ResponseEntity<>("Author created successfully", HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateAuthor(@PathVariable int id, @RequestBody Author author) {
        Author updated = authorsService.updateAuthor(id, author);
        if (updated == null) return new ResponseEntity<>("Author not found", HttpStatus.NOT_FOUND);
        return new ResponseEntity<>("Author updated successfully", HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteAuthor(@PathVariable int id) {
        Author toDelete = authorsService.getAuthor(id);
        if (toDelete == null) return new ResponseEntity<>("Author not found", HttpStatus.NOT_FOUND);
        authorsService.deleteAuthor(id);
        return new ResponseEntity<>("Author deleted successfully", HttpStatus.OK);
    }
}
