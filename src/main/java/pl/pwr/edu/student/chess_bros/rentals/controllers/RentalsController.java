package pl.pwr.edu.student.chess_bros.rentals.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.pwr.edu.student.chess_bros.rentals.models.Rental;
import pl.pwr.edu.student.chess_bros.rentals.services.IRentalsService;

import java.util.Collection;

@RestController
@RequestMapping("/api/rentals")
public class RentalsController {

    @Autowired
    private IRentalsService rentalsService;

    @PostMapping("/rent")
    public ResponseEntity<Object> rentBook(@RequestParam int bookId, @RequestParam int readerId) {
        try {
            Rental rental = rentalsService.rentBook(bookId, readerId);
            return new ResponseEntity<>(rental, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("An error occurred: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/return/{bookId}")
    public ResponseEntity<Object> returnBook(@PathVariable int bookId) {
        try {
            Rental rental = rentalsService.returnBook(bookId);
            return new ResponseEntity<>(rental, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/active")
    public ResponseEntity<Collection<Rental>> getActiveRentals() {
        return new ResponseEntity<>(rentalsService.getActiveRentals(), HttpStatus.OK);
    }
}