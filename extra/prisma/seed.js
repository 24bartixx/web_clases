const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function buildUsers() {
  return Array.from({ length: 10 }, (_, index) => {
    const n = String(index + 1).padStart(2, "0");
    return {
      name: `User ${n}`,
      login: `user${n}`,
      email: `user${n}@example.com`,
    };
  });
}

function buildTodos(users) {
  return Array.from({ length: 25 }, (_, index) => {
    const todoNumber = index + 1;
    const user = users[index % users.length];

    return {
      title: `Todo task ${todoNumber}`,
      completed: todoNumber % 3 === 0,
      userId: user.id,
    };
  });
}

async function main() {
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: buildUsers(),
  });

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
  });

  const todos = buildTodos(users);

  await prisma.todo.createMany({
    data: todos,
  });

  console.log(`Seed complete: ${users.length} users, ${todos.length} todos.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
