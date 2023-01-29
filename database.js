const bcrypt = require("bcryptjs");

//users and urlDatabase are sample databases used for testing
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "a@a.com",
    hashedPassword: bcrypt.hashSync("123", 10)
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "sgq3y6": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
  },
};

module.exports = { users, urlDatabase };