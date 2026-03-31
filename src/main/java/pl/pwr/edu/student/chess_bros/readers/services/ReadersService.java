package pl.pwr.edu.student.chess_bros.readers.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pl.pwr.edu.student.chess_bros.readers.models.Reader;
import pl.pwr.edu.student.chess_bros.readers.repositories.ReaderRepository;

import java.util.Collection;

@Service
public class ReadersService implements IReadersService {

    @Autowired
    private ReaderRepository readerRepository;

    @Override
    public Collection<Reader> getReaders() {
        return readerRepository.findAll();
    }

    @Override
    public Reader getReader(int id) {
        return readerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reader with ID " + id + " not found"));
    }

    @Override
    public Reader addReader(Reader reader) {
        if (reader.getEmail() == null || reader.getEmail().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        return readerRepository.save(reader);
    }

    @Override
    public Reader updateReader(int id, Reader readerData) {
        Reader existing = readerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reader with ID " + id + " not found"));

        existing.setName(readerData.getName());
        existing.setSurname(readerData.getSurname());
        existing.setEmail(readerData.getEmail());

        return readerRepository.save(existing);
    }

    @Override
    public void deleteReader(int id) {
        if (!readerRepository.existsById(id)) {
            throw new IllegalArgumentException("Cannot delete: Reader with ID " + id + " not found");
        }
        readerRepository.deleteById(id);
    }
}