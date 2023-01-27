const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('tiny'));
app.set("view engine", "ejs");

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

///  HELPER FUNCTIONS ///
const generateRandomString = function() {
  let result = '';
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const strLength = 6;
  for (let i = 0; i < strLength; i++) {
    result += char.charAt(Math.floor(Math.random()*char.length));
  }
  return result;
}
const findUserByEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}
const urlsForUser = function(id) {
  const urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key].longURL;
    }
  }
  return urls;
}

/// HOME PAGE ///
app.get("/", (req, res) => {
  res.redirect("/urls");
});

/// LOGIN FORM ///
app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body.email);

  if (!user) {
    return res.status(403).send("Unable to find Email");
  }
  console.log("user", user);
  console.log("req.body.password", req.body.password);
  if (!bcrypt.compareSync(req.body.password, user.hashedPassword)) {
    return res.status(403).send("Invalid Password");
  }
  res.cookie("user_id", user.id)
  res.redirect("/urls");
});
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"]; 
  if (userID) {
    return res.redirect("/urls");
  }
  const user = users[userID]; 
  const templateVars =  { user: user };
  res.render("login", templateVars);
})

/// LOGOUT ENDPOINT ///
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

/// REGISTRATION PAGE ///
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars = { email: req.body.email, user: user };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPass = req.body.password;
  if (newEmail === "" || newPass === "") {
    return res.status(400).send("Invalid email or password");
  }
  if (findUserByEmail(newEmail)) {
    return res.status(400).send("Email already exists!");
  }
  const userID = generateRandomString();
  bcrypt.genSalt(10)
    .then((salt) => {
      return bcrypt.hashSync(newPass, salt);
    })
    .then((hash) => {
      users[userID] = { id: userID,
                        email: newEmail,
                        hashedPassword: hash };
      res.cookie("user_id", userID);
      res.redirect("/urls");
    })
});

/// MY URLS PAGE ///
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"]; // check if userID exists
  if (!userID) {
    return res.status(403).send("Please login to use TinyApp");
  }
  const user = users[userID]; 
  const urls = urlsForUser(userID);
  const templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars);
});

/// CREATE NEW URL PAGE ///
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }
  const userID = req.cookies["user_id"]; 
  const user = users[userID]; 
  const templateVars =  { user: user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(403).send("Please login to use TinyApp");
  }
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL,
                      userID: req.cookies["user_id"],};
  res.redirect(`/urls/${id}`); // Redirect to new shortURL page
});

//////// URL ID PAGE ////////
/// SHOW URL ID ///
app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"]; 
  if (!userID) {
    return res.status(403).send("Please login to use TinyApp");
  }
  if (!(req.params.id in urlDatabase)) {
    return res.status(404).send("URL does not exist");
  }
  if (userID !== urlDatabase[req.params.id].userID) {
    return res.status(403).send("Hey this is someone else's URL!");
  }
  const user = users[userID]; 
  const longURL = urlDatabase[req.params.id].longURL;
  const templateVars = { id: req.params.id, longURL: longURL, user: user};
  res.render("urls_show", templateVars);
});

/// EDIT URL ID ///
app.post("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(403).send("Please login to use TinyApp");
  }
  if (!(req.params.id in urlDatabase)) {
    return res.status(404).send("URL does not exist");
  }
  if (req.cookies["user_id"] !== urlDatabase[req.params.id].userID) {
    return res.status(403).send("Hey this is someone else's URL!");
  }
  urlDatabase[req.params.id] = { longURL: req.body.longURL,
                                 userID: req.cookies["user_id"]};
  res.redirect(`/urls`);
});

/// DELETE URL ID ///
app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(403).send("Please login to use TinyApp");
  }
  //edge case if url id doesnt exist
  if (!(req.params.id in urlDatabase)) {
    return res.status(404).send("URL does not exist");
  }
  if (req.cookies["user_id"] !== urlDatabase[req.params.id].userID) {
    return res.status(403).send("Hey this is someone else's URL!");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

/// LONG URL REDIRECT ///
app.get("/u/:id", (req, res) => {
  if (!(req.params.id in urlDatabase)) {
    return res.status(404).send("URL does not exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

/// HANDLING ANY INVALID URL REQUEST ///
app.get('*', (req, res) => {
  res.status(404).redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});