package pl.pwr.edu.student.chess_bros.rentals.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.pwr.edu.student.chess_bros.rentals.dto.RentalRequest;
import pl.pwr.edu.student.chess_bros.rentals.models.Rental;
import pl.pwr.edu.student.chess_bros.rentals.services.IRentalsService;

import java.util.Collection;

@RestController
@RequestMapping("/api/rentals")
public class RentalsController {

    @Autowired
    private IRentalsService rentalsService;

    @PostMapping("/")
    public ResponseEntity<Object> rentBook(@RequestBody RentalRequest rentalRequest) {
        try {
            Rental rental = rentalsService.rentBook(rentalRequest.bookId, rentalRequest.readerId);
            return new ResponseEntity<>(rental, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>("An error occurred: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/")
    public ResponseEntity<Collection<Rental>> getRents() {
        return new ResponseEntity<>(rentalsService.getRents(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getRent(@PathVariable int id) {
        try {
            Rental rental = rentalsService.getRent(id);
            return new ResponseEntity<>(rental, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("An error occurred: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteRental(@PathVariable int id) {
        try {
            rentalsService.deleteRental(id);
            return new ResponseEntity<>("Rental deleted successfully", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>("An error occurred: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}