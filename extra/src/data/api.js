const axios = require("axios");

const api = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

async function fetchUsers() {
  const { data } = await api.get("/users");

  return data.map(({ id, name, email, username: login }) => ({
    id,
    name,
    email,
    login,
  }));
}

async function fetchTodos() {
  const { data } = await api.get("/todos");

  return data.map(({ id, title, completed, userId: user_id }) => ({
    id,
    title,
    completed,
    user_id,
  }));
}

module.exports = {
  fetchUsers,
  fetchTodos,
};
