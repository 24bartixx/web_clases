const axios = require("axios");

const api = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

function mapUser({ id, name, email, username: login }) {
  return {
    id,
    name,
    email,
    login,
  };
}

const UserRepository = {
  getAll: async () => {
    const { data } = await api.get("/users");
    return data.map(mapUser);
  },

  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return mapUser(data);
  },
};

module.exports = UserRepository;
