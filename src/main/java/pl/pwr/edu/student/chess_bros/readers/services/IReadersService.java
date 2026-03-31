package pl.pwr.edu.student.chess_bros.readers.services;

import pl.pwr.edu.student.chess_bros.readers.models.Reader;
import java.util.Collection;

public interface IReadersService {
    public abstract  Collection<Reader> getReaders();
    public abstract  Reader getReader(int id);
    Reader addReader(Reader reader);
    Reader updateReader(int id, Reader reader);
    void deleteReader(int id);
}