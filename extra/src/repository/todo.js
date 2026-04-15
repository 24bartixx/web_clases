const axios = require("axios");

const api = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

function mapTodo({ id, title, completed, userId: user_id }) {
  return {
    id,
    title,
    completed,
    user_id,
  };
}

const TodoRepository = {
  getAll: async () => {
    const { data } = await api.get("/todos");
    return data.map(mapTodo);
  },

  getById: async (id) => {
    const { data } = await api.get(`/todos/${id}`);
    return mapTodo(data);
  },
};

module.exports = TodoRepository;
