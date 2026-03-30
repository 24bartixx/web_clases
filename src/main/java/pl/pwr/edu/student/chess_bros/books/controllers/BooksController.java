package pl.pwr.edu.student.chess_bros.books.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.pwr.edu.student.chess_bros.books.models.Book;
import pl.pwr.edu.student.chess_bros.books.services.IBooksService;

@RestController
@RequestMapping("/api/books")
public class BooksController {
    @Autowired
    IBooksService booksService;

    @RequestMapping(value = "/", method = RequestMethod.GET)
    public ResponseEntity<Object> getBooks(){
        return new ResponseEntity<>(booksService.getBooks(), HttpStatus.OK);
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public ResponseEntity<Object> getBook(@PathVariable int id){
        Book toReturn = booksService.getBook(id);
        if(toReturn == null) return new ResponseEntity<>("Book not found", HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(toReturn, HttpStatus.OK);
    }

    @PostMapping("/")
    public ResponseEntity<Object> createBook(@RequestBody Book book) {
        booksService.addBook(book);
        return new ResponseEntity<>("Book created successfully", HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateBook(@PathVariable int id, @RequestBody Book book) {
        Book updated = booksService.updateBook(id, book);
        if (updated == null) return new ResponseEntity<>("Book not found", HttpStatus.NOT_FOUND);
        return new ResponseEntity<>("Book updated successfully", HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteBook(@PathVariable int id) {
        Book toDelete = booksService.getBook(id);
        if (toDelete == null) return new ResponseEntity<>("Book not found", HttpStatus.NOT_FOUND);
        booksService.deleteBook(id);
        return new ResponseEntity<>("Book deleted successfully", HttpStatus.OK);
    }
}
