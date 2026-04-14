package pl.pwr.edu.student.chess_bros.readers.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.pwr.edu.student.chess_bros.readers.models.Reader;
import pl.pwr.edu.student.chess_bros.readers.services.IReadersService;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/readers")
public class ReadersController {

    @Autowired
    IReadersService readersService;

    @GetMapping("/")
    public ResponseEntity<Object> getReaders() {
        return new ResponseEntity<>(readersService.getReaders(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getReader(@PathVariable int id) {
        Reader reader = readersService.getReader(id);
        if (reader == null) {
            return new ResponseEntity<>("Reader not found", HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(reader, HttpStatus.OK);
    }

    @PostMapping("/")
    public ResponseEntity<Object> createReader(@Valid @RequestBody Reader reader) {
        readersService.addReader(reader);
        return new ResponseEntity<>("Reader created successfully", HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> updateReader(@PathVariable int id, @Valid @RequestBody Reader reader) {
        Reader updated = readersService.updateReader(id, reader);
        if (updated == null) {
            return new ResponseEntity<>("Reader not found", HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>("Reader updated successfully", HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteReader(@PathVariable int id) {
        if (readersService.getReader(id) == null) {
            return new ResponseEntity<>("Reader not found", HttpStatus.NOT_FOUND);
        }
        readersService.deleteReader(id);
        return new ResponseEntity<>("Reader deleted successfully", HttpStatus.OK);
    }
}